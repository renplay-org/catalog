---
name: add-release
description: Add a new version of a game that is already in the Renplay catalog. Records the new archive, verifies the update on Renplay (including old saves), and opens a pull request. Use when a listed game has a new release.
---

# Add a release to a listed game

1. Open `recipes/<id>.yaml`. Releases are newest first; the new one goes on top. Keep every older
   release: people may still have those archives.
2. Collect the new archive's facts as in the `add-game` skill (sha256, size, version, Ren'Py version,
   date). If the developer changed the Ren'Py major version, check the engine
   ([renplay-web/engines](https://github.com/renplay-web/engines)).
3. Verify on Renplay. Install the new archive over the old one (Renplay offers "Update" for a game
   that is installed), then:
   - load a save made with the previous version and continue playing;
   - start a new game;
   - check new content (images, audio, video) loads.
4. Set `status` and `verified` (date, Renplay version, browsers, notes). If the developer's file
   names follow a pattern that `match` does not cover yet, add it.
5. If the developer has new official cover art, update the cover with the `find-cover` skill.
   Otherwise leave it.
6. `npm run build`, then a pull request titled `<Title>: add <version>`.

Renplay shows "Update" to everyone who has an older listed version once this is merged, so only mark
a release `verified` or `playable` after testing it.
