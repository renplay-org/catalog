// Validates a folder of recipes against the catalog's rules, for forks and
// local recipe folders that are not this repository's recipes/:
//
//   npm run validate -- <folder>
//
// Checks the schema (tags included, through its enums), the art (every image
// fetched and measured, shapes, the adult repository rule) and the links, and
// prints one plain error per line. Repository art (covers/…) resolves against
// the given folder; remote images are cached in <folder>/.art-cache.
import { readFileSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import Ajv from 'ajv/dist/2020.js'
import addFormats from 'ajv-formats'
import YAML from 'yaml'
import { tagEnums } from './tags-schema.mjs'
import { checkArt } from './art.mjs'

const folder = resolve(process.argv[2] ?? '')
if (!process.argv[2]) {
  console.error('Usage: npm run validate -- <folder of recipe .yaml files>')
  process.exit(1)
}

const root = new URL('..', import.meta.url).pathname
const schema = JSON.parse(readFileSync(join(root, 'schema/recipe.schema.json'), 'utf-8'))
for (const [field, values] of Object.entries(tagEnums)) {
  if (JSON.stringify(schema.properties[field].items.enum) !== JSON.stringify(values)) {
    throw new Error(`Stale ${field} enum: run node scripts/tags-schema.mjs`)
  }
}
const ajv = new Ajv({ allErrors: true, strict: false })
addFormats(ajv)
const validate = ajv.compile(schema)
const SCHEMA_LINE = `# yaml-language-server: $schema=${schema.$id}`

const errors = []
const warnings = []
const fail = (file, msg) => errors.push(`${file}: ${msg}`)
const warn = (file, msg) => warnings.push(`${file}: ${msg}`)

let files = []
try {
  files = readdirSync(folder).filter((f) => f.endsWith('.yaml') && !f.startsWith('_')).sort()
} catch {
  console.error(`Not a folder: ${folder}`)
  process.exit(1)
}
if (!files.length) {
  console.error(`No recipes in ${folder}`)
  process.exit(1)
}

const seen = new Set()
const cacheDir = join(folder, '.art-cache')
for (const file of files) {
  let recipe
  try {
    const text = readFileSync(join(folder, file), 'utf-8')
    if (text.split('\n', 1)[0] !== SCHEMA_LINE) fail(file, `the first line must be: ${SCHEMA_LINE}`)
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
  if (seen.has(recipe.id)) fail(file, `id ${recipe.id} appears twice`)
  seen.add(recipe.id)
  await checkArt(file, recipe, { root: folder, cacheDir, fail, warn })
}

for (const w of warnings) console.warn(`warning: ${w}`)
if (errors.length) {
  console.error(errors.join('\n'))
  process.exit(1)
}
console.log(`${files.length} recipes valid`)
