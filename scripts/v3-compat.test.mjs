// Proves the schema 3 and 2 files Renplay 3.x reads keep what main's build writes:
// apart from the build time and the url of the seven covers that left the
// repository for covers.renplay.org, the indexes are identical, and every other
// cover field (sha256, width, height, sfw) is unchanged. Also proves
// legacy/v3-covers.json holds main's covers with only those seven urls changed.
// Builds main in a git worktree (with this checkout's node_modules linked in)
// and compares the parsed indexes field by field.
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, symlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

const root = new URL('..', import.meta.url).pathname
const FILES = ['index.v3.json', 'index.v3.sfw.json', 'index.json']
// The seven repository covers that moved to covers.renplay.org byte for byte.
// Their sha256, width, height and sfw stay as main published them.
const MOVED = ['being-a-dik', 'broken-city', 'college-daze', 'fresh-women', 'fresh-women-season-2', 'harem-hotel', 'our-red-string']

// Order-insensitive serialization, so the comparison is about content, not key order.
const canonical = (value) => JSON.stringify(value, (_, v) => (v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => a.localeCompare(b))) : v))
// The index without the build time and the seven moved cover urls. Every other
// field, every other cover field included, stays in the comparison.
const normalize = (text) => {
  const idx = JSON.parse(text)
  delete idx.generated
  for (const game of idx.games ?? []) if (game.cover && MOVED.includes(game.id)) delete game.cover.url
  return canonical(idx)
}

// Builds main in a git worktree and runs fn with its path. Skips when no main ref exists.
const withMainBuild = (t, fn) => {
  let main
  try {
    // CI checks out a pull request's merge ref, so main may live at origin/main.
    const ref = ['main', 'origin/main'].find((r) => {
      try { execFileSync('git', ['rev-parse', '--verify', r], { cwd: root, stdio: 'pipe' }); return true } catch { return false }
    })
    if (!ref) throw new Error('no main ref')
    main = mkdtempSync(join(tmpdir(), 'catalog-main-'))
    execFileSync('git', ['worktree', 'add', '--detach', main, ref], { cwd: root, stdio: 'pipe' })
  } catch (e) {
    t.skip(`git worktree for main unavailable: ${e.message}`)
    return
  }
  try {
    symlinkSync(join(root, 'node_modules'), join(main, 'node_modules'), 'dir')
    execFileSync('node', ['scripts/build.mjs'], { cwd: main, stdio: 'pipe' })
    fn(main)
  } finally {
    execFileSync('git', ['worktree', 'remove', '--force', main], { cwd: root, stdio: 'pipe' })
    rmSync(main, { recursive: true, force: true })
  }
}

test("the v3 and v2 indexes equal main's build apart from the moved cover urls and the build time", (t) => {
  withMainBuild(t, (main) => {
    for (const name of FILES) {
      const before = normalize(readFileSync(join(main, 'dist', name), 'utf8'))
      const after = normalize(readFileSync(join(root, 'dist', name), 'utf8'))
      assert.equal(after, before, `${name} differs from main's build beyond the moved cover urls and the build time`)
    }
  })
})

test("the frozen v3 covers are main's covers with only the moved urls changed", (t) => {
  withMainBuild(t, (main) => {
    const frozen = JSON.parse(readFileSync(join(root, 'legacy/v3-covers.json'), 'utf8'))
    const games = JSON.parse(readFileSync(join(main, 'dist', 'index.v3.json'), 'utf8')).games
    const moved = []
    for (const game of games) {
      if (!game.cover) continue
      const held = frozen[game.id]
      assert.ok(held, `${game.id} is in main's build but not in legacy/v3-covers.json`)
      const { url: mainUrl, ...mainRest } = game.cover
      const { url: heldUrl, ...heldRest } = held
      assert.deepEqual(heldRest, mainRest, `${game.id}: the frozen cover changed more than the url`)
      if (heldUrl === mainUrl) continue
      assert.ok(mainUrl.startsWith('covers/'), `${game.id}: only a repository cover may move, not ${mainUrl}`)
      assert.ok(heldUrl.startsWith('https://covers.renplay.org/'), `${game.id}: the moved cover must live on covers.renplay.org, not ${heldUrl}`)
      moved.push(game.id)
    }
    assert.deepEqual(moved.sort(), [...MOVED].sort(), 'the covers with a changed url are not the seven expected ones')
  })
})
