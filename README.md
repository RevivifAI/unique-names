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

## Installation

```bash
pnpm add @revivifai/unique-names
```

## Quick Start

```typescript
import { generate, haikunate } from "@revivifai/unique-names";

// Simple usage with defaults
const name = generate();
// e.g., "brave-tiger"

// Haiku-style name with 4-digit suffix
const haiku = haikunate();
// e.g., "winter-snow-4829"
```

## API

### `generate(options?)`

Generate a unique name with customizable options.

```typescript
import { generate, adjectives, nouns, verbs } from "@revivifai/unique-names";

// Default: adjective + noun
const name = generate();
// e.g., "calm-river"

// Three words
const name3 = generate({
  dictionaries: [adjectives, nouns, verbs],
  length: 3,
});
// e.g., "bright-star-shine"

// Custom separator and style
const styled = generate({
  separator: "_",
  style: "uppercase",
});
// e.g., "BRAVE_TIGER"

// With token suffix
const withToken = generate({
  token: { length: 6, type: "numeric" },
});
// e.g., "brave-tiger-482931"

// Deterministic (same seed = same result)
const deterministic = generate({ seed: "my-seed" });
```

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `dictionaries` | `readonly (readonly string[])[]` | `[adjectives, nouns]` | Arrays of words to pick from |
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

### `haikunate(options?)`

Generate a haiku-style name (adjective-noun-number). Compatible with haikunatorjs API.

```typescript
import { haikunate } from "@revivifai/unique-names";

// Default: adjective-noun-XXXX (4-digit number)
const name = haikunate();
// e.g., "winter-forest-4829"

// Custom configuration
const custom = haikunate({
  separator: ".",
  style: "capital",
  token: { length: 6, type: "hex" },
});
// e.g., "Silent.Moon.3f2a8b"

// Disable token
const noToken = haikunate({ token: { length: 0 } });
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
