/**
 * Tests for secure random utilities.
 */
import { describe, expect, it } from "vitest";

import { secureRandomElement, secureRandomInt, SeededRandom } from "../src/utils/random.js";

describe("secureRandomInt", () => {
  it("should generate a number within range", () => {
    for (let i = 0; i < 100; i++) {
      const result = secureRandomInt(0, 10);

      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThan(10);
    }
  });

  it("should generate different values", () => {
    const values = new Set<number>();

    for (let i = 0; i < 100; i++) {
      values.add(secureRandomInt(0, 1000));
    }
    expect(values.size).toBeGreaterThan(50);
  });

  it("should throw when min >= max", () => {
    expect(() => secureRandomInt(5, 5)).toThrow("max must be greater than min");
    expect(() => secureRandomInt(10, 5)).toThrow("max must be greater than min");
  });

  it("should handle small ranges", () => {
    for (let i = 0; i < 50; i++) {
      const result = secureRandomInt(0, 2);

      expect(result).toBeLessThan(2);
    }
  });

  it("should handle large ranges", () => {
    const result = secureRandomInt(0, 1_000_000);

    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThan(1_000_000);
  });
});

describe("secureRandomElement", () => {
  it("should pick an element from array", () => {
    const arr = ["a", "b", "c"];

    for (let i = 0; i < 50; i++) {
      const element = secureRandomElement(arr);

      expect(arr).toContain(element);
    }
  });

  it("should throw on empty array", () => {
    expect(() => secureRandomElement([])).toThrow("Cannot pick from empty array");
  });

  it("should return the only element from single-element array", () => {
    const result = secureRandomElement(["only"]);

    expect(result).toBe("only");
  });

  it("should pick different elements over multiple calls", () => {
    const arr = ["a", "b", "c", "d", "e"];
    const values = new Set<string>();

    for (let i = 0; i < 50; i++) {
      values.add(secureRandomElement(arr));
    }
    expect(values.size).toBeGreaterThan(1);
  });
});

describe("SeededRandom", () => {
  describe("constructor", () => {
    it("should accept number seed", () => {
      const rng = new SeededRandom(12345);

      expect(rng.next()).toBeTypeOf("number");
    });

    it("should accept string seed", () => {
      const rng = new SeededRandom("test-seed");

      expect(rng.next()).toBeTypeOf("number");
    });

    it("should produce same sequence with same number seed", () => {
      const rng1 = new SeededRandom(12345);
      const rng2 = new SeededRandom(12345);

      for (let i = 0; i < 10; i++) {
        expect(rng1.next()).toBe(rng2.next());
      }
    });

    it("should produce same sequence with same string seed", () => {
      const rng1 = new SeededRandom("same-seed");
      const rng2 = new SeededRandom("same-seed");

      for (let i = 0; i < 10; i++) {
        expect(rng1.next()).toBe(rng2.next());
      }
    });

    it("should produce different sequences with different seeds", () => {
      const rng1 = new SeededRandom(12345);
      const rng2 = new SeededRandom(67890);

      let same = 0;

      for (let i = 0; i < 10; i++) {
        if (rng1.next() === rng2.next()) {
          same++;
        }
      }
      expect(same).toBeLessThan(10);
    });
  });

  describe("next", () => {
    it("should return number in [0, 1)", () => {
      const rng = new SeededRandom(12345);

      for (let i = 0; i < 100; i++) {
        const value = rng.next();

        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThan(1);
      }
    });
  });

  describe("nextInt", () => {
    it("should return integer within range", () => {
      const rng = new SeededRandom(12345);

      for (let i = 0; i < 100; i++) {
        const value = rng.nextInt(0, 100);

        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThan(100);
        expect(Number.isInteger(value)).toBe(true);
      }
    });

    it("should handle negative ranges", () => {
      const rng = new SeededRandom(12345);

      for (let i = 0; i < 50; i++) {
        const value = rng.nextInt(-100, 100);

        expect(value).toBeGreaterThanOrEqual(-100);
        expect(value).toBeLessThan(100);
      }
    });
  });

  describe("nextElement", () => {
    it("should pick element from array", () => {
      const rng = new SeededRandom(12345);
      const arr = ["a", "b", "c"];

      for (let i = 0; i < 20; i++) {
        const element = rng.nextElement(arr);

        expect(arr).toContain(element);
      }
    });

    it("should throw on empty array", () => {
      const rng = new SeededRandom(12345);

      expect(() => rng.nextElement([])).toThrow("Cannot pick from empty array");
    });

    it("should pick deterministically with same seed", () => {
      const rng1 = new SeededRandom(12345);
      const rng2 = new SeededRandom(12345);
      const arr = ["a", "b", "c", "d", "e"];

      for (let i = 0; i < 10; i++) {
        expect(rng1.nextElement(arr)).toBe(rng2.nextElement(arr));
      }
    });
  });
});
