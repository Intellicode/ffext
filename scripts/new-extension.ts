import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const template = join(root, "templates/extension");

export async function createExtension(
  slug: string,
  extensionsDirectory = join(root, "extensions"),
): Promise<string> {
  if (!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 48) {
    throw new Error("Use a lowercase kebab-case name, at most 48 characters.");
  }

  const title = slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
  const files = await readdir(template, {
    recursive: true,
    withFileTypes: true,
  });
  await mkdir(extensionsDirectory, { recursive: true });
  const destination = join(extensionsDirectory, slug);
  // Non-recursive creation refuses to overwrite any existing extension.
  await mkdir(destination);

  for (const file of files) {
    if (!file.isFile()) continue;
    const source = join(file.parentPath, file.name);
    const relative = source.slice(template.length + 1);
    const target = join(destination, relative);
    const content = (await readFile(source, "utf8"))
      .replaceAll("__SLUG__", slug)
      .replaceAll("__TITLE__", title);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, content);
  }

  return destination;
}

if (import.meta.main) {
  const slug = Bun.argv[2];
  if (!slug || Bun.argv.length !== 3) {
    console.error("Usage: bun run new <extension-name>");
    process.exit(1);
  }

  try {
    const destination = await createExtension(slug);
    console.log(`Created ${destination}`);
    console.log(`Next: bun install && bun run --filter @ffext/${slug} dev`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
