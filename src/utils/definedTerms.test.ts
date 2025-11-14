/**
 * Tests for defined term extraction and scoring
 */

import { describe, it, expect } from 'vitest'
import {
  normalizeTerm,
  isCapitalizedTerm,
  extractFromDefinitions,
  extractCapitalizedTerms,
  extractQuotedTerms,
  isDefinitionsSection,
  extractDefinedTerms,
  deduplicateTerms,
  calculateDTStats,
  scoreChangeWithDT,
  scoreAllChanges,
  getPrimaryDT,
} from './definedTerms'
import type { Change } from '../types/dataModel'
import type { DefinedTerm } from '../types/clustering'

describe('normalizeTerm', () => {
  it('converts to lowercase', () => {
    expect(normalizeTerm('Force Majeure')).toBe('force majeure')
  })

  it('trims whitespace', () => {
    expect(normalizeTerm('  Force Majeure  ')).toBe('force majeure')
  })

  it('removes leading/trailing punctuation', () => {
    expect(normalizeTerm('"Force Majeure"')).toBe('force majeure')
    expect(normalizeTerm('(Force Majeure)')).toBe('force majeure')
  })

  it('collapses multiple spaces', () => {
    expect(normalizeTerm('Force   Majeure')).toBe('force majeure')
  })
})

describe('isCapitalizedTerm', () => {
  it('identifies multi-word capitalized terms', () => {
    expect(isCapitalizedTerm('Force Majeure Event')).toBe(true)
    expect(isCapitalizedTerm('Operating Budget')).toBe(true)
  })

  it('identifies single significant capitalized words', () => {
    expect(isCapitalizedTerm('Budget')).toBe(true)
    expect(isCapitalizedTerm('Termination')).toBe(true)
  })

  it('rejects non-capitalized terms', () => {
    expect(isCapitalizedTerm('force majeure')).toBe(false)
    expect(isCapitalizedTerm('the agreement')).toBe(false)
  })

  it('rejects short single words', () => {
    expect(isCapitalizedTerm('A')).toBe(false)
    expect(isCapitalizedTerm('In')).toBe(false)
  })

  it('rejects all-caps acronyms', () => {
    expect(isCapitalizedTerm('USA')).toBe(false)
    expect(isCapitalizedTerm('LLC')).toBe(false)
  })

  it('rejects empty or null strings', () => {
    expect(isCapitalizedTerm('')).toBe(false)
  })
})

describe('extractFromDefinitions', () => {
  it('extracts terms with "means"', () => {
    const text = '"Force Majeure Event" means any event beyond the control of the parties.'
    const terms = extractFromDefinitions(text, 'doc1')
    
    expect(terms).toHaveLength(1)
    expect(terms[0].term).toBe('force majeure event')
    expect(terms[0].source).toBe('definitions-section')
    expect(terms[0].confidence).toBeGreaterThan(0.9)
  })

  it('extracts terms with "shall mean"', () => {
    const text = '"Operating Budget" shall mean the annual budget approved by the Board.'
    const terms = extractFromDefinitions(text, 'doc1')
    
    expect(terms).toHaveLength(1)
    expect(terms[0].term).toBe('operating budget')
  })

  it('extracts terms with "refers to"', () => {
    const text = '"Gross Revenue" refers to all revenue before deductions.'
    const terms = extractFromDefinitions(text, 'doc1')
    
    expect(terms).toHaveLength(1)
    expect(terms[0].term).toBe('gross revenue')
  })

  it('extracts terms from (the "Term") pattern', () => {
    const text = 'The management fee (the "Management Fee") shall be calculated monthly.'
    const terms = extractFromDefinitions(text, 'doc1')
    
    expect(terms).toHaveLength(1)
    expect(terms[0].term).toBe('management fee')
  })

  it('extracts terms from (collectively, "Term") pattern', () => {
    const text = 'The buyer and seller (collectively, "Parties") agree to the terms.'
    const terms = extractFromDefinitions(text, 'doc1')
    
    expect(terms).toHaveLength(1)
    expect(terms[0].term).toBe('parties')
  })

  it('extracts multiple terms from text', () => {
    const text = `
      "Force Majeure Event" means any event beyond control.
      "Operating Budget" shall mean the annual budget.
      "Gross Revenue" refers to all revenue.
    `
    const terms = extractFromDefinitions(text, 'doc1')
    
    expect(terms.length).toBeGreaterThanOrEqual(3)
  })
})

describe('extractCapitalizedTerms', () => {
  it('extracts multi-word capitalized terms', () => {
    const text = 'The Force Majeure Event clause requires immediate notification.'
    const terms = extractCapitalizedTerms(text, 'doc1')
    
    const termStrings = terms.map(t => t.term)
    expect(termStrings).toContain('force majeure event')
  })

  it('filters out common legal terms', () => {
    const text = 'The Buyer and Seller agree to the terms of this Agreement.'
    const terms = extractCapitalizedTerms(text, 'doc1')
    
    const termStrings = terms.map(t => t.term)
    expect(termStrings).not.toContain('buyer')
    expect(termStrings).not.toContain('seller')
    expect(termStrings).not.toContain('agreement')
  })

  it('extracts multiple capitalized terms', () => {
    const text = 'The Operating Budget and Management Fee must be approved by the Board Members.'
    const terms = extractCapitalizedTerms(text, 'doc1')
    
    expect(terms.length).toBeGreaterThan(0)
    const termStrings = terms.map(t => t.term)
    expect(termStrings).toContain('operating budget')
    expect(termStrings).toContain('management fee')
  })

  it('sets medium confidence for capitalized terms', () => {
    const text = 'The Force Majeure Event clause applies.'
    const terms = extractCapitalizedTerms(text, 'doc1')
    
    expect(terms[0].confidence).toBeGreaterThan(0.5)
    expect(terms[0].confidence).toBeLessThan(0.9)
  })
})

describe('extractQuotedTerms', () => {
  it('extracts terms from (the "Term") pattern', () => {
    const text = 'The management fee (the "Management Fee") shall be paid monthly.'
    const terms = extractQuotedTerms(text, 'doc1')
    
    expect(terms).toHaveLength(1)
    expect(terms[0].term).toBe('management fee')
    expect(terms[0].source).toBe('quoted-introduction')
  })

  it('extracts terms from (collectively, "Term") pattern', () => {
    const text = 'The parties (collectively, "Parties") agree.'
    const terms = extractQuotedTerms(text, 'doc1')
    
    expect(terms).toHaveLength(1)
    expect(terms[0].term).toBe('parties')
  })

  it('handles multiple quoted terms', () => {
    const text = 'The fee (the "Fee") and the budget (the "Budget") must be approved.'
    const terms = extractQuotedTerms(text, 'doc1')
    
    expect(terms).toHaveLength(2)
  })
})

describe('isDefinitionsSection', () => {
  it('identifies definition sections', () => {
    expect(isDefinitionsSection(['1', 'Definitions'])).toBe(true)
    expect(isDefinitionsSection(['2', 'Interpretation'])).toBe(true)
    expect(isDefinitionsSection(['1', 'Definitions and Interpretation'])).toBe(true)
  })

  it('identifies section 1 as likely definitions', () => {
    expect(isDefinitionsSection(['1', 'General'])).toBe(true)
  })

  it('rejects non-definition sections', () => {
    expect(isDefinitionsSection(['8', 'Termination'])).toBe(false)
    expect(isDefinitionsSection(['5', 'Payment Terms'])).toBe(false)
  })
})

describe('deduplicateTerms', () => {
  it('removes duplicate terms keeping highest confidence', () => {
    const terms: DefinedTerm[] = [
      {
        term: 'force majeure',
        originalForm: 'Force Majeure',
        source: 'capitalized-span',
        docId: 'doc1',
        confidence: 0.6,
      },
      {
        term: 'force majeure',
        originalForm: 'Force Majeure',
        source: 'definitions-section',
        docId: 'doc1',
        confidence: 0.95,
      },
    ]
    
    const deduped = deduplicateTerms(terms)
    
    expect(deduped).toHaveLength(1)
    expect(deduped[0].confidence).toBe(0.95)
    expect(deduped[0].source).toBe('definitions-section')
  })

  it('preserves unique terms', () => {
    const terms: DefinedTerm[] = [
      {
        term: 'force majeure',
        originalForm: 'Force Majeure',
        source: 'definitions-section',
        docId: 'doc1',
        confidence: 0.95,
      },
      {
        term: 'operating budget',
        originalForm: 'Operating Budget',
        source: 'definitions-section',
        docId: 'doc1',
        confidence: 0.95,
      },
    ]
    
    const deduped = deduplicateTerms(terms)
    
    expect(deduped).toHaveLength(2)
  })
})

describe('calculateDTStats', () => {
  it('calculates document frequency correctly', () => {
    const terms: DefinedTerm[] = [
      {
        term: 'force majeure',
        originalForm: 'Force Majeure',
        source: 'definitions-section',
        docId: 'doc1',
        confidence: 0.95,
      },
    ]
    
    const contexts = [
      'Force Majeure Event occurred',
      'Force Majeure applies',
      'Other clause without the term',
    ]
    
    const stats = calculateDTStats(terms, contexts)
    
    expect(stats.has('force majeure')).toBe(true)
    const stat = stats.get('force majeure')!
    expect(stat.df).toBe(2) // Appears in 2 contexts
    expect(stat.idf).toBeGreaterThan(0)
  })

  it('assigns higher IDF to rare terms', () => {
    const terms: DefinedTerm[] = [
      {
        term: 'common term',
        originalForm: 'Common Term',
        source: 'definitions-section',
        docId: 'doc1',
        confidence: 0.95,
      },
      {
        term: 'rare term',
        originalForm: 'Rare Term',
        source: 'definitions-section',
        docId: 'doc1',
        confidence: 0.95,
      },
    ]
    
    const contexts = [
      'common term appears here',
      'common term appears again',
      'common term once more',
      'rare term appears once',
    ]
    
    const stats = calculateDTStats(terms, contexts)
    
    const commonStat = stats.get('common term')!
    const rareStat = stats.get('rare term')!
    
    expect(rareStat.idf).toBeGreaterThan(commonStat.idf)
  })
})

describe('scoreChangeWithDT', () => {
  const definedTerms: DefinedTerm[] = [
    {
      term: 'force majeure',
      originalForm: 'Force Majeure',
      source: 'definitions-section',
      docId: 'doc1',
      confidence: 0.95,
    },
  ]
  
  const dtStats = new Map([
    ['force majeure', { term: 'force majeure', df: 2, idf: 1.5 }],
  ])

  it('assigns strong match for term in changed text', () => {
    const change: Change = {
      changeId: 'chg1',
      docId: 'doc1',
      type: 'insertion',
      author: 'Author',
      timestamp: '2025-01-01T00:00:00Z',
      clausePath: ['8', 'Termination'],
      textBefore: 'In case of',
      changedText: 'Force Majeure Event',
      textRuns: [],
      textAfter: ', the contract may be terminated.',
      threadId: null,
      suggestedThread: null,
    }
    
    const { dtMatches, dtScore } = scoreChangeWithDT(change, definedTerms, dtStats)
    
    expect(dtMatches).toHaveLength(1)
    expect(dtMatches[0].kind).toBe('strong')
    expect(dtScore).toBeGreaterThan(0)
  })

  it('assigns context match for term in before/after text', () => {
    const change: Change = {
      changeId: 'chg1',
      docId: 'doc1',
      type: 'insertion',
      author: 'Author',
      timestamp: '2025-01-01T00:00:00Z',
      clausePath: ['8', 'Termination'],
      textBefore: 'In case of Force Majeure',
      changedText: 'event',
      textRuns: [],
      textAfter: ', the contract terminates.',
      threadId: null,
      suggestedThread: null,
    }
    
    const { dtMatches, dtScore } = scoreChangeWithDT(change, definedTerms, dtStats)
    
    expect(dtMatches).toHaveLength(1)
    expect(dtMatches[0].kind).toBe('context')
    expect(dtScore).toBeGreaterThan(0)
  })

  it('boosts score for changes in definition sections', () => {
    const changeInDef: Change = {
      changeId: 'chg1',
      docId: 'doc1',
      type: 'insertion',
      author: 'Author',
      timestamp: '2025-01-01T00:00:00Z',
      clausePath: ['1', 'Definitions'],
      textBefore: '',
      changedText: 'Force Majeure means',
      textRuns: [],
      textAfter: 'an event beyond control',
      threadId: null,
      suggestedThread: null,
    }
    
    const changeNotInDef: Change = {
      ...changeInDef,
      clausePath: ['8', 'Termination'],
    }
    
    const resultInDef = scoreChangeWithDT(changeInDef, definedTerms, dtStats)
    const resultNotInDef = scoreChangeWithDT(changeNotInDef, definedTerms, dtStats)
    
    expect(resultInDef.dtScore).toBeGreaterThan(resultNotInDef.dtScore)
  })

  it('returns empty matches when no terms found', () => {
    const change: Change = {
      changeId: 'chg1',
      docId: 'doc1',
      type: 'insertion',
      author: 'Author',
      timestamp: '2025-01-01T00:00:00Z',
      clausePath: ['5', 'Payment'],
      textBefore: 'The payment',
      changedText: 'shall be made',
      textRuns: [],
      textAfter: 'within 30 days.',
      threadId: null,
      suggestedThread: null,
    }
    
    const { dtMatches, dtScore } = scoreChangeWithDT(change, definedTerms, dtStats)
    
    expect(dtMatches).toHaveLength(0)
    expect(dtScore).toBe(0)
  })
})

describe('scoreAllChanges', () => {
  it('scores multiple changes', () => {
    const definedTerms: DefinedTerm[] = [
      {
        term: 'force majeure',
        originalForm: 'Force Majeure',
        source: 'definitions-section',
        docId: 'doc1',
        confidence: 0.95,
      },
    ]
    
    const dtStats = new Map([
      ['force majeure', { term: 'force majeure', df: 2, idf: 1.5 }],
    ])
    
    const changes: Change[] = [
      {
        changeId: 'chg1',
        docId: 'doc1',
        type: 'insertion',
        author: 'Author',
        timestamp: '2025-01-01T00:00:00Z',
        clausePath: ['8', 'Termination'],
        textBefore: 'In case of',
        changedText: 'Force Majeure Event',
      textRuns: [],
        textAfter: ', the contract terminates.',
        threadId: null,
        suggestedThread: null,
      },
      {
        changeId: 'chg2',
        docId: 'doc1',
        type: 'deletion',
        author: 'Author',
        timestamp: '2025-01-01T00:00:00Z',
        clausePath: ['5', 'Payment'],
        textBefore: 'The payment',
        changedText: 'shall be made',
      textRuns: [],
        textAfter: 'within 30 days.',
        threadId: null,
        suggestedThread: null,
      },
    ]
    
    const scored = scoreAllChanges(changes, definedTerms, dtStats)
    
    expect(scored).toHaveLength(2)
    expect(scored[0].dtScore).toBeGreaterThan(0)
    expect(scored[0].dtMatches).toBeDefined()
    expect(scored[1].dtScore).toBe(0)
  })
})

describe('getPrimaryDT', () => {
  it('returns the highest-weighted term', () => {
    const change: Change = {
      changeId: 'chg1',
      docId: 'doc1',
      type: 'insertion',
      author: 'Author',
      timestamp: '2025-01-01T00:00:00Z',
      clausePath: ['8', 'Termination'],
      textBefore: '',
      changedText: '',
      textRuns: [],
      textAfter: '',
      threadId: null,
      suggestedThread: null,
      dtMatches: [
        { term: 'force majeure', weight: 5.0, kind: 'strong' },
        { term: 'termination', weight: 2.0, kind: 'context' },
      ],
      dtScore: 7.0,
    }
    
    const primary = getPrimaryDT(change)
    
    expect(primary).toBe('force majeure')
  })

  it('returns null when no matches', () => {
    const change: Change = {
      changeId: 'chg1',
      docId: 'doc1',
      type: 'insertion',
      author: 'Author',
      timestamp: '2025-01-01T00:00:00Z',
      clausePath: ['8', 'Termination'],
      textBefore: '',
      changedText: '',
      textRuns: [],
      textAfter: '',
      threadId: null,
      suggestedThread: null,
      dtMatches: [],
      dtScore: 0,
    }
    
    const primary = getPrimaryDT(change)
    
    expect(primary).toBe(null)
  })

  it('returns null when dtMatches is undefined', () => {
    const change: Change = {
      changeId: 'chg1',
      docId: 'doc1',
      type: 'insertion',
      author: 'Author',
      timestamp: '2025-01-01T00:00:00Z',
      clausePath: ['8', 'Termination'],
      textBefore: '',
      changedText: '',
      textRuns: [],
      textAfter: '',
      threadId: null,
      suggestedThread: null,
    }
    
    const primary = getPrimaryDT(change)
    
    expect(primary).toBe(null)
  })
})

describe('extractDefinedTerms', () => {
  it('extracts terms from mixed content', () => {
    const text = `
      "Force Majeure Event" means any event beyond control.
      The Operating Budget must be approved annually.
      The management fee (the "Management Fee") is calculated monthly.
    `
    
    const terms = extractDefinedTerms(text, 'doc1')
    
    expect(terms.length).toBeGreaterThan(2)
    const termStrings = terms.map(t => t.term)
    expect(termStrings).toContain('force majeure event')
    expect(termStrings).toContain('management fee')
  })

  it('boosts confidence for terms in definition sections', () => {
    const text = '"Force Majeure" means any event beyond control.'
    
    const termsInDef = extractDefinedTerms(text, 'doc1', ['1', 'Definitions'])
    const termsNotInDef = extractDefinedTerms(text, 'doc1', ['8', 'Termination'])
    
    expect(termsInDef[0].confidence).toBeGreaterThan(termsNotInDef[0].confidence)
  })
})
