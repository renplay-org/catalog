import assert from 'node:assert/strict'
import test from 'node:test'
import { httpsUrl, plainText } from './plain-text.mjs'

test('quotes the words of an itch.io "Made with" cell', () => {
  assert.equal(plainText('<a href="/game-development/engines/renpy">Ren&#039;Py</a>, <a href="x">Aseprite</a>'), "Ren'Py, Aseprite")
})

test('leaves no tag, Markdown or mention in what it quotes', () => {
  for (const html of ['<scr<script>ipt>alert(1)</script>', '<img src=x onerror=alert(1)', '[a link](https://example.com) @everyone `code` **bold**']) {
    const text = plainText(html)
    assert.doesNotMatch(text, /[<>[\]`*@]/, text)
  }
  assert.equal(plainText('x'.repeat(500)).length, 120)
})

test('quotes only https addresses', () => {
  assert.equal(httpsUrl('https://img.itch.zone/a b<c>.png'), 'https://img.itch.zone/a%20b%3Cc%3E.png')
  assert.equal(httpsUrl('javascript:alert(1)'), null)
  assert.equal(httpsUrl('http://example.com/x.png'), null)
  assert.equal(httpsUrl('not a url'), null)
})
