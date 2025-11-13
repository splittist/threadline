/**
 * Tests for keyword extraction utilities
 */

import { describe, it, expect } from 'vitest'
import {
  tokenize,
  filterStopWords,
  calculateTermFrequency,
  calculateInverseDocumentFrequency,
  calculateTfIdf,
  extractKeywords,
  extractAggregatedKeywords,
  generateTopicFromKeywords,
} from './keywordExtraction'
import type { Keyword } from '../types/clustering'

describe('tokenize', () => {
  it('should tokenize simple text', () => {
    const tokens = tokenize('Hello world')
    expect(tokens).toEqual(['hello', 'world'])
  })

  it('should handle punctuation', () => {
    const tokens = tokenize('Hello, world! How are you?')
    expect(tokens).toEqual(['hello', 'world', 'how', 'are', 'you'])
  })

  it('should preserve hyphens in words', () => {
    const tokens = tokenize('Force-Majeure clause')
    expect(tokens).toEqual(['force-majeure', 'clause'])
  })

  it('should handle empty string', () => {
    const tokens = tokenize('')
    expect(tokens).toEqual([])
  })
})

describe('filterStopWords', () => {
  it('should remove common stop words', () => {
    const tokens = ['the', 'force', 'majeure', 'clause', 'is', 'important']
    const filtered = filterStopWords(tokens)
    expect(filtered).toEqual(['force', 'majeure', 'clause', 'important'])
  })

  it('should remove short tokens', () => {
    const tokens = ['a', 'be', 'xyz', 'test']
    const filtered = filterStopWords(tokens)
    expect(filtered).toEqual(['xyz', 'test'])
  })

  it('should handle empty array', () => {
    const filtered = filterStopWords([])
    expect(filtered).toEqual([])
  })
})

describe('calculateTermFrequency', () => {
  it('should calculate frequency for single occurrence', () => {
    const tokens = ['apple', 'banana', 'cherry']
    const tf = calculateTermFrequency(tokens)
    
    expect(tf.get('apple')).toBeCloseTo(1/3)
    expect(tf.get('banana')).toBeCloseTo(1/3)
    expect(tf.get('cherry')).toBeCloseTo(1/3)
  })

  it('should calculate frequency for multiple occurrences', () => {
    const tokens = ['apple', 'apple', 'banana', 'apple']
    const tf = calculateTermFrequency(tokens)
    
    expect(tf.get('apple')).toBeCloseTo(3/4)
    expect(tf.get('banana')).toBeCloseTo(1/4)
  })

  it('should handle empty array', () => {
    const tf = calculateTermFrequency([])
    expect(tf.size).toBe(0)
  })
})

describe('calculateInverseDocumentFrequency', () => {
  it('should calculate IDF for terms', () => {
    const docs = [
      ['apple', 'banana'],
      ['apple', 'cherry'],
      ['banana', 'cherry'],
    ]
    const idf = calculateInverseDocumentFrequency(docs)
    
    // apple appears in 2 docs: log(3/2)
    expect(idf.get('apple')).toBeCloseTo(Math.log(3/2))
    
    // banana appears in 2 docs: log(3/2)
    expect(idf.get('banana')).toBeCloseTo(Math.log(3/2))
    
    // cherry appears in 2 docs: log(3/2)
    expect(idf.get('cherry')).toBeCloseTo(Math.log(3/2))
  })

  it('should give higher score to rare terms', () => {
    const docs = [
      ['common', 'rare'],
      ['common', 'other'],
      ['common', 'another'],
    ]
    const idf = calculateInverseDocumentFrequency(docs)
    
    const commonIdf = idf.get('common') || 0
    const rareIdf = idf.get('rare') || 0
    
    expect(rareIdf).toBeGreaterThan(commonIdf)
  })
})

describe('calculateTfIdf', () => {
  it('should calculate TF-IDF scores', () => {
    const tokens = ['apple', 'apple', 'banana']
    const idf = new Map([
      ['apple', 0.5],
      ['banana', 1.0],
    ])
    
    const tfIdf = calculateTfIdf(tokens, idf)
    
    // TF for apple = 2/3, IDF = 0.5, TF-IDF = 1/3
    expect(tfIdf.get('apple')).toBeCloseTo(2/3 * 0.5)
    
    // TF for banana = 1/3, IDF = 1.0, TF-IDF = 1/3
    expect(tfIdf.get('banana')).toBeCloseTo(1/3 * 1.0)
  })
})

describe('extractKeywords', () => {
  it('should extract keywords from text', () => {
    const text = 'Force Majeure clause defines extraordinary events'
    const allTexts = [
      text,
      'Payment terms are important',
      'Termination clause is necessary',
    ]
    
    const keywords = extractKeywords(text, allTexts, 3)
    
    expect(keywords.length).toBeGreaterThan(0)
    expect(keywords.length).toBeLessThanOrEqual(3)
    expect(keywords[0]).toHaveProperty('term')
    expect(keywords[0]).toHaveProperty('score')
    expect(keywords[0]).toHaveProperty('frequency')
  })

  it('should return keywords sorted by score', () => {
    const text = 'Force Majeure Force Majeure clause defines extraordinary events'
    const allTexts = [text, 'Other document with different terms']
    
    const keywords = extractKeywords(text, allTexts, 5)
    
    // Verify sorted by score descending
    for (let i = 1; i < keywords.length; i++) {
      expect(keywords[i-1].score).toBeGreaterThanOrEqual(keywords[i].score)
    }
  })

  it('should respect maxKeywords parameter', () => {
    const text = 'Force Majeure clause defines extraordinary events and circumstances'
    const allTexts = [text, 'Other text']
    
    const keywords = extractKeywords(text, allTexts, 2)
    expect(keywords.length).toBeLessThanOrEqual(2)
  })
})

describe('extractAggregatedKeywords', () => {
  it('should extract keywords from multiple texts', () => {
    const texts = [
      'Force Majeure clause defines extraordinary events',
      'Force Majeure events include natural disasters',
      'Payment clause specifies terms',
    ]
    
    const keywords = extractAggregatedKeywords(texts, 5)
    
    expect(keywords.length).toBeGreaterThan(0)
    expect(keywords.length).toBeLessThanOrEqual(5)
    
    // Should extract meaningful keywords
    expect(keywords[0]).toHaveProperty('term')
    expect(keywords[0]).toHaveProperty('score')
  })
})

describe('generateTopicFromKeywords', () => {
  it('should generate topic from keywords', () => {
    const keywords: Keyword[] = [
      { term: 'force', score: 1.5, frequency: 3 },
      { term: 'majeure', score: 1.5, frequency: 3 },
      { term: 'clause', score: 1.0, frequency: 2 },
    ]
    
    const topic = generateTopicFromKeywords(keywords, 2)
    expect(topic).toBe('Force / Majeure')
  })

  it('should capitalize keywords', () => {
    const keywords: Keyword[] = [
      { term: 'payment', score: 1.5, frequency: 3 },
      { term: 'terms', score: 1.0, frequency: 2 },
    ]
    
    const topic = generateTopicFromKeywords(keywords, 2)
    expect(topic).toBe('Payment / Terms')
  })

  it('should handle hyphenated terms', () => {
    const keywords: Keyword[] = [
      { term: 'force-majeure', score: 2.0, frequency: 4 },
    ]
    
    const topic = generateTopicFromKeywords(keywords, 1)
    expect(topic).toBe('Force Majeure')
  })

  it('should return "Unassigned" for empty keywords', () => {
    const topic = generateTopicFromKeywords([])
    expect(topic).toBe('Unassigned')
  })

  it('should respect maxTerms parameter', () => {
    const keywords: Keyword[] = [
      { term: 'first', score: 3.0, frequency: 3 },
      { term: 'second', score: 2.0, frequency: 2 },
      { term: 'third', score: 1.0, frequency: 1 },
      { term: 'fourth', score: 0.5, frequency: 1 },
    ]
    
    const topic = generateTopicFromKeywords(keywords, 2)
    expect(topic).toBe('First / Second')
  })
})
