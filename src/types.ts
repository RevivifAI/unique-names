/**
 * Options for the NumberDictionary helper.
 */
export interface NumberDictionaryOptions {
  /**
   * Fixed length for the number (padded with zeros).
   * Overrides min/max if specified.
   */
  length?: number;

  /**
   * Maximum value for the random number.
   */
  max?: number;

  /**
   * Minimum value for the random number.
   */
  min?: number;
}

/**
 * Options for token generation.
 */
export interface TokenOptions {
  /**
   * Custom characters for type: 'custom'.
   * Ignored for other types.
   */
  chars?: string;

  /**
   * Length of the token to generate.
   * @default 0 (no token)
   */
  length?: number;

  /**
   * Type of token to generate.
   * - 'numeric': Numbers only (0-9)
   * - 'hex': Hexadecimal (0-9, a-f)
   * - 'custom': Custom character set.
   * @default 'numeric'
   */
  type?: "custom" | "hex" | "numeric";
}

/**
 * Options for unique name generation.
 */
export interface UniqueNameOptions {
  /**
   * Array of dictionaries (arrays of strings) to pull words from.
   * Each dictionary contributes one word to the final name.
   * @default [adjectives, nouns]
   */
  dictionaries?: readonly (readonly string[])[];

  /**
   * Number of words to generate (must be <= dictionaries.length).
   * @default 2
   */
  length?: number;

  /**
   * Seed for deterministic name generation.
   * Same seed always produces the same name.
   */
  seed?: number | string;

  /**
   * Separator between words.
   * @default '-'
   */
  separator?: string;

  /**
   * Text style for the generated name.
   * - 'lowercase': "brave-tiger"
   * - 'uppercase': "BRAVE-TIGER"
   * - 'capital': "Brave-Tiger".
   * @default 'lowercase'
   */
  style?: "capital" | "lowercase" | "uppercase";

  /**
   * Token configuration for appending random characters.
   */
  token?: TokenOptions;
}
