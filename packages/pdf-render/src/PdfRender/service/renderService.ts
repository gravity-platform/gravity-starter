import type { PdfRenderConfig } from "../util/types";

/**
 * Page dimensions at 96 DPI for Puppeteer's page.pdf()
 */
const PAGE_SIZES: Record<string, { width: string; height: string }> = {
  letter: { width: "8.5in", height: "11in" },
  a4: { width: "8.27in", height: "11.69in" },
  tabloid: { width: "11in", height: "17in" },
};

/**
 * Find Chrome/Chromium executable on the system
 */
function findChromePath(): string {
  const fs = require("fs");

  // Common Chrome/Chromium paths by platform
  const candidates =
    process.platform === "darwin"
      ? [
          "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
          "/Applications/Chromium.app/Contents/MacOS/Chromium",
          "/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary",
        ]
      : [
          // Linux (Docker / production)
          "/usr/bin/chromium-browser",
          "/usr/bin/chromium",
          "/usr/bin/google-chrome-stable",
          "/usr/bin/google-chrome",
          // Snap
          "/snap/bin/chromium",
        ];

  // Allow override via env
  if (process.env.CHROME_PATH) {
    return process.env.CHROME_PATH;
  }

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error("Chrome/Chromium not found. Set CHROME_PATH environment variable or install Chrome.");
}

/**
 * Build the HTML page that loads the component bundle and renders it
 */
function buildRenderPage(componentUrl: string, props: Record<string, any>): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { margin: 0; padding: 0; background: white; }
    #root { margin: 0; padding: 0; }
    img { max-width: 100%; height: auto; image-rendering: auto; }
    @media print {
      @page { margin: 0; }
      img { max-width: 100% !important; height: auto !important; }
    }
  </style>
</head>
<body>
  <div id="root"></div>
  <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script>
    window.__RENDER_PROPS__ = ${JSON.stringify(props)};
    window.__RENDER_READY__ = false;
  </script>
  <script src="${componentUrl}"></script>
  <script>
    (function() {
      // The UMD bundle registers itself - find the component
      // Design system components register on window.__GRAVITY_COMPONENTS__ or as UMD globals
      var Component = window.__GRAVITY_COMPONENTS__
        ? Object.values(window.__GRAVITY_COMPONENTS__)[0]
        : null;

      // Fallback: check for any newly added global that looks like a React component
      if (!Component) {
        var keys = Object.keys(window);
        for (var i = keys.length - 1; i >= 0; i--) {
          var val = window[keys[i]];
          if (val && (typeof val === 'function' || (val.default && typeof val.default === 'function'))) {
            if (keys[i] !== 'React' && keys[i] !== 'ReactDOM') {
              Component = val.default || val;
              break;
            }
          }
        }
      }

      if (!Component) {
        document.getElementById('root').innerHTML = '<p style="color:red">Component not found</p>';
        window.__RENDER_READY__ = true;
        return;
      }

      var root = ReactDOM.createRoot(document.getElementById('root'));
      root.render(React.createElement(Component, window.__RENDER_PROPS__));

      // Wait for render, then inject CSS from __GRAVITY_COMPONENT_CSS__ into <head>
      // The JS bundle registers CSS on this global (normally consumed by ShadowDOMWrapper)
      setTimeout(function() {
        var allCSS = window.__GRAVITY_COMPONENT_CSS__ || {};
        var names = Object.keys(allCSS);
        names.forEach(function(name) {
          var css = allCSS[name];
          if (css) {
            var style = document.createElement('style');
            style.textContent = css;
            style.setAttribute('data-component', name);
            document.head.appendChild(style);
          }
        });

        // Wait for all images to finish loading, then signal ready
        var imgs = Array.from(document.images);
        var imagePromises = imgs.map(function(img) {
          if (img.complete) return Promise.resolve();
          return new Promise(function(resolve) {
            img.onload = resolve;
            img.onerror = resolve;
          });
        });
        Promise.all(imagePromises).then(function() {
          setTimeout(function() {
            window.__RENDER_READY__ = true;
          }, 500);
        });
      }, 500);
    })();
  </script>
</body>
</html>`;
}

/**
 * Render a Gravity design system component to PDF using Puppeteer
 */
export async function renderComponentToPdf(
  config: PdfRenderConfig,
  logger: any,
): Promise<{ pdfBase64: string; pages: number; size: number }> {
  // Dynamic import to avoid issues if puppeteer-core isn't installed
  const puppeteer = await import("puppeteer-core");

  const { componentSpec, pageSize = "letter", orientation = "portrait" } = config;
  const { componentUrl, props } = componentSpec;

  // Resolve the full component URL
  const serverUrl =
    process.env.SERVER_URL || process.env.API_URL || `http://localhost:${process.env.SERVER_PORT || "4100"}`;

  const fullComponentUrl = componentUrl.startsWith("http") ? componentUrl : `${serverUrl}${componentUrl}`;

  const chromePath = findChromePath();
  logger.info(`Launching Chrome from: ${chromePath}`);

  const browser = await puppeteer.default.launch({
    executablePath: chromePath,
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--font-render-hinting=none",
    ],
  });

  try {
    const page = await browser.newPage();

    // Disable default navigation timeout — we control timeouts explicitly
    page.setDefaultNavigationTimeout(0);
    page.setDefaultTimeout(0);

    // Set viewport to match page size at 96 DPI
    const dims = PAGE_SIZES[pageSize] || PAGE_SIZES.letter;
    const widthPx = parseFloat(dims.width) * 96;
    const heightPx = parseFloat(dims.height) * 96;

    await page.setViewport({
      width: Math.round(widthPx),
      height: Math.round(heightPx),
      deviceScaleFactor: 1,
    });

    // Build and load the render page
    const html = buildRenderPage(fullComponentUrl, props);
    await page.setContent(html, { waitUntil: "domcontentloaded", timeout: 30000 });

    // Wait for the component to signal it's ready
    await page.waitForFunction("window.__RENDER_READY__ === true", {
      timeout: 15000,
    });

    // Additional settle time for fonts and complex layouts
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Generate PDF
    const isLandscape = orientation === "landscape";
    const pdfDims = PAGE_SIZES[pageSize] || PAGE_SIZES.letter;
    const pdfWidth = isLandscape ? pdfDims.height : pdfDims.width;
    const pdfHeight = isLandscape ? pdfDims.width : pdfDims.height;

    const pdfBuffer = await page.pdf({
      width: pdfWidth,
      height: pdfHeight,
      printBackground: true,
      margin: { top: "0in", right: "0in", bottom: "0in", left: "0in" },
      preferCSSPageSize: false,
      scale: 1,
    });

    // Convert to base64
    const pdfBase64 = Buffer.from(pdfBuffer).toString("base64");

    // Estimate page count from PDF size (rough heuristic)
    // A more accurate approach would parse the PDF, but this is sufficient
    const sizeBytes = pdfBuffer.byteLength;

    // Count pages by looking for /Type /Page in the PDF
    const pdfString = Buffer.from(pdfBuffer).toString("latin1");
    const pageMatches = pdfString.match(/\/Type\s*\/Page[^s]/g);
    const pages = pageMatches ? pageMatches.length : 1;

    logger.info(`PDF generated: ${pages} pages, ${Math.round(sizeBytes / 1024)}KB`);

    return { pdfBase64, pages, size: sizeBytes };
  } finally {
    await browser.close();
  }
}
