// @ts-check
import { createConfig } from "@revivifai/eslint-config";

const config = createConfig({
  tsconfigRootDir: import.meta.dirname,
});

// Modify the existing projectService config to include test and scripts files
// so typescript-eslint can parse them even though they're not in tsconfig.json
for (const entry of config) {
  // Cast to any because eslint's Linter.Config type doesn't include
  // typescript-eslint's `projectService` extension to parserOptions
  const languageOptions = /** @type {any} */ (entry).languageOptions;
  const parserOptions = languageOptions?.parserOptions;
  const projectService = parserOptions?.projectService;

  if (
    projectService &&
    typeof projectService === "object" &&
    "allowDefaultProject" in projectService &&
    Array.isArray(projectService.allowDefaultProject)
  ) {
    projectService.allowDefaultProject.push(
      "scripts/extract-words.ts",
      "test/generator.test.ts",
      "test/random.test.ts",
      "test/word-pool.test.ts",
    );
  }
}

export default config;