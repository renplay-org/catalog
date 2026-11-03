# Renplay catalog: notes for agents

This repository is the curated list of Ren'Py games that work in
[Renplay](https://github.com/renplay-web/renplay), a self-hosted web app that plays PC releases of
Ren'Py games in the browser with saves on the server. It holds recipes (YAML), covers and small
patches, and publishes them as one JSON index on GitHub Pages:
`https://renplay-web.github.io/catalog/index.json`. Every Renplay instance reads that index.

**Never commit game files** (archives, scripts, images from inside a game other than a cover). A
recipe points to the official download; players get the game from the developer.

## Layout

| Path | What |
|---|---|
| `recipes/<id>.yaml` | One game. The file name is the id. |
| `recipes/_template.yaml` | Every field, explained. CI validates it too. |
| `covers/<id>.webp` | The game's cover: 16:9, 1280–1920 px wide, WebP, < 400 KB, safe for work. |
| `patches/<id>/*.rpy` | Small browser fixes, referenced from `build.patches`. Rare. |
| `schema/recipe.schema.json` | JSON Schema for recipes. |
| `scripts/build.mjs` | Validates everything and writes `dist/` (the published site). |
| `scripts/cover.mjs` | `npm run cover -- <image> <id>` makes a cover. |
| `.agents/skills/` | Procedures: add a game, add a release, make a cover. `.claude/skills` links here. |

## Commands

```sh
npm ci              # once
npm run build       # validate all recipes and covers, write dist/index.json
npm run cover -- <image> <id> [--focus attention|top|bottom|left|right]
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
- **Building:** `engine` picks the Ren'Py web engine (from
  [renplay-web/engines](https://github.com/renplay-web/engines)); `build.keep`, `build.exclude` and
  `build.patches` adjust the build. Renplay detects everything else (archives, streaming, save
  folder, screen size).
- **Updates:** when a recipe lists a `verified` or `playable` release newer than the installed one,
  Renplay shows "Update".
- **Covers:** Renplay downloads them on catalog refresh and caches them by content hash.

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

Curated, because Renplay shows nothing else: art from the game itself (the developer's store page
screenshots or the game's menu art), safe for work (no nudity or sexual content), no text or logos,
16:9. See `.agents/skills/make-cover`.

## Workflow

1. Branch from `main`, one game (or one change) per pull request.
2. `npm run build` passes; the PR template's checklist is filled in.
3. CI (`.github/workflows/pages.yml`) validates on every PR. Merging to `main` publishes the index
   to GitHub Pages within minutes.
4. Commit messages: `Add <Game> (<version>, <status>)`, `<Game>: add <version>`, `<Game>: <fix>`.

Agents prepare branches and pull requests; a maintainer merges.
