import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { toCSV, exportCSV, exportJSON, flattenTimeSeries } from "@/lib/export-utils";

describe("Export Utils", () => {
  describe("toCSV", () => {
    it("converts empty array to empty string", () => {
      expect(toCSV([])).toBe("");
    });

    it("converts simple objects to CSV", () => {
      const rows = [
        { name: "Alice", age: 30 },
        { name: "Bob", age: 25 },
      ];
      const result = toCSV(rows);
      expect(result).toContain("name,age");
      expect(result).toContain("Alice,30");
      expect(result).toContain("Bob,25");
    });

    it("handles values with commas by quoting", () => {
      const rows = [{ city: "New York, NY", country: "USA" }];
      const result = toCSV(rows);
      expect(result).toContain('"New York, NY"');
    });

    it("handles values with double quotes by escaping", () => {
      const rows = [{ text: 'He said "hello"' }];
      const result = toCSV(rows);
      expect(result).toContain('"He said ""hello"""');
    });

    it("handles values with newlines by quoting", () => {
      const rows = [{ text: "line1\nline2" }];
      const result = toCSV(rows);
      expect(result).toContain('"line1\nline2"');
    });

    it("handles null and undefined values as empty", () => {
      const rows = [{ a: null, b: undefined, c: "test" }];
      const result = toCSV(rows);
      const lines = result.split("\n");
      expect(lines[1]).toBe(",,test");
    });

    it("uses custom delimiter", () => {
      const rows = [{ a: 1, b: 2 }];
      const result = toCSV(rows, ";");
      expect(result).toContain("a;b");
      expect(result).toContain("1;2");
    });

    it("collects all unique headers across rows", () => {
      const rows = [
        { a: 1, b: 2 },
        { b: 3, c: 4 },
      ];
      const result = toCSV(rows);
      const headers = result.split("\n")[0];
      expect(headers).toContain("a");
      expect(headers).toContain("b");
      expect(headers).toContain("c");
    });

    it("handles numeric values", () => {
      const rows = [{ count: 42, price: 9.99 }];
      const result = toCSV(rows);
      expect(result).toContain("42");
      expect(result).toContain("9.99");
    });

    it("handles boolean values", () => {
      const rows = [{ active: true, deleted: false }];
      const result = toCSV(rows);
      expect(result).toContain("true");
      expect(result).toContain("false");
    });
  });

  describe("download behavior", () => {
    let clickSpy: ReturnType<typeof vi.fn>;
    let createElementSpy: ReturnType<typeof vi.fn>;
    let createObjectURLSpy: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      clickSpy = vi.fn();
      createElementSpy = vi.spyOn(document, "createElement").mockReturnValue({
        href: "",
        download: "",
        click: clickSpy,
      } as unknown as HTMLAnchorElement);
      vi.spyOn(document.body, "appendChild").mockImplementation((node) => node);
      vi.spyOn(document.body, "removeChild").mockImplementation((node) => node);
      createObjectURLSpy = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:mock-url");
      vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.restoreAllMocks();
      vi.useRealTimers();
    });

    describe("exportCSV", () => {
      it("triggers download with correct filename", () => {
        exportCSV([{ a: 1 }], "test");
        expect(createElementSpy).toHaveBeenCalledWith("a");
        expect(clickSpy).toHaveBeenCalled();
      });

      it("appends .csv extension if missing", () => {
        exportCSV([{ a: 1 }], "data");
        expect(createElementSpy.mock.results[0].value.download).toBe("data.csv");
      });

      it("does not double .csv extension", () => {
        exportCSV([{ a: 1 }], "data.csv");
        expect(createElementSpy.mock.results[0].value.download).toBe("data.csv");
      });

      it("adds BOM for Excel UTF-8 compatibility", () => {
        exportCSV([{ a: 1 }], "test");
        const blob = createObjectURLSpy.mock.calls[0][0] as Blob;
        expect(blob.type).toBe("text/csv;charset=utf-8");
      });
    });

    describe("exportJSON", () => {
      it("triggers download with correct filename", () => {
        exportJSON({ key: "value" }, "test");
        expect(clickSpy).toHaveBeenCalled();
      });

      it("appends .json extension if missing", () => {
        exportJSON({ key: "value" }, "data");
        expect(createElementSpy.mock.results[0].value.download).toBe("data.json");
      });

      it("does not double .json extension", () => {
        exportJSON({ key: "value" }, "data.json");
        expect(createElementSpy.mock.results[0].value.download).toBe("data.json");
      });

      it("creates blob with correct mime type", () => {
        exportJSON({ key: "value" }, "test.json");
        const blob = createObjectURLSpy.mock.calls[0][0] as Blob;
        expect(blob.type).toBe("application/json");
      });
    });
  });

  describe("flattenTimeSeries", () => {
    it("returns a copy of the data", () => {
      const data = [
        { name: "Jan", value: 10 },
        { name: "Feb", value: 20 },
      ];
      const result = flattenTimeSeries(data);
      expect(result).toEqual(data);
      expect(result).not.toBe(data);
    });

    it("handles empty array", () => {
      expect(flattenTimeSeries([])).toEqual([]);
    });

    it("preserves all properties", () => {
      const data = [{ name: "Jan", cpu: 10, mem: 20, disk: 30 }];
      const result = flattenTimeSeries(data);
      expect(result[0]).toEqual({ name: "Jan", cpu: 10, mem: 20, disk: 30 });
    });
  });
});
