// Small presentation helpers shared across components.

const AVATAR_TINTS = [
  '#7c8ea3',
  '#8a7f9e',
  '#9e8477',
  '#6f9089',
  '#a3818b',
  '#84906d',
];

/** First letter of each of the first two words, e.g. "Ria Sharma" -> "RS". */
export function initials(name) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

/**
 * Pick a stable tint for a name so the same person keeps the same avatar
 * colour across renders and reloads (no randomness, no stored state).
 */
export function tintFor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return AVATAR_TINTS[hash % AVATAR_TINTS.length];
}
