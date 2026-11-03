# Renplay catalog

Recipes for Ren'Py games that work in [Renplay](https://github.com/renplay-web/renplay), published
to `https://renplay-web.github.io/catalog/index.json`. Every Renplay instance reads this index.

The catalog hosts **no game files**. A recipe says which download of a game works (file name,
size, sha256), where to get it, and how to build it for the browser. Players download the game from
its official source; Renplay recognizes the archive by checksum, name, or a `match` pattern, and
builds it with the recipe's settings and engine version.

Renplay does most of the work by itself (unpacking archives, choosing what streams, detecting the
save folder), so most recipes are short: identity, links, the official cover, and the tested
releases. The title, developer, tags and cover a player sees in Renplay come from here. Covers are
linked from the developers' own pages, not copied, so no adult art is hosted here.

- Add or update a game: [CONTRIBUTING.md](CONTRIBUTING.md)
- Every field explained: [recipes/_template.yaml](recipes/_template.yaml)
- Request a game or report a broken one: [issues](https://github.com/renplay-web/catalog/issues/new/choose)
- Working on this repository with an AI agent: [AGENTS.md](AGENTS.md) and the skills in
  [.agents/skills](.agents/skills)

## Index format

`index.json` is `{ "schema": 2, "generated": "…", "games": [recipe, …] }`, the recipes as in this
repository with patch files resolved to `{ path, url, sha256 }` and covers to
`{ url, sha256, width, height }`.

Renplay is free and open source. If it is useful to you, you can support it on
[Ko-fi](https://ko-fi.com/janpuc).
