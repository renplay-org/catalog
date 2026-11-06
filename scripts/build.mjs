// Validates recipes/*.yaml and writes dist/index.v4.json, dist/index.v4.sfw.json,
// the schema 3 and 2 indexes Renplay 3.x reads (dist/index.v3.json,
// dist/index.v3.sfw.json, dist/index.json, whose cover is frozen from
// legacy/v3-covers.json when the map knows the game, else derived from the art),
// plus the schema, covers and patches, for catalog.renplay.org.
// Files starting with "_" (the template) are not recipes.
import { createHash } from 'node:crypto'
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import Ajv from 'ajv/dist/2020.js'
import addFormats from 'ajv-formats'
import YAML from 'yaml'
import { tags, tagEnums } from './tags-schema.mjs'
import { checkArt, deriveCover } from './art.mjs'

const root = new URL('..', import.meta.url).pathname
const dist = join(root, 'dist')
const cacheDir = join(root, '.art-cache')
const ajv = new Ajv({ allErrors: true, strict: false })
addFormats(ajv)
const schema = JSON.parse(readFileSync(join(root, 'schema/recipe.schema.json'), 'utf-8'))
for (const [field, values] of Object.entries(tagEnums)) {
  if (JSON.stringify(schema.properties[field].items.enum) !== JSON.stringify(values)) {
    throw new Error(`Stale ${field} enum: run node scripts/tags-schema.mjs`)
  }
}
const vocabulary = Object.fromEntries(tags.map(({ id, label, group }) => [id, { label, group }]))
const validate = ajv.compile(schema)
// Every recipe names the schema on its first line, for editors (yaml-language-server).
const SCHEMA_LINE = `# yaml-language-server: $schema=${schema.$id}`
const namesSchema = (file, text) => text.split('\n', 1)[0] === SCHEMA_LINE || fail(file, `the first line must be: ${SCHEMA_LINE}`)

const errors = []
const warnings = []
const fail = (file, msg) => errors.push(`${file}: ${msg}`)
const warn = (file, msg) => warnings.push(`${file}: ${msg}`)

// Engine versions recipes may name.
let engines = null
try {
  const res = await fetch('https://engines.renplay.org/index.json', { signal: AbortSignal.timeout(15000) })
  if (res.ok) engines = new Set((await res.json()).engines.map((e) => e.version))
} catch {}
if (!engines) console.warn('warning: engine index unreachable, engine versions not checked')

// The template must stay a valid example.
{
  const text = readFileSync(join(root, 'recipes', '_template.yaml'), 'utf-8')
  namesSchema('_template.yaml', text)
  const t = YAML.parse(text)
  if (!validate(t)) fail('_template.yaml', ajv.errorsText(validate.errors, { separator: '; ' }))
}

const games = []
const shas = new Map()
for (const file of readdirSync(join(root, 'recipes')).filter((f) => f.endsWith('.yaml') && !f.startsWith('_')).sort()) {
  let recipe
  try {
    const text = readFileSync(join(root, 'recipes', file), 'utf-8')
    namesSchema(file, text)
    recipe = YAML.parse(text)
  } catch (e) {
    fail(file, `not valid YAML: ${e.message}`)
    continue
  }
  if (!validate(recipe)) {
    fail(file, ajv.errorsText(validate.errors, { separator: '; ' }))
    continue
  }
  if (`${recipe.id}.yaml` !== file) fail(file, 'id must match the file name')
  await checkArt(file, recipe, { root, cacheDir, fail, warn })
  // Only Ren'Py runtimes are published so far; other engines' arrive with their support.
  if ((recipe.engine ?? 'renpy') === 'renpy') {
    for (const v of [recipe.runtime, ...recipe.releases.map((r) => r.runtime)].filter(Boolean)) {
      if (engines && !engines.has(v)) fail(file, `runtime ${v} is not published in renplay-org/engines`)
    }
  }
  const versions = new Set()
  for (const r of recipe.releases) {
    if (versions.has(r.version)) fail(file, `release ${r.version} is listed twice`)
    versions.add(r.version)
    if (r.status === 'verified' && !r.archives.some((a) => a.sha256)) fail(file, `verified release ${r.version} needs the archive sha256`)
    for (const a of r.archives) {
      if (!a.sha256) continue
      if (shas.has(a.sha256)) fail(file, `archive ${a.name} is already listed in ${shas.get(a.sha256)}`)
      shas.set(a.sha256, file)
    }
  }
  for (const p of recipe.build?.patches ?? []) {
    const src = join(root, 'patches', recipe.id, p.file)
    if (!existsSync(src)) {
      fail(file, `missing patch patches/${recipe.id}/${p.file}`)
      continue
    }
    p.url = `patches/${recipe.id}/${p.file}`
    p.sha256 = createHash('sha256').update(readFileSync(src)).digest('hex')
    delete p.file
  }
  games.push(recipe)
}
const ids = new Set(games.map((g) => g.id))
for (const g of games) for (const c of g.continuesFrom ?? []) if (!ids.has(c)) fail(`${g.id}.yaml`, `continuesFrom: no recipe ${c}`)

if (errors.length) {
  console.error(errors.join('\n'))
  process.exit(1)
}
for (const w of warnings) console.warn(`warning: ${w}`)
rmSync(dist, { recursive: true, force: true })
mkdirSync(dist, { recursive: true })
// covers/ goes away once every file has moved to the cover host. Publish it only while it holds files.
for (const dir of ['covers', 'patches']) {
  const src = join(root, dir)
  if (existsSync(src) && readdirSync(src).length > 0) cpSync(src, join(dist, dir), { recursive: true })
}
const generated = new Date().toISOString()
// Old clients (Renplay 2.9 and older) render tags as labels, never ids, and make a library chip
// of each one, so they get only the play and story groups. Art, protagonist and content tags
// reach them through tagIds and content.
const CHIP_GROUPS = new Set(['play', 'story'])
const displayGames = games.map((g) => ({
  ...g,
  ...(g.tags
    ? {
        tags: g.tags.filter((id) => CHIP_GROUPS.has(vocabulary[id].group)).map((id) => vocabulary[id].label.toLowerCase()),
        tagIds: g.tags,
      }
    : {}),
}))
// Schema 4 (Renplay 4.0 and later): the art list with hashes, sizes, tints and credits.
writeFileSync(join(dist, 'index.v4.json'), JSON.stringify({ schema: 4, generated, vocabulary, games: displayGames }, null, 1))
// Safe-for-work clients must not fetch adult recipes, art or content vocabulary.
const sfwVocabulary = Object.fromEntries(Object.entries(vocabulary).filter(([, tag]) => tag.group !== 'content'))
const sfwGames = displayGames.filter((g) => g.nsfw !== true).map(({ content, ...g }) => g)
writeFileSync(join(dist, 'index.v4.sfw.json'), JSON.stringify({ schema: 4, generated, vocabulary: sfwVocabulary, games: sfwGames }, null, 1))
// Schema 3 (Renplay 2.6 to 3.x, kept until 3.x is retired): the same games, but
// with a single cover instead of the art list. Renplay 3.2 crops the cover it has
// today, so that cover is frozen at what the last schema 3 build published
// (legacy/v3-covers.json, with the seven repository files at their covers.renplay.org
// address). Only games the frozen map does not know (added later) get a cover
// derived from the art.
const frozenCovers = JSON.parse(readFileSync(join(root, 'legacy/v3-covers.json'), 'utf-8'))
const v3Games = displayGames.map(({ art, phone, ...g }) => {
  const cover = frozenCovers[g.id] ?? deriveCover({ art, nsfw: g.nsfw })
  return cover ? { ...g, cover } : g
})
writeFileSync(join(dist, 'index.v3.json'), JSON.stringify({ schema: 3, generated, vocabulary, games: v3Games }, null, 1))
const v3SfwGames = v3Games.filter((g) => g.nsfw !== true).map(({ content, ...g }) => g)
writeFileSync(join(dist, 'index.v3.sfw.json'), JSON.stringify({ schema: 3, generated, vocabulary: sfwVocabulary, games: v3SfwGames }, null, 1))
// Schema 2 for Renplay 2.5 and older: Ren'Py games only, under the names those versions read.
const schema2 = v3Games
  .filter((g) => (g.engine ?? 'renpy') === 'renpy')
  .map(({ engine, runtime, releases, tagIds, content, summary, state, ...g }) => ({
    ...g,
    engine: runtime,
    releases: releases.map(({ madeWith, runtime, ...r }) => ({ ...r, renpy: madeWith, engine: runtime })),
  }))
writeFileSync(join(dist, 'index.json'), JSON.stringify({ schema: 2, generated, games: schema2 }, null, 1))
// Published at the schema's $id, which recipes name on their first line.
cpSync(join(root, 'schema/recipe.schema.json'), join(dist, 'recipe.schema.json'))
cpSync(join(root, 'schema/tags.json'), join(dist, 'tags.json'))

// Cloudflare (catalog.renplay.org) reads these. Renplay fetches the
// indexes from other origins, so everything is open to CORS.
writeFileSync(
  join(dist, '_headers'),
  `/*
  Access-Control-Allow-Origin: *
  X-Content-Type-Options: nosniff
/index.v4.json
  Cache-Control: public, max-age=300
/index.v4.sfw.json
  Cache-Control: public, max-age=300
/index.v3.json
  Cache-Control: public, max-age=300
/index.v3.sfw.json
  Cache-Control: public, max-age=300
/index.json
  Cache-Control: public, max-age=300
/recipe.schema.json
  Cache-Control: public, max-age=3600
/tags.json
  Cache-Control: public, max-age=3600
/covers/*
  Cache-Control: public, max-age=86400
/patches/*
  Cache-Control: public, max-age=86400
`,
)
writeFileSync(
  join(dist, 'index.html'),
  `<!doctype html>
<meta charset="utf-8">
<title>Renplay catalog</title>
<meta name="robots" content="noindex">
<meta http-equiv="refresh" content="0; url=https://renplay.org/catalog">
<p>This is where Renplay reads its catalog. The games are listed at <a href="https://renplay.org/catalog">renplay.org/catalog</a>.</p>
`,
)
console.log(`Built ${games.length} recipes`)
