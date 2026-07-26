import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    include: ["test/react/**/*.test.{ts,tsx}"],
    setupFiles: ["./test/react/setup.ts"],
  },
});
