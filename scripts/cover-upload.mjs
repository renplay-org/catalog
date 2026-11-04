// Puts a cover on the catalog's cover host, for adult art that has no official
// copy to link to in the right shape (GitHub must not host adult art). Makes
// the same 1260×1000 WebP as `npm run cover`, uploads it as <id>-<hash>.webp
// (a changed cover gets a new address, so no cache serves the old one) and
// prints the URL for the recipe's `cover`.
//
//   RENPLAY_COVERS_TOKEN=… npm run cover:upload -- <image> <id> [--focus centre|attention|top|bottom|left|right]
//
// RENPLAY_COVERS_TOKEN is the bucket's Cloudflare R2 API token; maintainers have it.
import { createHash, createHmac } from 'node:crypto'
import sharp from 'sharp'

const BUCKET = process.env.RENPLAY_COVERS_BUCKET ?? 'renplay-covers'
const PUBLIC = process.env.RENPLAY_COVERS_URL ?? 'https://covers.renplay.org'

const args = process.argv.slice(2)
const focusAt = args.indexOf('--focus')
const focus = focusAt >= 0 ? args.splice(focusAt, 2)[1] : 'centre'
const [src, id] = args
const token = process.env.RENPLAY_COVERS_TOKEN
if (!src || !id || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(id) || !token) {
  console.error('Usage: RENPLAY_COVERS_TOKEN=… npm run cover:upload -- <image> <id> [--focus centre|attention|top|bottom|left|right]')
  process.exit(1)
}

const position = focus === 'attention' ? sharp.strategy.attention : focus
const data = await sharp(src).resize(1260, 1000, { fit: 'cover', position }).webp({ quality: 80, effort: 6 }).toBuffer()
const hash = createHash('sha256').update(data).digest('hex')
const key = `${id}-${hash.slice(0, 10)}.webp`

// The token belongs to one Cloudflare account, which is where the bucket is.
const cf = (path) => fetch(`https://api.cloudflare.com/client/v4${path}`, { headers: { authorization: `Bearer ${token}` } }).then((r) => r.json())
const ACCOUNT = process.env.RENPLAY_COVERS_ACCOUNT ?? (await cf('/accounts')).result?.[0]?.id
if (!ACCOUNT) throw new Error('The token does not show its Cloudflare account; set RENPLAY_COVERS_ACCOUNT')
// An R2 API token works as S3 credentials: its id is the access key, the SHA-256 of its value the secret.
const verify = await cf(`/accounts/${ACCOUNT}/tokens/verify`)
if (!verify.success) throw new Error(`The token was refused: ${verify.errors?.map((e) => e.message).join('; ')}`)
const accessKey = verify.result.id
const secret = createHash('sha256').update(token).digest('hex')

// AWS Signature Version 4 for one PUT.
const host = `${ACCOUNT}.r2.cloudflarestorage.com`
const path = `/${BUCKET}/${key}`
const now = new Date().toISOString().replace(/[-:]|\.\d{3}/g, '')
const day = now.slice(0, 8)
const scope = `${day}/auto/s3/aws4_request`
const signed = 'host;x-amz-content-sha256;x-amz-date'
const canonical = ['PUT', path, '', `host:${host}`, `x-amz-content-sha256:${hash}`, `x-amz-date:${now}`, '', signed, hash].join('\n')
const toSign = ['AWS4-HMAC-SHA256', now, scope, createHash('sha256').update(canonical).digest('hex')].join('\n')
const hmac = (k, s) => createHmac('sha256', k).update(s).digest()
const signingKey = ['auto', 's3', 'aws4_request'].reduce(hmac, hmac(`AWS4${secret}`, day))
const signature = createHmac('sha256', signingKey).update(toSign).digest('hex')
const res = await fetch(`https://${host}${path}`, {
  method: 'PUT',
  body: data,
  headers: {
    authorization: `AWS4-HMAC-SHA256 Credential=${accessKey}/${scope}, SignedHeaders=${signed}, Signature=${signature}`,
    'x-amz-content-sha256': hash,
    'x-amz-date': now,
    'content-type': 'image/webp',
    'cache-control': 'public, max-age=31536000, immutable',
  },
})
if (!res.ok) throw new Error(`Upload failed: HTTP ${res.status} ${(await res.text()).slice(0, 300)}`)
console.log(`${PUBLIC}/${key} (${Math.round(data.length / 1024)} KB)`)
