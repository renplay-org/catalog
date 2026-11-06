// Repository art is safe for work by policy; remote art of an adult game is
// never marked safe. The schema 3 and 2 indexes carry this as cover.sfw.
export function coverIsSfw(recipe, url) {
  return recipe.nsfw !== true || url.startsWith('covers/')
}
