import { createElement as h, useMemo } from "react";

/**
 * Parse markdown into clean sections
 */
function parseMarkdownSections(text) {
  if (!text) return [];

  const sections = [];
  const parts = text.split(/^## /gm);

  parts.forEach((part, idx) => {
    if (!part.trim()) return;

    if (idx === 0 && !text.startsWith("## ")) {
      sections.push({ title: null, content: part.trim() });
    } else {
      const lines = part.split("\n");
      const title = lines[0].trim();
      const content = lines.slice(1).join("\n").trim();
      if (title) sections.push({ title, content });
    }
  });

  return sections;
}

/**
 * Service Details - Clean, editorial design
 */
export function ServiceDetails({ service, onBookClick, showButton = true, compact = false }) {
  if (!service) return null;

  const title = service.title;
  const description = service.description || service.metadata?.shortDescription;
  const introParagraph = service.metadata?.introParagraph;
  const images = service.metadata?.images || [];
  const heroImage = images[0];
  const bodyCopy = service.metadata?.bodyCopy;
  const callToAction = service.metadata?.callToAction || "Book Now";

  const sections = useMemo(() => parseMarkdownSections(bodyCopy), [bodyCopy]);

  return h(
    "div",
    { className: "h-full flex flex-col bg-white dark:bg-black" },

    // Scrollable content
    h(
      "div",
      { className: "flex-1 overflow-y-auto" },

      // Hero - full bleed image
      heroImage &&
        h(
          "div",
          { className: "relative w-full aspect-[16/9]" },
          h("img", {
            src: heroImage,
            alt: title || "Service",
            className: "w-full h-full object-cover",
          })
        ),

      // Content
      h(
        "div",
        { className: "px-6 pt-8 pb-32" },

        // Title
        h(
          "h1",
          {
            className: "text-[24px] font-semibold text-gray-900 dark:text-white tracking-tight leading-tight",
          },
          title
        ),

        // Description
        description &&
          h(
            "p",
            {
              className: "mt-3 text-[15px] text-gray-500 dark:text-gray-400 leading-relaxed",
            },
            description
          ),

        // Divider
        h("div", { className: "mt-8 mb-8 h-px bg-gray-200 dark:bg-gray-800" }),

        // Intro
        introParagraph &&
          h(
            "p",
            {
              className: "text-[15px] text-gray-900 dark:text-white leading-[1.6] font-medium",
            },
            introParagraph
          ),

        // Sections
        sections.length > 0 &&
          h(
            "div",
            { className: "mt-8 space-y-8" },
            sections.map((section, idx) =>
              h(
                "div",
                { key: idx },
                section.title &&
                  h(
                    "h2",
                    {
                      className:
                        "text-[11px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-3",
                    },
                    section.title
                  ),
                h(
                  "p",
                  {
                    className: "text-[15px] text-gray-700 dark:text-gray-300 leading-[1.6]",
                  },
                  section.content
                )
              )
            )
          )
      )
    ),

    // Fixed CTA - minimal
    showButton &&
      h(
        "div",
        {
          className:
            "absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white via-white dark:from-black dark:via-black to-transparent pt-16",
        },
        h(
          "button",
          {
            onClick: onBookClick,
            className:
              "w-full bg-blue-600 hover:bg-blue-700 text-white font-medium text-[15px] py-3.5 rounded-xl transition-all active:scale-[0.98]",
          },
          callToAction
        )
      )
  );
}

/**
 * Booking Form Placeholder - Replace with actual booking component
 */
export function BookingForm({ service }) {
  return h(
    "div",
    { className: "bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8" },

    h(
      "h2",
      { className: "text-2xl font-bold text-gray-900 dark:text-white mb-6" },
      `Book ${service?.title || "Service"}`
    ),

    h("p", { className: "text-gray-600 dark:text-gray-400 mb-8" }, "Booking form will be loaded here..."),

    h(
      "div",
      { className: "space-y-4" },

      // Name field
      h(
        "div",
        null,
        h("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" }, "Name"),
        h("input", {
          type: "text",
          className:
            "w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent",
          placeholder: "Your name",
        })
      ),

      // Email field
      h(
        "div",
        null,
        h("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" }, "Email"),
        h("input", {
          type: "email",
          className:
            "w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent",
          placeholder: "your@email.com",
        })
      ),

      // Date field
      h(
        "div",
        null,
        h("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" }, "Preferred Date"),
        h("input", {
          type: "date",
          className:
            "w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent",
        })
      ),

      // Submit button
      h(
        "button",
        {
          className:
            "w-full mt-6 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200",
        },
        "Confirm Booking"
      )
    )
  );
}
