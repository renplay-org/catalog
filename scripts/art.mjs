// The art pipeline shared by the build (scripts/build.mjs) and the validate
// command (scripts/validate.mjs). Every image a recipe links is fetched once,
// measured, hashed and tinted; what the index publishes per image is what the
// app needs to draw it before it loads and to credit who made it.
//
// Shapes (SteamGridDB's formats): grid 600x900, wide 920x430, hero 1920x620.
// An exact 2x (or Steam's half-size header) is the same shape. A logo is a
// transparent PNG of any size, an icon a square of 512 and up. Steam,
// SteamGridDB and Renplay art must arrive in shape; itch.io and developer art
// is a source the server places by the making order (crop at the focal point,
// composed, or whole on its glow), so any shape goes.
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import sharp from 'sharp'
import { rgbaToThumbHash, thumbHashToAverageRGBA } from 'thumbhash'
import { coverIsSfw } from './content-modes.mjs'

export const FORMATS = { grid: [600, 900], wide: [920, 430], hero: [1920, 620] }
export const ART_SOURCES = ['steam', 'itch', 'sgdb', 'renplay', 'developer']
// Sources that always deliver a picture in the format's own shape.
const SHAPED_SOURCES = new Set(['steam', 'sgdb', 'renplay'])

const hex = (r, g, b) => '#' + [r, g, b].map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0')).join('')

/**
 * Fetches an image once per URL. Remote bytes are kept in <cacheDir>/<sha256 of the URL>
 * (gitignored; CI keeps the folder between runs with actions/cache), so a rebuild
 * measures the same bytes again without another download.
 */
export async function fetchImage(url, { root, cacheDir, fetchImpl } = {}) {
  if (url.startsWith('covers/')) {
    const path = join(root, url)
    if (!existsSync(path)) throw new Error(`missing file ${url}`)
    return { data: readFileSync(path), mime: 'image/webp' }
  }
  mkdirSync(cacheDir, { recursive: true })
  const file = join(cacheDir, createHash('sha256').update(url).digest('hex'))
  if (existsSync(file)) return { data: readFileSync(file), mime: null }
  const get = fetchImpl ?? fetch
  const res = await get(url, { signal: AbortSignal.timeout(30000), headers: { 'user-agent': 'renplay-catalog' } })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = Buffer.from(await res.arrayBuffer())
  writeFileSync(file, data)
  return { data, mime: res.headers?.get?.('content-type') ?? null }
}

async function thumbhashOf(data) {
  const img = sharp(data).ensureAlpha()
  const { width, height } = await img.metadata()
  const s = 100 / Math.max(width, height)
  const w = Math.max(1, Math.round(width * s))
  const h = Math.max(1, Math.round(height * s))
  const buf = await img.resize(w, h, { fit: 'fill' }).raw().toBuffer()
  return Buffer.from(rgbaToThumbHash(w, h, new Uint8Array(buf))).toString('base64')
}

// The tint: the most vivid hue that covers enough of the picture, never near
// white or black, lifted a little so it glows on ink.
async function tintOf(data) {
  const buf = await sharp(data).resize(48, 48, { fit: 'fill' }).removeAlpha().raw().toBuffer()
  const bins = Array.from({ length: 12 }, () => ({ w: 0, r: 0, g: 0, b: 0 }))
  for (let i = 0; i < buf.length; i += 3) {
    const r = buf[i] / 255, g = buf[i + 1] / 255, b = buf[i + 2] / 255
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn
    if (d < 0.08 || mx < 0.12) continue
    let h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4
    h = (h + 6) % 6
    const k = Math.floor(h * 2) % 12
    const w = (d / mx) * Math.min(1, mx * 1.5)
    const bin = bins[k]
    bin.w += w; bin.r += r * w; bin.g += g * w; bin.b += b * w
  }
  const best = bins.reduce((a, b) => (b.w > a.w ? b : a), bins[0])
  if (!best.w) return '#5a5a7a'
  let r = best.r / best.w, g = best.g / best.w, b = best.b / best.w
  const mx = Math.max(r, g, b)
  if (mx < 0.45) { const f = 0.45 / mx; r *= f; g *= f; b *= f }
  return hex(r * 255, g * 255, b * 255)
}

/** Why an image is not its kind's shape, or null when it is. */
export function shapeProblem(kind, { width, height, format, hasAlpha }) {
  if (kind === 'logo') {
    if (format !== 'png' || !hasAlpha) return 'a logo must be a PNG with transparency'
    return null
  }
  if (kind === 'icon') {
    if (Math.abs(width - height) > Math.max(width, height) * 0.02) return `an icon must be square; this is ${width}x${height}`
    if (width < 512) return `an icon is at least 512 pixels wide; this is ${width}`
    return null
  }
  const [fw, fh] = FORMATS[kind]
  const ratio = width / height, want = fw / fh
  if (Math.abs(ratio - want) > want * 0.02) return `${kind} art is ${fw}x${fh}; this is ${width}x${height}`
  // Steam's header.jpg is the wide shape at half size; 2x is the same shape doubled.
  if (width < fw * 0.5 * 0.98 || width > fw * 2 * 1.02) return `${kind} art is between ${fw / 2} and ${fw * 2} pixels wide; this is ${width}`
  return null
}

const MIME_BY_FORMAT = { webp: 'image/webp', png: 'image/png', jpeg: 'image/jpeg', gif: 'image/gif' }

/**
 * Fetches, measures and publishes every image of a recipe's art list, rewriting
 * recipe.art into the published form. Problems go to fail(file, message); a
 * recipe with neither a grid nor a hero earns a warn(file, message).
 */
export async function checkArt(file, recipe, { root, cacheDir, fetchImpl, fail, warn }) {
  const art = recipe.art ?? []
  if (!art.some((a) => a.kind === 'grid') && !art.some((a) => a.kind === 'hero')) {
    warn?.(file, 'has neither a grid nor a hero; the game gets a text title and a glow until art is added')
  }
  const published = []
  for (const item of art) {
    if (item.url.startsWith('covers/')) {
      if (!item.url.startsWith(`covers/${recipe.id}`)) fail(file, `repository art of ${recipe.id} must live at covers/${recipe.id}….webp, not ${item.url}`)
      if (recipe.nsfw === true) {
        fail(file, `${item.url}: art of an adult game is never committed to the repository; link Steam, SteamGridDB, itch.io or covers.renplay.org`)
        continue
      }
    }
    if (/patreon(usercontent)?\.com/.test(item.url)) {
      fail(file, `${item.url}: Patreon image links expire; use the Steam, itch.io or developer copy`)
      continue
    }
    // covers.renplay.org hosts only Renplay-made art and art with no stable home elsewhere.
    if (item.source === 'renplay' && !item.url.startsWith('https://covers.renplay.org/')) {
      fail(file, `${item.url}: Renplay-made art lives on covers.renplay.org`)
      continue
    }
    let fetched
    try {
      fetched = await fetchImage(item.url, { root, cacheDir, fetchImpl })
    } catch (e) {
      fail(file, `${item.kind} ${item.url}: ${e.message}`)
      continue
    }
    const { data } = fetched
    let meta
    try {
      meta = await sharp(data).metadata()
    } catch {
      fail(file, `${item.kind} ${item.url} is not an image`)
      continue
    }
    const { width, height, format, hasAlpha } = meta
    if (!MIME_BY_FORMAT[format]) {
      fail(file, `${item.kind} ${item.url} is ${format}; use WebP, PNG or JPEG`)
      continue
    }
    const problem = shapeProblem(item.kind, { width, height, format, hasAlpha })
    if (problem && (SHAPED_SOURCES.has(item.source) || item.kind === 'logo' || item.kind === 'icon')) {
      fail(file, `${item.kind} ${item.url}: ${problem}`)
      continue
    }
    const sha256 = createHash('sha256').update(data).digest('hex')
    const thumbhash = await thumbhashOf(data)
    const avgRgba = thumbHashToAverageRGBA(Buffer.from(thumbhash, 'base64'))
    const image = {
      kind: item.kind,
      url: item.url,
      source: item.source,
      sha256,
      width,
      height,
      thumbhash,
      tint: await tintOf(data),
      avg: hex(avgRgba.r * 255, avgRgba.g * 255, avgRgba.b * 255),
      ...(item.focal ? { focal: item.focal } : {}),
      ...(item.dark === true ? { dark: true } : {}),
    }
    if (item.source === 'sgdb') {
      image.sgdb = item.sgdb
      image.asset = `https://www.steamgriddb.com/${item.kind === 'wide' ? 'grid' : item.kind}/${item.sgdb}`
      image.by = item.by
      image.byUrl = item.byUrl
      if (item.adult === true) image.adult = true
      if (item.animated) {
        try {
          const twin = await fetchImage(item.animated, { root, cacheDir, fetchImpl })
          const mime = twin.mime?.split(';')[0] ?? MIME_BY_FORMAT[(await sharp(twin.data).metadata()).format] ?? 'application/octet-stream'
          image.animated = { url: item.animated, sha256: createHash('sha256').update(twin.data).digest('hex'), mime }
        } catch (e) {
          fail(file, `animated twin ${item.animated}: ${e.message}`)
          continue
        }
      }
    }
    published.push({ requested: item, image })
  }
  // The default of a kind: the image that says default: true, else the first one in the format's
  // own shape (real art in the shape beats one the app has to crop or frame), else the first.
  const byKind = new Map()
  for (const entry of published) {
    const list = byKind.get(entry.image.kind) ?? []
    list.push(entry)
    byKind.set(entry.image.kind, list)
  }
  for (const [kind, list] of byKind) {
    const marked = list.filter((e) => e.requested.default === true)
    if (marked.length > 1) fail(file, `two images of kind ${kind} say default: true`)
    const inShape = (e) => kind === 'logo' || !shapeProblem(kind, e.image)
    const chosen = marked[0] ?? list.find(inShape) ?? list[0]
    chosen.image.default = true
  }
  recipe.art = published.map((e) => e.image)
}

/**
 * The cover schema 3 and 2 indexes carry, derived from the art: an itch.io
 * source first (the shape old Renplay cards are built around), else the wide
 * grid, else a grid. Repository art is safe for work by policy.
 */
export function deriveCover(recipe) {
  const art = recipe.art ?? []
  const pick = art.find((a) => a.source === 'itch') ?? art.find((a) => a.kind === 'wide') ?? art.find((a) => a.kind === 'grid')
  if (!pick) return null
  return {
    url: pick.url,
    sha256: pick.sha256,
    width: pick.width,
    height: pick.height,
    ...(coverIsSfw(recipe, pick.url) ? { sfw: true } : {}),
  }
}
