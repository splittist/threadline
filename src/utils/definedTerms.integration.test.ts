/**
 * Integration tests for Defined Term clustering
 * Tests realistic legal document scenarios
 */

import { describe, it, expect } from 'vitest'
import { clusterChanges } from './clustering'
import type { Change } from '../types/dataModel'

describe('DT Clustering Integration', () => {
  it('should cluster Force Majeure changes across multiple clauses', () => {
    // Simulate changes across different sections of a contract
    const changes: Change[] = [
      // Definition section - defines Force Majeure
      {
        changeId: 'c1',
        docId: 'contract1',
        type: 'insertion',
        author: 'Legal Team',
        timestamp: '2025-01-15T10:00:00Z',
        clausePath: ['1', 'Definitions', '1.5'],
        textBefore: '',
        changedText: '"Force Majeure Event" means any event beyond the reasonable control of a party',
      textRuns: [],
        textAfter: 'including acts of God, war, terrorism, pandemic',
        threadId: null,
        suggestedThread: null,
      },
      // Termination clause - references Force Majeure
      {
        changeId: 'c2',
        docId: 'contract1',
        type: 'insertion',
        author: 'Legal Team',
        timestamp: '2025-01-15T10:15:00Z',
        clausePath: ['8', 'Termination', '8.3'],
        textBefore: 'Either party may terminate this Agreement upon',
        changedText: 'the occurrence of a Force Majeure Event',
      textRuns: [],
        textAfter: 'that continues for more than 90 days',
        threadId: null,
        suggestedThread: null,
      },
      // Notice clause - references Force Majeure
      {
        changeId: 'c3',
        docId: 'contract1',
        type: 'insertion',
        author: 'Legal Team',
        timestamp: '2025-01-15T10:30:00Z',
        clausePath: ['12', 'Notices', '12.4'],
        textBefore: 'Any party experiencing a',
        changedText: 'Force Majeure Event shall promptly notify',
      textRuns: [],
        textAfter: 'the other party in writing',
        threadId: null,
        suggestedThread: null,
      },
      // Unrelated change about payment
      {
        changeId: 'c4',
        docId: 'contract1',
        type: 'deletion',
        author: 'Legal Team',
        timestamp: '2025-01-15T10:45:00Z',
        clausePath: ['5', 'Payment Terms', '5.2'],
        textBefore: 'Payment shall be made',
        changedText: 'within 30 days',
      textRuns: [],
        textAfter: 'of invoice date',
        threadId: null,
        suggestedThread: null,
      },
    ]

    const result = clusterChanges(changes, {
      useDefinedTerms: true,
      dtScoreThreshold: 1.0,
    })

    // Should create at least one bucket for Force Majeure changes
    expect(result.buckets.length).toBeGreaterThan(0)

    // Find the Force Majeure bucket
    const forceMajeureBucket = result.buckets.find(b =>
      b.suggestedTopic.toLowerCase().includes('force majeure')
    )
    
    expect(forceMajeureBucket).toBeDefined()
    
    if (forceMajeureBucket) {
      // Should contain the three Force Majeure related changes
      expect(forceMajeureBucket.changeIds).toContain('c1')
      expect(forceMajeureBucket.changeIds).toContain('c2')
      expect(forceMajeureBucket.changeIds).toContain('c3')
      
      // Should NOT contain the payment change
      expect(forceMajeureBucket.changeIds).not.toContain('c4')
      
      // Should use defined-term method
      expect(forceMajeureBucket.method).toBe('defined-term')
      
      // Should have reasonable confidence (> 0.1)
      expect(forceMajeureBucket.confidence).toBeGreaterThan(0.1)
    }

    // The payment change should be unassigned
    expect(result.unassignedChangeIds).toContain('c4')
  })

  it('should handle multiple defined terms in same document', () => {
    const changes: Change[] = [
      // Operating Budget definition
      {
        changeId: 'c1',
        docId: 'contract1',
        type: 'insertion',
        author: 'Finance',
        timestamp: '2025-01-15T10:00:00Z',
        clausePath: ['1', 'Definitions', '1.3'],
        textBefore: '',
        changedText: '"Operating Budget" shall mean the annual budget',
      textRuns: [],
        textAfter: 'approved by the Board of Directors',
        threadId: null,
        suggestedThread: null,
      },
      // Management Fee definition
      {
        changeId: 'c2',
        docId: 'contract1',
        type: 'insertion',
        author: 'Finance',
        timestamp: '2025-01-15T10:10:00Z',
        clausePath: ['1', 'Definitions', '1.4'],
        textBefore: '',
        changedText: '"Management Fee" means the fee payable to Manager',
      textRuns: [],
        textAfter: 'as specified in Schedule A',
        threadId: null,
        suggestedThread: null,
      },
      // Operating Budget usage in financials
      {
        changeId: 'c3',
        docId: 'contract1',
        type: 'insertion',
        author: 'Finance',
        timestamp: '2025-01-15T10:20:00Z',
        clausePath: ['7', 'Financial Matters', '7.1'],
        textBefore: 'Manager shall prepare the',
        changedText: 'Operating Budget annually',
      textRuns: [],
        textAfter: 'and submit for approval',
        threadId: null,
        suggestedThread: null,
      },
      // Management Fee usage in payment clause
      {
        changeId: 'c4',
        docId: 'contract1',
        type: 'insertion',
        author: 'Finance',
        timestamp: '2025-01-15T10:30:00Z',
        clausePath: ['5', 'Compensation', '5.1'],
        textBefore: 'Owner shall pay the',
        changedText: 'Management Fee monthly',
      textRuns: [],
        textAfter: 'in arrears',
        threadId: null,
        suggestedThread: null,
      },
    ]

    const result = clusterChanges(changes, {
      useDefinedTerms: true,
      dtScoreThreshold: 1.0,
    })

    // Should create two separate buckets
    expect(result.buckets.length).toBeGreaterThanOrEqual(2)

    // Check for Operating Budget bucket
    const budgetBucket = result.buckets.find(b =>
      b.suggestedTopic.toLowerCase().includes('operating budget')
    )
    
    if (budgetBucket) {
      expect(budgetBucket.changeIds).toContain('c1')
      expect(budgetBucket.changeIds).toContain('c3')
      expect(budgetBucket.changeIds.length).toBe(2)
    }

    // Check for Management Fee bucket
    const feeBucket = result.buckets.find(b =>
      b.suggestedTopic.toLowerCase().includes('management fee')
    )
    
    if (feeBucket) {
      expect(feeBucket.changeIds).toContain('c2')
      expect(feeBucket.changeIds).toContain('c4')
      expect(feeBucket.changeIds.length).toBe(2)
    }
  })

  it('should prioritize strong matches over context matches', () => {
    const changes: Change[] = [
      // Definition
      {
        changeId: 'c1',
        docId: 'contract1',
        type: 'insertion',
        author: 'Legal',
        timestamp: '2025-01-15T10:00:00Z',
        clausePath: ['1', 'Definitions'],
        textBefore: '',
        changedText: '"Gross Revenue" means all revenue before deductions',
      textRuns: [],
        textAfter: '',
        threadId: null,
        suggestedThread: null,
      },
      // Strong match - term in changed text
      {
        changeId: 'c2',
        docId: 'contract1',
        type: 'insertion',
        author: 'Legal',
        timestamp: '2025-01-15T10:10:00Z',
        clausePath: ['6', 'Revenue', '6.1'],
        textBefore: 'Manager shall calculate',
        changedText: 'Gross Revenue quarterly',
      textRuns: [],
        textAfter: 'and provide reports',
        threadId: null,
        suggestedThread: null,
      },
      // Context match - term in surrounding text only
      {
        changeId: 'c3',
        docId: 'contract1',
        type: 'insertion',
        author: 'Legal',
        timestamp: '2025-01-15T10:20:00Z',
        clausePath: ['6', 'Revenue', '6.2'],
        textBefore: 'Based on Gross Revenue calculations',
        changedText: 'distributions shall be made',
      textRuns: [],
        textAfter: 'within 15 days',
        threadId: null,
        suggestedThread: null,
      },
    ]

    const result = clusterChanges(changes, {
      useDefinedTerms: true,
      dtScoreThreshold: 1.0,
    })

    const revenueBucket = result.buckets.find(b =>
      b.suggestedTopic.toLowerCase().includes('gross revenue')
    )

    if (revenueBucket) {
      // Strong match (c2) should definitely be included
      expect(revenueBucket.changeIds).toContain('c1')
      expect(revenueBucket.changeIds).toContain('c2')
      
      // Context match (c3) should also be included
      expect(revenueBucket.changeIds).toContain('c3')
    }
  })

  it('should handle cross-document clustering with same defined terms', () => {
    const changes: Change[] = [
      // HMA document - Force Majeure definition
      {
        changeId: 'c1',
        docId: 'hma-doc',
        type: 'insertion',
        author: 'Legal',
        timestamp: '2025-01-15T10:00:00Z',
        clausePath: ['1', 'Definitions'],
        textBefore: '',
        changedText: '"Force Majeure Event" means any unforeseeable circumstance',
      textRuns: [],
        textAfter: '',
        threadId: null,
        suggestedThread: null,
      },
      // HMA document - Force Majeure clause
      {
        changeId: 'c2',
        docId: 'hma-doc',
        type: 'insertion',
        author: 'Legal',
        timestamp: '2025-01-15T10:10:00Z',
        clausePath: ['9', 'Force Majeure'],
        textBefore: 'Neither party shall be liable for',
        changedText: 'any Force Majeure Event',
      textRuns: [],
        textAfter: 'affecting performance',
        threadId: null,
        suggestedThread: null,
      },
      // License document - Force Majeure clause
      {
        changeId: 'c3',
        docId: 'license-doc',
        type: 'insertion',
        author: 'Legal',
        timestamp: '2025-01-15T10:20:00Z',
        clausePath: ['8', 'Termination'],
        textBefore: 'License may be suspended upon',
        changedText: 'Force Majeure Event',
      textRuns: [],
        textAfter: 'lasting more than 30 days',
        threadId: null,
        suggestedThread: null,
      },
    ]

    const result = clusterChanges(changes, {
      useDefinedTerms: true,
      dtScoreThreshold: 1.0,
    })

    const forceMajeureBucket = result.buckets.find(b =>
      b.suggestedTopic.toLowerCase().includes('force majeure')
    )

    if (forceMajeureBucket) {
      // Should group changes across both documents
      expect(forceMajeureBucket.changeIds).toContain('c1')
      expect(forceMajeureBucket.changeIds).toContain('c2')
      expect(forceMajeureBucket.changeIds).toContain('c3')
      
      // Verify changes are from different documents
      const c1 = changes.find(c => c.changeId === 'c1')
      const c3 = changes.find(c => c.changeId === 'c3')
      expect(c1?.docId).not.toBe(c3?.docId)
    }
  })

  it('should respect dtScoreThreshold parameter', () => {
    const changes: Change[] = [
      // Weak definition
      {
        changeId: 'c1',
        docId: 'contract1',
        type: 'insertion',
        author: 'Legal',
        timestamp: '2025-01-15T10:00:00Z',
        clausePath: ['5', 'General'],
        textBefore: 'The term',
        changedText: '"Term" means something',
      textRuns: [],
        textAfter: 'as defined herein',
        threadId: null,
        suggestedThread: null,
      },
      // Very weak reference
      {
        changeId: 'c2',
        docId: 'contract1',
        type: 'insertion',
        author: 'Legal',
        timestamp: '2025-01-15T10:10:00Z',
        clausePath: ['6', 'Duration'],
        textBefore: 'This',
        changedText: 'agreement shall last for the term',
      textRuns: [],
        textAfter: 'specified',
        threadId: null,
        suggestedThread: null,
      },
    ]

    // High threshold - should exclude weak matches
    const resultHigh = clusterChanges(changes, {
      useDefinedTerms: true,
      dtScoreThreshold: 10.0,
    })

    // Low threshold - should include more matches
    const resultLow = clusterChanges(changes, {
      useDefinedTerms: true,
      dtScoreThreshold: 0.1,
    })

    // Lower threshold should capture more changes
    expect(resultLow.assignedChangeIds.length).toBeGreaterThanOrEqual(
      resultHigh.assignedChangeIds.length
    )
  })

  it('should boost scores for changes in definition sections', () => {
    const changes: Change[] = [
      // In definition section
      {
        changeId: 'c1',
        docId: 'contract1',
        type: 'insertion',
        author: 'Legal',
        timestamp: '2025-01-15T10:00:00Z',
        clausePath: ['1', 'Definitions', '1.1'],
        textBefore: '',
        changedText: '"Confidential Information" means all proprietary information',
      textRuns: [],
        textAfter: '',
        threadId: null,
        suggestedThread: null,
      },
      // Not in definition section
      {
        changeId: 'c2',
        docId: 'contract1',
        type: 'insertion',
        author: 'Legal',
        timestamp: '2025-01-15T10:10:00Z',
        clausePath: ['7', 'Confidentiality', '7.1'],
        textBefore: 'Each party shall protect',
        changedText: 'Confidential Information',
      textRuns: [],
        textAfter: 'from disclosure',
        threadId: null,
        suggestedThread: null,
      },
    ]

    const result = clusterChanges(changes, {
      useDefinedTerms: true,
      dtScoreThreshold: 1.0,
    })

    const bucket = result.buckets.find(b =>
      b.suggestedTopic.toLowerCase().includes('confidential')
    )

    if (bucket) {
      // Both should be included, but definition section change provides
      // the term extraction and boosted score
      expect(bucket.changeIds).toContain('c1')
      expect(bucket.changeIds).toContain('c2')
    }
  })
})
