import assert from "node:assert/strict";
import test from "node:test";

import { updatePassword } from "../src/api/users.js";

test("비밀번호 변경 API에 현재 비밀번호와 새 비밀번호를 전송한다", async (context) => {
  const originalFetch = globalThis.fetch;
  const originalSessionStorage = globalThis.sessionStorage;
  let capturedRequest;

  context.after(() => {
    globalThis.fetch = originalFetch;
    globalThis.sessionStorage = originalSessionStorage;
  });

  globalThis.sessionStorage = {
    getItem(key) {
      return key === "accessToken" ? "token" : null;
    },
  };
  globalThis.fetch = async (url, options) => {
    capturedRequest = { url, options };
    return new Response(null, { status: 204 });
  };

  await updatePassword({
    currentPassword: "Password1!",
    newPassword: "Password2!",
  });

  assert.equal(
    capturedRequest.url,
    "http://localhost:8080/api/users/me/password",
  );
  assert.equal(capturedRequest.options.method, "PATCH");
  assert.equal(capturedRequest.options.headers.Authorization, "Bearer token");
  assert.deepEqual(JSON.parse(capturedRequest.options.body), {
    currentPassword: "Password1!",
    newPassword: "Password2!",
  });
});
