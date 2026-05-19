#!/usr/bin/env node
/**
 * Script to extract words from WordNet index files.
 * WordNet index files have the format:
 * word pos sense_cnt p_cnt [ptr_symbol...] sense_offset...
 *
 * We extract just the first column (word) from each non-license line.
 */

/* eslint-disable no-console, security/detect-non-literal-fs-filename */

import * as fs from "node:fs";
import * as path from "node:path";

const DICT_DIR = "./dict";
const OUTPUT_DIR = "./src/dictionaries";

interface WordStats {
  adjectives: number;
  adverbs: number;
  nouns: number;
  verbs: number;
}

function extractWords(indexFile: string): string[] {
  const content = fs.readFileSync(indexFile, "utf-8");
  const lines = content.split("\n");
  const words: string[] = [];

  for (const line of lines) {
    // Skip license lines (start with space or are empty)
    if (line.startsWith(" ") || line.trim() === "") {
      continue;
    }

    // Skip lines that look like license text
    if ((/^[0-9]+ [A-Z]/.exec(line)) || line.includes("Princeton University")) {
      continue;
    }

    // Extract the first word (column)
    const parts = line.split(/\s+/);
    const word = parts[0];

    if (word && word.length > 0 && !(/^[0-9]/.exec(word))) {
      // Filter out multi-word phrases (containing underscore) and special characters
      if (!word.includes("_") && !word.includes("-") && (/^[a-zA-Z]+$/.exec(word))) {
        words.push(word.toLowerCase());
      }
    }
  }

  // Dedupe and sort
  return [...new Set(words)].sort();
}

function generateTypeScriptFile(words: string[], name: string): string {
  return `/**
 * ${name.charAt(0).toUpperCase() + name.slice(1)} dictionary extracted from WordNet 3.1.
 * WordNet 3.1 Copyright 2011 by Princeton University. All rights reserved.
 * 
 * Total words: ${words.length}
 */
export const ${name}: readonly string[] = [
${words.map((w) => `  "${w}",`).join("\n")}
] as const;
`;
}

function main(): void {
  const stats: WordStats = {
    adjectives: 0,
    adverbs: 0,
    nouns: 0,
    verbs: 0,
  };

  const files = [
    { input: "index.adj", output: "adjectives", stat: "adjectives" as keyof WordStats },
    { input: "index.noun", output: "nouns", stat: "nouns" as keyof WordStats },
    { input: "index.verb", output: "verbs", stat: "verbs" as keyof WordStats },
    { input: "index.adv", output: "adverbs", stat: "adverbs" as keyof WordStats },
  ];

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  for (const file of files) {
    const inputPath = path.join(DICT_DIR, file.input);
    const outputPath = path.join(OUTPUT_DIR, `${file.output}.ts`);

    console.log(`Processing ${file.input}...`);

    const words = extractWords(inputPath);

    stats[file.stat] = words.length;

    const tsContent = generateTypeScriptFile(words, file.output);

    fs.writeFileSync(outputPath, tsContent);

    console.log(`  -> ${words.length} words written to ${outputPath}`);
  }

  // Generate index file
  const indexContent = `/**
 * Dictionary exports from WordNet 3.1.
 * WordNet 3.1 Copyright 2011 by Princeton University. All rights reserved.
 */
export { adjectives } from "./adjectives.js";
export { nouns } from "./nouns.js";
export { verbs } from "./verbs.js";
export { adverbs } from "./adverbs.js";
`;

  fs.writeFileSync(path.join(OUTPUT_DIR, "index.ts"), indexContent);

  console.log("\n=== Summary ===");
  console.log(`Adjectives: ${stats.adjectives}`);
  console.log(`Nouns: ${stats.nouns}`);
  console.log(`Verbs: ${stats.verbs}`);
  console.log(`Adverbs: ${stats.adverbs}`);
  console.log(`Total: ${stats.adjectives + stats.nouns + stats.verbs + stats.adverbs}`);
}

main();
