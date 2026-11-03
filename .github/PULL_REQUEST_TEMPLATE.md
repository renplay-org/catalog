## Game

<!-- Name, version, and what this PR does: new recipe, new release, fix. -->

## How I tested

- Renplay version:
- Archive: exact file name from the official source (not a repack)
- Browsers / devices:

## Checklist

- [ ] The archive is the official download (website, itch.io, Patreon, Steam…), linked under `links`
- [ ] `sha256` and `size` are from that exact file (`shasum -a 256 <file>`; Renplay's Settings › Catalog › **Export recipe** fills them in)
- [ ] The game installs in Renplay from the recipe and starts
- [ ] Played past the first chapter (or ~30 minutes): images, music and videos work
- [ ] Saving, loading and resuming from the library work
- [ ] `status` matches what I saw (`verified` plays through, `playable` has issues described in `verified.notes`)
- [ ] `cover` links the official cover art (itch.io `og:image`, Steam or the developer's site), not a copy
- [ ] `npm ci && npm run build` passes
- [ ] No game files are added to this repository (only recipes, covers and small patches)
