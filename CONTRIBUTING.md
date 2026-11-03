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
   id, save folder, the engine version the game was made with (`madeWith`), the runtime and the
   archive's size and sha256.
5. Add the developer, `links` (at least the official page), `tags` and `nsfw`, and set `status`:
   - `verified`: plays through without problems
   - `playable`: works, with issues you describe in `verified.notes`
   - `broken`: does not work; say why in `verified.notes`, so nobody has to find out again
6. Add the cover: the official art's URL (below).
7. Save the recipe as `recipes/<id>.yaml`, run `npm ci && npm run build`, and open a pull request.

`recipes/_template.yaml` explains every field. Keep its first line, which points editors such as VS
Code (with the YAML extension) at the schema, so they check the recipe as you type.

## Covers

Renplay shows the catalog's cover for a game and nothing else, so a cover must make the game
recognizable at a glance, the way its itch.io, Steam or F95zone thumbnail does. Every game that
works (newest release `verified` or `playable`) needs one.

- **The official cover art**, with the game's logo: the cover image of the game's itch.io page is
  the first choice, then a Steam capsule or the developer's own banner. Not screenshots, fan art,
  or images from download sites.
- **Linked, not copied.** Put the image's https URL in `cover`, on the developer's own hosting. On
  an itch.io page it is the `og:image`:
  `curl -sL <itch page> | grep -o '<meta[^>]*og:image[^>]*>'`. Patreon image links expire, so do
  not use them. Many covers of adult games are not safe for work, and this repository must not host
  them; Renplay downloads each cover once and keeps it on the server.
- **Shape:** landscape, 1.2:1 to 2.2:1 (itch.io covers are 630×500), at least 600 pixels wide.
- **No official art?** Then, and only for safe-for-work images, add a file:
  `npm run cover -- <image> <id>` writes `covers/<id>.webp` (1260×1000) and you set
  `cover: covers/<id>.webp`.

The build downloads every cover, checks it, and publishes its sha256 and size. A weekly run notices
covers that disappeared.

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
- **Needs another runtime version**: set `runtime` (published versions:
  [renplay-web/engines](https://github.com/renplay-web/engines)).

Renplay splits `.rpa` archives, decides what streams and finds the save folder by itself, so most
recipes need none of this.

## Review

CI validates every recipe against the schema and checks engine versions, checksums, links between
games and covers. A maintainer reviews the rest, merges, and the index is published within a few
minutes. Renplay instances pick it up on their next catalog refresh (every 6 hours, or Settings ›
Catalog › Refresh).
