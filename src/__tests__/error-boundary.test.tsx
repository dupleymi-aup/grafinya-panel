import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { ErrorBoundary } from "@/components/error-boundary";

function Bomb(): React.ReactNode {
  throw new Error("Test error");
}

function GoodChild() {
  return <div>Child content</div>;
}

describe("ErrorBoundary", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("renders children when no error", () => {
    render(
      <ErrorBoundary>
        <GoodChild />
      </ErrorBoundary>
    );
    expect(screen.getByText("Child content")).toBeDefined();
  });

  it("renders error UI when child throws", () => {
    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>
    );
    expect(screen.getByText("Что-то пошло не так")).toBeDefined();
    expect(screen.getByText("Test error")).toBeDefined();
  });

  it("shows recovery buttons", () => {
    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>
    );
    expect(screen.getByText("Попробовать снова")).toBeDefined();
    expect(screen.getByText("Обновить страницу")).toBeDefined();
    expect(screen.getByText("На главную")).toBeDefined();
  });

  it("shows stack trace details", () => {
    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>
    );
    const details = screen.getByText("Показать стек");
    expect(details).toBeDefined();
    fireEvent.click(details);
  });

  it("recovers when retry is clicked", () => {
    let shouldThrow = true;
    function ConditionalBomb(): React.ReactNode {
      if (shouldThrow) throw new Error("Conditional");
      return <div>Recovered</div>;
    }

    const { rerender } = render(
      <ErrorBoundary>
        <ConditionalBomb />
      </ErrorBoundary>
    );
    expect(screen.getByText("Что-то пошло не так")).toBeDefined();

    shouldThrow = false;
    fireEvent.click(screen.getByText("Попробовать снова"));
    rerender(
      <ErrorBoundary>
        <ConditionalBomb />
      </ErrorBoundary>
    );
    expect(screen.getByText("Recovered")).toBeDefined();
  });
});
