import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "../../src/app/App.jsx";

describe("App", () => {
  it("루트에서 로그인 화면을 표시한다", async () => {
    render(<App />);
    expect(
      await screen.findByRole("heading", { name: "로그인" }),
    ).toBeInTheDocument();
  });
});
