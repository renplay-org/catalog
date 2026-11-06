---
name: find-art
description: Find a game's art for the Renplay catalog in the five SteamGridDB formats (grid, wide, hero, logo, icon), from Steam, SteamGridDB, itch.io or the developer, and write the recipe's art list with credits. Use when a recipe needs art or better art.
---

# Find a game's art

Renplay shows a game through its art everywhere: the library grid, the stage, the room behind the
screens. A recipe links pictures in five formats, and players should recognize the game from them
at a glance. That means **official art with the game's logo**, as the game's store pages show it.
Not screenshots, not menu backgrounds, not fan art.

## The five formats

| Format | Size | Where it shows |
|---|---|---|
| `grid` | 600×900 (2x 1200×1800) | Library tiles, the stage poster, the picker |
| `wide` | 920×430 | Up next, the phone stage art, the save gallery header |
| `hero` | 1920×620 (2x 3840×1240) | The top of the game page, the room behind every screen |
| `logo` | transparent PNG, any size | The title on the stage and the door. `dark: true` for a dark logo |
| `icon` | square, 512 and up | History, Activity and Add games rows, the player drawer |

A game needs at least one grid or one hero (the build warns otherwise). An exact 2x of a format is
the same shape. Steam's half-size `header.jpg` (460×215) counts as a wide. The first image of a
kind is the default. A second image of a kind is an alternative, and `default: true` on one chooses
it. `focal: [x, y]` (0 to 1) says where the picture matters and forces a crop into missing formats.

## Sources, in order

1. **SteamGridDB**, when a maintainer has a key. Art is referenced by id, never copied, and always
   credits its author:

   ```sh
   STEAMGRIDDB_API_KEY=… npm run sgdb -- "<game name>"
   ```

   prints candidates per format with asset id, author, score, size and nsfw flag. Choose and
   record exactly what it prints. Never invent ids or authors. Results SteamGridDB tags adult get
   `adult: true`, and an animated twin is `animated: <url>`.

2. **Steam's library art**, when the game is on Steam (`links.steam`). Check each file exists for
   the app id, some apps lack some files:

   ```sh
   for f in library_600x900_2x.jpg library_hero.jpg logo.png header.jpg; do
     curl -s -o /dev/null -w "%{http_code} $f\n" -I "https://cdn.cloudflare.steamstatic.com/steam/apps/<appid>/$f"
   done
   ```

   Grid, hero, logo and wide respectively. `library_hero_2x.jpg` is the hero at 2x when it exists.

3. **The itch.io page's cover**, its `og:image` (usually 630×500), as a grid source:

   ```sh
   curl -sL https://dev.itch.io/game | grep -o '<meta[^>]*og:image[^>]*>'
   ```

4. **The developer's own site** or press kit, as a grid source.

5. **Renplay-made art** (`source: renplay`), hosted on `https://covers.renplay.org`, only when
   nothing official exists. A maintainer uploads it. Say in the pull request what to make.

Do not use Patreon images (their links expire) or images from download and aggregator sites.

## Write it

```yaml
art:
  - kind: grid
    url: https://cdn.cloudflare.steamstatic.com/steam/apps/1301220/library_600x900_2x.jpg
    source: steam
  - kind: wide
    url: https://cdn.cloudflare.steamstatic.com/steam/apps/1301220/header.jpg
    source: steam
  - kind: hero
    url: https://cdn.cloudflare.steamstatic.com/steam/apps/1301220/library_hero.jpg
    source: steam
    focal: [0.72, 0.5]
  - kind: logo
    url: https://cdn.cloudflare.steamstatic.com/steam/apps/1301220/logo.png
    source: steam
  - kind: grid                      # an alternative, from the itch.io page
    url: https://img.itch.zone/…/original/….jpg
    source: itch
```

Steam, SteamGridDB and Renplay art must already be in the format's shape (within 2 percent, or an
exact 2x). itch.io and developer art may be any shape: Renplay places it by its making order (real
art first, then a crop at the focal point, composed or a glow, whole on its glow last).

**Art of an adult game is never committed to this repository.** Adult games link SteamGridDB,
Steam, itch.io or `covers.renplay.org`, and the build refuses a repository file for them.
Safe-for-work art without an official copy to link to may become a repository file:
`npm run cover -- <image> <id> [--focus …]` writes `covers/<id>.webp` (1260×1000) with source
`developer`. Adult art of that kind goes to the cover host: a maintainer runs
`RENPLAY_COVERS_TOKEN=… npm run cover:upload -- <image> <id>` (the same WebP, uploaded as
`<id>-<hash>.webp`, so a changed picture gets a new address).

## Renplay-made art sizes

When the Renplay Team makes art it is made in the format's own shape: grid 600×900 (or 1200×1800),
wide 920×430, hero 1920×620 (or 3840×1240), logo a transparent PNG, icon a square of 512 or more.
Nothing is ever upscaled beyond 2x, nothing is stretched, and nothing adult is made for this
repository.

## Check it

```sh
npm run build
```

The build downloads every image once (kept in `.art-cache/` between runs), measures it, checks the
shape, and publishes its sha256, size, ThumbHash, average colour and tint. A logo must be a PNG
with transparency, an icon square and at least 512. Look at the art at small size (a library tile
is about 110 pixels wide on a phone): the logo should still read.
