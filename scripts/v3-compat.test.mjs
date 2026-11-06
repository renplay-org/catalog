// Proves the schema 3 and 2 files Renplay 3.x reads did not change with schema 4:
// apart from each game's derived cover and the build time, they are identical to
// what main's build writes. Builds main in a git worktree (with this checkout's
// node_modules linked in) and compares the parsed indexes field by field.
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, symlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

const root = new URL('..', import.meta.url).pathname
const FILES = ['index.v3.json', 'index.v3.sfw.json', 'index.json']

// Order-insensitive serialization, so the comparison is about content, not key order.
const canonical = (value) => JSON.stringify(value, (_, v) => (v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => a.localeCompare(b))) : v))
const normalize = (name, text) => {
  const idx = JSON.parse(text)
  delete idx.generated
  for (const game of idx.games ?? []) delete game.cover
  return canonical(idx)
}

test('the v3 and v2 indexes are unchanged apart from derived covers and build time', (t) => {
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
    for (const name of FILES) {
      const before = normalize(name, readFileSync(join(main, 'dist', name), 'utf8'))
      const after = normalize(name, readFileSync(join(root, 'dist', name), 'utf8'))
      assert.equal(after, before, `${name} differs from main's build beyond covers and the build time`)
    }
  } finally {
    execFileSync('git', ['worktree', 'remove', '--force', main], { cwd: root, stdio: 'pipe' })
    rmSync(main, { recursive: true, force: true })
  }
})
