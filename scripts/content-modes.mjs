// Repository covers are safe for work by policy; remote adult art needs explicit approval.
export function coverIsSfw(recipe) {
  return recipe.coverSfw === true || recipe.nsfw !== true || recipe.cover.startsWith('covers/')
}
