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
4. In Renplay's **Settings › Catalog**, choose the game and press **Export recipe**. It fills in
   the id, save folder, the engine version the game was made with (`madeWith`), the runtime and the
   archive's size and sha256.
5. Add the developer, `links` (at least the official page), `tags` and `nsfw`, and set `status`:
   - `verified`: plays through without problems
   - `playable`: works, with issues you describe in `verified.notes`
   - `broken`: does not work; say why in `verified.notes`, so nobody has to find out again
6. Add the art (below). A game needs at least one grid or one hero.
7. Save the recipe as `recipes/<id>.yaml`, run `npm ci && npm run build`, and open a pull request.

`recipes/_template.yaml` explains every field. Keep its first line, which points editors such as VS
Code (with the YAML extension) at the schema, so they check the recipe as you type.

## Art

Renplay shows every game through its art: the library grid, the stage at the top of the game page,
the room behind the screens. A recipe links the game's pictures in five formats, in the shape of
SteamGridDB:

| Format | Size | What it is |
|---|---|---|
| `grid` | 600×900 (2x 1200×1800) | The poster: library tiles, the stage poster |
| `wide` | 920×430 | The wide tile: Up next, the phone stage art |
| `hero` | 1920×620 (2x 3840×1240) | The top of the game page, the room behind every screen |
| `logo` | transparent PNG, any size | The title on the stage. `dark: true` for a dark logo |
| `icon` | square, 512 and up | Rows: History, Activity, Add games |

An exact 2x of a format is the same shape, and Steam's half-size `header.jpg` (460×215) counts as
a wide. The first image of a kind in its format's shape is the default, else the first image. Add
more of a kind as alternatives and mark one `default: true` to choose it. A `focal: [x, y]` (0 to 1) says where the picture matters and forces
a crop into missing formats.

**Sources, in order:**

1. **SteamGridDB**, when the game has an entry and a maintainer has a key: referenced by id, never
   copied, always with its author's credit (`by`, `byUrl`).
   `STEAMGRIDDB_API_KEY=… npm run sgdb -- "<game name>"` prints the candidates per format with
   author, score, size and nsfw flag. Never invent ids or authors.
2. **Steam's library art**, when the game is on Steam. Check which files exist for the app id:
   `library_600x900_2x.jpg` (grid), `library_hero.jpg` (hero), `logo.png` (logo),
   `header.jpg` (wide). Some apps lack some files.
3. **The itch.io page's cover** (its `og:image`:
   `curl -sL <itch page> | grep -o '<meta[^>]*og:image[^>]*>'`), as a grid source.
4. **The developer's own art** from their site or press kit.
5. **Renplay-made art** on `covers.renplay.org`, only when nothing else exists.

Steam, SteamGridDB and Renplay art must already be in the format's shape (within 2 percent, or an
exact 2x). itch.io and developer art may be any shape: Renplay places it by its making order (real
art first, then a crop at the focal point, composed or a glow, whole on its glow last).

**Art of an adult game is never committed to this repository.** Adult games link SteamGridDB,
Steam, itch.io or `covers.renplay.org`. The build refuses a repository file for them. Safe-for-work
art without an official copy to link to may become a repository file: `npm run cover -- <image> <id>`
writes `covers/<id>.webp`. Adult art of that kind goes to the cover host instead: say in the pull
request which official image to use, and a maintainer puts it on `https://covers.renplay.org`
(`RENPLAY_COVERS_TOKEN=… npm run cover:upload -- <image> <id>`).

Do not use Patreon images (their links expire) or images from download and aggregator sites.

The build downloads every linked image once (kept in `.art-cache/` between runs), checks it, and
publishes its sha256, size, ThumbHash, average colour and tint. A weekly run notices art that
disappeared.

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
  [renplay-org/engines](https://github.com/renplay-org/engines)).

Renplay splits `.rpa` archives, decides what streams and finds the save folder by itself, so most
recipes need none of this.

## Review

CI validates every recipe against the schema and checks engine versions, checksums, links between
games and art. A maintainer reviews the rest, merges, and the index is published within a few
minutes. Renplay instances pick it up on their next catalog refresh (every 6 hours, or Settings ›
Catalog › Refresh).
