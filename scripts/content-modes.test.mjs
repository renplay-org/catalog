import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import test from 'node:test'
import Ajv from 'ajv/dist/2020.js'
import addFormats from 'ajv-formats'
import YAML from 'yaml'
import { coverIsSfw } from './content-modes.mjs'

const readJSON = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'))
const index = readJSON('../dist/index.v3.json')
const legacy = readJSON('../dist/index.json')
const sfwText = readFileSync(new URL('../dist/index.v3.sfw.json', import.meta.url), 'utf8')
const sfw = JSON.parse(sfwText)
const sources = readdirSync(new URL('../recipes/', import.meta.url))
  .filter((file) => file.endsWith('.yaml') && !file.startsWith('_'))
  .map((file) => YAML.parse(readFileSync(new URL(`../recipes/${file}`, import.meta.url), 'utf8')))

test('free and coverSfw are optional booleans', () => {
  const ajv = new Ajv({ strict: false })
  addFormats(ajv)
  const validate = ajv.compile(readJSON('../schema/recipe.schema.json'))
  const recipe = { id: 'example', title: 'Example', releases: [{ version: '1', status: 'untested', archives: [] }] }
  assert.equal(validate(recipe), true)
  for (const field of ['free', 'coverSfw']) {
    for (const value of [true, false]) assert.equal(validate({ ...recipe, [field]: value }), true)
    for (const value of ['true', 1, null]) assert.equal(validate({ ...recipe, [field]: value }), false)
  }
})

test('cover safety requires approval for remote adult art, but not repository art or non-adult games', () => {
  const cover = 'https://example.com/cover.webp'
  assert.equal(coverIsSfw({ cover, nsfw: true }), false)
  assert.equal(coverIsSfw({ cover, nsfw: true, coverSfw: false }), false)
  assert.equal(coverIsSfw({ cover, nsfw: true, coverSfw: true }), true)
  assert.equal(coverIsSfw({ cover, nsfw: false }), true)
  assert.equal(coverIsSfw({ cover }), true)
  assert.equal(coverIsSfw({ cover, nsfw: false, coverSfw: false }), true)
  assert.equal(coverIsSfw({ cover: 'covers/example.webp', nsfw: true, coverSfw: false }), true)
})

test('both full indexes publish free and cover.sfw, not recipe-only coverSfw', () => {
  assert.deepEqual(sources.filter((g) => g.free === true).map((g) => g.id).sort(), ['dear-devere', 'frightwood'])
  assert.equal(sources.some((g) => 'coverSfw' in g), false)
  for (const source of sources) {
    for (const built of [index, legacy]) {
      const game = built.games.find((g) => g.id === source.id)
      if (built.schema === 2 && (source.engine ?? 'renpy') !== 'renpy') continue
      assert.ok(game, source.id)
      assert.equal('coverSfw' in game, false)
      assert.equal(game.free, source.free)
      assert.equal('free' in game, 'free' in source)
      if (source.cover) {
        assert.equal(game.cover.sfw, coverIsSfw(source) ? true : undefined)
        assert.equal('sfw' in game.cover, coverIsSfw(source))
      }
    }
  }
})

test('safe-for-work index preserves schema 3 while removing adult games and content', () => {
  assert.equal(sfw.schema, 3)
  assert.equal(sfw.generated, index.generated)
  assert.deepEqual(sfw.vocabulary, Object.fromEntries(Object.entries(index.vocabulary).filter(([, tag]) => tag.group !== 'content')))
  assert.deepEqual(sfw.games, index.games.filter((g) => g.nsfw !== true).map(({ content, ...g }) => g))
  assert.ok(sfw.games.length > 0)
  assert.ok(index.games.some((g) => g.nsfw === true))
})

test('whole safe-for-work file contains no adult recipe, adult cover URL or content-tag label', () => {
  // Scan the serialized file, not just games, to catch leaks in any field or vocabulary entry.
  for (const game of index.games.filter((g) => g.nsfw === true)) {
    assert.equal(sfwText.includes(JSON.stringify(game.id)), false, `Adult recipe: ${game.id}`)
    if (game.cover) assert.equal(sfwText.includes(game.cover.url), false, `Adult cover: ${game.id}`)
  }
  for (const [id, tag] of Object.entries(index.vocabulary).filter(([, tag]) => tag.group === 'content')) {
    // Match complete JSON strings: ordinary premise words (such as "trap") are not tag labels.
    assert.equal(sfwText.toLowerCase().includes(JSON.stringify(tag.label.toLowerCase())), false, `Content label: ${tag.label}`)
    assert.equal(sfwText.includes(JSON.stringify(id)), false, `Content id: ${id}`)
  }
  assert.equal(sfwText.includes('"content"'), false)
})
