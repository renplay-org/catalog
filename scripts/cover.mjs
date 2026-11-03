// Makes covers/<id>.webp, for safe-for-work art that has no official copy to
// link to: 1260×1000 (the shape of itch.io covers), WebP.
//
//   npm run cover -- <image> <id> [--focus centre|attention|top|bottom|left|right]
//
// The focus decides what a crop keeps when the source has another shape.
import { statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const args = process.argv.slice(2)
const focusAt = args.indexOf('--focus')
const focus = focusAt >= 0 ? args.splice(focusAt, 2)[1] : 'centre'
const [src, id] = args
if (!src || !id || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(id)) {
  console.error('Usage: npm run cover -- <image> <id> [--focus centre|attention|top|bottom|left|right]')
  process.exit(1)
}
const position = focus === 'attention' ? sharp.strategy.attention : focus
const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'covers', `${id}.webp`)
const meta = await sharp(src).metadata()
await sharp(src).resize(1260, 1000, { fit: 'cover', position }).webp({ quality: 80, effort: 6 }).toFile(out)
console.log(`covers/${id}.webp from ${meta.width}×${meta.height}: ${Math.round(statSync(out).size / 1024)} KB`)
