# Contributing recipes

Thanks for adding games! A recipe tells renplay which download of a game works in the browser and
how to build it. **Never add game files**: recipes point to the official download, players get the
game from there.

## Add a game

1. Download the game's PC version from its official source.
2. In renplay, add the archive (Add games → upload, or copy it into the archives folder) and install it.
3. Play it: past the first chapter, check images, music and videos, save, load, and resume from the
   library (ideally also on a second device).
4. On the game's **Details** tab, press **Export recipe**. It fills in the id, save folder, Ren'Py
   version, engine and the archive's size and sha256.
5. Add the developer, `links` (at least the official page), `tags`, `nsfw`, and set `status`:
   - `verified`: plays through without problems
   - `playable`: works, with issues you describe in `verified.notes`
   - `broken`: does not work; say why in `verified.notes`, so nobody has to find out again
6. Save it as `recipes/<id>.yaml`, run `npm ci && npm run build`, and open a pull request.

`recipes/_template.yaml` explains every field.

## New version of a listed game

Add a release at the top of `releases` with the new archive's name, size and sha256, and test it the
same way. Keep older releases: people may still have those files. Add a `match` pattern if the
developer's file names follow one, so renplay recognizes future versions before they are listed.

## When a game needs help

- **Something must be ready before streaming can help** (main menu art, a loading screen): list it
  under `build.keep` (globs relative to `game/`).
- **The download contains junk** (PSD sources, backups): `build.exclude`.
- **The game needs a fix for the browser**: add a small `.rpy` under `patches/<id>/` and reference it
  under `build.patches`. Keep patches minimal and explain them in the PR.
- **Needs another engine version**: set `engine` (published versions: renplay-web/engines).

## Covers

Optional. `covers/<id>.webp`, 16:9, at least 1280×720, under 300 KB. renplay makes its own cover from
the main menu when there is none.
