/**
 * Markdown Buffer - Holds back incomplete markdown syntax during streaming
 * Prevents jumpy rendering when links, bold, code blocks are partially streamed
 */

/**
 * Find the safe cutoff point in markdown text
 * Returns the index up to which we can safely render
 */
export function getSafeMarkdownCutoff(text: string): number {
  if (!text) return 0;

  let safeEnd = text.length;

  // Check for incomplete link: [text](url) or [text]
  // Find last unclosed [ that doesn't have a matching ]
  const lastOpenBracket = text.lastIndexOf("[");
  if (lastOpenBracket !== -1) {
    const afterBracket = text.slice(lastOpenBracket);
    // Check if this bracket is closed with ](url) pattern
    const closedLink = /^\[[^\]]*\]\([^)]*\)/.test(afterBracket);
    const closedRef = /^\[[^\]]*\](?!\()/.test(afterBracket) && afterBracket.indexOf("]") < afterBracket.length - 1;

    if (!closedLink && !closedRef) {
      // Incomplete link - cut before it
      safeEnd = Math.min(safeEnd, lastOpenBracket);
    }
  }

  // Check for incomplete bold/italic: ** or * or __ or _
  // Count asterisks and underscores from the end
  const patterns = [
    { marker: "**", name: "bold" },
    { marker: "__", name: "bold" },
    { marker: "*", name: "italic" },
    { marker: "_", name: "italic" },
    { marker: "`", name: "code" },
    { marker: "```", name: "codeblock" },
  ];

  for (const { marker } of patterns) {
    const lastMarker = text.lastIndexOf(marker);
    if (lastMarker !== -1 && lastMarker > safeEnd - 20) {
      // Check if there's a closing marker after this one
      const afterMarker = text.slice(lastMarker + marker.length);
      if (!afterMarker.includes(marker)) {
        // Unclosed marker - cut before it
        safeEnd = Math.min(safeEnd, lastMarker);
      }
    }
  }

  // Don't cut in the middle of a word - find last space before safeEnd
  if (safeEnd < text.length && safeEnd > 0) {
    const lastSpace = text.lastIndexOf(" ", safeEnd);
    if (lastSpace > safeEnd - 50 && lastSpace > 0) {
      safeEnd = lastSpace;
    }
  }

  return safeEnd;
}

/**
 * Get the safe portion of markdown to render
 */
export function getSafeMarkdown(text: string, isStreaming: boolean): string {
  if (!isStreaming) {
    // Not streaming - show everything
    return text;
  }

  const cutoff = getSafeMarkdownCutoff(text);
  return text.slice(0, cutoff);
}
