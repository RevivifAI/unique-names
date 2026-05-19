/**
 * @revivifai/unique-names.
 *
 * Generate unique, memorable names using WordNet dictionaries.
 * Consolidates features from unique-names-generator and haikunatorjs.
 *
 * @packageDocumentation
 */

// Dictionaries
export {
  adjectives, adverbs, nouns, verbs,
} from "./dictionaries/index.js";

// Generator functions
export { generate, haikunate } from "./generator.js";

// Types
export type { NumberDictionaryOptions, TokenOptions, UniqueNameOptions } from "./types.js";

// Random utilities (for advanced use)
export { secureRandomElement, secureRandomInt, SeededRandom } from "./utils/random.js";
