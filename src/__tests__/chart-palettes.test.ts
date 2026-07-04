import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  CHART_PALETTES,
  DEFAULT_PALETTE,
  PALETTE_STORAGE_KEY,
  getPaletteById,
  colorAt,
  colorsFor,
  loadPreferredPaletteId,
  savePreferredPaletteId,
} from "@/lib/chart-palettes";

describe("Chart Palettes", () => {
  describe("CHART_PALETTES", () => {
    it("contains 8 palettes", () => {
      expect(CHART_PALETTES).toHaveLength(8);
    });

    it("each palette has required fields", () => {
      for (const palette of CHART_PALETTES) {
        expect(palette.id).toBeTruthy();
        expect(palette.name).toBeTruthy();
        expect(palette.description).toBeTruthy();
        expect(palette.primary).toMatch(/^#[0-9a-f]{6}$/);
        expect(palette.colors.length).toBeGreaterThanOrEqual(7);
      }
    });

    it("all palette ids are unique", () => {
      const ids = CHART_PALETTES.map((p) => p.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  describe("DEFAULT_PALETTE", () => {
    it("is the first palette", () => {
      expect(DEFAULT_PALETTE).toBe(CHART_PALETTES[0]);
    });
  });

  describe("getPaletteById", () => {
    it("returns default palette for null", () => {
      expect(getPaletteById(null)).toBe(DEFAULT_PALETTE);
    });

    it("returns default palette for undefined", () => {
      expect(getPaletteById(undefined)).toBe(DEFAULT_PALETTE);
    });

    it("returns default palette for empty string", () => {
      expect(getPaletteById("")).toBe(DEFAULT_PALETTE);
    });

    it("returns default palette for unknown id", () => {
      expect(getPaletteById("nonexistent")).toBe(DEFAULT_PALETTE);
    });

    it("returns correct palette by id", () => {
      const ocean = getPaletteById("ocean");
      expect(ocean.id).toBe("ocean");
      expect(ocean.name).toBe("Океан");
    });

    it("returns correct palette for each known id", () => {
      for (const palette of CHART_PALETTES) {
        expect(getPaletteById(palette.id)).toBe(palette);
      }
    });
  });

  describe("colorAt", () => {
    it("returns color at index", () => {
      const palette = CHART_PALETTES[0];
      expect(colorAt(palette, 0)).toBe(palette.colors[0]);
      expect(colorAt(palette, 1)).toBe(palette.colors[1]);
    });

    it("wraps around when index exceeds length", () => {
      const palette = CHART_PALETTES[0];
      const len = palette.colors.length;
      expect(colorAt(palette, len)).toBe(palette.colors[0]);
      expect(colorAt(palette, len + 1)).toBe(palette.colors[1]);
    });

    it("returns primary for empty palette", () => {
      const emptyPalette = { id: "empty", name: "Empty", description: "", primary: "#ff0000", colors: [] };
      expect(colorAt(emptyPalette, 0)).toBe("#ff0000");
    });

    it("handles negative index gracefully", () => {
      const palette = CHART_PALETTES[0];
      // JS modulo of negative: -1 % 10 = -1, so palette.colors[-1] is undefined
      // This is expected behavior - callers should use non-negative indices
      const result = colorAt(palette, -1);
      expect(result).toBeUndefined();
    });
  });

  describe("colorsFor", () => {
    it("returns empty array for count 0", () => {
      expect(colorsFor(DEFAULT_PALETTE, 0)).toEqual([]);
    });

    it("returns empty array for negative count", () => {
      expect(colorsFor(DEFAULT_PALETTE, -1)).toEqual([]);
    });

    it("returns correct number of colors", () => {
      const result = colorsFor(DEFAULT_PALETTE, 5);
      expect(result).toHaveLength(5);
    });

    it("wraps around palette", () => {
      const result = colorsFor(DEFAULT_PALETTE, DEFAULT_PALETTE.colors.length + 3);
      expect(result).toHaveLength(DEFAULT_PALETTE.colors.length + 3);
      expect(result[0]).toBe(DEFAULT_PALETTE.colors[0]);
      expect(result[DEFAULT_PALETTE.colors.length]).toBe(DEFAULT_PALETTE.colors[0]);
    });

    it("returns all colors for exact palette length", () => {
      const result = colorsFor(DEFAULT_PALETTE, DEFAULT_PALETTE.colors.length);
      expect(result).toEqual(DEFAULT_PALETTE.colors);
    });
  });

  describe("localStorage persistence", () => {
    let getItemSpy: ReturnType<typeof vi.fn>;
    let setItemSpy: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      getItemSpy = vi.spyOn(Storage.prototype, "getItem");
      setItemSpy = vi.spyOn(Storage.prototype, "setItem");
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    describe("loadPreferredPaletteId", () => {
      it("returns null when localStorage is empty", () => {
        getItemSpy.mockReturnValue(null);
        expect(loadPreferredPaletteId()).toBeNull();
      });

      it("returns stored value", () => {
        getItemSpy.mockReturnValue("ocean");
        expect(loadPreferredPaletteId()).toBe("ocean");
        expect(getItemSpy).toHaveBeenCalledWith(PALETTE_STORAGE_KEY);
      });

      it("returns null on error", () => {
        getItemSpy.mockImplementation(() => {
          throw new Error("SecurityError");
        });
        expect(loadPreferredPaletteId()).toBeNull();
      });
    });

    describe("savePreferredPaletteId", () => {
      it("saves palette id to localStorage", () => {
        savePreferredPaletteId("ocean");
        expect(setItemSpy).toHaveBeenCalledWith(PALETTE_STORAGE_KEY, "ocean");
      });

      it("handles errors silently", () => {
        setItemSpy.mockImplementation(() => {
          throw new Error("QuotaExceededError");
        });
        expect(() => savePreferredPaletteId("ocean")).not.toThrow();
      });
    });
  });
});
