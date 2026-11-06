// Searches SteamGridDB for art a recipe could link, and prints candidates per
// format with everything the catalog records: asset id, size, score, the nsfw
// flag, and the author's name and profile (the credit every SteamGridDB image
// carries). Nothing is copied: a recipe references an asset by id and URL.
//
//   STEAMGRIDDB_API_KEY=… node scripts/sgdb.mjs <game name> [--game <steamgriddb game id>]
//
// The key comes from https://www.steamgriddb.com/profile/preferences/api.
// Without STEAMGRIDDB_API_KEY the script explains itself and stops.
const key = process.env.STEAMGRIDDB_API_KEY
const args = process.argv.slice(2)
const gameAt = args.indexOf('--game')
const gameId = gameAt >= 0 ? Number(args.splice(gameAt, 2)[1]) : null
const name = args.join(' ').trim()

if (!key || (!name && !gameId)) {
  console.error(`Usage: STEAMGRIDDB_API_KEY=… node scripts/sgdb.mjs <game name> [--game <steamgriddb game id>]

Searches SteamGridDB's public API v2 and prints candidate art per format
(grid 600x900, wide 920x430, hero, logo, icon) with author, score, size and
nsfw flag, so a maintainer can choose and write the recipe's art entry:

  - kind: grid
    source: sgdb
    sgdb: <asset id>
    url: <the asset's url>
    by: <author name>
    byUrl: https://www.steamgriddb.com/profile/<author steam64>
    adult: true              # only when the asset's nsfw flag is set
    animated: <url>          # only when an animated twin was chosen

Get a key at https://www.steamgriddb.com/profile/preferences/api.`)
  process.exit(1)
}

const api = async (path) => {
  const res = await fetch(`https://www.steamgriddb.com/api/v2${path}`, {
    headers: { authorization: `Bearer ${key}` },
    signal: AbortSignal.timeout(20000),
  })
  if (!res.ok) throw new Error(`SteamGridDB ${path}: HTTP ${res.status}`)
  const body = await res.json()
  return body.data ?? []
}

let id = gameId
if (!id) {
  const results = await api(`/search/autocomplete/${encodeURIComponent(name)}`)
  if (!results.length) {
    console.error(`No SteamGridDB game matches "${name}"`)
    process.exit(1)
  }
  id = results[0].id
  console.log(`${results[0].name} (SteamGridDB game ${id})`)
  for (const other of results.slice(1, 4)) console.log(`  also: ${other.name} (${other.id}); rerun with --game ${other.id} if that is the one`)
} else {
  console.log(`SteamGridDB game ${id}`)
}

const show = (label, assets) => {
  console.log(`\n${label} (${assets.length})`)
  for (const a of assets.slice(0, 8)) {
    const flags = [a.type === 'animated' ? 'animated' : null, a.nsfw ? 'nsfw' : null].filter(Boolean).join(', ')
    console.log(`  ${a.id}  ${a.width}x${a.height}  score ${a.score}  by ${a.author?.name ?? 'unknown'}  https://www.steamgriddb.com/profile/${a.author?.steam64 ?? ''}${flags ? `  [${flags}]` : ''}`)
    console.log(`    ${a.url}`)
  }
  if (assets.length > 8) console.log(`  … and ${assets.length - 8} more`)
}

const grids = await api(`/grids/game/${id}?limit=50`)
const byScore = (a, b) => b.score - a.score
show('grid 600x900', grids.filter((g) => g.width === 600 && g.height === 900).sort(byScore))
show('wide 920x430', grids.filter((g) => g.width === 920 && g.height === 430).sort(byScore))
show('hero', (await api(`/heroes/game/${id}?limit=50`)).sort(byScore))
show('logo', (await api(`/logos/game/${id}?limit=50`)).sort(byScore))
show('icon', (await api(`/icons/game/${id}?limit=50`)).sort(byScore))
