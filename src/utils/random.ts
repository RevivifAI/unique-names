/**
 * Secure random number generation utilities.
 */
import * as crypto from "node:crypto";

/**
 * Simple seeded pseudo-random number generator (Mulberry32).
 * Used for deterministic name generation.
 */
export class SeededRandom {
  private seed: number;

  /**
   * Create a new seeded random generator.
   * @param seed - The seed value (number or string).
   */
  constructor(seed: number | string) {
    // Hash string seeds to a number
    if (typeof seed === "string") {
      let hash = 0;

      for (let i = 0; i < seed.length; i++) {
        const char = seed.charCodeAt(i);

        hash = ((hash << 5) - hash + char) | 0;
      }
      this.seed = hash >>> 0;
    } else {
      this.seed = seed >>> 0;
    }
  }

  /**
   * Generate the next random number in sequence.
   * @returns Random number in [0, 1).
   */
  next(): number {
    let t = (this.seed += 0x6d2b79f5);

    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * Pick a random element from an array.
   * @param array - Array to pick from.
   * @returns Random element.
   */
  nextElement<T>(array: readonly T[]): T {
    if (array.length === 0) {
      throw new Error("Cannot pick from empty array");
    }

    const index = this.nextInt(0, array.length);

    // eslint-disable-next-line security/detect-object-injection -- index is bounded by array.length
    return array[index] as T;
  }

  /**
   * Generate a random integer within a range.
   * @param min - Minimum value (inclusive).
   * @param max - Maximum value (exclusive).
   * @returns Random integer in [min, max).
   */
  nextInt(min: number, max: number): number {
    return min + Math.floor(this.next() * (max - min));
  }
}

/**
 * Pick a random element from an array using secure random.
 * @param array - Array to pick from.
 * @returns Random element.
 */
export function secureRandomElement<T>(array: readonly T[]): T {
  if (array.length === 0) {
    throw new Error("Cannot pick from empty array");
  }

  const index = secureRandomInt(0, array.length);

  // eslint-disable-next-line security/detect-object-injection -- index is bounded by array.length
  return array[index] as T;
}

/**
 * Generate a cryptographically secure random integer within a range.
 * @param min - Minimum value (inclusive).
 * @param max - Maximum value (exclusive).
 * @returns Random integer in [min, max).
 */
export function secureRandomInt(min: number, max: number): number {
  if (min >= max) {
    throw new Error("max must be greater than min");
  }

  const range = max - min;
  const bytesNeeded = Math.ceil(Math.log2(range) / 8) || 1;
  const maxValid = Math.floor((256 ** bytesNeeded) / range) * range;

  let randomValue: number;

  do {
    const buffer = crypto.randomBytes(bytesNeeded);

    randomValue = buffer.readUIntBE(0, bytesNeeded);
  } while (randomValue >= maxValid);

  return min + (randomValue % range);
}
