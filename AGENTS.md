# Renplay catalog: notes for agents

This repository is the curated list of games that work in
[Renplay](https://github.com/renplay-org/renplay), a self-hosted web app that plays PC releases of
Ren'Py games in the browser with saves on the server. Ren'Py comes first; HTML games are in too,
as second-class citizens (`engine` in a recipe), and other engines only when their normal download
plays as easily. Unity WebGL and Godot web builds work in Renplay but rarely come as a download,
so they are not added. It holds recipes
(YAML), safe-for-work art files and small patches, and publishes them through Cloudflare as
`https://catalog.renplay.org/index.v4.json` (schema 4, the art system, Renplay 4.0 and later),
`index.v4.sfw.json` (schema 4 without adult games, game `content` fields and the `content`
vocabulary group), and the files Renplay 3.x reads until it is retired: `index.v3.json`,
`index.v3.sfw.json` (schema 3) and `index.json` (schema 2, Renplay 2.5 and older), their `cover`
derived from the art. Never make blocking clients fetch a full index first.

**Never commit game files** (archives, scripts, images from a game) and **never commit art of an
adult game**: adult art is linked from SteamGridDB, Steam, itch.io or `covers.renplay.org`, and
the build refuses a repository file for an adult game. Safe-for-work art without a stable home may
live in `covers/`.

## Layout

| Path | What |
|---|---|
| `recipes/<id>.yaml` | One game. The file name is the id. |
| `recipes/_template.yaml` | Every field, explained. CI validates it too. |
| `covers/<id>.webp` | Rare: safe-for-work art without an official copy to link to. Adult art goes to the cover host instead (`npm run cover:upload`, `https://covers.renplay.org`, a Cloudflare R2 bucket; the maintainer has the token). |
| `patches/<id>/*.rpy` | Small browser fixes, referenced from `build.patches`. Rare. |
| `schema/recipe.schema.json` | JSON Schema for recipes, published at its `$id`. Every recipe starts with `# yaml-language-server: $schema=<that URL>`, so editors check it as you type; the build refuses recipes without it. |
| `scripts/build.mjs` | Validates everything and writes `dist/` (the published site). |
| `scripts/art.mjs` | The art pipeline the build and the validate command share: fetch once, measure, sha256, ThumbHash, tint, shape checks, defaults, the derived v3 cover. |
| `scripts/validate.mjs` | `npm run validate -- <folder>` checks a folder of recipes (forks, local folders). |
| `scripts/sgdb.mjs` | `STEAMGRIDDB_API_KEY=… npm run sgdb -- "<game name>"` prints SteamGridDB candidates per format with author, score, size and nsfw flag. |
| `scripts/cover.mjs` | `npm run cover -- <image> <id>` makes a repository art file (1260×1000 WebP). |
| `scripts/cover-upload.mjs` | `npm run cover:upload -- <image> <id>` makes the same WebP and uploads it to the cover host as `<id>-<hash>.webp`; needs `RENPLAY_COVERS_TOKEN`. |
| `.agents/skills/` | Procedures: add a game, add a release, find the art. `.claude/skills` links here. |

## Commands

```sh
npm ci              # once
npm run build       # validate recipes and art, then write dist/index.v4.json, dist/index.v4.sfw.json, dist/index.v3.json, dist/index.v3.sfw.json and dist/index.json
node --test scripts/*.test.mjs  # schema 4, art checks, content safety and index compatibility
npm run validate -- <folder>    # check recipes in another folder (forks, local folders)
npm run cover -- <image> <id> [--focus attention|top|bottom|left|right]   # safe-for-work art file
RENPLAY_COVERS_TOKEN=… npm run cover:upload -- <image> <id> [--focus …]  # adult art, to the cover host
STEAMGRIDDB_API_KEY=… npm run sgdb -- "<game name>"   # SteamGridDB candidates with credits
shasum -a 256 <archive>          # macOS (Linux: sha256sum)
stat -f %z <archive>             # size in bytes on macOS (Linux: stat -c %s)
```

`npm run build` and `node --test scripts/*.test.mjs` must pass before a pull request. The build
fetches every linked image once and keeps the bytes in `.art-cache/` (gitignored, CI caches the
folder between runs), so rebuilds are cheap and what ships is what was measured.

## How Renplay uses a recipe

- **Matching an archive:** by sha256, then by file name and size, then by `match` patterns (for new
  versions not listed yet). Installed games also link to a recipe by id or save folder, so a recipe
  added after an install applies without reinstalling.
- **Library metadata:** title, developer, tags and links come only from the recipe. Art starts
  from the recipe's defaults. An instance can override per game and per person. Users cannot edit
  the metadata in Renplay, so a recipe's metadata is what everyone sees.
- **Art:** the `art` list links the game's pictures in SteamGridDB's formats (grid 600×900, wide
  920×430, hero 1920×620, a transparent logo, a square icon). The build fetches each image once,
  measures it, and publishes its sha256, size, ThumbHash, average colour and tint, plus the credit
  for SteamGridDB art. Renplay makes missing formats from what is there (real art first, then a
  crop at the focal point, composed or a glow, whole on its glow last) and caches everything it
  shows on the instance.
- **Building:** `engine` says what made the game (`renpy` by default, `html`, `godot`, `unity`);
  `runtime` picks the web runtime to build with (from
  [renplay-org/engines](https://github.com/renplay-org/engines)), per recipe or per release, and
  `madeWith` records the engine version the game was made with. `build.keep`, `build.exclude` and
  `build.patches` adjust the build. Renplay detects everything else (archives, streaming, save
  folder, screen size).
- **Updates:** when a recipe lists a `verified` or `playable` release newer than the installed one,
  Renplay shows "Update".
- **Old clients:** Renplay 3.x reads the schema 3 indexes, where each game's art is reduced to one
  derived `cover` (an itch.io source first, else the wide grid, else a grid) with its sha256 and
  size. Renplay downloads it on catalog refresh and refuses it if the checksum differs.

## Rules for recipes

- `id`: lowercase words joined by dashes, matching the file name. Never rename an id once merged:
  installed games are linked by it.
- `releases`: newest first. Keep old releases. A `verified` release needs the archive's sha256.
- `status`: `verified` (plays through), `playable` (works with issues, described in
  `verified.notes`), `broken` (say why), `untested`.
- `links`: only official pages (developer site, itch.io, Patreon, SubscribeStar, Steam, Discord) and
  the F95zone thread; `walkthrough` for a guide. https only.
- `tags`: at most ten non-content ids from `schema/tags.json`, never free-form labels. `content`
  holds the vocabulary's content-group ids; searchable, never library chips. Use the linked
  F95zone thread's tag list, or map existing tags by hand without inventing ids (see README).
- `summary`: optional safe-for-work premise, developer wording with explicit sentences/clauses
  removed, one to three sentences, plain text, at most 600 characters. Omit without an F95 thread.
- `state`: ongoing/completed/on-hold/abandoned from F95 prefixes, ongoing without a prefix or
  thread (unverified default). Not the release's `status`.
- Vocabulary changes: update `schema/tags.json`, then `node scripts/tags-schema.mjs`. The build
  checks enum drift and unknown/wrong-group tags. The full indexes publish `vocabulary`, label
  `tags` and `tagIds`; schema 2 must not gain `tagIds`, `content`, `summary` or `state`.
- `free`: optional boolean, true only when the release in this recipe is free from its developer
  with no payment or subscription. Omit when unknown, including games with only older free releases.
- `phone`: optional curated phone rating (`great`, `playable`, `desktop`), set only by a
  maintainer who tried the game on a phone. Never guessed by the build.
- `saveDir`: Ren'Py's `config.save_directory`, exactly. Renplay reports it on install.
- Text in `verified.notes`: full sentences, plain English, what was tested and any problem.

## Art

Five formats, in the shape of SteamGridDB: grid 600×900, wide 920×430, hero 1920×620 (an exact 2x
of each is the same shape), a transparent PNG logo of any size, a square icon of 512 and up. A
game needs at least one grid or one hero. Sources, in order: SteamGridDB (referenced by id, always
with its author's credit), Steam's library art (`library_600x900_2x.jpg`, `library_hero.jpg`,
`logo.png`, `header.jpg`), the itch.io page's cover, the developer's own art, Renplay-made art on
`covers.renplay.org`. Steam, SteamGridDB and Renplay art must be in the format's shape. itch.io
and developer art is a source Renplay crops or composes from, so any shape goes. Art of an adult
game is never committed to this repository. See `.agents/skills/find-art`.

## Workflow

1. Branch from `main`, one game (or one change) per pull request.
2. `npm run build` passes; the PR template's checklist is filled in.
3. CI (`.github/workflows/pages.yml`) validates on every PR. Merging to `main` publishes the index
   to catalog.renplay.org (Cloudflare) within minutes.
4. Commit messages: `Add <Game> (<version>, <status>)`, `<Game>: add <version>`, `<Game>: <fix>`.

Agents prepare branches and pull requests; a maintainer merges.
