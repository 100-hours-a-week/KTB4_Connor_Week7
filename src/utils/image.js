import { API_BASE_URL } from "../api/client.js";

function resolveImageUrl(imageUrl) {
  if (!imageUrl) {
    return "";
  }

  if (/^(https?:|data:|blob:)/.test(imageUrl)) {
    return imageUrl;
  }

  return imageUrl.startsWith("/") ? `${API_BASE_URL}${imageUrl}` : imageUrl;
}

function renderBackgroundImage(element, imageUrl) {
  element.textContent = "";
  element.style.backgroundImage = "";

  const resolvedUrl = resolveImageUrl(imageUrl);

  if (resolvedUrl) {
    element.style.backgroundImage = `url("${resolvedUrl}")`;
  }
}

function extractFileName(imageUrl) {
  if (!imageUrl) {
    return "";
  }

  const path = imageUrl.split("?")[0].split("#")[0];
  const rawName = path.split("/").filter(Boolean).pop() || "";

  try {
    return decodeURIComponent(rawName);
  } catch (error) {
    return rawName;
  }
}

export { extractFileName, renderBackgroundImage, resolveImageUrl };
