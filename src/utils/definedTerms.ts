/**
 * Defined Term (DT) extraction and analysis utilities
 * Implements semantic clustering based on legal defined terms
 */

import type { DefinedTerm, DTStats, DTMatch } from '../types/clustering'
import type { Change } from '../types/dataModel'

/**
 * Common legal terms that appear frequently but have low semantic value
 * These will receive lower IDF scores naturally, but we list them for clarity
 */
const COMMON_LEGAL_TERMS = new Set([
  'buyer',
  'seller',
  'company',
  'party',
  'parties',
  'agreement',
  'contract',
  'document',
  'section',
  'clause',
  'term',
  'condition',
])

/**
 * Patterns that indicate a definition is being introduced
 */
const DEFINITION_PATTERNS = [
  /[""]([^""]+)[""]?\s+means/i,
  /[""]([^""]+)[""]?\s+shall\s+mean/i,
  /[""]([^""]+)[""]?\s+refers?\s+to/i,
  /[""]([^""]+)[""]?\s+is\s+defined\s+as/i,
  /\(the\s+[""]([^""]+)[""]?\)/i,
  /\(collectively,?\s+[""]([^""]+)[""]?\)/i,
  /\(together,?\s+[""]([^""]+)[""]?\)/i,
]

/**
 * Normalize a term for comparison
 * - Convert to lowercase
 * - Trim whitespace and punctuation
 * - Collapse multiple spaces
 */
export function normalizeTerm(term: string): string {
  return term
    .toLowerCase()
    .replace(/^[^\w\s]+|[^\w\s]+$/g, '') // Remove leading/trailing punctuation
    .replace(/\s+/g, ' ') // Collapse whitespace
    .trim()
}

/**
 * Check if a term appears to be a capitalized defined term
 * Must start with capital letter and be at least 2 words or a single word > 3 chars
 */
export function isCapitalizedTerm(text: string): boolean {
  // Must start with capital letter
  if (!text || text[0] !== text[0].toUpperCase()) {
    return false
  }

  // Check if it's a proper defined term pattern
  const words = text.trim().split(/\s+/)
  
  // Multi-word: at least 2 words, each starting with capital
  if (words.length >= 2) {
    return words.every(w => w[0] === w[0].toUpperCase())
  }
  
  // Single word: must be > 3 chars and not all caps (acronyms are handled separately)
  if (words.length === 1) {
    const word = words[0]
    return word.length > 3 && word !== word.toUpperCase()
  }
  
  return false
}

/**
 * Extract defined terms from definition section text
 * Looks for patterns like "Term" means/shall mean/refers to
 */
export function extractFromDefinitions(
  text: string,
  docId: string
): DefinedTerm[] {
  const terms: DefinedTerm[] = []
  
  for (const pattern of DEFINITION_PATTERNS) {
    const matches = text.matchAll(new RegExp(pattern, 'gi'))
    
    for (const match of matches) {
      const term = match[1]
      if (term && term.length > 2) {
        const normalized = normalizeTerm(term)
        terms.push({
          term: normalized,
          originalForm: term,
          source: 'definitions-section',
          docId,
          confidence: 0.95, // High confidence from definition section
        })
      }
    }
  }
  
  return terms
}

/**
 * Extract capitalized terms from general text
 * Looks for spans of capitalized words that might be defined terms
 */
export function extractCapitalizedTerms(
  text: string,
  docId: string
): DefinedTerm[] {
  const terms: DefinedTerm[] = []
  
  // Match sequences of capitalized words (2+ words or significant single words)
  // Exclude common sentence starters like "The"
  const capitalizedPattern = /\b(?!The\b)([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b/g
  const matches = text.matchAll(capitalizedPattern)
  
  for (const match of matches) {
    const term = match[1]
    if (isCapitalizedTerm(term)) {
      const normalized = normalizeTerm(term)
      // Don't add if it's a common term
      if (!COMMON_LEGAL_TERMS.has(normalized)) {
        terms.push({
          term: normalized,
          originalForm: term,
          source: 'capitalized-span',
          docId,
          confidence: 0.6, // Medium confidence - could be proper nouns
        })
      }
    }
  }
  
  return terms
}

/**
 * Extract terms from quoted introductions like (the "Term")
 */
export function extractQuotedTerms(
  text: string,
  docId: string
): DefinedTerm[] {
  const terms: DefinedTerm[] = []
  
  // Match patterns like (the "Term") or (collectively, "Terms")
  // Use a more specific pattern to avoid greedy matching
  const quotedPattern = /\((?:the|collectively|together|hereinafter)?[,\s]*[""]([^""]+)[""][,\s]*\)/gi
  const matches = Array.from(text.matchAll(quotedPattern))
  
  for (const match of matches) {
    const term = match[1]
    if (term && term.length > 2) {
      const normalized = normalizeTerm(term)
      terms.push({
        term: normalized,
        originalForm: term,
        source: 'quoted-introduction',
        docId,
        confidence: 0.85, // High confidence for quoted introductions
      })
    }
  }
  
  return terms
}

/**
 * Check if text appears to be in a definitions section
 */
export function isDefinitionsSection(clausePath: string[]): boolean {
  const pathStr = clausePath.join(' ').toLowerCase()
  return (
    pathStr.includes('definition') ||
    pathStr.includes('interpretation') ||
    pathStr.includes('meaning') ||
    /^\s*1\b/.test(pathStr) // Often section 1
  )
}

/**
 * Extract all defined terms from a document's full text
 */
export function extractDefinedTerms(
  fullText: string,
  docId: string,
  clausePath: string[] = []
): DefinedTerm[] {
  const allTerms: DefinedTerm[] = []
  
  // Higher priority for definition sections
  const isDefSection = isDefinitionsSection(clausePath)
  
  // Extract from definitions patterns (highest priority)
  const defTerms = extractFromDefinitions(fullText, docId)
  allTerms.push(...defTerms)
  
  // Extract quoted terms (high priority)
  const quotedTerms = extractQuotedTerms(fullText, docId)
  allTerms.push(...quotedTerms)
  
  // Extract capitalized terms (medium priority)
  const capTerms = extractCapitalizedTerms(fullText, docId)
  allTerms.push(...capTerms)
  
  // Boost confidence if in definitions section
  if (isDefSection) {
    allTerms.forEach(term => {
      term.confidence = Math.min(term.confidence * 1.3, 1.0)
    })
  }
  
  return allTerms
}

/**
 * Deduplicate and merge defined terms
 * Keeps highest confidence version of each term
 */
export function deduplicateTerms(terms: DefinedTerm[]): DefinedTerm[] {
  const termMap = new Map<string, DefinedTerm>()
  
  for (const term of terms) {
    const existing = termMap.get(term.term)
    if (!existing || term.confidence > existing.confidence) {
      termMap.set(term.term, term)
    }
  }
  
  return Array.from(termMap.values())
}

/**
 * Calculate document frequency and IDF for all terms
 */
export function calculateDTStats(
  terms: DefinedTerm[],
  allContexts: string[]
): Map<string, DTStats> {
  const statsMap = new Map<string, DTStats>()
  const totalContexts = allContexts.length
  
  // Count document frequency for each term
  const uniqueTerms = Array.from(new Set(terms.map(t => t.term)))
  
  for (const term of uniqueTerms) {
    // Count how many contexts contain this term (case-insensitive)
    const df = allContexts.filter(context => {
      const lowerContext = context.toLowerCase()
      return lowerContext.includes(term)
    }).length
    
    // Calculate IDF: log(1 + total / df)
    // Add 1 to avoid division by zero and log(0)
    const idf = Math.log(1 + totalContexts / (df || 1))
    
    statsMap.set(term, { term, df, idf })
  }
  
  return statsMap
}

/**
 * Check if a term appears in text (case-insensitive)
 */
function termAppearsIn(term: string, text: string): boolean {
  const lowerText = text.toLowerCase()
  const lowerTerm = term.toLowerCase()
  
  // Use word boundaries to avoid partial matches
  const pattern = new RegExp(`\\b${lowerTerm.replace(/\s+/g, '\\s+')}\\b`, 'i')
  return pattern.test(lowerText)
}

/**
 * Score a single change based on defined term presence
 */
export function scoreChangeWithDT(
  change: Change,
  definedTerms: DefinedTerm[],
  dtStats: Map<string, DTStats>,
  weights: {
    strong: number
    context: number
    docwide: number
    definitionBoost: number
  } = {
    strong: 3.0,
    context: 1.5,
    docwide: 0.5,
    definitionBoost: 1.5,
  }
): { dtMatches: DTMatch[]; dtScore: number } {
  const matches: DTMatch[] = []
  let totalScore = 0
  
  const isInDefSection = isDefinitionsSection(change.clausePath)
  
  // Check each defined term
  for (const dt of definedTerms) {
    const stats = dtStats.get(dt.term)
    if (!stats) continue
    
    const idf = stats.idf
    
    // Strong match: term in changed text
    if (termAppearsIn(dt.term, change.changedText)) {
      let weight = weights.strong * idf
      if (isInDefSection) {
        weight *= weights.definitionBoost
      }
      matches.push({ term: dt.term, weight, kind: 'strong' })
      totalScore += weight
    }
    // Context match: term in before/after context
    else if (
      termAppearsIn(dt.term, change.textBefore) ||
      termAppearsIn(dt.term, change.textAfter)
    ) {
      const weight = weights.context * idf
      matches.push({ term: dt.term, weight, kind: 'context' })
      totalScore += weight
    }
    // Note: docwide matches would require document-level text analysis
    // For now, we skip this as it requires additional document data
  }
  
  return { dtMatches: matches, dtScore: totalScore }
}

/**
 * Score all changes with DT matching
 */
export function scoreAllChanges(
  changes: Change[],
  definedTerms: DefinedTerm[],
  dtStats: Map<string, DTStats>,
  weights?: {
    strong: number
    context: number
    docwide: number
    definitionBoost: number
  }
): Change[] {
  return changes.map(change => {
    const { dtMatches, dtScore } = scoreChangeWithDT(
      change,
      definedTerms,
      dtStats,
      weights
    )
    
    return {
      ...change,
      dtMatches,
      dtScore,
    }
  })
}

/**
 * Get the primary (highest-weighted) defined term for a change
 */
export function getPrimaryDT(change: Change): string | null {
  if (!change.dtMatches || change.dtMatches.length === 0) {
    return null
  }
  
  // Find the match with highest weight
  let maxWeight = 0
  let primaryTerm: string | null = null
  
  for (const match of change.dtMatches) {
    if (match.weight > maxWeight) {
      maxWeight = match.weight
      primaryTerm = match.term
    }
  }
  
  return primaryTerm
}
