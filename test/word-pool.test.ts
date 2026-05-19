/**
 * Tests for the WordPool class.
 */
import { describe, expect, it } from "vitest";

import { adjectives, nouns } from "../src/index.js";
import {
  createAdjectivePool,
  createAdverbPool,
  createNounPool,
  createVerbPool,
  WordPool,
} from "../src/word-pool.js";

describe("WordPool", () => {
  describe("constructor", () => {
    it("should create a pool with default size of 500", () => {
      const pool = new WordPool({ dictionary: adjectives });

      pool.getPool(); // Initialize the pool
      expect(pool.size).toBe(500);
    });

    it("should create a pool with custom size", () => {
      const pool = new WordPool({ dictionary: nouns, poolSize: 100 });

      pool.getPool(); // Initialize the pool
      expect(pool.size).toBe(100);
    });

    it("should throw if poolSize is less than 1", () => {
      expect(() => new WordPool({ dictionary: nouns, poolSize: 0 })).toThrow(
        "poolSize must be at least 1",
      );
    });
  });

  describe("getPool", () => {
    it("should return a pool with the specified size", () => {
      const pool = new WordPool({ dictionary: adjectives, poolSize: 100 });
      const words = pool.getPool();

      expect(words.length).toBe(100);
    });

    it("should return all words if pool size exceeds dictionary size", () => {
      const smallDict = ["a", "b", "c"];
      const pool = new WordPool({ dictionary: smallDict, poolSize: 100 });
      const words = pool.getPool();

      expect(words.length).toBe(3);
    });

    it("should return cached pool on subsequent calls", () => {
      const pool = new WordPool({ dictionary: nouns, poolSize: 50 });
      const words1 = pool.getPool();
      const words2 = pool.getPool();

      expect(words1).toBe(words2);
    });

    it("should throw for lazy dictionaries that are not loaded", () => {
      const pool = new WordPool({
        dictionary: () => Promise.resolve(["a", "b", "c"]),
        poolSize: 2,
      });

      expect(() => pool.getPool()).toThrow(
        "Dictionary not loaded. Call load() first",
      );
    });
  });

  describe("load", () => {
    it("should load synchronous dictionaries immediately", async () => {
      const pool = new WordPool({ dictionary: adjectives, poolSize: 50 });

      await pool.load();
      expect(pool.isLoaded()).toBe(true);
    });

    it("should load lazy dictionaries", async () => {
      const pool = new WordPool({
        dictionary: () => Promise.resolve(nouns),
        poolSize: 100,
      });

      expect(pool.isLoaded()).toBe(false);
      await pool.load();
      expect(pool.isLoaded()).toBe(true);
      expect(pool.getPool().length).toBe(100);
    });

    it("should be idempotent", async () => {
      const pool = new WordPool({ dictionary: adjectives, poolSize: 50 });

      await pool.load();

      const words1 = pool.getPool();

      await pool.load();

      const words2 = pool.getPool();

      expect(words1).toBe(words2);
    });
  });

  describe("refresh", () => {
    it("should select a new pool", () => {
      const pool = new WordPool({ dictionary: nouns, poolSize: 100 });
      const words1 = pool.getPool();

      pool.refresh();

      const words2 = pool.getPool();

      // Different pool instances (may have same content but different reference)
      expect(words1).not.toBe(words2);
    });

    it("should throw if not loaded", () => {
      const pool = new WordPool({
        dictionary: () => Promise.resolve(["a", "b"]),
        poolSize: 1,
      });

      expect(() => pool.refresh()).toThrow("Dictionary not loaded");
    });

    it("should derive new seed for refresh with seeded pool", () => {
      const pool = new WordPool({
        dictionary: nouns,
        poolSize: 100,
        seed: "refresh-test-seed",
      });
      const words1 = pool.getPool();

      pool.refresh();

      const words2 = pool.getPool();

      // Different pool instances due to derived seed
      expect(words1).not.toBe(words2);
    });
  });

  describe("randomWord", () => {
    it("should return a word from the pool", () => {
      const pool = new WordPool({ dictionary: adjectives, poolSize: 50 });
      const word = pool.randomWord();

      expect(typeof word).toBe("string");
      expect(word.length).toBeGreaterThan(0);
    });

    it("should throw if pool is empty", () => {
      const pool = new WordPool({ dictionary: [], poolSize: 1 });

      expect(() => pool.randomWord()).toThrow("Pool is empty");
    });

    it("should use seeded random when provided", async () => {
      const { SeededRandom } = await import("../src/utils/random.js");
      const pool = new WordPool({ dictionary: nouns, poolSize: 50, seed: "test" });
      const rng = new SeededRandom("word-seed");

      const word1 = pool.randomWord(rng);
      const word2 = pool.randomWord(rng);

      // Same seed should produce different words as rng advances
      expect(typeof word1).toBe("string");
      expect(typeof word2).toBe("string");
    });
  });

  describe("size", () => {
    it("should return 0 for unloaded pool", () => {
      const pool = new WordPool({
        dictionary: () => Promise.resolve(["a"]),
        poolSize: 1,
      });

      expect(pool.size).toBe(0);
    });

    it("should return pool size for loaded pool", () => {
      const pool = new WordPool({ dictionary: nouns, poolSize: 75 });

      pool.getPool(); // Initialize the pool
      expect(pool.size).toBe(75);
    });
  });

  describe("seeded selection", () => {
    it("should produce same pool with same seed", () => {
      const pool1 = new WordPool({
        dictionary: adjectives,
        poolSize: 100,
        seed: "test-seed",
      });
      const pool2 = new WordPool({
        dictionary: adjectives,
        poolSize: 100,
        seed: "test-seed",
      });

      expect(pool1.getPool()).toEqual(pool2.getPool());
    });

    it("should produce different pools with different seeds", () => {
      const pool1 = new WordPool({
        dictionary: nouns,
        poolSize: 100,
        seed: "seed-1",
      });
      const pool2 = new WordPool({
        dictionary: nouns,
        poolSize: 100,
        seed: "seed-2",
      });

      expect(pool1.getPool()).not.toEqual(pool2.getPool());
    });
  });
});

describe("factory functions", () => {
  describe("createAdjectivePool", () => {
    it("should create a pool with adjectives", async () => {
      const pool = await createAdjectivePool(100);

      expect(pool.size).toBe(100);
    });

    it("should accept a seed", async () => {
      const pool1 = await createAdjectivePool(50, "my-seed");
      const pool2 = await createAdjectivePool(50, "my-seed");

      expect(pool1.getPool()).toEqual(pool2.getPool());
    });
  });

  describe("createNounPool", () => {
    it("should create a pool with nouns", async () => {
      const pool = await createNounPool(100);

      expect(pool.size).toBe(100);
    });

    it("should accept a seed", async () => {
      const pool1 = await createNounPool(50, "noun-seed");
      const pool2 = await createNounPool(50, "noun-seed");

      expect(pool1.getPool()).toEqual(pool2.getPool());
    });
  });

  describe("createVerbPool", () => {
    it("should create a pool with verbs", async () => {
      const pool = await createVerbPool(100);

      expect(pool.size).toBe(100);
    });

    it("should accept a seed", async () => {
      const pool1 = await createVerbPool(50, "verb-seed");
      const pool2 = await createVerbPool(50, "verb-seed");

      expect(pool1.getPool()).toEqual(pool2.getPool());
    });
  });

  describe("createAdverbPool", () => {
    it("should create a pool with adverbs", async () => {
      const pool = await createAdverbPool(100);

      expect(pool.size).toBe(100);
    });

    it("should accept a seed", async () => {
      const pool1 = await createAdverbPool(50, "adverb-seed");
      const pool2 = await createAdverbPool(50, "adverb-seed");

      expect(pool1.getPool()).toEqual(pool2.getPool());
    });
  });
});
