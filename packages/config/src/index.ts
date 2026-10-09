import { fileURLToPath } from "node:url";
import { defineConfig } from "wxt";

/** Common build defaults; each extension owns its manifest and Firefox ID. */
export const firefoxConfig = defineConfig({
  manifestVersion: 3,
  // Prefer explicit imports so shared modules and entrypoints use the same rules.
  imports: false,
  zip: {
    // Source archives need the workspace catalog and local dependencies to rebuild.
    sourcesRoot: fileURLToPath(new URL("../../../", import.meta.url)),
    includeSources: [
      "package.json",
      "bun.lock",
      "README.md",
      "tsconfig*.json",
      "biome.json",
      "scripts/**",
      "templates/**",
      "extensions/**",
      "packages/**",
    ],
    excludeSources: [
      "**/node_modules/**",
      "**/.wxt/**",
      "**/.output/**",
      "**/.env*",
    ],
  },
});
