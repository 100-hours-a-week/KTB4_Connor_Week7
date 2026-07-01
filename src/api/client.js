import { COMMON_REQUEST_FAILURE } from "../constants/messages.js";

const API_BASE_URL = "http://localhost:8080";

async function parseJson(response) {
  const contentType = response.headers.get("content-type") || "";
  return contentType.includes("application/json") ? response.json() : {};
}

async function request(path, options = {}, fallbackMessage = COMMON_REQUEST_FAILURE) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    ...options,
  });
  const data = await parseJson(response);

  if (!response.ok) {
    const message = data.message || fallbackMessage;
    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export { API_BASE_URL, parseJson, request };
