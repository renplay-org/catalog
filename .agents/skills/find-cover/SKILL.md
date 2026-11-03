---
name: find-cover
description: Find the official cover art for a game in the Renplay catalog and set the recipe's cover to its URL. Covers must make the game recognizable at a glance, like its itch.io, Steam or F95zone thumbnail. Use when a recipe needs a cover or a better one.
---

# Find a game's cover

Renplay shows the catalog's cover and nothing else, and players should recognize the game from it
at a glance. That means the **official cover art with the game's logo**, as the game's store pages
show it. Not screenshots, not menu backgrounds, not fan art.

## Where to look, in order

1. **The game's itch.io page.** Its cover image is the page's `og:image` (usually 630×500):

   ```sh
   curl -sL https://dev.itch.io/game | grep -o '<meta[^>]*og:image[^>]*>'
   ```

2. **Steam**, if the game is there: the header capsule,
   `https://cdn.cloudflare.steamstatic.com/steam/apps/<appid>/header.jpg` (460×215, so below the
   600 px minimum; use `capsule_616x353.jpg` instead when it exists).
3. **The developer's own site** or press kit.

Do not use Patreon images (their links expire) or images from download and aggregator sites.

## Set it

Put the image's https URL in the recipe:

```yaml
cover: https://img.itch.zone/…/original/….png
```

Do **not** download the image into this repository: many covers of adult games are not safe for
work, and GitHub must not host them. Renplay downloads each cover once and keeps it on the server.

When there is no official copy to link to (Patreon links expire) or it has the wrong shape:

- **Safe for work:** add a file. `npm run cover -- <image> <id>` writes `covers/<id>.webp`, and the
  recipe says `cover: covers/<id>.webp`.
- **Not safe for work:** never into this repository. A maintainer puts it on the catalog's cover
  host, `https://covers.janpuc.com` (a Cloudflare R2 bucket):
  `RENPLAY_COVERS_TOKEN=… npm run cover:upload -- <image> <id> [--focus …]` makes the same
  1260×1000 WebP, uploads it as `<id>-<hash>.webp` and prints the URL for `cover:`. A changed cover
  gets a new name, so nothing serves a stale copy. Contributors without the token: say in the pull
  request which official image to use, and a maintainer uploads it.

## Check it

```sh
npm run build
```

The build downloads the cover and checks that it is an image shaped like an itch.io cover (63:50,
between 1.12:1 and 1.41:1), at least 600 pixels wide. Renplay shows other shapes shrunk on a blur,
which looks scuffed. When the official art has another shape and is safe for work, make a cover
file from it: crop it with `npm run cover -- <image> <id> --focus …` if the logo survives the
crop, or put the whole art on a matching plain background first (Our Red String's logo on black).
Never blur or stretch. Look at it at small size (a library card is about 250 pixels wide on a
phone): the logo should still read.
