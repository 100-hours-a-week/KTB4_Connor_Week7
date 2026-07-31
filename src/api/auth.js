import { request } from "./client.js";
import { AUTH_LOGIN_FAILURE } from "../shared/constants/messages.js";
import { createAuthHeaders } from "../shared/lib/session.js";

function login({ email, password }) {
  return request(
    "/api/auth/login",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    },
    AUTH_LOGIN_FAILURE
  ).catch(() => {
    throw new Error(AUTH_LOGIN_FAILURE);
  });
}

function logout() {
  return request("/api/auth/logout", {
    method: "POST",
    headers: createAuthHeaders(),
  });
}

export { login, logout };
