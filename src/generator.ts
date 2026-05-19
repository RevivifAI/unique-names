import * as crypto from "node:crypto";

/**
 * Core name generator implementation.
 */
import type { TokenOptions, UniqueNameOptions } from "./types.js";

import { adjectives, nouns } from "./dictionaries/index.js";
import { secureRandomElement, SeededRandom } from "./utils/random.js";

const HEX_CHARS = "0123456789abcdef";
const NUMERIC_CHARS = "0123456789";

/**
 * Generate a unique name with customizable options.
 *
 * @param options - Configuration options for name generation.
 * @returns Generated name string.
 *
 * @example
 * ```typescript
 * // Simple usage with defaults
 * const name = generate(); // e.g., "brave-tiger"
 *
 * // Custom dictionaries and separator
 * const name = generate({
 *   dictionaries: [adjectives, nouns],
 *   separator: '_',
 *   style: 'uppercase'
 * }); // e.g., "BRAVE_TIGER"
 *
 * // With token suffix
 * const name = generate({
 *   token: { length: 4, type: 'numeric' }
 * }); // e.g., "brave-tiger-4829"
 *
 * // Deterministic output with seed
 * const name = generate({ seed: 'my-seed' }); // Always same result
 * ```
 */
export function generate(options: UniqueNameOptions = {}): string {
  const {
    dictionaries = [
      adjectives,
      nouns,
    ], length = 2, seed, separator = "-", style = "lowercase", token,
  } = options;

  // Validate length
  if (length < 1) {
    throw new Error("length must be at least 1");
  }
  if (length > dictionaries.length) {
    throw new Error(
      `length (${length}) cannot be greater than number of dictionaries (${dictionaries.length})`,
    );
  }

  // Set up random generator
  const random = seed !== undefined ? new SeededRandom(seed) : null;

  // Pick words from each dictionary
  const words: string[] = [];

  for (let i = 0; i < length; i++) {
    const dict = dictionaries[i];

    if (!dict || dict.length === 0) {
      throw new Error(`Dictionary at index ${i} is empty or undefined`);
    }

    const word = random ? random.nextElement(dict) : secureRandomElement(dict);

    words.push(applyStyle(word, style));
  }

  // Generate token if configured
  const tokenStr = token ? generateToken(token, random) : "";

  // Combine words and token
  const parts = tokenStr ? [...words, tokenStr] : words;

  return parts.join(separator);
}

/**
 * Generate a haiku-style name (adjective-noun-number).
 * Compatible with haikunatorjs API.
 *
 * @param options - Configuration options for name generation.
 * @returns Generated haiku-style name string.
 */
export function haikunate(options: Partial<UniqueNameOptions> = {}): string {
  const config: UniqueNameOptions = {
    dictionaries: [adjectives, nouns],
    separator: options.separator ?? "-",
    style: options.style ?? "lowercase",
    token: options.token ?? { length: 4, type: "numeric" },
  };

  if (options.seed !== undefined) {
    config.seed = options.seed;
  }

  return generate(config);
}

/**
 * Apply text style transformation to a word.
 * @param word - The word to transform.
 * @param style - The style to apply.
 * @returns The transformed word.
 */
function applyStyle(word: string, style: "capital" | "lowercase" | "uppercase"): string {
  switch (style) {
    case "capital":
      return word.charAt(0).toUpperCase() + word.slice(1);
    case "uppercase":
      return word.toUpperCase();
    case "lowercase":
    default:
      return word.toLowerCase();
  }
}

/**
 * Generate a token string based on options.
 * @param options - Token configuration options.
 * @param random - Optional seeded random generator for deterministic output.
 * @returns The generated token string.
 */
function generateToken(options: TokenOptions, random: null | SeededRandom): string {
  const { chars, length = 0, type = "numeric" } = options;

  if (length <= 0) {
    return "";
  }

  let charSet: string;

  switch (type) {
    case "custom":
      charSet = chars ?? NUMERIC_CHARS;
      break;
    case "hex":
      charSet = HEX_CHARS;
      break;
    case "numeric":
    default:
      charSet = NUMERIC_CHARS;
  }

  let token = "";

  if (random) {
    for (let i = 0; i < length; i++) {
      const index = random.nextInt(0, charSet.length);

      token = `${token}${charSet[index]}`;
    }
  } else {
    // Use secure random
    for (let i = 0; i < length; i++) {
      const buffer = crypto.randomBytes(1);
      const byteValue = buffer[0];

      if (byteValue === undefined) {
        throw new Error("Failed to generate random bytes");
      }

      const index = byteValue % charSet.length;

      token = `${token}${charSet[index]}`;
    }
  }

  return token;
}
