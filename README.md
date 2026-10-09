# ffext

A Bun workspace monorepo for custom Firefox extensions. Each extension is an
independent [WXT](https://wxt.dev/) project with its own manifest, version, and
Firefox add-on ID. The starter uses TypeScript and plain HTML/CSS; add a UI
framework to an individual extension when needed.

## Quick start

Install Bun 1.3.6 or newer, Node.js 22.12 or newer (for the WXT and Mozilla CLI tools),
and Firefox 142 or newer. CI uses Bun 1.3.6 and Node.js 24.

```sh
bun install
bun run dev
```

The dev command starts `@ffext/starter` in a temporary Firefox profile with live
reload. Generated types are prepared during installation. If Firefox is installed
in a nonstandard location, configure `webExt.binaries.firefox` in the extension's
`wxt.config.ts`.

## Layout

```text
extensions/           Independent Firefox extensions
  starter/            Minimal working popup; safe to replace or remove
  tab-headers/        Set request headers for the current tab
packages/
  config/             Shared WXT defaults, exported as @ffext/config
templates/extension/  Source template for new extensions
scripts/              Bun scaffolding command and its tests
.github/workflows/    Validation and ZIP artifacts for every extension
```

Use `packages/*` for shared code. Give each package a unique `@ffext/...` name,
declare local dependencies with `workspace:*`, and export its TypeScript source;
WXT bundles source imports without a separate package build. Tool dependencies
live at the root; the WXT version is centralized in the Bun workspace catalog.

### Tab Headers

Run `bun run --filter @ffext/tab-headers dev` to develop the header extension.
Open its popup on a website tab, add header names and values, then click **Apply**
or **Apply & reload**. Overrides apply only to that tab, including requests to
other sites, until you clear them, close the tab, or restart Firefox. See
[the extension README](extensions/tab-headers/README.md) for loading instructions,
permissions, and browser limitations.

## Add an extension

```sh
bun run new tab-tools
bun install
bun run --filter @ffext/tab-tools dev
```

Names must be lowercase kebab-case, start with a letter, and contain at most 48
characters. The generator creates a popup and a unique local Firefox ID and
refuses to overwrite an existing directory. Edit `templates/extension/` to change
future scaffolds; existing extensions are independent.

Each `wxt.config.ts` imports the shared configuration and declares its own
manifest. Add browser permissions only as a feature needs them. The template uses
Manifest V3, targets Firefox 142+, and declares no data collection. Update that
declaration if an extension starts transmitting user data. Firefox's current
declaration format is documented on
[MDN](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/browser_specific_settings).

Add entrypoints under `entrypoints/`, for example `background.ts`, `content.ts`,
or `options/index.html`. Auto-imports are disabled; import `browser` from
`wxt/browser`, `defineBackground` from `wxt/utils/define-background`, or
`defineContentScript` from `wxt/utils/define-content-script` explicitly.

## Commands

| Command | Purpose |
| --- | --- |
| `bun run dev` | Develop the starter in Firefox |
| `bun run new <name>` | Scaffold an extension |
| `bun run prepare` | Regenerate WXT types for all extensions |
| `bun run check` | Check formatting, lint, TypeScript, and run Bun tests |
| `bun run lint:fix` | Apply Biome's safe fixes and formatting |
| `bun run build` | Build every extension for Firefox |
| `bun run zip` | Build extension ZIPs and source archives |
| `bun run --filter './extensions/*' lint:manifest` | Validate built extensions with Mozilla's web-ext |

Target one workspace with `bun run --filter @ffext/tab-tools build` (or `dev`,
`zip`, or `typecheck`). Test pure shared logic with `bun:test`; browser integration
tests need a browser or mocks.

## Load and package

Production files go to `extensions/<name>/.output/firefox-mv3/`. To load a build
manually, visit `about:debugging#/runtime/this-firefox`, choose **Load Temporary
Add-on**, and select its `manifest.json`. Temporary installations disappear when
Firefox restarts.

`bun run zip` writes two archives under each extension's `.output/`: the built
Firefox extension and the monorepo sources, including the lockfile and shared
packages needed to reproduce the build. To rebuild a source archive, extract it,
run `bun install --frozen-lockfile` at its root, then run the selected extension's
build command. CI runs checks, builds, manifest validation, and packaging, then
uploads the ZIPs as artifacts.

ZIPs are unsigned. For normal installation, submit them for Mozilla signing or
publish through AMO. Choose a permanent, unique `browser_specific_settings.gecko.id`
before the first signed release, keep it stable afterward, and increment that
extension's `package.json` version for each release. The generated `@ffext.local`
IDs are development defaults.

Commit `bun.lock` and use `bun install --frozen-lockfile` in CI. Generated `.wxt/`,
`.output/`, dependencies, and environment files are ignored by Git.
