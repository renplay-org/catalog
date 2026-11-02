// Validates recipes/*.yaml and writes dist/index.json (plus covers and patches)
// for GitHub Pages. Patch files get their sha256 filled in automatically.
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

rmSync(dist, { recursive: true, force: true })
mkdirSync(dist, { recursive: true })
const games = []
let failed = false
for (const file of readdirSync(join(root, 'recipes')).filter((f) => f.endsWith('.yaml')).sort()) {
  const recipe = YAML.parse(readFileSync(join(root, 'recipes', file), 'utf-8'))
  if (!validate(recipe)) {
    failed = true
    console.error(`${file}:`, ajv.errorsText(validate.errors, { separator: '\n  ' }))
    continue
  }
  if (`${recipe.id}.yaml` !== file) {
    failed = true
    console.error(`${file}: id must match the file name`)
    continue
  }
  if (recipe.cover && !/^https?:/.test(recipe.cover)) {
    if (!existsSync(join(root, recipe.cover))) {
      failed = true
      console.error(`${file}: missing cover ${recipe.cover}`)
    }
  }
  for (const p of recipe.build?.patches ?? []) {
    const src = join(root, 'patches', recipe.id, p.file)
    if (!existsSync(src)) {
      failed = true
      console.error(`${file}: missing patch ${p.file}`)
      continue
    }
    p.url = `patches/${recipe.id}/${p.file}`
    p.sha256 = createHash('sha256').update(readFileSync(src)).digest('hex')
    delete p.file
  }
  games.push(recipe)
}
if (failed) process.exit(1)
for (const dir of ['covers', 'patches']) if (existsSync(join(root, dir))) cpSync(join(root, dir), join(dist, dir), { recursive: true })
writeFileSync(join(dist, 'index.json'), JSON.stringify({ schema: 1, generated: new Date().toISOString(), games }, null, 1))
writeFileSync(join(dist, '.nojekyll'), '')
console.log(`Built ${games.length} recipes`)
