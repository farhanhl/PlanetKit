import { describe, it, expect } from "vitest";

function parseRange(input: string, pageCount: number): Set<number> {
  const pages = new Set<number>();
  const parts = input.split(",").map((s) => s.trim());
  for (const part of parts) {
    if (part.includes("-")) {
      const [start, end] = part.split("-").map(Number);
      if (start >= 1 && end <= pageCount && start <= end) {
        for (let i = start; i <= end; i++) pages.add(i);
      }
    } else {
      const num = Number(part);
      if (num >= 1 && num <= pageCount) pages.add(num);
    }
  }
  return pages;
}

function computePagesToCopy(
  mode: "keep" | "remove",
  selectedPages: Set<number>,
  pageCount: number
): number[] {
  return mode === "keep"
    ? Array.from(selectedPages).sort((a, b) => a - b)
    : Array.from({ length: pageCount }, (_, i) => i + 1).filter(
        (p) => !selectedPages.has(p)
      );
}

describe("split-pdf", () => {
  describe("parseRange", () => {
    it("parses single page", () => {
      expect(parseRange("3", 10)).toEqual(new Set([3]));
    });

    it("parses range", () => {
      expect(parseRange("2-5", 10)).toEqual(new Set([2, 3, 4, 5]));
    });

    it("parses comma-separated", () => {
      expect(parseRange("1,3,5", 10)).toEqual(new Set([1, 3, 5]));
    });

    it("parses mixed ranges and singles", () => {
      expect(parseRange("1-3,7,9-10", 10)).toEqual(
        new Set([1, 2, 3, 7, 9, 10])
      );
    });

    it("ignores out-of-bounds pages", () => {
      expect(parseRange("1,11,0", 10)).toEqual(new Set([1]));
    });

    it("ignores invalid range (start > end)", () => {
      expect(parseRange("5-3", 10)).toEqual(new Set());
    });

    it("handles empty input", () => {
      expect(parseRange("", 10)).toEqual(new Set());
    });

    it("handles spaces around parts", () => {
      expect(parseRange(" 1 , 3 - 5 ", 10)).toEqual(new Set([1, 3, 4, 5]));
    });
  });

  describe("computePagesToCopy", () => {
    it("keep mode: returns selected pages sorted", () => {
      const selected = new Set([5, 1, 3]);
      expect(computePagesToCopy("keep", selected, 10)).toEqual([1, 3, 5]);
    });

    it("remove mode: returns unselected pages", () => {
      const selected = new Set([2, 4]);
      expect(computePagesToCopy("remove", selected, 5)).toEqual([1, 3, 5]);
    });

    it("keep mode with empty set returns empty", () => {
      expect(computePagesToCopy("keep", new Set(), 10)).toEqual([]);
    });

    it("remove mode with all selected returns empty", () => {
      const all = new Set([1, 2, 3]);
      expect(computePagesToCopy("remove", all, 3)).toEqual([]);
    });
  });
});
