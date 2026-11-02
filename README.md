# renplay catalog

Recipes for Ren'Py games that work in [renplay](https://github.com/renplay-web/renplay), published
to `https://renplay-web.github.io/catalog/index.json`. Every renplay instance reads this index.

The catalog hosts **no game files**. A recipe says which download of a game works (file name,
size, sha256), where to get it, and how to build it for the browser. Players download the game from
its official source; renplay recognizes the archive by checksum, name, or a `match` pattern, and
builds it with the recipe's settings and engine version.

renplay does most of the work by itself (unpacking archives, choosing what streams, detecting the
save folder), so most recipes are short: identity, links, and the tested releases.

- Add or update a game: [CONTRIBUTING.md](CONTRIBUTING.md)
- Every field explained: [recipes/_template.yaml](recipes/_template.yaml)
- Request a game or report a broken one: [issues](https://github.com/renplay-web/catalog/issues/new/choose)

## Index format

`index.json` is `{ "schema": 2, "generated": "…", "games": [recipe, …] }`, the recipes as in this
repository with patch files resolved to `{ path, url, sha256 }`.
