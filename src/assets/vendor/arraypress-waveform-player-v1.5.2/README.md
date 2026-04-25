# ArrayPress WaveformPlayer v1.5.2 (vendored)

These files are an unmodified copy of [`@arraypress/waveform-player@1.5.2`](https://www.npmjs.com/package/@arraypress/waveform-player), vendored into the Marbl Codes component library so the Marbl waveform-player component does not depend on a third-party CDN at runtime.

## Why vendored

Per Universal Truth #94 — *"Vendor third-party scripts. CDN-hosted script sources in CSP are a supply-chain vulnerability."* Loading from `unpkg.com` would either require widening our `script-src` CSP to include `unpkg.com` (a supply-chain risk) or serving via `self` after vendoring (the chosen path).

## Source

| | |
|---|---|
| Package | `@arraypress/waveform-player` |
| Version | 1.5.2 |
| Author | ArrayPress |
| Homepage | https://waveformplayer.com |
| License | MIT (see `LICENSE`) |
| Vendored from | `https://unpkg.com/@arraypress/waveform-player@1.5.2/dist/` |
| Vendored on | 2026-04-25 |

## Files

| File | Source |
|---|---|
| `waveform-player.css` | `dist/waveform-player.css` (unminified, 4.2 KB) |
| `waveform-player.min.js` | `dist/waveform-player.min.js` (minified IIFE, 29 KB) |
| `LICENSE` | MIT licence text |

## How to update

When upgrading to a new ArrayPress version:

1. Create a new version directory: `assets/arraypress/v<NEW_VERSION>/`
2. Download from unpkg:
   ```bash
   cd assets/arraypress/v<NEW_VERSION>
   curl -sSfL "https://unpkg.com/@arraypress/waveform-player@<NEW_VERSION>/dist/waveform-player.css" -o waveform-player.css
   curl -sSfL "https://unpkg.com/@arraypress/waveform-player@<NEW_VERSION>/dist/waveform-player.min.js" -o waveform-player.min.js
   curl -sSfL "https://unpkg.com/@arraypress/waveform-player@<NEW_VERSION>/LICENSE" -o LICENSE
   ```
3. Update `waveform-player.md` Section 2 (Dependencies) to reference the new version path
4. Update `preview.html` to reference the new version path
5. Test the glow-patch in `waveform-player-init.js` still works (release notes will tell you if `drawWaveform` changed)
6. Update consumers of the component library to point at the new version path
7. Keep the previous version directory until consumers have migrated; remove only when no consumer references it

## Modifications

**None.** These files are byte-identical to the upstream `dist/` artefacts. Any patches Marbl applies to the player's behaviour live in `../../waveform-player-init.js` (e.g. the canvas-glow monkey-patch), never in this vendored bundle.
