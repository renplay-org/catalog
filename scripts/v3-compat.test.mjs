// Proves Renplay 3.x keeps the covers it had when schema 4 arrived. Every game in
// legacy/v3-covers.json publishes exactly its frozen cover in the schema 3 and 2
// files. The frozen map holds the covers of the last schema 3 commit with only
// the url of the seven covers that left the repository for covers.renplay.org
// changed. Their sha256, width, height and sfw are unchanged, the bytes the same.
// The second test builds that commit in a git worktree (with this checkout's
// node_modules linked in) and compares field by field.
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, symlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

const root = new URL('..', import.meta.url).pathname
const FILES = ['index.v3.json', 'index.v3.sfw.json', 'index.json']
// The last commit before schema 4 (#27), whose covers Renplay 3.x shows.
const BASELINE = '4712d75'
// The seven repository covers that moved to covers.renplay.org byte for byte.
const MOVED = ['being-a-dik', 'broken-city', 'college-daze', 'fresh-women', 'fresh-women-season-2', 'harem-hotel', 'our-red-string']
const frozen = JSON.parse(readFileSync(join(root, 'legacy/v3-covers.json'), 'utf8'))

// Builds the baseline commit in a git worktree and runs fn with its path.
// Skips when the commit is not in this clone (a shallow checkout).
const withBaselineBuild = (t, fn) => {
  let dir
  try {
    execFileSync('git', ['rev-parse', '--verify', `${BASELINE}^{commit}`], { cwd: root, stdio: 'pipe' })
    dir = mkdtempSync(join(tmpdir(), 'catalog-baseline-'))
    execFileSync('git', ['worktree', 'add', '--detach', dir, BASELINE], { cwd: root, stdio: 'pipe' })
  } catch (e) {
    t.skip(`git worktree for ${BASELINE} unavailable: ${e.message}`)
    return
  }
  try {
    symlinkSync(join(root, 'node_modules'), join(dir, 'node_modules'), 'dir')
    execFileSync('node', ['scripts/build.mjs'], { cwd: dir, stdio: 'pipe' })
    fn(dir)
  } finally {
    execFileSync('git', ['worktree', 'remove', '--force', dir], { cwd: root, stdio: 'pipe' })
    rmSync(dir, { recursive: true, force: true })
  }
}

test('every frozen game publishes exactly its frozen cover in the v3 and v2 indexes', () => {
  for (const name of FILES) {
    const games = JSON.parse(readFileSync(join(root, 'dist', name), 'utf8')).games
    for (const game of games) {
      if (!(game.id in frozen)) continue
      assert.deepEqual(game.cover, frozen[game.id], `${name}: ${game.id} does not publish its frozen cover`)
    }
  }
})

test('the frozen v3 covers are the last schema 3 covers with only the moved urls changed', (t) => {
  withBaselineBuild(t, (dir) => {
    const games = JSON.parse(readFileSync(join(dir, 'dist', 'index.v3.json'), 'utf8')).games
    const moved = []
    for (const game of games) {
      if (!game.cover) continue
      const held = frozen[game.id]
      assert.ok(held, `${game.id} is in the ${BASELINE} build but not in legacy/v3-covers.json`)
      const { url: oldUrl, ...oldRest } = game.cover
      const { url: heldUrl, ...heldRest } = held
      assert.deepEqual(heldRest, oldRest, `${game.id}: the frozen cover changed more than the url`)
      if (heldUrl === oldUrl) continue
      assert.ok(oldUrl.startsWith('covers/'), `${game.id}: only a repository cover may move, not ${oldUrl}`)
      assert.ok(heldUrl.startsWith('https://covers.renplay.org/'), `${game.id}: the moved cover must live on covers.renplay.org, not ${heldUrl}`)
      moved.push(game.id)
    }
    assert.deepEqual(moved.sort(), [...MOVED].sort(), 'the covers with a changed url are not the seven expected ones')
  })
})
