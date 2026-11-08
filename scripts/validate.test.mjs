// The validate command on a sample folder: a good recipe passes, schema, tag,
// art and adult-rule problems print plain errors and fail.
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import sharp from 'sharp'

const root = new URL('..', import.meta.url).pathname
const SCHEMA_LINE = '# yaml-language-server: $schema=https://catalog.renplay.org/recipe.schema.json'
const RECIPE = `${SCHEMA_LINE}
id: good-game
title: Good Game
tags: [romance]
art:
  - kind: grid
    url: covers/good-game.webp
    source: developer
releases:
  - version: "1.0"
    status: untested
    archives: []
`

const run = (folder) => {
  try {
    const out = execFileSync('node', ['scripts/validate.mjs', folder], { cwd: root, encoding: 'utf8', stdio: 'pipe' })
    return { code: 0, out }
  } catch (e) {
    return { code: e.status, out: `${e.stdout}${e.stderr}` }
  }
}

test('validate accepts a good folder and rejects schema, tag and art problems', async () => {
  const folder = mkdtempSync(join(tmpdir(), 'validate-test-'))
  try {
    mkdirSync(join(folder, 'covers'))
    writeFileSync(join(folder, 'covers', 'good-game.webp'), await sharp({ create: { width: 600, height: 900, channels: 3, background: { r: 40, g: 40, b: 90 } } }).webp().toBuffer())
    writeFileSync(join(folder, 'good-game.yaml'), RECIPE)
    let r = run(folder)
    assert.equal(r.code, 0, r.out)
    assert.ok(r.out.includes('1 recipes valid'))

    // An unknown tag id fails, with the file named.
    writeFileSync(join(folder, 'bad-tag.yaml'), RECIPE.replace('id: good-game', 'id: bad-tag').replace('[romance]', '[not-a-tag]'))
    r = run(folder)
    assert.equal(r.code, 1)
    assert.ok(r.out.includes('bad-tag.yaml'), r.out)
    rmSync(join(folder, 'bad-tag.yaml'))

    // Art of an adult game is never a repository file.
    writeFileSync(join(folder, 'bad-adult.yaml'), RECIPE.replace('id: good-game', 'id: bad-adult').replace('tags: [romance]', 'nsfw: true'))
    r = run(folder)
    assert.equal(r.code, 1)
    assert.ok(r.out.includes('adult'), r.out)
    rmSync(join(folder, 'bad-adult.yaml'))

    // An icon of the wrong shape fails.
    writeFileSync(join(folder, 'covers', 'bad-shape.webp'), await sharp({ create: { width: 600, height: 900, channels: 3, background: { r: 90, g: 40, b: 40 } } }).webp().toBuffer())
    writeFileSync(join(folder, 'bad-shape.yaml'), RECIPE.replace('id: good-game', 'id: bad-shape').replace('kind: grid', 'kind: icon').replace('covers/good-game.webp', 'covers/bad-shape.webp'))
    r = run(folder)
    assert.equal(r.code, 1)
    assert.ok(r.out.includes('icon'), r.out)
  } finally {
    rmSync(folder, { recursive: true, force: true })
  }
})
