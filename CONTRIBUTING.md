# Contributing recipes

Thanks for adding games! A recipe tells Renplay which download of a game works in the browser and
how to build it. **Never add game files**: recipes point to the official download, and players get
the game from there.

## Add a game

1. Download the game's PC version from its official source.
2. In Renplay, add the archive (Add games → Upload, or copy it into the archives folder) and install
   it.
3. Play it: past the first chapter, check images, music and videos, save, load, and resume from the
   library (ideally also on a second device, such as a phone).
4. In Renplay's **Settings › Catalog**, choose the game and press **Export recipe**. It fills in the
   id, save folder, Ren'Py version, engine and the archive's size and sha256.
5. Add the developer, `links` (at least the official page), `tags` and `nsfw`, and set `status`:
   - `verified`: plays through without problems
   - `playable`: works, with issues you describe in `verified.notes`
   - `broken`: does not work; say why in `verified.notes`, so nobody has to find out again
6. Add a cover (below).
7. Save the recipe as `recipes/<id>.yaml`, run `npm ci && npm run build`, and open a pull request.

`recipes/_template.yaml` explains every field.

## Covers

Renplay shows the catalog's cover for a game and nothing else, so covers are curated. Every game
that works (newest release `verified` or `playable`) needs one.

- **Source:** the game's own art: the developer's store page screenshots, or the game's menu art.
- **Safe for work:** no nudity or sexual content. A library is often on a shared screen.
- **No text or logos:** Renplay prints the title over the cover.
- **Shape:** 16:9, 1280 to 1920 pixels wide, WebP, under 400 KB, at `covers/<id>.webp`.

`npm run cover -- <image> <id>` makes one from any image (1280×720, cropped to 16:9). Add
`--focus attention` (or `top`, `bottom`, `left`, `right`) when the crop cuts off what matters.

## New version of a listed game

Add a release at the top of `releases` with the new archive's name, size and sha256, and test it the
same way. Keep older releases: people may still have those files. Add a `match` pattern if the
developer's file names follow one, so Renplay recognizes future versions before they are listed.
Renplay offers the update to everyone who has an older listed version installed.

## When a game needs help

- **Something must be ready before streaming can help** (a file the game reads directly in
  Python): list it under `build.keep` (globs relative to `game/`).
- **The download contains junk** (PSD sources, backups): `build.exclude`.
- **The game needs a fix for the browser**: add a small `.rpy` under `patches/<id>/` and reference it
  under `build.patches`. Keep patches minimal and explain them in the PR.
- **Needs another engine version**: set `engine` (published versions:
  [renplay-web/engines](https://github.com/renplay-web/engines)).

Renplay splits `.rpa` archives, decides what streams and finds the save folder by itself, so most
recipes need none of this.

## Review

CI validates every recipe against the schema and checks engine versions, checksums, links between
games and covers. A maintainer reviews the rest, merges, and the index is published within a few
minutes. Renplay instances pick it up on their next catalog refresh (every 6 hours, or Settings ›
Catalog › Refresh).
