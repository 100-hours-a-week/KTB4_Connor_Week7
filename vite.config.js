import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
  },
  test: {
    environment: "jsdom",
    include: ["test/react/**/*.test.{js,jsx}"],
    setupFiles: ["./test/react/setup.js"],
  },
});
