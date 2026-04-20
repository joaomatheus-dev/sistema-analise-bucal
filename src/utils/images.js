export async function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Não foi possível ler a imagem selecionada."));
    reader.readAsDataURL(file);
  });
}

export function splitImageUrls(text) {
  return String(text || "")
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function mergeGallerySources({ imageGallery = [], imageUrlsText = "", imageUrl = "" }) {
  const merged = [...imageGallery, ...splitImageUrls(imageUrlsText)];

  if (imageUrl && !merged.includes(imageUrl)) {
    merged.unshift(imageUrl);
  }

  return [...new Set(merged.map((item) => String(item || "").trim()).filter(Boolean))];
}
