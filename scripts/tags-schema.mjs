// Run after editing schema/tags.json; the build checks these enums have not drifted.
import { readFileSync, writeFileSync } from 'node:fs'

export const tags = JSON.parse(readFileSync(new URL('../schema/tags.json', import.meta.url), 'utf8'))
const groups = new Set(['play', 'story', 'art', 'protagonist', 'content'])
const ids = new Set()
const f95Ids = new Set()
for (const tag of tags) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(tag.id) || ids.has(tag.id) ||
      !tag.label || !groups.has(tag.group) || !Number.isInteger(tag.f95) || tag.f95 < 1 || f95Ids.has(tag.f95)) {
    throw new Error(`Invalid or duplicate vocabulary entry: ${JSON.stringify(tag)}`)
  }
  ids.add(tag.id)
  f95Ids.add(tag.f95)
}
export const tagEnums = {
  tags: tags.filter((t) => t.group !== 'content').map((t) => t.id),
  content: tags.filter((t) => t.group === 'content').map((t) => t.id),
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const path = new URL('../schema/recipe.schema.json', import.meta.url)
  let text = readFileSync(path, 'utf8')
  for (const [field, values] of Object.entries(tagEnums)) {
    const pattern = new RegExp(`("${field}": \\{ "type": "array", "items": \\{ "type": "string", "enum": )\\[[^\\]]*\\]`)
    text = text.replace(pattern, (_, prefix) => prefix + JSON.stringify(values))
  }
  writeFileSync(path, text)
  console.log('Updated recipe tag enums')
}
