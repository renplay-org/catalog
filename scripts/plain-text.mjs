// Text from someone else's web page, safe to quote in a GitHub comment: no tags, no Markdown, no
// mentions, only letters, digits, spaces and plain punctuation, and at most `max` characters.
export function plainText(html, max = 120) {
  return html
    .replace(/<[^>]*>?/g, '')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/[^\p{L}\p{N} '’.,&+()/-]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max)
}

// An address from someone else's web page, quoted only when it is an https URL, in its normal form.
export function httpsUrl(text) {
  try {
    const url = new URL(text)
    return url.protocol === 'https:' ? url.href : null
  } catch {
    return null
  }
}
