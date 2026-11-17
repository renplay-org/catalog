# Renplay catalog

**Games tested in Renplay, with their official art and settings.**

This is the catalog behind [Renplay](https://github.com/renplay-org/renplay), a self-hosted player for
Ren’Py games in the browser, with saves on your own server. Every game in it was installed and played
in Renplay. For each one the catalog says which download to get from the developer, brings the official
art, and sets what the game needs, so Renplay recognizes the download you add and builds it the right way.

The catalog hosts **no game files**. Games come from their developers.

**[Browse the catalog](https://renplay.org/catalog)**, or open **Catalog** inside Renplay. Try Renplay
first in the [demo](https://demo.renplay.org).

## Ask for a game

Is a game missing, or is your version of it not listed? [Request it](https://renplay.org/catalog/request).
Requests are public issues here, and a bot checks each one against the catalog and the game’s page and
comments with what it found. Link the developer’s own page (itch.io, Steam, Patreon or their website),
never a download mirror. If a listed game does not work for you,
[report it](https://github.com/renplay-org/catalog/issues/new/choose).

Renplay plays Ren’Py 8 games and most Ren’Py 7 games. HTML games, such as Twine stories, play too.
Other engines are added only when their normal download plays as easily.
[The docs](https://docs.renplay.org/engines/) say what works.

## Add a game yourself

A game is one short file, `recipes/<id>.yaml`. It holds the game’s name and developer, its links, tags
and art, and the tested releases, each with the download’s file name, size and checksum. Renplay does the
rest by itself: it unpacks the archive, decides what streams and finds the save folder.

1. Install the game in Renplay and play it.
2. In Renplay, open **Settings › Catalog**, choose the game and press **Export recipe**.
3. Add the details, the art and the tested status, and open a pull request.

[CONTRIBUTING.md](CONTRIBUTING.md) has every step, and [recipes/_template.yaml](recipes/_template.yaml)
explains every field. Art is linked from the developers’ and stores’ own pages and from SteamGridDB, never
copied, so no adult art is hosted here.

## How Renplay uses it

The catalog is published as `https://catalog.renplay.org/index.v4.json`. Instances that block adult games
read `https://catalog.renplay.org/index.v4.sfw.json` instead. Renplay fetches it every six hours. It
recognizes a download by its checksum, its name and size, or a `match` pattern, then shows the game with
the title, developer, tags and art from here, and says when a newer tested version exists.

Working on this repository with an AI agent? Read [AGENTS.md](AGENTS.md) and the skills in
[.agents/skills](.agents/skills).

Renplay is free and open source. If it is useful to you, you can [support it](https://renplay.org/support).

## For developers

### Index format

`index.v4.json` is `{ "schema": 4, "generated": "<time>", "vocabulary": { id: { label, group } }, "games": [recipe, ...] }`,
with patch files resolved to `{ path, url, sha256 }` and each `art` image resolved to
`{ kind, url, source, sha256, width, height, thumbhash, tint, avg }` plus optional `focal`,
`dark` and `default`. SteamGridDB art also carries `sgdb`, `asset` (the asset's page), `by`,
`byUrl` and, when SteamGridDB tags it, `adult`. An animated twin is `animated: { url, sha256, mime }`.
The `thumbhash` (about 28 bytes) draws the picture before it loads, `avg` is its average colour
and `tint` its most vivid one, so a blurred adult game keeps its colours without a single picture.
Recipe `tags` contain vocabulary ids. The index instead keeps `tags` as lowercase display labels
for Renplay 2.9 and earlier, and adds the original ids as `tagIds`. `content` always contains ids
and must never be displayed as library chips. Optional `summary` and `state` are included unchanged.

`index.v4.sfw.json` has the same schema 4 shape, but includes only games whose `nsfw` is not
`true`, omits each game's `content` field, and excludes the `content` vocabulary group. It contains
no adult recipes, adult art URLs or content-tag labels. Blocking adult games must select this
index before fetching the catalog, not filter the full index after downloading it.

- `free`: optional boolean. The release in the recipe is free to download from its developer,
  with no payment or subscription. Omit when unknown. Free older releases do not qualify a paid
  current release.
- `phone`: optional curated phone rating: `great` (Great on phones), `playable` (Playable on
  phones) or `desktop` (Needs a bigger screen). Set only by a maintainer who tried the game on a
  phone. Never guessed.

**Renplay 3.x reads `index.v3.json`, `index.v3.sfw.json` and `index.json` (schema 2, Renplay 2.5
and older) until it is retired.** They carry the same games under the older fields: the art list
becomes a single `cover` as `{ url, sha256, width, height }` plus `sfw: true` for non-adult games
and repository files, and `phone` is dropped. The cover is frozen at what main published
(`legacy/v3-covers.json`), so Renplay 3.x keeps the covers it has until it is retired. Games
added later get one derived from the art (an itch.io source first, else the wide grid, else a
grid). Schema 2 keeps only Ren'Py games under the older names (`engine`
for the runtime version, `releases[].renpy` and `releases[].engine` for `madeWith` and `runtime`)
and omits the vocabulary, `tagIds`, `content`, `summary` and `state`.

### Tags, summaries and game state

[`schema/tags.json`](schema/tags.json) is the fixed vocabulary. Each entry has a lowercase
kebab-case `id`, sentence-case `label`, `group`, and numeric `f95` id. The source is F95Checker's
[tag mapping](https://github.com/WillyJL/F95Checker/blob/46a5e42154c8291e40fbcd88b389af70010788a8/common/structs.py#L399-L554)
at commit `46a5e42154c8291e40fbcd88b389af70010788a8`. State prefixes follow its
[parser](https://github.com/WillyJL/F95Checker/blob/46a5e42154c8291e40fbcd88b389af70010788a8/common/parser.py#L324-L331).
The numbers are from that mapping, not guessed from tag names or thread ids.

- `tags`: at most ten ids from `play` (gameplay), `story` (non-explicit genres and settings),
  `art` (visual/audio presentation), or `protagonist` (male, female or multiple protagonist).
- `content`: every other vocabulary id, searchable but never a library chip. This fallback
  deliberately includes technical and asset tags as well as adult themes. It does not imply that
  every such tag is explicit. Empty means no content tags were recorded, not a content guarantee.
- `summary`: optional safe-for-work plain text, one to three sentences, at most 600 characters.
  Keep the developer's premise wording and remove explicit sentences or clauses. No markup.
- `state`: `ongoing`, `completed`, `on-hold`, or `abandoned`. Use the F95zone thread's Completed,
  Onhold or Abandoned prefix. No prefix means ongoing. Without a thread, ongoing is the default,
  not a verified claim. This is separate from each release's playability `status`.

Copy the tags, state (from the thread's prefixes) and overview from the game's F95zone thread
(a normal browser user agent, no login, and at most one request every three seconds). Every recipe
links its thread as `links.f95`. Find it with F95zone's search if the request lacks it. Keep
summaries safe for work: the developer's wording for the premise, without explicit sentences.
Without a thread, map existing metadata by hand and omit the summary. Do not invent content tags. Map free roam to `sandbox`, two protagonists to
`multiple-protagonist`, fan game to `parody`, school to `school-setting`, and comedy to `humor`.
The pinned source has no drama, mystery, slice-of-life or minigames tag: omit these rather than
invent ids or numeric mappings. Do not substitute a different game's thread.

When updating the upstream vocabulary, edit `schema/tags.json`, then run
`node scripts/tags-schema.mjs` to regenerate the schema enums. The build rejects unknown ids,
wrong-group ids, duplicates, more than ten chip tags, and stale schema enums. Both the schema
and `tags.json` are published alongside the index. Run `npm run build` followed by
`node --test scripts/*.test.mjs` to check validation and index compatibility.
