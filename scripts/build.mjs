// Validates recipes/*.yaml and writes dist/index.json (plus covers and patches)
// for GitHub Pages. Files starting with "_" (the template) are not recipes.
import { createHash } from 'node:crypto'
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import Ajv from 'ajv/dist/2020.js'
import addFormats from 'ajv-formats'
import YAML from 'yaml'

const root = new URL('..', import.meta.url).pathname
const dist = join(root, 'dist')
const ajv = new Ajv({ allErrors: true, strict: false })
addFormats(ajv)
const validate = ajv.compile(JSON.parse(readFileSync(join(root, 'schema/recipe.schema.json'), 'utf-8')))

const errors = []
const fail = (file, msg) => errors.push(`${file}: ${msg}`)

// Engine versions recipes may name.
let engines = null
try {
  const res = await fetch('https://renplay-web.github.io/engines/index.json', { signal: AbortSignal.timeout(15000) })
  if (res.ok) engines = new Set((await res.json()).engines.map((e) => e.version))
} catch {}
if (!engines) console.warn('warning: engine index unreachable, engine versions not checked')

// The template must stay a valid example.
{
  const t = YAML.parse(readFileSync(join(root, 'recipes', '_template.yaml'), 'utf-8'))
  if (!validate(t)) fail('_template.yaml', ajv.errorsText(validate.errors, { separator: '; ' }))
}

/** Width and height of a WebP image, or null. */
function webpSize(b) {
  if (b.length < 30 || b.toString('latin1', 0, 4) !== 'RIFF' || b.toString('latin1', 8, 12) !== 'WEBP') return null
  const chunk = b.toString('latin1', 12, 16)
  if (chunk === 'VP8 ') return { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff }
  if (chunk === 'VP8L') {
    const bits = b.readUInt32LE(21)
    return { w: (bits & 0x3fff) + 1, h: ((bits >> 14) & 0x3fff) + 1 }
  }
  if (chunk === 'VP8X') return { w: 1 + b.readUIntLE(24, 3), h: 1 + b.readUIntLE(27, 3) }
  return null
}

/**
 * Covers are curated: covers/<id>.webp, 16:9, 1280 to 1920 pixels wide, under
 * 400 KB. Games that work (newest release verified or playable) need one.
 */
function checkCover(file, recipe) {
  const working = ['verified', 'playable'].includes(recipe.releases[0]?.status)
  if (!recipe.cover) {
    if (working) fail(file, `needs a cover (covers/${recipe.id}.webp), see CONTRIBUTING.md`)
    return
  }
  if (recipe.cover !== `covers/${recipe.id}.webp`) return fail(file, `cover must be covers/${recipe.id}.webp`)
  const path = join(root, recipe.cover)
  if (!existsSync(path)) return fail(file, `missing cover ${recipe.cover}`)
  const data = readFileSync(path)
  const size = webpSize(data)
  if (!size) return fail(file, `${recipe.cover} is not a WebP image`)
  if (size.w < 1280 || size.w > 1920 || Math.abs(size.w * 9 - size.h * 16) > size.w * 0.01 * 9) fail(file, `${recipe.cover} is ${size.w}×${size.h}; use 16:9, 1280 to 1920 pixels wide`)
  if (data.length > 400 * 1024) fail(file, `${recipe.cover} is ${Math.round(data.length / 1024)} KB; keep it under 400 KB`)
}

const games = []
const shas = new Map()
for (const file of readdirSync(join(root, 'recipes')).filter((f) => f.endsWith('.yaml') && !f.startsWith('_')).sort()) {
  let recipe
  try {
    recipe = YAML.parse(readFileSync(join(root, 'recipes', file), 'utf-8'))
  } catch (e) {
    fail(file, `not valid YAML: ${e.message}`)
    continue
  }
  if (!validate(recipe)) {
    fail(file, ajv.errorsText(validate.errors, { separator: '; ' }))
    continue
  }
  if (`${recipe.id}.yaml` !== file) fail(file, 'id must match the file name')
  checkCover(file, recipe)
  for (const v of [recipe.engine, ...recipe.releases.map((r) => r.engine)].filter(Boolean)) {
    if (engines && !engines.has(v)) fail(file, `engine ${v} is not published in renplay-web/engines`)
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
rmSync(dist, { recursive: true, force: true })
mkdirSync(dist, { recursive: true })
for (const dir of ['covers', 'patches']) if (existsSync(join(root, dir))) cpSync(join(root, dir), join(dist, dir), { recursive: true })
writeFileSync(join(dist, 'index.json'), JSON.stringify({ schema: 2, generated: new Date().toISOString(), games }, null, 1))
writeFileSync(join(dist, '.nojekyll'), '')
console.log(`Built ${games.length} recipes`)
