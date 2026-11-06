# Renplay catalog

Recipes for games that work in [Renplay](https://github.com/renplay-org/renplay), published to
`https://catalog.renplay.org/index.v4.json`. Instances that block adult games use
`https://catalog.renplay.org/index.v4.sfw.json` instead.
Ren'Py games come first; HTML games (Twine and similar) are in too, and other engines only when
their normal download plays as easily.

The catalog hosts **no game files**. A recipe says which download of a game works (file name,
size, sha256), where to get it, and how to build it for the browser. Players download the game from
its official source; Renplay recognizes the archive by checksum, name, or a `match` pattern, and
builds it with the recipe's settings and engine version.

Renplay does most of the work by itself (unpacking archives, choosing what streams, detecting the
save folder), so most recipes are short: identity, links, the art, and the tested releases. The
title, developer, tags and art a player sees in Renplay come from here. Art is linked from the
developers' and stores' own pages and from SteamGridDB (by id, never copied), so no adult art is
hosted here.

- Add or update a game: [CONTRIBUTING.md](CONTRIBUTING.md)
- Every field explained: [recipes/_template.yaml](recipes/_template.yaml)
- Request a game or report a broken one: [issues](https://github.com/renplay-org/catalog/issues/new/choose)
- Working on this repository with an AI agent: [AGENTS.md](AGENTS.md) and the skills in
  [.agents/skills](.agents/skills)

## Index format

`index.v4.json` is `{ "schema": 4, "generated": "…", "vocabulary": { id: { label, group } }, "games": [recipe, …] }`,
with patch files resolved to `{ path, url, sha256 }` and each `art` image resolved to
`{ kind, url, source, sha256, width, height, thumbhash, tint, avg }` plus optional `focal`,
`dark` and `default`. SteamGridDB art also carries `sgdb`, `asset` (the asset's page), `by`,
`byUrl` and, when SteamGridDB tags it, `adult`. An animated twin is `animated: { url, sha256, mime }`.
The `thumbhash` (about 28 bytes) draws the picture before it loads, `avg` is its average colour
and `tint` its most vivid one, so a blurred adult game keeps its colours without a single picture.
Recipe `tags` contain vocabulary ids; the index instead keeps `tags` as lowercase display labels
for Renplay 2.9 and earlier, and adds the original ids as `tagIds`. `content` always contains ids
and must never be displayed as library chips. Optional `summary` and `state` are included unchanged.

`index.v4.sfw.json` has the same schema 4 shape, but includes only games whose `nsfw` is not
`true`, omits each game's `content` field, and excludes the `content` vocabulary group. It contains
no adult recipes, adult art URLs or content-tag labels. Blocking adult games must select this
index before fetching the catalog, not filter the full index after downloading it.

- `free`: optional boolean. The release in the recipe is free to download from its developer,
  with no payment or subscription. Omit when unknown; free older releases do not qualify a paid
  current release.
- `phone`: optional curated phone rating: `great` (Great on phones), `playable` (Playable on
  phones) or `desktop` (Needs a bigger screen). Set only by a maintainer who tried the game on a
  phone. Never guessed.

**Renplay 3.x reads `index.v3.json`, `index.v3.sfw.json` and `index.json` (schema 2, Renplay 2.5
and older) until it is retired.** They carry the same games under the older fields: the art list
becomes a single `cover` derived from it (an itch.io source first, else the wide grid, else a
grid) as `{ url, sha256, width, height }` plus `sfw: true` for non-adult games and repository
files, and `phone` is dropped. Schema 2 keeps only Ren'Py games under the older names (`engine`
for the runtime version, `releases[].renpy` and `releases[].engine` for `madeWith` and `runtime`)
and omits the vocabulary, `tagIds`, `content`, `summary` and `state`.

## Tags, summaries and game state

[`schema/tags.json`](schema/tags.json) is the fixed vocabulary. Each entry has a lowercase
kebab-case `id`, sentence-case `label`, `group`, and numeric `f95` id. The source is F95Checker's
[tag mapping](https://github.com/WillyJL/F95Checker/blob/46a5e42154c8291e40fbcd88b389af70010788a8/common/structs.py#L399-L554)
at commit `46a5e42154c8291e40fbcd88b389af70010788a8`; state prefixes follow its
[parser](https://github.com/WillyJL/F95Checker/blob/46a5e42154c8291e40fbcd88b389af70010788a8/common/parser.py#L324-L331).
The numbers are from that mapping, not guessed from tag names or thread ids.

- `tags`: at most ten ids from `play` (gameplay), `story` (non-explicit genres and settings),
  `art` (visual/audio presentation), or `protagonist` (male, female or multiple protagonist).
- `content`: every other vocabulary id, searchable but never a library chip. This fallback
  deliberately includes technical/asset tags as well as adult themes; it does not imply that
  every such tag is explicit. Empty means no content tags were recorded, not a content guarantee.
- `summary`: optional safe-for-work plain text, one to three sentences, at most 600 characters.
  Keep the developer's premise wording and remove explicit sentences or clauses. No markup.
- `state`: `ongoing`, `completed`, `on-hold`, or `abandoned`. Use the F95zone thread's Completed,
  Onhold or Abandoned prefix; no prefix means ongoing. Without a thread, ongoing is the default,
  not a verified claim. This is separate from each release's playability `status`.

Copy the tags, state (from the thread's prefixes) and overview from the game's F95zone thread
(normal browser user agent, no login; at most one request every three seconds). Every recipe
links its thread as `links.f95`; find it with F95zone's search if the request lacks it. Keep
summaries safe for work: the developer's wording for the premise, without explicit sentences.
Without a thread, map existing metadata by hand and omit the summary; do not invent content tags. Map free roam to `sandbox`, two protagonists to
`multiple-protagonist`, fan game to `parody`, school to `school-setting`, and comedy to `humor`.
The pinned source has no drama, mystery, slice-of-life or minigames tag: omit these rather than
invent ids or numeric mappings. Do not substitute a different game's thread.

When updating the upstream vocabulary, edit `schema/tags.json`, then run
`node scripts/tags-schema.mjs` to regenerate the schema enums. The build rejects unknown ids,
wrong-group ids, duplicates, more than ten chip tags, and stale schema enums. Both the schema
and `tags.json` are published alongside the index. Run `npm run build` followed by
`node --test scripts/*.test.mjs` to check validation and index compatibility.

Renplay is free and open source. If it is useful to you, you can support it on
[Ko-fi](https://ko-fi.com/janpuc).
