function decodeHtmlEntities(text = "") {
  if (typeof window === "undefined" || !window.document) {
    return String(text);
  }

  const textarea = window.document.createElement("textarea");
  textarea.innerHTML = String(text);
  return textarea.value;
}

export function stripHtml(html = "") {
  return decodeHtmlEntities(
    String(html)
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
  );
}

export function summarizeHtml(html = "", maxLength = 180) {
  const text = stripHtml(html);
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength).trimEnd()}...`;
}
