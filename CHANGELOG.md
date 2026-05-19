# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.1] - 2026-05-19

### Added

- Added `@vitest/coverage-v8` dev dependency for code coverage measurement
- New tests for WordPool module:
  - `randomWord` with seeded random parameter
  - `refresh` with seeded pool (derives new seed)
  - Factory function seed parameter tests for `createNounPool`, `createVerbPool`, `createAdverbPool`

### Changed

- Improved test coverage: 100% statements, 95.12% branches, 100% functions, 100% lines

## [1.1.0] - 2026-05-19

### Added

- **WordPool class** for memory-efficient word selection with sliding window mechanism
  - Selects a subset from dictionaries to reduce memory footprint
  - Configurable pool size (default: 500 words)
  - Support for lazy loading with dynamic imports
  - Seeded selection for reproducible pools
  - `refresh()` method to select new random subsets
- **Factory functions** for convenient pool creation:
  - `createAdjectivePool(size?, seed?)`
  - `createNounPool(size?, seed?)`
  - `createVerbPool(size?, seed?)`
  - `createAdverbPool(size?, seed?)`
- **Sub-path exports** for granular imports and optimal tree-shaking:
  - `@revivifai/unique-names/generator` - Generator functions only
  - `@revivifai/unique-names/word-pool` - WordPool class and factories
  - `@revivifai/unique-names/dictionaries` - All dictionaries
  - `@revivifai/unique-names/dictionaries/adjectives` - Adjectives only
  - `@revivifai/unique-names/dictionaries/nouns` - Nouns only
  - `@revivifai/unique-names/dictionaries/verbs` - Verbs only
  - `@revivifai/unique-names/dictionaries/adverbs` - Adverbs only
  - `@revivifai/unique-names/utils/random` - Random utilities
- **`"sideEffects": false`** in package.json for bundler tree-shaking optimization
- Comprehensive documentation for bundle size impact and memory optimization strategies

### Changed

- **BREAKING**: `generate()` now requires `dictionaries` option (no default dictionaries)
- **BREAKING**: `haikunate()` now requires `dictionaries` option
- Removed static dictionary imports from generator module for better tree-shaking

### Fixed

- Improved memory efficiency for browser and serverless environments
- Better tree-shaking support for unused dictionary exports

## [1.0.0] - 2026-05-19

### Added

- Initial release
- `generate()` function for unique name generation
- `haikunate()` function for haiku-style names
- WordNet 3.1 dictionaries (adjectives, nouns, verbs, adverbs)
- Cryptographically secure random generation using Node.js `crypto` module
- Seeded PRNG (Mulberry32) for deterministic output
- TypeScript support with full type definitions
- Zero runtime dependencies
