# Tab Headers icon

Created with the built-in image generation tool. The original artwork is
`icon-source.png`; transparent PNG exports in `../public/icons/` are used by
the extension manifest and toolbar action.

## Generation prompt

Use case: logo-brand. Asset type: production Firefox browser extension icon for
'Tab Headers', a developer utility that sets request headers on the current tab.
Create one polished square app icon, centered, front-facing, clean geometric flat
graphic. A cobalt blue rounded-square tile containing a bold white browser tab
outline and two horizontal header-control bars with small adjustment knobs,
suggesting per-tab request settings. Match an understated modern developer-tool
interface with accent blue #2563eb and a subtle darker blue gradient. The white
mark must be very simple, chunky and optically balanced, immediately legible when
reduced to 16 or 32 pixels. Tile fills approximately 90% of the square canvas,
transparent exterior around rounded corners. No text, no letters, no numbers,
no fine details, no shadows outside the tile, no perspective, no mockups, no extra
icons. Actual transparent background. Deliver a single square 1024x1024 icon.

## Export

From the repository root, regenerate the browser sizes with macOS `sips`:

```sh
for size in 16 32 48 96 128; do
  sips -z "$size" "$size" extensions/tab-headers/assets/icon-source.png \
    --out "extensions/tab-headers/public/icons/$size.png"
done
```
