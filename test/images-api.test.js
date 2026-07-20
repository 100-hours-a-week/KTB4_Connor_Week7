import assert from "node:assert/strict";
import test from "node:test";

import { uploadImage } from "../src/api/images.js";

test("이미지를 POST /api/images의 image 파트로 업로드한다", async (context) => {
  const originalFetch = globalThis.fetch;
  let capturedRequest;
  context.after(() => {
    globalThis.fetch = originalFetch;
  });
  globalThis.fetch = async (url, options) => {
    capturedRequest = { url, options };
    return new Response(JSON.stringify({ imageUrl: "/uploads/profile.png" }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  };

  const file = new Blob(["image"], { type: "image/png" });
  const imageUrl = await uploadImage(file);

  assert.equal(capturedRequest.url, "http://localhost:8080/api/images");
  assert.equal(capturedRequest.options.method, "POST");
  assert.ok(capturedRequest.options.body instanceof FormData);
  const uploadedImage = capturedRequest.options.body.get("image");
  assert.ok(uploadedImage instanceof Blob);
  assert.equal(uploadedImage.type, "image/png");
  assert.equal(await uploadedImage.text(), "image");
  assert.equal(imageUrl, "/uploads/profile.png");
});
