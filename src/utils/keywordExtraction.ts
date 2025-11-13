/**
 * Keyword extraction and TF-IDF utilities for topic suggestion
 */

import type { Keyword } from '../types/clustering'

/**
 * Common stop words to filter out
 * These are words that don't carry meaningful semantic content
 */
const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
  'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
  'to', 'was', 'will', 'with', 'shall', 'may', 'must', 'can', 'or',
  'but', 'not', 'have', 'had', 'do', 'does', 'did', 'been', 'being',
  'would', 'could', 'should', 'this', 'these', 'those', 'such', 'than',
])

/**
 * Tokenize text into words
 * Removes punctuation and converts to lowercase
 * 
 * @param text Text to tokenize
 * @returns Array of tokens
 */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    // Remove most punctuation but keep hyphens in words
    .replace(/[^\w\s-]/g, ' ')
    // Split on whitespace
    .split(/\s+/)
    // Filter empty strings
    .filter(token => token.length > 0)
}

/**
 * Filter out stop words from tokens
 * 
 * @param tokens Array of tokens
 * @returns Filtered tokens
 */
export function filterStopWords(tokens: string[]): string[] {
  return tokens.filter(token => {
    // Filter stop words and very short tokens
    return !STOP_WORDS.has(token) && token.length > 2
  })
}

/**
 * Calculate term frequency (TF) for tokens
 * TF = (number of times term appears) / (total number of terms)
 * 
 * @param tokens Array of tokens
 * @returns Map of term to frequency
 */
export function calculateTermFrequency(tokens: string[]): Map<string, number> {
  const termCounts = new Map<string, number>()
  
  // Count occurrences
  tokens.forEach(token => {
    termCounts.set(token, (termCounts.get(token) || 0) + 1)
  })
  
  // Calculate frequency
  const total = tokens.length
  const termFrequency = new Map<string, number>()
  
  termCounts.forEach((count, term) => {
    termFrequency.set(term, count / total)
  })
  
  return termFrequency
}

/**
 * Calculate inverse document frequency (IDF) for terms across documents
 * IDF = log(total documents / documents containing term)
 * 
 * @param documents Array of document token sets
 * @returns Map of term to IDF score
 */
export function calculateInverseDocumentFrequency(
  documents: string[][]
): Map<string, number> {
  const totalDocs = documents.length
  const docCounts = new Map<string, number>()
  
  // Count documents containing each term
  documents.forEach(doc => {
    const uniqueTerms = new Set(doc)
    uniqueTerms.forEach(term => {
      docCounts.set(term, (docCounts.get(term) || 0) + 1)
    })
  })
  
  // Calculate IDF
  const idf = new Map<string, number>()
  docCounts.forEach((count, term) => {
    idf.set(term, Math.log(totalDocs / count))
  })
  
  return idf
}

/**
 * Calculate TF-IDF scores for a document
 * TF-IDF = TF * IDF
 * 
 * @param tokens Tokens from the document
 * @param idf IDF scores for all terms
 * @returns Map of term to TF-IDF score
 */
export function calculateTfIdf(
  tokens: string[],
  idf: Map<string, number>
): Map<string, number> {
  const tf = calculateTermFrequency(tokens)
  const tfIdf = new Map<string, number>()
  
  tf.forEach((frequency, term) => {
    const idfScore = idf.get(term) || 0
    tfIdf.set(term, frequency * idfScore)
  })
  
  return tfIdf
}

/**
 * Extract keywords from text using TF-IDF
 * 
 * @param text Text to extract keywords from
 * @param allTexts All texts in the corpus (for IDF calculation)
 * @param maxKeywords Maximum number of keywords to return
 * @returns Array of keywords sorted by score
 */
export function extractKeywords(
  text: string,
  allTexts: string[],
  maxKeywords: number = 5
): Keyword[] {
  // Tokenize all texts
  const allTokens = allTexts.map(t => {
    const tokens = tokenize(t)
    return filterStopWords(tokens)
  })
  
  // Tokenize the target text
  const targetTokens = filterStopWords(tokenize(text))
  
  // Calculate IDF for all terms
  const idf = calculateInverseDocumentFrequency(allTokens)
  
  // Calculate TF-IDF for target text
  const tfIdf = calculateTfIdf(targetTokens, idf)
  
  // Count term frequencies for the result
  const termCounts = new Map<string, number>()
  targetTokens.forEach(token => {
    termCounts.set(token, (termCounts.get(token) || 0) + 1)
  })
  
  // Convert to array and sort by score
  const keywords: Keyword[] = []
  tfIdf.forEach((score, term) => {
    keywords.push({
      term,
      score,
      frequency: termCounts.get(term) || 0,
    })
  })
  
  // Sort by score descending
  keywords.sort((a, b) => b.score - a.score)
  
  // Return top N keywords
  return keywords.slice(0, maxKeywords)
}

/**
 * Extract keywords from multiple texts and aggregate
 * Useful for finding common themes across a set of changes
 * 
 * @param texts Array of texts to analyze
 * @param maxKeywords Maximum keywords to return
 * @returns Array of aggregated keywords
 */
export function extractAggregatedKeywords(
  texts: string[],
  maxKeywords: number = 5
): Keyword[] {
  // Combine all texts for analysis
  const combinedText = texts.join(' ')
  
  // Extract keywords using the full corpus
  return extractKeywords(combinedText, texts, maxKeywords)
}

/**
 * Generate a suggested topic from keywords
 * Takes the top keywords and formats them into a readable topic
 * 
 * @param keywords Array of keywords
 * @param maxTerms Maximum terms to include in topic
 * @returns Suggested topic string
 */
export function generateTopicFromKeywords(
  keywords: Keyword[],
  maxTerms: number = 3
): string {
  if (keywords.length === 0) {
    return 'Unassigned'
  }
  
  // Take top keywords and capitalize
  const topKeywords = keywords
    .slice(0, maxTerms)
    .map(k => {
      // Capitalize first letter of each word
      return k.term
        .split(/[-\s]/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    })
  
  return topKeywords.join(' / ')
}
