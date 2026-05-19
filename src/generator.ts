/**
 * Core name generator implementation.
 */
import type { TokenOptions, UniqueNameOptions } from "./types.js";

import { secureRandomElement, secureRandomInt, SeededRandom } from "./utils/random.js";

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
 * import { generate, adjectives, nouns } from "@revivifai/unique-names";
 *
 * // Simple usage with dictionaries
 * const name = generate({
 *   dictionaries: [adjectives, nouns],
 * }); // e.g., "brave-tiger"
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
 *   dictionaries: [adjectives, nouns],
 *   token: { length: 4, type: 'numeric' }
 * }); // e.g., "brave-tiger-4829"
 *
 * // Deterministic output with seed
 * const name = generate({
 *   dictionaries: [adjectives, nouns],
 *   seed: 'my-seed'
 * }); // Always same result
 * ```
 */
export function generate(options: UniqueNameOptions): string {
  const {
    dictionaries, length = 2, seed, separator = "-", style = "lowercase", token,
  } = options;

  // Validate dictionaries
  if (!dictionaries || dictionaries.length === 0) {
    throw new Error("dictionaries must be a non-empty array");
  }

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
    // eslint-disable-next-line security/detect-object-injection -- i is bounded by length
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
 *
 * @example
 * ```typescript
 * import { haikunate, adjectives, nouns } from "@revivifai/unique-names";
 *
 * // With dictionaries
 * const name = haikunate({
 *   dictionaries: [adjectives, nouns],
 * }); // e.g., "winter-forest-4829"
 *
 * // Custom configuration
 * const custom = haikunate({
 *   dictionaries: [adjectives, nouns],
 *   separator: ".",
 *   style: "capital",
 *   token: { length: 6, type: "hex" },
 * }); // e.g., "Silent.Moon.3f2a8b"
 * ```
 */
export function haikunate(options: Partial<UniqueNameOptions>): string {
  const config: UniqueNameOptions = {
    dictionaries: options.dictionaries ?? [],
    separator: options.separator ?? "-",
    style: options.style ?? "lowercase",
    token: options.token ?? { length: 4, type: "numeric" },
  };

  if (options.seed !== undefined) {
    config.seed = options.seed;
  }

  if (!config.dictionaries || config.dictionaries.length === 0) {
    throw new Error("haikunate requires dictionaries to be provided");
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

      // eslint-disable-next-line security/detect-object-injection -- index bounded by charSet
      token = `${token}${charSet[index]}`;
    }
  } else {
    // Use secure random.
    // We use secureRandomInt to avoid modulo bias when charSet.length
    // does not divide 256.
    for (let i = 0; i < length; i++) {
      const index = secureRandomInt(0, charSet.length);

      // eslint-disable-next-line security/detect-object-injection -- bounded index
      token = `${token}${charSet[index]}`;
    }
  }

  return token;
}
