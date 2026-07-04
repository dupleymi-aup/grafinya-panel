import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { WelcomeScreen } from "@/components/welcome-screen";

vi.mock("@/lib/store", () => ({
  useGraphinyaStore: vi.fn(() => ({
    enableDemoMode: vi.fn(),
  })),
}));

import { useGraphinyaStore } from "@/lib/store";

describe("WelcomeScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the hero title", () => {
    render(<WelcomeScreen />);
    expect(screen.getByText("Графиня")).toBeDefined();
  });

  it("renders subtitle with lab name", () => {
    render(<WelcomeScreen />);
    expect(screen.getByText(/Лаборатории Числитель/)).toBeDefined();
  });

  it("renders connect and demo buttons", () => {
    render(<WelcomeScreen />);
    expect(screen.getByText("Подключиться к серверу")).toBeDefined();
    expect(screen.getByText("Демо-режим")).toBeDefined();
  });

  it("calls enableDemoMode when demo button clicked", () => {
    const enableDemoMode = vi.fn();
    (useGraphinyaStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      enableDemoMode,
    });
    render(<WelcomeScreen />);
    fireEvent.click(screen.getByText("Демо-режим"));
    expect(enableDemoMode).toHaveBeenCalledOnce();
  });

  it("renders feature cards", () => {
    render(<WelcomeScreen />);
    expect(screen.getByText("Дашборды")).toBeDefined();
    expect(screen.getByText("Исследование")).toBeDefined();
    expect(screen.getByText("Плагины")).toBeDefined();
    expect(screen.getByText("Модули")).toBeDefined();
    expect(screen.getByText("JWT + Refresh")).toBeDefined();
  });

  it("renders stats", () => {
    render(<WelcomeScreen />);
    expect(screen.getByText("5 дашбордов")).toBeDefined();
    expect(screen.getByText("6 источников")).toBeDefined();
  });

  it("renders keyboard shortcuts hint", () => {
    render(<WelcomeScreen />);
    expect(screen.getByText("Alt+D")).toBeDefined();
  });
});
