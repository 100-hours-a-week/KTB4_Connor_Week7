import { request } from "./client.js";
import { authHeaders } from "../utils/session.js";

const LOGIN_FAILURE_MESSAGE = "* 아이디 또는 비밀번호를 확인해주세요";

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
    LOGIN_FAILURE_MESSAGE
  ).catch(() => {
    throw new Error(LOGIN_FAILURE_MESSAGE);
  });
}

function logout() {
  return request("/api/auth/logout", {
    method: "POST",
    headers: authHeaders(),
  });
}

export { login, logout };
