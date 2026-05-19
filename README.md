# @revivifai/unique-names

A secure, modern TypeScript library for generating unique, memorable names using WordNet dictionaries. Consolidates features from [unique-names-generator](https://github.com/andreasonny83/unique-names-generator) and [haikunatorjs](https://github.com/Atrox/haikunatorjs).

## Features

- **Secure by default**: Uses Node.js `crypto` module for cryptographically secure random generation
- **WordNet dictionaries**: 85,000+ words extracted from WordNet 3.1 (adjectives, nouns, verbs, adverbs)
- **Fully typed**: Complete TypeScript support with strict type checking
- **Deterministic mode**: Seed-based generation for reproducible results
- **Highly configurable**: Custom dictionaries, separators, styles, and token suffixes
- **Zero dependencies**: No runtime dependencies, minimal bundle footprint
- **Tree-shakeable**: Export only what you need
- **Memory-efficient**: WordPools for reduced memory footprint in constrained environments

## Installation

```bash
pnpm add @revivifai/unique-names
```

## Quick Start

```typescript
import { generate, haikunate, adjectives, nouns } from "@revivifai/unique-names";

// Simple usage with dictionaries
const name = generate({ dictionaries: [adjectives, nouns] });
// e.g., "brave-tiger"

// Haiku-style name with 4-digit suffix
const haiku = haikunate({ dictionaries: [adjectives, nouns] });
// e.g., "winter-snow-4829"
```

## Bundle Size & Memory Considerations

### Dictionary Sizes

The bundled WordNet dictionaries are substantial:

| Dictionary | Words | Source Size |
|------------|-------|-------------|
| `adjectives` | 17,879 | ~264KB |
| `nouns` | 55,239 | ~776KB |
| `verbs` | 8,431 | ~108KB |
| `adverbs` | 3,642 | ~60KB |
| **Total** | **85,191** | **~1.2MB** |

### Tree-Shaking Support

This package has `"sideEffects": false` and supports tree-shaking. Import only what you need:

```typescript
// Import only the generator (no dictionaries loaded)
import { generate } from "@revivifai/unique-names/generator";

// Import only specific dictionaries
import { adjectives } from "@revivifai/unique-names/dictionaries/adjectives";
import { nouns } from "@revivifai/unique-names/dictionaries/nouns";
```

### Sub-path Exports

| Path | Description |
|------|-------------|
| `@revivifai/unique-names` | Full package (all exports) |
| `@revivifai/unique-names/generator` | Generator functions only |
| `@revivifai/unique-names/word-pool` | WordPool class and factories |
| `@revivifai/unique-names/dictionaries` | All dictionaries |
| `@revivifai/unique-names/dictionaries/adjectives` | Adjectives only |
| `@revivifai/unique-names/dictionaries/nouns` | Nouns only |
| `@revivifai/unique-names/dictionaries/verbs` | Verbs only |
| `@revivifai/unique-names/dictionaries/adverbs` | Adverbs only |
| `@revivifai/unique-names/utils/random` | Random utilities |

### Memory-Efficient WordPool

For browser environments, serverless functions, or memory-constrained contexts, use `WordPool` to select a subset of words:

```typescript
import { WordPool, adjectives, nouns, generate } from "@revivifai/unique-names";

// Create a pool with 500 words (default size)
const adjPool = new WordPool({
  dictionary: adjectives,
  poolSize: 500,  // Only 500 words in memory instead of 17,879
  seed: "session-123",  // Optional: reproducible selection
});

// Use the pool with generate
const name = generate({
  dictionaries: [adjPool.getPool(), nouns],
});

// Refresh the pool to get a different selection
adjPool.refresh();
```

**Memory savings with WordPool:**
- Full dictionary: ~1.2MB in memory
- 500-word pool: ~15KB in memory (98.75% reduction)

### Lazy Loading with Dynamic Imports

For maximum efficiency, lazy-load dictionaries:

```typescript
import { WordPool, generate } from "@revivifai/unique-names";

// Create a pool with lazy loading
const nounPool = new WordPool({
  dictionary: () => import("@revivifai/unique-names/dictionaries/nouns").then(m => m.nouns),
  poolSize: 300,
});

// Load the dictionary when needed
await nounPool.load();
const name = generate({ dictionaries: [nounPool.getPool()] });
```

### Factory Functions

Convenience functions for creating pools:

```typescript
import {
  createAdjectivePool,
  createNounPool,
  createVerbPool,
  createAdverbPool,
} from "@revivifai/unique-names";

// Create pools with default size (500 words)
const adjPool = await createAdjectivePool();
const nounPool = await createNounPool(300);  // Custom size
const seededPool = await createAdjectivePool(500, "my-seed");  // With seed
```

## API

### `generate(options)`

Generate a unique name with customizable options.

```typescript
import { generate, adjectives, nouns, verbs } from "@revivifai/unique-names";

// Default: adjective + noun
const name = generate({
  dictionaries: [adjectives, nouns],
});
// e.g., "calm-river"

// Three words
const name3 = generate({
  dictionaries: [adjectives, nouns, verbs],
  length: 3,
});
// e.g., "bright-star-shine"

// Custom separator and style
const styled = generate({
  dictionaries: [adjectives, nouns],
  separator: "_",
  style: "uppercase",
});
// e.g., "BRAVE_TIGER"

// With token suffix
const withToken = generate({
  dictionaries: [adjectives, nouns],
  token: { length: 6, type: "numeric" },
});
// e.g., "brave-tiger-482931"

// Deterministic (same seed = same result)
const deterministic = generate({
  dictionaries: [adjectives, nouns],
  seed: "my-seed",
});
```

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `dictionaries` | `readonly (readonly string[])[]` | **Required** | Arrays of words to pick from |
| `separator` | `string` | `"-"` | Separator between words |
| `length` | `number` | `2` | Number of words (≤ dictionaries.length) |
| `style` | `"lowercase"` \| `"uppercase"` \| `"capital"` | `"lowercase"` | Text transformation |
| `seed` | `string \| number` | — | Seed for deterministic generation |
| `token` | `TokenOptions` | — | Token suffix configuration |

### Token Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `length` | `number` | `0` | Length of token (0 = no token) |
| `type` | `"numeric"` \| `"hex"` \| `"custom"` | `"numeric"` | Character set |
| `chars` | `string` | — | Custom characters (type: "custom") |

### `haikunate(options)`

Generate a haiku-style name (adjective-noun-number). Compatible with haikunatorjs API.

```typescript
import { haikunate, adjectives, nouns } from "@revivifai/unique-names";

// Default: adjective-noun-XXXX (4-digit number)
const name = haikunate({
  dictionaries: [adjectives, nouns],
});
// e.g., "winter-forest-4829"

// Custom configuration
const custom = haikunate({
  dictionaries: [adjectives, nouns],
  separator: ".",
  style: "capital",
  token: { length: 6, type: "hex" },
});
// e.g., "Silent.Moon.3f2a8b"

// Disable token
const noToken = haikunate({
  dictionaries: [adjectives, nouns],
  token: { length: 0 },
});
// e.g., "bright-sun"
```

## Dictionaries

The library includes WordNet 3.1 dictionaries:

| Dictionary | Count | Description |
|------------|-------|-------------|
| `adjectives` | 17,879 | Descriptive words |
| `nouns` | 55,239 | Things, places, concepts |
| `verbs` | 8,431 | Actions |
| `adverbs` | 3,642 | Modifiers |

```typescript
import { adjectives, nouns, verbs, adverbs } from "@revivifai/unique-names";

// Use specific dictionaries
const actionName = generate({
  dictionaries: [adverbs, verbs],
  length: 2,
});
// e.g., "quickly-run"

// Custom dictionary
const colors = ["red", "blue", "green", "yellow"];
const animals = ["fox", "bear", "owl", "wolf"];

const custom = generate({
  dictionaries: [colors, animals],
});
// e.g., "red-fox"
```

## WordPool API

### `new WordPool(options)`

Create a memory-efficient word pool.

```typescript
const pool = new WordPool({
  dictionary: adjectives,  // Source dictionary
  poolSize: 500,           // Number of words in pool (default: 500)
  seed: "my-seed",         // Optional: for reproducible selection
});
```

### Methods

| Method | Description |
|--------|-------------|
| `getPool()` | Get the active word pool (readonly string[]) |
| `load()` | Load the dictionary (required for lazy-loaded dictionaries) |
| `isLoaded()` | Check if the dictionary is loaded |
| `refresh()` | Select a new random subset from the source dictionary |
| `randomWord(random?)` | Get a random word from the pool |

### Properties

| Property | Description |
|----------|-------------|
| `size` | Number of words in the active pool |

## Security

This library uses Node.js `crypto.randomBytes()` for secure random number generation, making it suitable for:

- API key generation
- Unique identifiers
- Session tokens
- Any context where unpredictability matters

For deterministic use cases (testing, reproducibility), use the `seed` option which uses a seeded PRNG (Mulberry32).

## Utilities

Advanced users can access the underlying random utilities:

```typescript
import {
  secureRandomInt,
  secureRandomElement,
  SeededRandom,
} from "@revivifai/unique-names";

// Cryptographically secure random integer
const dieRoll = secureRandomInt(1, 7); // 1-6

// Secure random element from array
const pick = secureRandomElement(["a", "b", "c"]);

// Seeded PRNG for deterministic sequences
const rng = new SeededRandom("my-seed");
const value = rng.next(); // 0-1
const int = rng.nextInt(0, 100); // 0-99
const element = rng.nextElement(myArray);
```

## Comparison

### vs unique-names-generator

- **WordNet dictionaries**: 85,000+ words vs ~2,000
- **Secure random**: Uses `crypto` module by default
- **No dependencies**: Zero runtime dependencies
- **TypeScript native**: Written in TypeScript with full type safety
- **Memory efficient**: WordPool for reduced memory footprint

### vs haikunatorjs

- **Larger dictionaries**: WordNet adjectives/nouns vs small predefined lists
- **More options**: Style transformations, custom dictionaries, multiple token types
- **Deterministic mode**: Optional seed-based generation
- **Modern ESM**: Native ES modules with tree-shaking support

## License

Apache-2.0

## Acknowledgments

- WordNet 3.1 © 2011 Princeton University. All rights reserved.
- Inspired by [unique-names-generator](https://github.com/andreasonny83/unique-names-generator) by andreasonny83
- Inspired by [haikunatorjs](https://github.com/Atrox/haikunatorjs) by Atrox
