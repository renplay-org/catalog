# Renplay catalog: notes for agents

This repository is the curated list of games that work in
[Renplay](https://github.com/renplay-web/renplay), a self-hosted web app that plays PC releases of
Ren'Py games in the browser with saves on the server. Ren'Py comes first; HTML, Godot and Unity
WebGL games are being added as second-class citizens (`engine` in a recipe). It holds recipes
(YAML), covers and small patches, and publishes them on GitHub Pages as
`https://renplay-web.github.io/catalog/index.v3.json` (schema 3, every engine; Renplay 2.6 and
later) and `index.json` (schema 2, Ren'Py games under the older field names, for Renplay 2.5 and
older).

**Never commit game files** (archives, scripts, images from a game) and never commit images that
are not safe for work. A recipe points to the official download and links the official cover art;
players get both from the developer.

## Layout

| Path | What |
|---|---|
| `recipes/<id>.yaml` | One game. The file name is the id. |
| `recipes/_template.yaml` | Every field, explained. CI validates it too. |
| `covers/<id>.webp` | Rare: a safe-for-work cover without an official copy to link to. Adult ones go to the cover host instead (`npm run cover:upload`, `https://covers.janpuc.com`, a Cloudflare R2 bucket; the maintainer has the token). |
| `patches/<id>/*.rpy` | Small browser fixes, referenced from `build.patches`. Rare. |
| `schema/recipe.schema.json` | JSON Schema for recipes, published at its `$id`. Every recipe starts with `# yaml-language-server: $schema=<that URL>`, so editors check it as you type; the build refuses recipes without it. |
| `scripts/build.mjs` | Validates everything and writes `dist/` (the published site). |
| `scripts/cover.mjs` | `npm run cover -- <image> <id>` makes such a file (1260×1000 WebP). |
| `scripts/cover-upload.mjs` | `npm run cover:upload -- <image> <id>` makes the same WebP and uploads it to the cover host as `<id>-<hash>.webp`; needs `RENPLAY_COVERS_TOKEN`. |
| `.agents/skills/` | Procedures: add a game, add a release, find the cover. `.claude/skills` links here. |

## Commands

```sh
npm ci              # once
npm run build       # validate all recipes, download and check covers, write dist/index.v3.json and dist/index.json
npm run cover -- <image> <id> [--focus attention|top|bottom|left|right]   # safe-for-work cover file
RENPLAY_COVERS_TOKEN=… npm run cover:upload -- <image> <id> [--focus …]  # adult cover, to the cover host
shasum -a 256 <archive>          # macOS (Linux: sha256sum)
stat -f %z <archive>             # size in bytes on macOS (Linux: stat -c %s)
```

`npm run build` is the test. It must pass before a pull request.

## How Renplay uses a recipe

- **Matching an archive:** by sha256, then by file name and size, then by `match` patterns (for new
  versions not listed yet). Installed games also link to a recipe by id or save folder, so a recipe
  added after an install applies without reinstalling.
- **Library metadata:** title, developer, tags, links and cover come only from the recipe. Users
  cannot edit them in Renplay, so a recipe's metadata is what everyone sees.
- **Building:** `engine` says what made the game (`renpy` by default, `html`, `godot`, `unity`);
  `runtime` picks the web runtime to build with (from
  [renplay-web/engines](https://github.com/renplay-web/engines)), per recipe or per release, and
  `madeWith` records the engine version the game was made with. `build.keep`, `build.exclude` and
  `build.patches` adjust the build. Renplay detects everything else (archives, streaming, save
  folder, screen size).
- **Updates:** when a recipe lists a `verified` or `playable` release newer than the installed one,
  Renplay shows "Update".
- **Covers:** the index gives each cover's URL, sha256 and size. Renplay downloads it on catalog
  refresh, refuses it if the checksum differs, and keeps a WebP thumbnail on the server.

## Rules for recipes

- `id`: lowercase words joined by dashes, matching the file name. Never rename an id once merged:
  installed games are linked by it.
- `releases`: newest first. Keep old releases. A `verified` release needs the archive's sha256.
- `status`: `verified` (plays through), `playable` (works with issues, described in
  `verified.notes`), `broken` (say why), `untested`.
- `links`: only official pages (developer site, itch.io, Patreon, SubscribeStar, Steam, Discord) and
  the F95zone thread; `walkthrough` for a guide. https only.
- `tags`: a few, lowercase in the file (Renplay capitalizes them).
- `saveDir`: Ren'Py's `config.save_directory`, exactly. Renplay reports it on install.
- Text in `verified.notes`: full sentences, plain English, what was tested and any problem.

## Covers

A cover is the game's official cover art, with its logo, as the game's itch.io, Steam or F95zone
thumbnail shows it: the first thing players recognize. Link it by its https URL on the developer's
own hosting (the itch.io page's `og:image` first); never copy adult art into this repository.
Shaped like an itch.io cover (63:50, 1.12:1 to 1.41:1), at least 600 px wide; safe-for-work art of
another shape becomes a cover file (cropped, or on a plain background, never blurred). See
`.agents/skills/find-cover`.

## Workflow

1. Branch from `main`, one game (or one change) per pull request.
2. `npm run build` passes; the PR template's checklist is filled in.
3. CI (`.github/workflows/pages.yml`) validates on every PR. Merging to `main` publishes the index
   to GitHub Pages within minutes.
4. Commit messages: `Add <Game> (<version>, <status>)`, `<Game>: add <version>`, `<Game>: <fix>`.

Agents prepare branches and pull requests; a maintainer merges.
