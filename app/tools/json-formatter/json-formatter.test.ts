import { describe, it, expect } from "vitest";

function formatJson(input: string): string {
  const parsed = JSON.parse(input);
  return JSON.stringify(parsed, null, 2);
}

function minifyJson(input: string): string {
  const parsed = JSON.parse(input);
  return JSON.stringify(parsed);
}

describe("json-formatter", () => {
  describe("formatJson", () => {
    it("formats compact JSON", () => {
      const input = '{"name":"Alice","age":30}';
      const result = formatJson(input);
      expect(result).toContain('"name": "Alice"');
      expect(result).toContain('"age": 30');
    });

    it("formats already formatted JSON", () => {
      const input = '{\n  "key": "value"\n}';
      const result = formatJson(input);
      expect(result).toContain('"key": "value"');
    });

    it("handles nested objects", () => {
      const input = '{"a":{"b":{"c":1}}}';
      const result = formatJson(input);
      expect(result).toContain('"a"');
      expect(result).toContain('"b"');
      expect(result).toContain('"c": 1');
    });

    it("handles arrays", () => {
      const input = '{"items":[1,2,3]}';
      const result = formatJson(input);
      expect(result).toContain("[");
      expect(result).toContain("1");
    });

    it("throws on invalid JSON", () => {
      expect(() => formatJson("{invalid}")).toThrow();
    });
  });

  describe("minifyJson", () => {
    it("minifies formatted JSON", () => {
      const input = '{\n  "name": "Alice",\n  "age": 30\n}';
      const result = minifyJson(input);
      expect(result).toBe('{"name":"Alice","age":30}');
    });

    it("handles nested objects", () => {
      const input = '{\n  "a": {\n    "b": 1\n  }\n}';
      const result = minifyJson(input);
      expect(result).toBe('{"a":{"b":1}}');
    });

    it("throws on invalid JSON", () => {
      expect(() => minifyJson("not json")).toThrow();
    });
  });

  it("roundtrips: parse -> stringify -> parse", () => {
    const original = { name: "Bob", scores: [1, 2, 3], nested: { x: true } };
    const stringified = JSON.stringify(original);
    const parsed = JSON.parse(stringified);
    expect(parsed).toEqual(original);
  });
});
