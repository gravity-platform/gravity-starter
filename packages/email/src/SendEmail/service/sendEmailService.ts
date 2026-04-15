import nodemailer from "nodemailer";
import { SendEmailConfig } from "../util/types";

function autoLinkUrls(text: string): string {
  const urlRegex = /(?<!["'=])(https?:\/\/[^\s<>"']+)/g;
  return text.replace(urlRegex, (url) => `<a href="${url}">${url}</a>`);
}

function prepareHtmlBody(body: string, autoLink: boolean): string {
  if (!autoLink) return body;
  const alreadyHtml = /<[a-z][\s\S]*>/i.test(body);
  if (alreadyHtml) {
    return autoLinkUrls(body);
  }
  const linked = autoLinkUrls(body);
  return linked.replace(/\n/g, "<br>");
}

function injectUtmParams(body: string, utm: Record<string, string>): string {
  const params = new URLSearchParams(utm).toString();
  return body.replace(/href="(https?:\/\/[^"]+)"/g, (_match, url) => {
    const separator = url.includes("?") ? "&" : "?";
    return `href="${url}${separator}${params}"`;
  });
}

function appendTrackingPixel(body: string, measurementId: string, label: string): string {
  const pixel = `<img src="https://www.google-analytics.com/collect?v=1&t=event&tid=${measurementId}&cid=email&ec=email&ea=open&el=${encodeURIComponent(label)}" width="1" height="1" style="display:none" alt="" />`;
  if (/<\/body>/i.test(body)) {
    return body.replace(/<\/body>/i, `${pixel}</body>`);
  }
  return body + pixel;
}

const PROVIDERS = {
  microsoft365: {
    host: "smtp.office365.com",
    port: 587,
    secure: false,
  },
};

export async function sendEmail(
  config: SendEmailConfig,
  context: any,
  logger: any,
): Promise<{ sent: boolean; messageId: string }> {
  const credentials = context.credentials?.microsoft365Credential || context.credentials;
  const username = credentials?.username;
  const password = credentials?.password;

  if (!username || !password) {
    throw new Error("Microsoft 365 credentials (username/password) not found");
  }

  const providerConfig = PROVIDERS[config.provider] || PROVIDERS.microsoft365;

  const transporter = nodemailer.createTransport({
    host: providerConfig.host,
    port: providerConfig.port,
    secure: providerConfig.secure,
    auth: {
      user: username,
      pass: password,
    },
    tls: {
      ciphers: "SSLv3",
    },
  });

  let htmlBody = config.bodyType === "html" ? prepareHtmlBody(config.body, config.autoLinkUrls !== false) : undefined;

  if (htmlBody && config.utmSource) {
    const utm: Record<string, string> = { utm_source: config.utmSource };
    if (config.utmMedium) utm.utm_medium = config.utmMedium;
    if (config.utmCampaign) utm.utm_campaign = config.utmCampaign;
    if (config.utmContent) utm.utm_content = config.utmContent;
    htmlBody = injectUtmParams(htmlBody, utm);
  }

  if (htmlBody && config.gaMeasurementId) {
    const label = config.utmCampaign || config.subject || "email";
    htmlBody = appendTrackingPixel(htmlBody, config.gaMeasurementId, label);
  }

  const mailOptions: nodemailer.SendMailOptions = {
    from: config.from || username,
    to: config.to,
    subject: config.subject,
    ...(config.bodyType === "html" ? { html: htmlBody } : { text: config.body }),
    ...(config.cc ? { cc: config.cc } : {}),
    ...(config.bcc ? { bcc: config.bcc } : {}),
  };

  logger.info("Sending email", { to: config.to, subject: config.subject, provider: config.provider });

  const info = await transporter.sendMail(mailOptions);

  logger.info("Email sent", { messageId: info.messageId, to: config.to });

  return { sent: true, messageId: info.messageId };
}
