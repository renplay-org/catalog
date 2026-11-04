---
name: add-game
description: Add a Ren'Py game to the Renplay catalog. Collects the archive's facts, verifies the game on a Renplay instance, links the official cover, writes recipes/<id>.yaml and opens a pull request. Use when asked to add, list, or write a recipe for a game.
---

# Add a game to the catalog

The result is one pull request with `recipes/<id>.yaml`. Read `AGENTS.md`
first; `recipes/_template.yaml` explains every field.

## 1. Identify the game and its official sources

- Find the developer and the official pages: itch.io, Patreon, SubscribeStar, Steam, the
  developer's site, the F95zone thread. Use only pages the developer controls (plus the F95zone
  thread). Never link download mirrors.
- The id is the title in lowercase words joined by dashes (`pale-carnations`). Check that
  `recipes/<id>.yaml` does not exist yet; if it does, use the `add-release` skill instead.
- Use only ids in `schema/tags.json`: at most ten non-content ids in `tags`, content-group ids
  in `content` (searchable, never library chips). From the linked F95zone thread, take its tag
  list and map by id, not by guessed labels. Fetch with a normal browser user agent, at most one
  request every three seconds. Without a thread, map existing tags by hand and omit summary.
- `summary`: the thread overview's safe-for-work premise, one to three sentences under 600
  characters, plain text. Keep developer wording, removing explicit sentences or clauses.
- `state`: Completed → `completed`, Onhold → `on-hold`, Abandoned → `abandoned`; no prefix or
  no thread → `ongoing` (unverified default). This is not a release's playability `status`.
- Do not invent vocabulary ids. Comedy maps to `humor`, free roam to `sandbox`, school to
  `school-setting`, fan game to `parody`, two protagonists to `multiple-protagonist`. The pinned
  F95 source has no drama, mystery or minigames; omit them. See README for source and updates.
- `nsfw: true` for adult games.

## 2. Collect the archive's facts

You need the PC archive (`<Game>-<version>-pc.zip`) as the developer distributes it.

```sh
shasum -a 256 Game-1.0-pc.zip          # sha256 (Linux: sha256sum)
stat -f %z Game-1.0-pc.zip             # size in bytes (Linux: stat -c %s)
unzip -p Game-1.0-pc.zip '*/renpy/vc_version.py'        # Ren'Py version: version = '8.2.1…'
unzip -p Game-1.0-pc.zip '*/game/cache/build_info.json' # build time, if present
```

Record `version` exactly as the developer names it, the Ren'Py version (`madeWith`) as `major.minor.patch`
(`8.2.1`), and the release date (the developer's announcement, or the build time).

Ren'Py 7 games run on the Ren'Py 8 engine: set `runtime` to the newest 8.x engine explicitly and
play well past the opening, because Python 2-only code in a game fails only when it runs. Ren'Py 6
and older have not been tried; ask the maintainer first.

## 3. Verify it on Renplay

Ask for a Renplay instance if none is named. Install the archive there (Add games → Upload, or
copy it into the archives folder, then Install). Then:

1. Start the game, begin a new game, play several minutes. Images, music, voice and video must
   load; nothing may stay as a grey placeholder.
2. Save, reload the page, resume from the library. The save must load where it was made.
3. If possible, repeat on a phone.
4. Note the save folder Renplay shows on the game's Details tab (`saveDir`), and any problem.

Renplay's Settings › Catalog › Export recipe fills in most fields from the installation; use it
as a starting point.

Status: `verified` if everything works, `playable` with notes if it works with issues, `broken`
with the reason if it does not.

## 4. Link the cover

Use the `find-cover` skill: link the official cover art (the itch.io page’s cover first). It is required for `verified` and `playable` games.

## 5. Write the recipe

```yaml
id: my-game
title: My Game
developer: Studio Name
tags: [sci-fi, romance]
content: []
state: ongoing
summary: A student discovers a mystery that changes the course of their studies.
nsfw: true
cover: https://img.itch.zone/…/original/….png
links:
  itch: https://studio.itch.io/my-game
  patreon: https://www.patreon.com/studio
  f95: https://f95zone.to/threads/12345/
saveDir: MyGame-1234567890
match:
  - MyGame-*-pc.zip
engine: renpy
runtime: 8.5.3
releases:
  - version: "1.0"
    date: "2026-01-31"
    madeWith: 8.2.1
    status: verified
    archives:
      - name: MyGame-1.0-pc.zip
        size: 1234567890
        sha256: "…"
        platform: pc
    verified:
      date: "2026-02-01"
      renplay: 2.2.0
      browsers: [chromium, webkit]
      notes: Played the first two chapters; saves load across devices.
```

Quote versions and sha256 values (YAML would read some as numbers). `runtime` is the newest
published engine of the game's Ren'Py major version unless the game needs another; `madeWith` is
the Ren'Py version from `vc_version.py`.

## 6. Check and open the pull request

```sh
npm ci && npm run build
git checkout -b add-<id>
git add recipes/<id>.yaml
git commit -m "Add <Title> (<version>, <status>)"
```

Push and open a pull request with the template's checklist filled in: where you tested, what you
played, anything odd. A maintainer merges it.
