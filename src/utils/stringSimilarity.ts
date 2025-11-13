/**
 * String similarity utilities for clustering
 * Used to compare clause paths and identify similar changes
 */

/**
 * Calculate Levenshtein distance between two strings
 * Returns the minimum number of single-character edits needed to change one string into another
 * 
 * @param str1 First string
 * @param str2 Second string
 * @returns Number of edits needed (lower is more similar)
 */
export function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length
  const len2 = str2.length

  // Create a 2D array for dynamic programming
  const matrix: number[][] = Array(len1 + 1)
    .fill(null)
    .map(() => Array(len2 + 1).fill(0))

  // Initialize first row and column
  for (let i = 0; i <= len1; i++) {
    matrix[i][0] = i
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j
  }

  // Fill in the rest of the matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost // substitution
      )
    }
  }

  return matrix[len1][len2]
}

/**
 * Calculate similarity ratio between two strings (0 to 1)
 * Uses normalized Levenshtein distance
 * 
 * @param str1 First string
 * @param str2 Second string
 * @returns Similarity ratio (1 = identical, 0 = completely different)
 */
export function stringSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 1.0
  if (str1.length === 0 && str2.length === 0) return 1.0
  if (str1.length === 0 || str2.length === 0) return 0.0

  const maxLength = Math.max(str1.length, str2.length)
  const distance = levenshteinDistance(str1, str2)
  
  return 1 - distance / maxLength
}

/**
 * Calculate similarity between two clause paths
 * Compares paths element by element and returns average similarity
 * 
 * @param path1 First clause path
 * @param path2 Second clause path
 * @returns Similarity ratio (0-1)
 */
export function clausePathSimilarity(path1: string[], path2: string[]): number {
  if (path1.length === 0 && path2.length === 0) return 1.0
  if (path1.length === 0 || path2.length === 0) return 0.0

  // Compare each level of the path
  const maxLength = Math.max(path1.length, path2.length)
  let totalSimilarity = 0

  for (let i = 0; i < maxLength; i++) {
    const elem1 = path1[i] || ''
    const elem2 = path2[i] || ''
    
    // Exact match at this level gets higher weight
    if (elem1 === elem2) {
      totalSimilarity += 1.0
    } else {
      // Partial match using string similarity
      totalSimilarity += stringSimilarity(elem1, elem2) * 0.5
    }
  }

  return totalSimilarity / maxLength
}

/**
 * Join clause path into a normalized string for comparison
 * 
 * @param clausePath Clause path array
 * @returns Normalized string representation
 */
export function normalizeClausePath(clausePath: string[]): string {
  return clausePath
    .map(segment => segment.trim().toLowerCase())
    .filter(segment => segment.length > 0)
    .join(' > ')
}

/**
 * Check if two clause paths are similar enough to be in the same cluster
 * 
 * @param path1 First clause path
 * @param path2 Second clause path
 * @param threshold Similarity threshold (default: 0.7)
 * @returns True if paths are similar enough
 */
export function areClausePathsSimilar(
  path1: string[],
  path2: string[],
  threshold: number = 0.7
): boolean {
  const similarity = clausePathSimilarity(path1, path2)
  return similarity >= threshold
}
