export function buildWhatsAppShareUrl({ title, category, path = "" }) {
  const origin =
    typeof window !== "undefined" ? window.location.origin : "http://localhost:5173";
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const postUrl = `${origin}${normalizedPath}`;
  const subject = category
    ? `Confira esse post sobre ${category}: ${title}`
    : `Confira esse post: ${title}`;
  const text = `${subject}\n${postUrl}`;

  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
