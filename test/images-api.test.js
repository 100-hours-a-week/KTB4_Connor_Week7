import assert from "node:assert/strict";
import test from "node:test";

import { uploadImage } from "../src/api/images.js";

test("presigned URL로 이미지를 직접 업로드하고 imageUrl을 반환한다", async (context) => {
  const originalFetch = globalThis.fetch;
  const capturedRequests = [];
  context.after(() => {
    globalThis.fetch = originalFetch;
  });
  globalThis.fetch = async (url, options) => {
    capturedRequests.push({ url, options });
    if (capturedRequests.length === 1) {
      return new Response(
        JSON.stringify({
          uploadUrl: "https://upload.example.com/ticket",
          imageUrl: "https://cdn.example.com/profiles/profile.png",
          method: "PUT",
          contentType: "image/png",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }
    return new Response(null, { status: 200 });
  };

  const file = new Blob(["image"], { type: "image/png" });
  Object.defineProperty(file, "name", { value: "profile.png" });
  const imageUrl = await uploadImage(file);

  assert.equal(capturedRequests.length, 2);
  assert.equal(capturedRequests[0].url, "http://localhost:8080/api/images/presigned-url");
  assert.equal(capturedRequests[0].options.method, "POST");
  assert.deepEqual(capturedRequests[0].options.headers, { "Content-Type": "application/json" });
  assert.deepEqual(JSON.parse(capturedRequests[0].options.body), {
    filename: "profile.png",
    contentType: "image/png",
    size: 5,
  });
  assert.equal(capturedRequests[1].url, "https://upload.example.com/ticket");
  assert.equal(capturedRequests[1].options.method, "PUT");
  assert.deepEqual(capturedRequests[1].options.headers, { "Content-Type": "image/png" });
  assert.equal(capturedRequests[1].options.credentials, "omit");
  assert.equal(capturedRequests[1].options.body, file);
  assert.equal(imageUrl, "https://cdn.example.com/profiles/profile.png");
});

test("S3 PUT 실패는 업로드 실패 메시지로 변환한다", async (context) => {
  const originalFetch = globalThis.fetch;
  let callCount = 0;
  context.after(() => {
    globalThis.fetch = originalFetch;
  });
  globalThis.fetch = async () => {
    callCount += 1;
    if (callCount === 1) {
      return new Response(
        JSON.stringify({
          uploadUrl: "https://upload.example.com/ticket",
          imageUrl: "https://cdn.example.com/profiles/profile.png",
          method: "PUT",
          contentType: "image/png",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }
    return new Response(null, { status: 500 });
  };

  const file = new Blob(["image"], { type: "image/png" });
  Object.defineProperty(file, "name", { value: "profile.png" });

  await assert.rejects(uploadImage(file, "이미지 업로드 실패"), {
    message: "이미지 업로드 실패",
  });
});
