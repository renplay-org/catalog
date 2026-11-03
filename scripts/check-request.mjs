// Checks a game request issue against the catalog and the game's page, and
// prints a Markdown comment plus the labels to add (as JSON on the last line).
//
//   ISSUE_BODY="…" node scripts/check-request.mjs
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import YAML from 'yaml'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const body = process.env.ISSUE_BODY ?? ''

/** Issue forms render as "### Label\n\nvalue" sections. */
function fields(text) {
  const out = {}
  const parts = text.split(/^### (.+)$/m)
  for (let i = 1; i < parts.length; i += 2) {
    const value = parts[i + 1].trim().replace(/^```\w*\n?|```$/g, '').trim()
    out[parts[i].trim()] = value === '_No response_' ? '' : value
  }
  return out
}

const f = fields(body)
const kind = f['What are you asking for?'] ?? ''
const title = f['Game'] ?? ''
const version = f['Version'] ?? ''
const page = f['Official page'] ?? ''
const f95 = f['F95zone thread (if there is one)'] ?? ''
const renpyHow = f["How do you know it is a Ren'Py game?"] ?? ''
const renpyVersion = f["Ren'Py version, if you know it"] ?? ''
const archive = f['Download file name'] ?? ''

const norm = (s) => s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]/g, '')
const recipes = readdirSync(join(root, 'recipes'))
  .filter((n) => n.endsWith('.yaml') && !n.startsWith('_'))
  .map((n) => YAML.parse(readFileSync(join(root, 'recipes', n), 'utf-8')))

const notes = []
const labels = new Set()
let ok = true

// 1. Is the game in the catalog already?
const key = norm(title)
const found = key && recipes.find((r) => norm(r.title) === key || norm(r.id) === key || (key.length > 5 && (norm(r.title).includes(key) || key.includes(norm(r.title)))))
const newGame = kind.startsWith('A game that is not')
if (found) {
  const versions = found.releases.map((r) => r.version)
  const listed = versions.some((v) => norm(String(v)) === norm(version))
  if (listed) {
    notes.push(`⚠️ **${found.title} ${version} is already in the catalog** ([recipes/${found.id}.yaml](https://github.com/renplay-web/catalog/blob/main/recipes/${found.id}.yaml)). If it does not work for you, please open a "Recipe does not work" issue instead.`)
    ok = false
  } else if (newGame) {
    notes.push(`ℹ️ **${found.title} is already in the catalog** (listed: ${versions.join(', ')}). This looks like a request for version ${version || 'another version'}, so it is treated as one.`)
    labels.add('new version')
  } else {
    notes.push(`✅ **${found.title} is in the catalog** (listed: ${versions.join(', ')}); version ${version || '?'} is not yet.`)
    labels.add('new version')
  }
} else {
  if (!newGame) notes.push(`ℹ️ No game called “${title}” is in the catalog yet, so this is treated as a new game.`)
  else notes.push(`✅ “${title}” is not in the catalog yet.`)
  labels.add('new game')
}

// 2. The official page.
let pageUrl = null
try {
  pageUrl = new URL(page)
} catch {}
const mirror = /(mega\.nz|mediafire|drive\.google|pixeldrain|gofile|workupload|anonfiles|zippyshare|f95zone|lewdzone|dropbox)/i
if (!pageUrl || pageUrl.protocol !== 'https:') {
  notes.push('⚠️ **The official page is not a valid https link.** Please edit the issue and add the developer’s page.')
  labels.add('needs info')
  ok = false
} else if (mirror.test(pageUrl.hostname)) {
  notes.push(`⚠️ **${pageUrl.hostname} is not the developer’s own page.** Please link where the developer publishes the game (itch.io, Steam, Patreon, their website).`)
  labels.add('needs info')
  ok = false
} else {
  notes.push(`✅ Official page: ${pageUrl.hostname}.`)
}
if (f95 && !/^https:\/\/f95zone\.to\/threads\//.test(f95)) notes.push('ℹ️ The F95zone link does not look like a thread link (`https://f95zone.to/threads/…`).')

// 3. Is it Ren'Py 8?
const major = renpyVersion.match(/^\s*(\d+)\./)?.[1]
if (major && major !== '8') {
  notes.push(`⚠️ **Ren'Py ${renpyVersion.trim()}**: Renplay plays Ren'Py 8 games only for now. The request stays open, labeled for later.`)
  labels.add(`ren'py ${major}`)
}
let pageSaysRenpy = null
if (pageUrl && /(^|\.)itch\.io$/.test(pageUrl.hostname)) {
  try {
    const res = await fetch(pageUrl, { signal: AbortSignal.timeout(20000), headers: { 'user-agent': 'renplay-catalog request check' } })
    const html = await res.text()
    pageSaysRenpy = /ren'?py/i.test(html)
    const coverMeta = html.match(/<meta content="([^"]+)" property="og:image"/)
    if (pageSaysRenpy) notes.push('✅ The itch.io page mentions Ren’Py.')
    else notes.push('ℹ️ The itch.io page does not mention Ren’Py. That is common, but please confirm the download has the `renpy` and `game` folders.')
    if (coverMeta) notes.push(`✅ The itch.io page has a cover image to link: ${coverMeta[1]}`)
  } catch (e) {
    notes.push(`ℹ️ Could not open the itch.io page (${e.message}).`)
  }
}
if (renpyHow.startsWith('I am not sure') && !pageSaysRenpy) {
  notes.push('ℹ️ To check: a Ren’Py game’s folder has a `renpy` folder next to a `game` folder with `.rpa` or `.rpy` files.')
  labels.add('needs info')
}

// 4. Download name.
if (archive && !/\.(zip|7z|rar|tar(\.\w+)?)$/i.test(archive)) notes.push(`ℹ️ “${archive}” does not look like an archive name (.zip, .7z, .rar, .tar).`)

const comment = [
  ok ? 'Thanks for the request! Here is what the automatic check found:' : 'Thanks for the request! The automatic check found something to fix:',
  '',
  ...notes.map((n) => `- ${n}`),
  '',
  'A maintainer or contributor will pick it up. Anyone can add a game: see [CONTRIBUTING.md](https://github.com/renplay-web/catalog/blob/main/CONTRIBUTING.md).',
].join('\n')
console.log(comment)
console.log(JSON.stringify([...labels]))
