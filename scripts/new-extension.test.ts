import { afterEach, expect, test } from "bun:test";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createExtension } from "./new-extension";

const directories: string[] = [];

async function temporaryDirectory() {
  const directory = await mkdtemp(join(tmpdir(), "ffext-test-"));
  directories.push(directory);
  return directory;
}

afterEach(async () => {
  await Promise.all(
    directories.splice(0).map((path) => rm(path, { recursive: true })),
  );
});

test("generates an independently named Firefox extension", async () => {
  const directory = await temporaryDirectory();
  const destination = await createExtension("tab-tools", directory);
  const manifest = JSON.parse(
    await readFile(join(destination, "package.json"), "utf8"),
  );
  expect(manifest.name).toBe("@ffext/tab-tools");
  const config = await readFile(join(destination, "wxt.config.ts"), "utf8");
  expect(config).toContain('name: "Tab Tools"');
  expect(config).toContain('id: "tab-tools@ffext.local"');
  expect(config).not.toContain("__SLUG__");
  expect(
    await readFile(join(destination, "entrypoints/popup/index.html"), "utf8"),
  ).toContain("<title>Tab Tools</title>");
});

test("rejects invalid names and path traversal", async () => {
  const directory = await temporaryDirectory();
  for (const slug of [
    "../escape",
    "MyExtension",
    "a/b",
    "a--b",
    "",
    "a".repeat(49),
  ]) {
    await expect(createExtension(slug, directory)).rejects.toThrow(
      "kebab-case",
    );
  }
});

test("refuses to overwrite an existing extension", async () => {
  const directory = await temporaryDirectory();
  const destination = await createExtension("tab-tools", directory);
  const marker = join(destination, "package.json");
  await writeFile(marker, "keep this file");
  await expect(createExtension("tab-tools", directory)).rejects.toThrow();
  expect(await readFile(marker, "utf8")).toBe("keep this file");
});
