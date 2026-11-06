import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import test from 'node:test'
import Ajv from 'ajv/dist/2020.js'
import addFormats from 'ajv-formats'
import YAML from 'yaml'
import { coverIsSfw } from './content-modes.mjs'

const readJSON = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'))
const v4 = readJSON('../dist/index.v4.json')
const index = readJSON('../dist/index.v3.json')
const legacy = readJSON('../dist/index.json')
const sfwText = readFileSync(new URL('../dist/index.v4.sfw.json', import.meta.url), 'utf8')
const sfw = JSON.parse(sfwText)
const sfw3Text = readFileSync(new URL('../dist/index.v3.sfw.json', import.meta.url), 'utf8')
const sfw3 = JSON.parse(sfw3Text)
const sources = readdirSync(new URL('../recipes/', import.meta.url))
  .filter((file) => file.endsWith('.yaml') && !file.startsWith('_'))
  .map((file) => YAML.parse(readFileSync(new URL(`../recipes/${file}`, import.meta.url), 'utf8')))

test('free is an optional boolean; cover and coverSfw no longer exist', () => {
  const ajv = new Ajv({ strict: false })
  addFormats(ajv)
  const validate = ajv.compile(readJSON('../schema/recipe.schema.json'))
  const recipe = { id: 'example', title: 'Example', releases: [{ version: '1', status: 'untested', archives: [] }] }
  assert.equal(validate(recipe), true)
  for (const value of [true, false]) assert.equal(validate({ ...recipe, free: value }), true)
  for (const value of ['true', 1, null]) assert.equal(validate({ ...recipe, free: value }), false)
  assert.equal(validate({ ...recipe, coverSfw: true }), false)
  assert.equal(validate({ ...recipe, cover: 'covers/example.webp' }), false)
})

test('cover safety: repository art is safe, remote art of an adult game is never marked safe', () => {
  assert.equal(coverIsSfw({ nsfw: true }, 'https://example.com/art.webp'), false)
  assert.equal(coverIsSfw({ nsfw: true }, 'covers/example.webp'), true)
  assert.equal(coverIsSfw({ nsfw: false }, 'https://example.com/art.webp'), true)
  assert.equal(coverIsSfw({}, 'https://example.com/art.webp'), true)
})

test('every index publishes free; the art list stays in schema 4, the derived cover in 3 and 2', () => {
  assert.deepEqual(sources.filter((g) => g.free === true).map((g) => g.id).sort(), ['dear-devere', 'frightwood'])
  for (const source of sources) {
    const game4 = v4.games.find((g) => g.id === source.id)
    assert.ok(game4, source.id)
    assert.equal('cover' in game4, false)
    assert.equal(game4.free, source.free)
    assert.equal('free' in game4, 'free' in source)
    for (const built of [index, legacy]) {
      const game = built.games.find((g) => g.id === source.id)
      if (built.schema === 2 && (source.engine ?? 'renpy') !== 'renpy') continue
      assert.ok(game, source.id)
      assert.equal('art' in game, false)
      assert.equal('phone' in game, false)
      assert.equal(game.free, source.free)
      if (game.cover) {
        const urls = (source.art ?? []).map((a) => a.url)
        assert.ok(urls.includes(game.cover.url), `${source.id}: the v3 cover comes from the art`)
        assert.equal('sfw' in game.cover, coverIsSfw(source, game.cover.url))
      }
    }
  }
})

test('safe-for-work indexes preserve their schemas while removing adult games and content', () => {
  assert.equal(sfw.schema, 4)
  assert.equal(sfw.generated, v4.generated)
  assert.equal(sfw3.schema, 3)
  assert.equal(sfw3.generated, index.generated)
  assert.deepEqual(sfw.vocabulary, Object.fromEntries(Object.entries(v4.vocabulary).filter(([, tag]) => tag.group !== 'content')))
  assert.deepEqual(sfw.games, v4.games.filter((g) => g.nsfw !== true).map(({ content, ...g }) => g))
  assert.deepEqual(sfw3.games, index.games.filter((g) => g.nsfw !== true).map(({ content, ...g }) => g))
  assert.ok(sfw.games.length > 0)
  assert.ok(v4.games.some((g) => g.nsfw === true))
})

test('the safe-for-work files contain no adult recipe, adult art URL or content-tag label', () => {
  // Scan the serialized files, not just games, to catch leaks in any field or vocabulary entry.
  for (const game of v4.games.filter((g) => g.nsfw === true)) {
    assert.equal(sfwText.includes(JSON.stringify(game.id)), false, `Adult recipe: ${game.id}`)
    for (const image of game.art ?? []) assert.equal(sfwText.includes(image.url), false, `Adult art: ${game.id}`)
  }
  for (const text of [sfwText, sfw3Text]) {
    for (const [id, tag] of Object.entries(v4.vocabulary).filter(([, tag]) => tag.group === 'content')) {
      // Match complete JSON strings: ordinary premise words (such as "trap") are not tag labels.
      assert.equal(text.toLowerCase().includes(JSON.stringify(tag.label.toLowerCase())), false, `Content label: ${tag.label}`)
      assert.equal(text.includes(JSON.stringify(id)), false, `Content id: ${id}`)
    }
    assert.equal(text.includes('"content"'), false)
  }
})
