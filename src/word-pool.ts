/**
 * WordPool - Memory-efficient word selection with sliding window.
 *
 * Selects a subset from a dictionary to reduce memory footprint while
 * maintaining variety. Useful for browser environments, serverless functions,
 * or any context with memory constraints.
 *
 * @module word-pool
 */
import { secureRandomElement, SeededRandom } from "./utils/random.js";

/**
 * Options for creating a WordPool.
 */
export interface WordPoolOptions {
  /**
   * Source dictionary - either a direct array or a lazy loader function.
   * Lazy loaders enable dynamic imports for code splitting.
   */
  dictionary: (() => Promise<readonly string[]>) | readonly string[];

  /**
   * Number of words to keep in the active pool.
   * Larger pools = more variety, smaller pools = less memory.
   * @default 500
   */
  poolSize?: number;

  /**
   * Seed for reproducible pool selection.
   * Same seed + same dictionary = same pool selection.
   */
  seed?: number | string;
}

/**
 * Memory-efficient word pool with sliding window selection.
 *
 * Selects a subset from a larger dictionary to reduce memory footprint
 * while maintaining variety. The pool can be refreshed to get a new
 * random selection from the source dictionary.
 *
 * @example
 * ```typescript
 * import { WordPool, adjectives } from "@revivifai/unique-names";
 *
 * // Create a pool with 500 words from adjectives
 * const pool = new WordPool({
 *   dictionary: adjectives,
 *   poolSize: 500,
 *   seed: 'session-123',
 * });
 *
 * // Get the active pool
 * const words = pool.getPool();
 *
 * // Refresh pool with new random selection
 * pool.refresh();
 *
 * // Lazy loading with dynamic import
 * const lazyPool = new WordPool({
 *   dictionary: () => import("./dictionaries/nouns.js").then(m => m.nouns),
 *   poolSize: 300,
 * });
 * ```
 */
export class WordPool {
  /**
   * Get the size of the active pool.
   * @returns The number of words in the pool.
   */
  get size(): number {
    return this.cachedPool?.length ?? 0;
  }

  private cachedDictionary: null | readonly string[] = null;

  private cachedPool: null | readonly string[] = null;

  private readonly dictionary: (() => Promise<readonly string[]>) | readonly string[];

  private dictionaryPromise: null | Promise<readonly string[]> = null;

  private readonly poolSize: number;

  private readonly seedValue: number | string | undefined;

  /**
   * Create a new WordPool.
   * @param options - Configuration options.
   */
  constructor(options: WordPoolOptions) {
    this.dictionary = options.dictionary;
    this.poolSize = options.poolSize ?? 500;
    this.seedValue = options.seed;

    if (this.poolSize < 1) {
      throw new Error("poolSize must be at least 1");
    }
  }

  /**
   * Get the active word pool.
   *
   * For lazy-loaded dictionaries, this will throw if load() hasn't been called.
   * Subsequent calls return the cached pool until `refresh()` is called.
   *
   * @returns The active word pool as a readonly array.
   */
  getPool(): readonly string[] {
    if (this.cachedPool !== null) {
      return this.cachedPool;
    }

    // For synchronous dictionaries, we can return immediately
    if (Array.isArray(this.dictionary)) {
      this.cachedDictionary = this.dictionary;
      this.cachedPool = this.selectPool(this.dictionary);
      return this.cachedPool;
    }

    // For lazy dictionaries, we need to have loaded them first
    throw new Error(
      "Dictionary not loaded. Call load() first when using lazy loading.",
    );
  }

  /**
   * Check if the dictionary is loaded.
   * @returns True if the dictionary is loaded and pool is ready.
   */
  isLoaded(): boolean {
    return this.cachedPool !== null;
  }

  /**
   * Load the dictionary (required for lazy-loaded dictionaries).
   *
   * For non-lazy dictionaries, this is a no-op that returns immediately.
   *
   * @returns Promise that resolves when the dictionary is loaded.
   */
  async load(): Promise<void> {
    if (this.cachedDictionary !== null) {
      return;
    }

    if (Array.isArray(this.dictionary)) {
      this.cachedDictionary = this.dictionary;
      this.cachedPool = this.selectPool(this.dictionary);
      return;
    }

    // Lazy loading
    if (!this.dictionaryPromise) {
      // Type guard: we know this is a function because Array.isArray check failed
      const loader = this.dictionary as () => Promise<readonly string[]>;

      this.dictionaryPromise = loader();
    }

    this.cachedDictionary = await this.dictionaryPromise;
    this.cachedPool = this.selectPool(this.cachedDictionary);
  }

  /**
   * Get a random word from the pool.
   *
   * @param random - Optional seeded random generator for deterministic selection.
   * @returns A random word from the active pool.
   */
  randomWord(random?: SeededRandom): string {
    const pool = this.getPool();

    if (pool.length === 0) {
      throw new Error("Pool is empty");
    }

    if (random) {
      return random.nextElement(pool);
    }

    return secureRandomElement(pool);
  }

  /**
   * Refresh the pool with a new random selection from the source dictionary.
   *
   * Uses a different seed derived from the original seed (if provided)
   * to ensure different selections on each refresh.
   */
  refresh(): void {
    if (this.cachedDictionary === null) {
      throw new Error("Dictionary not loaded. Call load() first.");
    }

    // Derive a new seed for refresh
    const refreshSeed = this.seedValue !== undefined
      ? `${this.seedValue}:refresh:${Date.now()}`
      : undefined;

    this.cachedPool = this.selectPool(this.cachedDictionary, refreshSeed);
  }

  /**
   * Resolve a seed value, falling back to instance seed or generating a random UUID.
   * @param overrideSeed - Optional seed override.
   * @returns A non-null seed value.
   */
  private resolveSeed(overrideSeed?: number | string): number | string {
    if (overrideSeed !== undefined) {
      return overrideSeed;
    }
    if (this.seedValue !== undefined) {
      return this.seedValue;
    }
    return crypto.randomUUID();
  }

  /**
   * Select a subset of words from the dictionary using Fisher-Yates shuffle.
   * @param dict - The source dictionary.
   * @param overrideSeed - Optional seed override for refresh operations.
   * @returns Selected subset of words.
   */
  private selectPool(dict: readonly string[], overrideSeed?: number | string): readonly string[] {
    const actualPoolSize = Math.min(this.poolSize, dict.length);

    if (actualPoolSize === dict.length) {
      // If pool size equals dictionary size, return a shuffled copy
      const shuffled = [...dict];

      this.shuffleInPlace(shuffled, overrideSeed);
      return shuffled;
    }

    // Fisher-Yates partial shuffle to select poolSize elements
    // Use a mutable array of indices
    const indices: number[] = [];

    for (let k = 0; k < dict.length; k++) {
      indices.push(k);
    }

    // Create a seeded random for selection - use provided seed or generate a random one
    const effectiveSeed = this.resolveSeed(overrideSeed);
    const rng = new SeededRandom(effectiveSeed);

    // Partial Fisher-Yates: shuffle only the first poolSize elements
    for (let i = 0; i < actualPoolSize; i++) {
      const j = i + Math.floor(rng.next() * (dict.length - i));
      // Swap indices[i] and indices[j]
      const temp = indices.at(i);
      const idxJ = indices.at(j);

      if (temp !== undefined && idxJ !== undefined) {
        // eslint-disable-next-line security/detect-object-injection
        indices[i] = idxJ;
        // eslint-disable-next-line security/detect-object-injection
        indices[j] = temp;
      }
    }

    // Extract selected words
    const selected: string[] = [];

    for (let i = 0; i < actualPoolSize; i++) {
      const idx = indices.at(i);
      const word = idx !== undefined ? dict.at(idx) : undefined;

      if (word !== undefined) {
        selected.push(word);
      }
    }

    return selected;
  }

  /**
   * Shuffle an array in place using Fisher-Yates.
   * @param array - Array to shuffle.
   * @param seedValue - Optional seed for deterministic shuffle.
   */
  private shuffleInPlace(array: string[], seedValue?: number | string): void {
    const effectiveSeed = this.resolveSeed(seedValue);
    const rng = new SeededRandom(effectiveSeed);

    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(rng.next() * (i + 1));
      const temp = array.at(i);
      const other = array.at(j);

      if (temp !== undefined && other !== undefined) {
        // eslint-disable-next-line security/detect-object-injection
        array[i] = other;
        // eslint-disable-next-line security/detect-object-injection
        array[j] = temp;
      }
    }
  }
}

/**
 * Factory function to create an adjective word pool.
 *
 * @param poolSize - Number of words in the pool. @default 500.
 * @param seed - Optional seed for reproducible selection.
 * @returns A new WordPool instance with adjectives.
 */
export async function createAdjectivePool(
  poolSize = 500,
  seed?: number | string,
): Promise<WordPool> {
  const { adjectives } = await import("./dictionaries/adjectives.js");
  const options: WordPoolOptions = { dictionary: adjectives, poolSize };

  if (seed !== undefined) {
    options.seed = seed;
  }

  const pool = new WordPool(options);

  await pool.load();
  return pool;
}

/**
 * Factory function to create an adverb word pool.
 *
 * @param poolSize - Number of words in the pool. @default 500.
 * @param seed - Optional seed for reproducible selection.
 * @returns A new WordPool instance with adverbs.
 */
export async function createAdverbPool(
  poolSize = 500,
  seed?: number | string,
): Promise<WordPool> {
  const { adverbs } = await import("./dictionaries/adverbs.js");
  const options: WordPoolOptions = { dictionary: adverbs, poolSize };

  if (seed !== undefined) {
    options.seed = seed;
  }

  const pool = new WordPool(options);

  await pool.load();
  return pool;
}

/**
 * Factory function to create a noun word pool.
 *
 * @param poolSize - Number of words in the pool. @default 500.
 * @param seed - Optional seed for reproducible selection.
 * @returns A new WordPool instance with nouns.
 */
export async function createNounPool(
  poolSize = 500,
  seed?: number | string,
): Promise<WordPool> {
  const { nouns } = await import("./dictionaries/nouns.js");
  const options: WordPoolOptions = { dictionary: nouns, poolSize };

  if (seed !== undefined) {
    options.seed = seed;
  }

  const pool = new WordPool(options);

  await pool.load();
  return pool;
}

/**
 * Factory function to create a verb word pool.
 *
 * @param poolSize - Number of words in the pool. @default 500.
 * @param seed - Optional seed for reproducible selection.
 * @returns A new WordPool instance with verbs.
 */
export async function createVerbPool(
  poolSize = 500,
  seed?: number | string,
): Promise<WordPool> {
  const { verbs } = await import("./dictionaries/verbs.js");
  const options: WordPoolOptions = { dictionary: verbs, poolSize };

  if (seed !== undefined) {
    options.seed = seed;
  }

  const pool = new WordPool(options);

  await pool.load();
  return pool;
}
