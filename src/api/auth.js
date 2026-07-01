import { request } from "./client.js";
import { AUTH_LOGIN_FAILURE } from "../constants/messages.js";
import { authHeaders } from "../utils/session.js";

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
    headers: authHeaders(),
  });
}

export { login, logout };
