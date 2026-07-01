const DEFAULT_API_BASE_URL = "http://localhost:8080";

const API_BASE_URL = globalThis.APP_CONFIG?.API_BASE_URL || DEFAULT_API_BASE_URL;

export { API_BASE_URL };
