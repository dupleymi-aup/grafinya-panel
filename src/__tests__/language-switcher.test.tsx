import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { LanguageSwitcher } from "@/components/language-switcher";

vi.mock("@/lib/store", () => ({
  useGraphinyaStore: vi.fn(() => ({
    language: "ru",
    setLanguage: vi.fn(),
  })),
}));

import { useGraphinyaStore } from "@/lib/store";

describe("LanguageSwitcher", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders both language buttons", () => {
    render(<LanguageSwitcher />);
    expect(screen.getByText("RU")).toBeDefined();
    expect(screen.getByText("EN")).toBeDefined();
  });

  it("highlights active language", () => {
    (useGraphinyaStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      language: "en",
      setLanguage: vi.fn(),
    });
    render(<LanguageSwitcher />);
    const enButton = screen.getByText("EN");
    expect(enButton.className).toContain("amber");
  });

  it("calls setLanguage on click", () => {
    const setLanguage = vi.fn();
    (useGraphinyaStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      language: "ru",
      setLanguage,
    });
    render(<LanguageSwitcher />);
    fireEvent.click(screen.getByText("EN"));
    expect(setLanguage).toHaveBeenCalledWith("en");
  });

  it("calls setLanguage for Russian", () => {
    const setLanguage = vi.fn();
    (useGraphinyaStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      language: "en",
      setLanguage,
    });
    render(<LanguageSwitcher />);
    fireEvent.click(screen.getByText("RU"));
    expect(setLanguage).toHaveBeenCalledWith("ru");
  });
});
