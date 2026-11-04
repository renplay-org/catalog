import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import test from 'node:test'
import Ajv from 'ajv/dist/2020.js'
import addFormats from 'ajv-formats'
import YAML from 'yaml'
import { tags, tagEnums } from './tags-schema.mjs'

const readJSON = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'))
const schema = readJSON('../schema/recipe.schema.json')
const ajv = new Ajv({ strict: false })
addFormats(ajv)
const validate = ajv.compile(schema)
const recipe = { id: 'example', title: 'Example', releases: [{ version: '1', status: 'untested', archives: [] }] }

test('schema enums match the fixed vocabulary', () => {
  for (const [field, values] of Object.entries(tagEnums)) assert.deepEqual(schema.properties[field].items.enum, values)
})

test('unknown ids and wrong-group ids fail in either tag field', () => {
  for (const [field, id] of [['tags', 'unknown-tag'], ['content', 'unknown-tag'], ['tags', 'anal-sex'], ['content', 'romance']]) {
    assert.equal(validate({ ...recipe, [field]: [id] }), false, `${field}: ${id}`)
  }
  assert.equal(validate({ ...recipe, tags: ['romance'], content: ['anal-sex'] }), true)
})

test('tag limits, uniqueness, summary length and game-state values are enforced', () => {
  for (const fields of [
    { tags: tagEnums.tags.slice(0, 11) },
    { tags: ['romance', 'romance'] },
    { content: ['anal-sex', 'anal-sex'] },
    { summary: 'x'.repeat(601) },
    { summary: '<b>Markup</b>' },
    { state: 'verified' },
  ]) assert.equal(validate({ ...recipe, ...fields }), false, JSON.stringify(fields))
  for (const state of ['ongoing', 'completed', 'on-hold', 'abandoned']) {
    assert.equal(validate({ ...recipe, summary: 'x'.repeat(600), state }), true)
  }
})

test('built indexes preserve labels for old clients and isolate new metadata', () => {
  const index = readJSON('../dist/index.v3.json')
  const legacy = readJSON('../dist/index.json')
  assert.equal(index.schema, 3)
  assert.equal(legacy.schema, 2)
  assert.equal(Object.keys(index.vocabulary).length, tags.length)
  assert.equal('vocabulary' in legacy, false)
  for (const file of readdirSync(new URL('../recipes/', import.meta.url)).filter((f) => f.endsWith('.yaml') && !f.startsWith('_'))) {
    const source = YAML.parse(readFileSync(new URL(`../recipes/${file}`, import.meta.url), 'utf8'))
    const game = index.games.find((g) => g.id === source.id)
    assert.deepEqual(game.tagIds, source.tags)
    // Old clients make a chip of each label, so they get only the play and story groups.
    const chips = source.tags.filter((id) => ['play', 'story'].includes(index.vocabulary[id].group))
    assert.deepEqual(game.tags, chips.map((id) => index.vocabulary[id].label.toLowerCase()))
    for (const field of ['content', 'summary', 'state']) assert.deepEqual(game[field], source[field])
    const old = legacy.games.find((g) => g.id === source.id)
    if ((source.engine ?? 'renpy') !== 'renpy') { assert.equal(old, undefined); continue }
    assert.deepEqual(old.tags, game.tags)
    for (const field of ['tagIds', 'content', 'summary', 'state']) assert.equal(field in old, false)
  }
})
