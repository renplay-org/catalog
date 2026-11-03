---
name: make-cover
description: Choose and make the curated cover for a game in the Renplay catalog (covers/<id>.webp). Finds candidate art, applies the cover rules, crops to 16:9 and checks the result. Use when a recipe needs a new or better cover.
---

# Make a cover

Renplay shows the catalog's cover and nothing else, so every cover is chosen by hand.

## Rules

- **The game's own art.** Best sources, in order: the screenshots on the developer's store page
  (itch.io, Steam, Patreon), then the game's menu art (main menu backgrounds inside the game).
  Not fan art, not AI images, not art from other games.
- **Safe for work.** No nudity, no sexual content, nothing graphic. Clothed characters in a
  scene that shows the game's setting or tone are ideal.
- **No text, logos or UI.** Renplay prints the title over the cover.
- **16:9**, 1280 to 1920 pixels wide, WebP, under 400 KB, saved as `covers/<id>.webp`.
- Prefer a sharp, well-lit image with a clear subject; avoid blurred backgrounds and dark scenes
  that turn to mush at card size.

## Find candidates

- itch.io pages list screenshots as `https://img.itch.zone/…/original/…` URLs in the page HTML:
  `curl -sL <itch page> | grep -o 'https://img.itch.zone/[^" ]*/original/[^" ]*' | sort -u`
- Inside an installed game, menu art often lives under `game/gui/`, `game/images/` or a folder
  named like `main menu`. Renplay's Mods & files tab shows a game's files.

Pick three candidates and show them to the maintainer (a contact sheet helps) before committing,
unless they already chose one.

## Make it

```sh
npm run cover -- path/to/art.png <id>                    # crop around the centre
npm run cover -- path/to/art.png <id> --focus attention  # keep the most detailed region
npm run build                                            # checks size, shape and format
```

Look at the result at small size (a library card is about 450 pixels wide) before committing.
