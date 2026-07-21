import { describe, it, expect } from "vitest";

function countStats(text: string) {
  const chars = text.length;
  const charsNoSpace = text.replace(/\s/g, "").length;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const sentences = text.trim() ? text.split(/[.!?]+/).filter((s) => s.trim()).length : 0;
  const paragraphs = text.trim() ? text.split(/\n\s*\n/).filter((p) => p.trim()).length : 0;
  const lines = text ? text.split("\n").length : 0;
  return { chars, charsNoSpace, words, sentences, paragraphs, lines };
}

describe("word-counter", () => {
  describe("countStats", () => {
    it("counts words", () => {
      expect(countStats("hello world").words).toBe(2);
    });

    it("counts characters", () => {
      expect(countStats("abc").chars).toBe(3);
    });

    it("counts characters without spaces", () => {
      expect(countStats("a b c").charsNoSpace).toBe(3);
    });

    it("counts sentences", () => {
      expect(countStats("Hello world. How are you? Fine!").sentences).toBe(3);
    });

    it("counts paragraphs", () => {
      const text = "First paragraph.\n\nSecond paragraph.\n\nThird.";
      expect(countStats(text).paragraphs).toBe(3);
    });

    it("counts lines", () => {
      expect(countStats("line1\nline2\nline3").lines).toBe(3);
    });

    it("handles empty text", () => {
      const stats = countStats("");
      expect(stats.words).toBe(0);
      expect(stats.chars).toBe(0);
      expect(stats.sentences).toBe(0);
      expect(stats.paragraphs).toBe(0);
      expect(stats.lines).toBe(0);
    });

    it("handles single word", () => {
      expect(countStats("hello").words).toBe(1);
      expect(countStats("hello").sentences).toBe(1);
    });

    it("handles whitespace only", () => {
      expect(countStats("   ").words).toBe(0);
    });

    it("handles multiple spaces between words", () => {
      expect(countStats("hello   world").words).toBe(2);
    });

    it("handles newlines as single paragraph", () => {
      expect(countStats("line1\nline2").paragraphs).toBe(1);
    });

    it("handles text with no punctuation", () => {
      expect(countStats("hello world").sentences).toBe(1);
    });
  });
});
