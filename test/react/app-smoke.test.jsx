import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "../../src/app/App.jsx";

describe("App", () => {
  it("회의실 예약 앱 제목을 표시한다", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: "회의실 예약" })).toBeInTheDocument();
  });
});
