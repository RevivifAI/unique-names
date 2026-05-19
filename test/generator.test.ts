/**
 * Tests for the name generator.
 */
import { describe, expect, it } from "vitest";

import {
  adjectives, adverbs, generate, haikunate, nouns, verbs,
} from "../src/index.js";

describe("generate", () => {
  describe("default behavior", () => {
    it("should generate a name with two words", () => {
      const name = generate();
      const parts = name.split("-");

      expect(parts.length).toBeGreaterThanOrEqual(2);
    });

    it("should use hyphen as default separator", () => {
      const name = generate();

      expect(name).toContain("-");
    });

    it("should use lowercase by default", () => {
      const name = generate();

      expect(name).toBe(name.toLowerCase());
    });
  });

  describe("dictionaries", () => {
    it("should use custom dictionaries", () => {
      const name = generate({
        dictionaries: [["red"], ["dragon"]],
      });

      expect(name).toBe("red-dragon");
    });

    it("should support more than two dictionaries", () => {
      const name = generate({
        dictionaries: [["big"], ["red"], ["dragon"]],
        length: 3,
      });

      expect(name).toBe("big-red-dragon");
    });

    it("should use WordNet adjectives dictionary", () => {
      const name = generate({
        dictionaries: [adjectives, ["test"]],
      });

      expect(name.split("-")[1]).toBe("test");
      expect(adjectives.length).toBeGreaterThan(1000);
    });

    it("should use WordNet nouns dictionary", () => {
      const name = generate({
        dictionaries: [["test"], nouns],
      });

      expect(name.split("-")[0]).toBe("test");
      expect(nouns.length).toBeGreaterThan(1000);
    });

    it("should use WordNet verbs dictionary", () => {
      expect(verbs.length).toBeGreaterThan(1000);
    });

    it("should use WordNet adverbs dictionary", () => {
      expect(adverbs.length).toBeGreaterThan(1000);
    });
  });

  describe("separator", () => {
    it("should use custom separator", () => {
      const name = generate({
        dictionaries: [["big"], ["dragon"]],
        separator: "_",
      });

      expect(name).toBe("big_dragon");
    });

    it("should support empty separator", () => {
      const name = generate({
        dictionaries: [["big"], ["dragon"]],
        separator: "",
      });

      expect(name).toBe("bigdragon");
    });

    it("should support multi-character separator", () => {
      const name = generate({
        dictionaries: [["big"], ["dragon"]],
        separator: "___",
      });

      expect(name).toBe("big___dragon");
    });
  });

  describe("length", () => {
    it("should generate single word with length 1", () => {
      const name = generate({
        dictionaries: [["test"]],
        length: 1,
      });

      expect(name).toBe("test");
    });

    it("should generate multiple words", () => {
      const name = generate({
        dictionaries: [["a"], ["b"], ["c"], ["d"]],
        length: 4,
      });

      expect(name).toBe("a-b-c-d");
    });

    it("should throw if length exceeds dictionaries", () => {
      expect(() =>
        generate({
          dictionaries: [["a"], ["b"]],
          length: 3,
        })).toThrow("cannot be greater than number of dictionaries");
    });

    it("should throw if length is less than 1", () => {
      expect(() =>
        generate({
          dictionaries: [["a"]],
          length: 0,
        })).toThrow("length must be at least 1");
    });
  });

  describe("style", () => {
    it("should generate lowercase style", () => {
      const name = generate({
        dictionaries: [["BIG"], ["DRAGON"]],
        style: "lowercase",
      });

      expect(name).toBe("big-dragon");
    });

    it("should generate uppercase style", () => {
      const name = generate({
        dictionaries: [["big"], ["dragon"]],
        style: "uppercase",
      });

      expect(name).toBe("BIG-DRAGON");
    });

    it("should generate capital style", () => {
      const name = generate({
        dictionaries: [["big"], ["dragon"]],
        style: "capital",
      });

      expect(name).toBe("Big-Dragon");
    });
  });

  describe("seed", () => {
    it("should produce same result with same seed (number)", () => {
      const options = { seed: 12345 };
      const name1 = generate(options);
      const name2 = generate(options);

      expect(name1).toBe(name2);
    });

    it("should produce same result with same seed (string)", () => {
      const options = { seed: "my-seed-value" };
      const name1 = generate(options);
      const name2 = generate(options);

      expect(name1).toBe(name2);
    });

    it("should produce different results with different seeds", () => {
      const name1 = generate({ seed: 12345 });
      const name2 = generate({ seed: 67890 });

      expect(name1).not.toBe(name2);
    });

    it("should produce deterministic output for all operations", () => {
      const options = {
        dictionaries: [adjectives, nouns, verbs],
        length: 3,
        seed: "deterministic-test",
        token: { length: 6, type: "numeric" as const },
      };
      const name1 = generate(options);
      const name2 = generate(options);

      expect(name1).toBe(name2);
    });
  });

  describe("token", () => {
    it("should append numeric token", () => {
      const name = generate({
        dictionaries: [["big"], ["dragon"]],
        token: { length: 4, type: "numeric" },
      });
      const parts = name.split("-");

      expect(parts.length).toBe(3);
      expect(parts[2]).toMatch(/^\d{4}$/);
    });

    it("should append hex token", () => {
      const name = generate({
        dictionaries: [["big"], ["dragon"]],
        token: { length: 8, type: "hex" },
      });
      const parts = name.split("-");

      expect(parts.length).toBe(3);
      expect(parts[2]).toMatch(/^[0-9a-f]{8}$/);
    });

    it("should append custom token", () => {
      const name = generate({
        dictionaries: [["big"], ["dragon"]],
        token: { chars: "abc", length: 4, type: "custom" },
      });
      const parts = name.split("-");

      expect(parts.length).toBe(3);
      expect(parts[2]).toMatch(/^[abc]{4}$/);
    });

    it("should not append token when length is 0", () => {
      const name = generate({
        dictionaries: [["big"], ["dragon"]],
        token: { length: 0 },
      });

      expect(name).toBe("big-dragon");
    });

    it("should generate deterministic token with seed", () => {
      const options = {
        dictionaries: [["a"], ["b"]] as const,
        seed: "token-seed",
        token: { length: 4, type: "numeric" as const },
      };
      const name1 = generate(options);
      const name2 = generate(options);

      expect(name1).toBe(name2);
    });
  });

  describe("error handling", () => {
    it("should throw on empty dictionary", () => {
      expect(() =>
        generate({
          dictionaries: [[], ["test"]],
          length: 2,
        })).toThrow("is empty or undefined");
    });

    it("should throw on undefined dictionary", () => {
      expect(() =>
        generate({
          dictionaries: [["test"], undefined as unknown as string[]],
          length: 2,
        })).toThrow("is empty or undefined");
    });
  });
});

describe("haikunate", () => {
  it("should generate haiku-style name with 4-digit token", () => {
    const name = haikunate();
    const parts = name.split("-");

    expect(parts.length).toBe(3);
    expect(parts[2]).toMatch(/^\d{4}$/);
  });

  it("should accept custom options", () => {
    const name = haikunate({
      separator: "_",
      style: "uppercase",
    });

    expect(name).toContain("_");
    expect(name).toBe(name.toUpperCase());
  });

  it("should support deterministic output", () => {
    const options = { seed: "haiku-seed" };
    const name1 = haikunate(options);
    const name2 = haikunate(options);

    expect(name1).toBe(name2);
  });

  it("should allow overriding token", () => {
    const name = haikunate({
      token: { length: 6, type: "hex" },
    });
    const parts = name.split("-");

    expect(parts[2]).toMatch(/^[0-9a-f]{6}$/);
  });

  it("should allow disabling token", () => {
    const name = haikunate({
      token: { length: 0 },
    });
    const parts = name.split("-");

    expect(parts.length).toBe(2);
  });
});
