/**
 * Tests for string similarity utilities
 */

import { describe, it, expect } from 'vitest'
import {
  levenshteinDistance,
  stringSimilarity,
  clausePathSimilarity,
  normalizeClausePath,
  areClausePathsSimilar,
} from './stringSimilarity'

describe('levenshteinDistance', () => {
  it('should return 0 for identical strings', () => {
    expect(levenshteinDistance('hello', 'hello')).toBe(0)
    expect(levenshteinDistance('', '')).toBe(0)
  })

  it('should calculate distance for different strings', () => {
    expect(levenshteinDistance('hello', 'hallo')).toBe(1)
    expect(levenshteinDistance('hello', 'helo')).toBe(1)
    expect(levenshteinDistance('hello', 'hello world')).toBe(6)
  })

  it('should handle empty strings', () => {
    expect(levenshteinDistance('', 'hello')).toBe(5)
    expect(levenshteinDistance('hello', '')).toBe(5)
  })

  it('should be case sensitive', () => {
    expect(levenshteinDistance('Hello', 'hello')).toBe(1)
  })
})

describe('stringSimilarity', () => {
  it('should return 1.0 for identical strings', () => {
    expect(stringSimilarity('hello', 'hello')).toBe(1.0)
    expect(stringSimilarity('', '')).toBe(1.0)
  })

  it('should return 0.0 for completely different strings', () => {
    expect(stringSimilarity('', 'hello')).toBe(0.0)
    expect(stringSimilarity('hello', '')).toBe(0.0)
  })

  it('should return high similarity for similar strings', () => {
    const similarity = stringSimilarity('hello', 'hallo')
    expect(similarity).toBeGreaterThanOrEqual(0.8)
    expect(similarity).toBeLessThan(1.0)
  })

  it('should return low similarity for different strings', () => {
    const similarity = stringSimilarity('hello', 'world')
    expect(similarity).toBeLessThan(0.5)
  })
})

describe('clausePathSimilarity', () => {
  it('should return 1.0 for identical paths', () => {
    const path = ['8', 'Termination', '8.2 Force Majeure']
    expect(clausePathSimilarity(path, path)).toBe(1.0)
  })

  it('should return 1.0 for empty paths', () => {
    expect(clausePathSimilarity([], [])).toBe(1.0)
  })

  it('should return 0.0 for completely different paths', () => {
    const path1 = ['8', 'Termination', '8.2 Force Majeure']
    const path2: string[] = []
    expect(clausePathSimilarity(path1, path2)).toBe(0.0)
  })

  it('should return high similarity for paths with same structure', () => {
    const path1 = ['8', 'Termination', '8.2 Force Majeure']
    const path2 = ['8', 'Termination', '8.3 Breach']
    const similarity = clausePathSimilarity(path1, path2)
    expect(similarity).toBeGreaterThan(0.6)
    expect(similarity).toBeLessThan(1.0)
  })

  it('should handle paths of different lengths', () => {
    const path1 = ['8', 'Termination']
    const path2 = ['8', 'Termination', '8.2 Force Majeure']
    const similarity = clausePathSimilarity(path1, path2)
    expect(similarity).toBeGreaterThan(0.5)
    expect(similarity).toBeLessThan(1.0)
  })

  it('should give higher score for exact matches at same level', () => {
    const path1 = ['8', 'Termination', '8.2 Force Majeure']
    const path2 = ['8', 'Termination', '8.2 Different']
    const path3 = ['9', 'Other', 'Completely Different']
    
    const sim1 = clausePathSimilarity(path1, path2)
    const sim2 = clausePathSimilarity(path1, path3)
    
    expect(sim1).toBeGreaterThan(sim2)
  })
})

describe('normalizeClausePath', () => {
  it('should normalize clause path to string', () => {
    const path = ['8', 'Termination', '8.2 Force Majeure']
    expect(normalizeClausePath(path)).toBe('8 > termination > 8.2 force majeure')
  })

  it('should handle empty paths', () => {
    expect(normalizeClausePath([])).toBe('')
  })

  it('should trim and lowercase', () => {
    const path = [' 8 ', 'TERMINATION ', '  8.2 Force Majeure  ']
    expect(normalizeClausePath(path)).toBe('8 > termination > 8.2 force majeure')
  })

  it('should filter empty segments', () => {
    const path = ['8', '', 'Termination', '  ', '8.2']
    expect(normalizeClausePath(path)).toBe('8 > termination > 8.2')
  })
})

describe('areClausePathsSimilar', () => {
  it('should return true for identical paths', () => {
    const path = ['8', 'Termination', '8.2 Force Majeure']
    expect(areClausePathsSimilar(path, path)).toBe(true)
  })

  it('should return true for similar paths above threshold', () => {
    const path1 = ['8', 'Termination', '8.2 Force Majeure']
    const path2 = ['8', 'Termination', '8.3 Breach']
    expect(areClausePathsSimilar(path1, path2, 0.7)).toBe(true)
  })

  it('should return false for dissimilar paths', () => {
    const path1 = ['8', 'Termination', '8.2 Force Majeure']
    const path2 = ['5', 'Payment', '5.1 Terms']
    expect(areClausePathsSimilar(path1, path2, 0.7)).toBe(false)
  })

  it('should use default threshold of 0.7', () => {
    const path1 = ['8', 'Termination']
    const path2 = ['8', 'Terminations']
    expect(areClausePathsSimilar(path1, path2)).toBe(true)
  })

  it('should respect custom threshold', () => {
    const path1 = ['8', 'Termination']
    const path2 = ['8', 'Different']
    
    // With low threshold, should be similar
    expect(areClausePathsSimilar(path1, path2, 0.4)).toBe(true)
    
    // With high threshold, should not be similar
    expect(areClausePathsSimilar(path1, path2, 0.9)).toBe(false)
  })
})
