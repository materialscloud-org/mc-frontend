/**
 * Matches an entire `<a ... target="_blank" ...>...</a>` element.
 * Anchors cannot be nested in valid HTML, so the non-greedy body capture
 * always stops at this anchor's own closing tag.
 */
const EXTERNAL_ANCHOR =
  /<a\b([^>]*\btarget=(?:"|')_blank(?:"|')[^>]*)>([\s\S]*?)<\/a>/gi;

/**
 * Rewrites links that open in a new tab so that, in the final static HTML:
 *  - `rel` always contains `noopener`/`noreferrer` (prevents reverse
 *    tabnabbing and referrer leakage), and
 *  - a visually-hidden "(opens in new tab)" hint is present so screen-reader
 *    users are told about the context change (WCAG 3.2.5).
 *
 * This runs at build time (static generation) and server-side in dev, so no
 * client-side JavaScript is shipped for it.
 */
function addNewTabAffordances(html) {
  return html.replace(EXTERNAL_ANCHOR, (_full, attrs, inner) => {
    // Merge/normalise the rel attribute.
    const relMatch = attrs.match(/\brel=("|')(.*?)\1/i);
    const relValues = new Set(
      (relMatch ? relMatch[2] : "").split(/\s+/).filter(Boolean),
    );
    relValues.add("noopener");
    relValues.add("noreferrer");
    const relAttr = `rel="${[...relValues].join(" ")}"`;
    const newAttrs = relMatch
      ? attrs.replace(relMatch[0], relAttr)
      : `${attrs} ${relAttr}`;

    // Skip the hint if the link already conveys the new-tab context.
    const alreadyHinted =
      /\baria-label=/i.test(attrs) ||
      /opens in new tab/i.test(inner) ||
      /class="[^"]*\bsr-only\b/i.test(inner);
    const body = alreadyHinted
      ? inner
      : `${inner}<span class="sr-only"> (opens in new tab)</span>`;

    return `<a${newAttrs}>${body}</a>`;
  });
}

export const onRequest = async (_context, next) => {
  const response = await next();

  if (!response.headers.get("content-type")?.includes("text/html")) {
    return response;
  }

  const html = addNewTabAffordances(await response.text());

  return new Response(html, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
};
