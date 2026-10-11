/**
 * Team name canonicalisation and fuzzy matching utilities.
 *
 * Strips common prefixes/suffixes and normalises whitespace so that
 * names from different API sources can be compared reliably.
 */

// Prefixes and suffixes to strip before comparison
const AFFIXES = [
  'FC', 'CF', 'AFC', 'AC', 'AS', 'SV', 'RV', 'SC', 'RC',
  'Sporting Clube de', 'Sporting', 'Real Club',
  'Club Atletico', 'Club de Futbol',
] as const;

/** Normalise a raw team name to a canonical form. */
export function canonicalizeTeamName(raw: string): string {
  let name = raw.trim().toLowerCase();

  // Remove common prefixes
  for (const prefix of AFFIXES) {
    const pattern = new RegExp(`^${prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*`, 'i');
    name = name.replace(pattern, '');
  }

  // Remove common suffixes
  for (const suffix of [...AFFIXES].reverse()) {
    const pattern = new RegExp(`\\s*${suffix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
    name = name.replace(pattern, '');
  }

  // Collapse whitespace and return
  return name.replace(/\s+/g, ' ').trim();
}

/**
 * Compare two team names for a match using canonical forms.
 * Returns true when the names are close enough to represent the same club.
 */
export function isTeamMatch(teamA: string, teamB: string): boolean {
  const a = canonicalizeTeamName(teamA);
  const b = canonicalizeTeamName(teamB);
  if (a === b) return true;
  // Allow minor variations (e.g. "Man Utd" vs "Manchester United")
  return a.includes(b) || b.includes(a) || levenshteinDistance(a, b) <= 3;
}

/** Simple Levenshtein distance for fuzzy matching fallback. */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1,
        );
      }
    }
  }
  return matrix[b.length][a.length];
}
