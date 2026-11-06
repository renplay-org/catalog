import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import Ajv from 'ajv/dist/2020.js'
import addFormats from 'ajv-formats'
import sharp from 'sharp'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { checkArt, deriveCover, shapeProblem } from './art.mjs'

const schema = JSON.parse(readFileSync(new URL('../schema/recipe.schema.json', import.meta.url), 'utf8'))
const ajv = new Ajv({ allErrors: true, strict: false })
addFormats(ajv)
const validate = ajv.compile(schema)
const recipe = { id: 'example', title: 'Example', releases: [{ version: '1', status: 'untested', archives: [] }] }
const grid = { kind: 'grid', url: 'https://example.com/grid.jpg', source: 'steam' }

test('schema 4: cover and coverSfw are gone, art and phone are validated', () => {
  assert.equal(validate(recipe), true)
  assert.equal(validate({ ...recipe, art: [grid] }), true)
  assert.equal(validate({ ...recipe, cover: 'https://example.com/c.jpg' }), false)
  assert.equal(validate({ ...recipe, coverSfw: true }), false)
  assert.equal(validate({ ...recipe, art: [{ ...grid, kind: 'banner' }] }), false)
  assert.equal(validate({ ...recipe, art: [{ ...grid, source: 'f95' }] }), false)
  assert.equal(validate({ ...recipe, art: [{ kind: 'grid', source: 'steam' }] }), false, 'url is required')
  assert.equal(validate({ ...recipe, art: [{ ...grid, focal: [0.5] }] }), false)
  assert.equal(validate({ ...recipe, art: [{ ...grid, focal: [0.5, 1.2] }] }), false)
  assert.equal(validate({ ...recipe, art: [{ ...grid, focal: [0.2, 0.8] }] }), true)
  assert.equal(validate({ ...recipe, art: [{ ...grid, url: 'http://example.com/x.jpg' }] }), false, 'https only')
  assert.equal(validate({ ...recipe, art: [{ ...grid, url: 'covers/example.webp' }] }), true)
  for (const value of ['great', 'playable', 'desktop']) assert.equal(validate({ ...recipe, phone: value }), true)
  for (const value of ['good', 'Great on phones', 1]) assert.equal(validate({ ...recipe, phone: value }), false)
})

test('schema 4: SteamGridDB fields belong to sgdb art only, which needs id and credit', () => {
  const sgdb = { kind: 'grid', url: 'https://cdn2.steamgriddb.com/grid/abc.png', source: 'sgdb', sgdb: 412233, by: 'Sebanisu', byUrl: 'https://www.steamgriddb.com/profile/123' }
  assert.equal(validate({ ...recipe, art: [sgdb] }), true)
  for (const missing of ['sgdb', 'by', 'byUrl']) {
    const broken = { ...sgdb }
    delete broken[missing]
    assert.equal(validate({ ...recipe, art: [broken] }), false, `sgdb art without ${missing}`)
  }
  for (const extra of ['sgdb', 'by', 'byUrl', 'animated', 'adult']) {
    assert.equal(validate({ ...recipe, art: [{ ...grid, [extra]: extra === 'sgdb' ? 1 : 'x' }] }), false, `${extra} on steam art`)
  }
  assert.equal(validate({ ...recipe, art: [{ ...sgdb, adult: true, animated: 'https://cdn2.steamgriddb.com/grid/abc.webp' }] }), true)
})

test('shape checks: the five formats, 2x, half-size wide, logo and icon', () => {
  const at = (kind, width, height, extra = {}) => shapeProblem(kind, { width, height, format: 'jpeg', hasAlpha: false, ...extra })
  assert.equal(at('grid', 600, 900), null)
  assert.equal(at('grid', 1200, 1800), null, 'exact 2x')
  assert.equal(at('grid', 610, 915), null, 'within 2 percent')
  assert.ok(at('grid', 630, 500), 'an itch.io cover is not grid-shaped')
  assert.ok(at('grid', 3000, 4500), 'beyond 2x')
  assert.equal(at('wide', 920, 430), null)
  assert.equal(at('wide', 460, 215), null, "Steam's header.jpg is the wide shape at half size")
  assert.equal(at('wide', 1840, 860), null, 'exact 2x')
  assert.ok(at('wide', 616, 353), 'a Steam capsule is not wide-shaped')
  assert.equal(at('hero', 1920, 620), null)
  assert.equal(at('hero', 3840, 1240), null, 'exact 2x')
  assert.ok(at('hero', 1920, 1080))
  assert.equal(at('icon', 512, 512, { format: 'png' }), null)
  assert.ok(at('icon', 512, 600, { format: 'png' }), 'square')
  assert.ok(at('icon', 256, 256, { format: 'png' }), '512 and up')
  assert.equal(shapeProblem('logo', { width: 640, height: 360, format: 'png', hasAlpha: true }), null)
  assert.ok(shapeProblem('logo', { width: 640, height: 360, format: 'png', hasAlpha: false }), 'a logo needs transparency')
  assert.ok(shapeProblem('logo', { width: 640, height: 360, format: 'jpeg', hasAlpha: false }), 'a logo is a PNG')
})

// Image fixtures and a fetch stub: checks run without network.
const jpg = (w, h) => sharp({ create: { width: w, height: h, channels: 3, background: { r: 30, g: 90, b: 160 } } }).jpeg().toBuffer()
const webp = (w, h) => sharp({ create: { width: w, height: h, channels: 3, background: { r: 60, g: 160, b: 90 } } }).webp().toBuffer()

async function run(recipe, { files = {}, remote = {}, nsfw } = {}) {
  const root = mkdtempSync(join(tmpdir(), 'art-test-'))
  for (const [name, data] of Object.entries(files)) {
    mkdirSync(join(root, 'covers'), { recursive: true })
    writeFileSync(join(root, name), data)
  }
  const fetchImpl = async (url) => {
    if (!remote[url]) return { ok: false, status: 404, arrayBuffer: async () => Buffer.alloc(0), headers: new Headers() }
    return { ok: true, status: 200, arrayBuffer: async () => remote[url], headers: new Headers({ 'content-type': 'image/webp' }) }
  }
  const errors = []
  const warnings = []
  const r = { ...recipe, ...(nsfw !== undefined ? { nsfw } : {}) }
  await checkArt('test.yaml', r, { root, cacheDir: join(root, '.art-cache'), fetchImpl, fail: (f, m) => errors.push(m), warn: (f, m) => warnings.push(m) })
  rmSync(root, { recursive: true, force: true })
  return { errors, warnings, art: r.art }
}

test('a repository grid is measured, hashed, tinted and made the default', async () => {
  const { errors, art } = await run({ ...recipe, id: 'test-game', art: [{ kind: 'grid', url: 'covers/test-game.webp', source: 'developer' }] }, { files: { 'covers/test-game.webp': await webp(600, 900) } })
  assert.deepEqual(errors, [])
  assert.equal(art.length, 1)
  const [image] = art
  assert.equal(image.kind, 'grid')
  assert.match(image.sha256, /^[0-9a-f]{64}$/)
  assert.equal(image.width, 600)
  assert.equal(image.height, 900)
  assert.ok(image.thumbhash.length > 20, 'a ThumbHash is published for every image')
  assert.doesNotThrow(() => Buffer.from(image.thumbhash, 'base64'))
  assert.match(image.tint, /^#[0-9a-f]{6}$/)
  assert.match(image.avg, /^#[0-9a-f]{6}$/)
  assert.equal(image.default, true)
})

test('itch and developer art may be any shape; steam, sgdb and renplay art must be in shape', async () => {
  const cover = await jpg(630, 500)
  const itch = { ...recipe, art: [{ kind: 'grid', url: 'https://img.itch.zone/x.jpg', source: 'itch' }] }
  assert.deepEqual((await run(itch, { remote: { 'https://img.itch.zone/x.jpg': cover } })).errors, [])
  const steam = { ...recipe, art: [{ kind: 'grid', url: 'https://example.com/x.jpg', source: 'steam' }] }
  assert.ok((await run(steam, { remote: { 'https://example.com/x.jpg': cover } })).errors[0].includes('600x900'))
})

test('art of an adult game is never a repository file', async () => {
  const files = { 'covers/test-game.webp': await webp(600, 900) }
  const adult = { ...recipe, id: 'test-game', art: [{ kind: 'grid', url: 'covers/test-game.webp', source: 'developer' }] }
  const { errors } = await run(adult, { files, nsfw: true })
  assert.equal(errors.length, 1)
  assert.ok(errors[0].includes('adult'))
  assert.deepEqual((await run(adult, { files, nsfw: false })).errors, [])
  const otherId = { ...recipe, id: 'test-game', art: [{ kind: 'grid', url: 'covers/someone-else.webp', source: 'developer' }] }
  assert.ok((await run(otherId, { files: { 'covers/someone-else.webp': await webp(600, 900) } })).errors[0].includes('covers/test-game'))
})

test('the first image of a kind is the default unless one says default: true', async () => {
  const files = { 'covers/test-game.webp': await webp(600, 900), 'covers/test-game-2.webp': await webp(600, 900) }
  const items = () => [
    { kind: 'grid', url: 'covers/test-game.webp', source: 'developer' },
    { kind: 'grid', url: 'covers/test-game-2.webp', source: 'developer' },
  ]
  let { art, errors } = await run({ ...recipe, id: 'test-game', art: items() }, { files })
  assert.deepEqual(errors, [])
  assert.equal(art[0].default, true)
  assert.equal(art[1].default, undefined)
  const marked = items().map((i) => ({ ...i, default: true }))
  assert.ok((await run({ ...recipe, id: 'test-game', art: marked }, { files })).errors[0].includes('default'))
  const picked = items()
  picked[1].default = true
  ;({ art } = await run({ ...recipe, id: 'test-game', art: picked }, { files }))
  assert.equal(art[1].default, true)
  assert.equal(art[0].default, undefined)
})

test('a recipe with neither a grid nor a hero earns a warning, not an error', async () => {
  const logo = await sharp({ create: { width: 640, height: 360, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).png().toBuffer()
  const { errors, warnings } = await run({ ...recipe, art: [{ kind: 'logo', url: 'https://example.com/logo.png', source: 'steam' }] }, { remote: { 'https://example.com/logo.png': logo } })
  assert.deepEqual(errors, [])
  assert.equal(warnings.length, 1)
  assert.ok(warnings[0].includes('grid'))
})

test('SteamGridDB art publishes its id, asset page, credit and animated twin', async () => {
  const still = await jpg(600, 900)
  const moving = await webp(600, 900)
  const sgdb = {
    kind: 'grid', url: 'https://cdn2.steamgriddb.com/grid/still.jpg', source: 'sgdb',
    sgdb: 412233, by: 'Sebanisu', byUrl: 'https://www.steamgriddb.com/profile/1', adult: true,
    animated: 'https://cdn2.steamgriddb.com/grid/moving.webp',
  }
  const { errors, art } = await run({ ...recipe, art: [sgdb] }, { remote: { 'https://cdn2.steamgriddb.com/grid/still.jpg': still, 'https://cdn2.steamgriddb.com/grid/moving.webp': moving } })
  assert.deepEqual(errors, [])
  const [image] = art
  assert.equal(image.sgdb, 412233)
  assert.equal(image.asset, 'https://www.steamgriddb.com/grid/412233')
  assert.equal(image.by, 'Sebanisu')
  assert.equal(image.byUrl, 'https://www.steamgriddb.com/profile/1')
  assert.equal(image.adult, true)
  assert.equal(image.animated.url, 'https://cdn2.steamgriddb.com/grid/moving.webp')
  assert.match(image.animated.sha256, /^[0-9a-f]{64}$/)
  assert.equal(image.animated.mime, 'image/webp')
})

test('the derived cover prefers itch.io, then the wide grid, then a grid', () => {
  const itch = { kind: 'grid', url: 'https://img.itch.zone/a.jpg', source: 'itch', sha256: 'i', width: 630, height: 500 }
  const wide = { kind: 'wide', url: 'https://example.com/w.jpg', source: 'steam', sha256: 'w', width: 460, height: 215 }
  const gridImg = { kind: 'grid', url: 'https://example.com/g.jpg', source: 'steam', sha256: 'g', width: 600, height: 900 }
  assert.equal(deriveCover({ nsfw: true, art: [gridImg, wide, itch] }).sha256, 'i')
  assert.equal(deriveCover({ nsfw: true, art: [gridImg, wide] }).sha256, 'w')
  assert.equal(deriveCover({ nsfw: true, art: [gridImg] }).sha256, 'g')
  assert.equal(deriveCover({ nsfw: true, art: [] }), null)
  // sfw: non-adult games and repository files; never remote art of an adult game.
  assert.equal(deriveCover({ nsfw: false, art: [itch] }).sfw, true)
  assert.equal(deriveCover({ art: [itch] }).sfw, true)
  assert.equal(deriveCover({ nsfw: true, art: [itch] }).sfw, undefined)
  assert.equal(deriveCover({ nsfw: true, art: [{ ...gridImg, url: 'covers/x.webp' }] }).sfw, true)
})
