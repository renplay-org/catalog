# renplay catalog

Recipes for games known to work in [renplay](https://github.com/renplay-web/renplay), published to
`https://renplay-web.github.io/catalog/index.json`. Every renplay instance reads this index.

The catalog hosts **no game files**. A recipe says which archive works (name, size, sha256), where
to get it, and how to build it for the browser. Players download the game from its official
source and drop it into their renplay archives folder; renplay matches it to the recipe by checksum
(or by file name) and builds it with the recipe's settings.

## Adding a game

1. Install the game in renplay from its PC download and play through enough of it to be confident.
2. Copy an existing file in `recipes/` to `recipes/<id>.yaml` and fill it in:
   - `saveDir`: the game's `config.save_directory` (shown on the game's Details tab in renplay).
   - `releases[].archives`: exact name, size and `sha256` of the tested download (`shasum -a 256 file.zip`),
     plus an optional `pattern` (e.g. `Game-*-pc.zip`) so later versions are suggested too.
   - `status`: `verified` (plays start to finish), `playable` (works with known issues, say which in
     `verified.notes`), `broken`, or `untested`.
3. Web-only fixes go into `patches/<id>/` and are listed under `build.patches` with the destination
   path inside the game (`game/...`). They are applied before the web build.
4. `npm ci && npm run build` validates everything; CI does the same on pull requests.
