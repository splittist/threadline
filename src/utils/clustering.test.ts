/**
 * Tests for clustering algorithm
 */

import { describe, it, expect } from 'vitest'
import { clusterChanges, clusterByDocument, applyBucketsToChanges } from './clustering'
import type { Change } from '../types/dataModel'

// Helper to create a test change
function createChange(
  id: string,
  docId: string,
  clausePath: string[],
  text: string
): Change {
  return {
    changeId: id,
    docId,
    type: 'insertion',
    author: 'Test Author',
    timestamp: new Date().toISOString(),
    clausePath,
    textBefore: 'context before',
    changedText: text,
    textAfter: 'context after',
    threadId: null,
    suggestedThread: null,
  }
}

describe('clusterChanges', () => {
  it('should cluster changes with identical clause paths', () => {
    const changes: Change[] = [
      createChange('c1', 'doc1', ['8', 'Termination'], 'Force Majeure clause'),
      createChange('c2', 'doc1', ['8', 'Termination'], 'Added force majeure event'),
      createChange('c3', 'doc1', ['5', 'Payment'], 'Payment terms modified'),
    ]
    
    const result = clusterChanges(changes)
    
    // Should create at least 2 buckets (one for Termination, one for Payment)
    expect(result.buckets.length).toBeGreaterThanOrEqual(2)
    
    // All changes should be assigned
    expect(result.assignedChangeIds.length).toBeGreaterThan(0)
    
    // Stats should be calculated
    expect(result.stats.totalChanges).toBe(3)
    expect(result.stats.totalBuckets).toBeGreaterThanOrEqual(2)
  })

  it('should cluster changes with similar clause paths', () => {
    const changes: Change[] = [
      createChange('c1', 'doc1', ['8', 'Termination', '8.1'], 'text'),
      createChange('c2', 'doc1', ['8', 'Termination', '8.2'], 'text'),
      createChange('c3', 'doc1', ['8', 'Terminations', '8.3'], 'text'),
    ]
    
    const result = clusterChanges(changes, {
      clauseSimilarityThreshold: 0.7,
    })
    
    // Should cluster similar paths together
    expect(result.buckets.length).toBeGreaterThan(0)
    expect(result.buckets.length).toBeLessThanOrEqual(2)
  })

  it('should respect maxBuckets parameter', () => {
    const changes: Change[] = []
    
    // Create 20 changes with different clause paths
    for (let i = 0; i < 20; i++) {
      changes.push(
        createChange(`c${i}`, 'doc1', [`${i}`, `Section ${i}`], `Change ${i}`)
      )
    }
    
    const result = clusterChanges(changes, {
      maxBuckets: 10,
    })
    
    // Should not exceed maxBuckets
    expect(result.buckets.length).toBeLessThanOrEqual(10)
  })

  it('should respect minChangesPerBucket parameter', () => {
    const changes: Change[] = [
      createChange('c1', 'doc1', ['8', 'Termination'], 'text'),
      createChange('c2', 'doc1', ['5', 'Payment'], 'text'),
      createChange('c3', 'doc1', ['5', 'Payment'], 'text'),
      createChange('c4', 'doc1', ['5', 'Payment'], 'text'),
    ]
    
    const result = clusterChanges(changes, {
      minChangesPerBucket: 2,
    })
    
    // Should only have bucket for Payment (3 changes)
    // Termination (1 change) should be excluded
    expect(result.buckets.length).toBe(1)
    expect(result.buckets[0].changeIds.length).toBe(3)
  })

  it('should generate suggested topics from keywords', () => {
    const changes: Change[] = [
      createChange('c1', 'doc1', ['8', 'Termination'], 'Force Majeure event occurs'),
      createChange('c2', 'doc1', ['8', 'Termination'], 'Force Majeure definition changed'),
    ]
    
    const result = clusterChanges(changes)
    
    expect(result.buckets.length).toBeGreaterThan(0)
    expect(result.buckets[0].suggestedTopic).toBeTruthy()
    expect(result.buckets[0].suggestedTopic).not.toBe('Unassigned')
  })

  it('should calculate confidence scores', () => {
    const changes: Change[] = [
      createChange('c1', 'doc1', ['8', 'Termination'], 'Force Majeure'),
      createChange('c2', 'doc1', ['8', 'Termination'], 'Force Majeure'),
    ]
    
    const result = clusterChanges(changes)
    
    expect(result.buckets.length).toBeGreaterThan(0)
    expect(result.buckets[0].confidence).toBeGreaterThan(0)
    expect(result.buckets[0].confidence).toBeLessThanOrEqual(1)
  })

  it('should extract keywords for each bucket', () => {
    const changes: Change[] = [
      createChange('c1', 'doc1', ['8'], 'Force Majeure clause modified'),
      createChange('c2', 'doc1', ['8'], 'Force Majeure events listed'),
    ]
    
    const result = clusterChanges(changes, {
      maxKeywordsPerBucket: 3,
    })
    
    expect(result.buckets.length).toBeGreaterThan(0)
    expect(result.buckets[0].keywords).toBeInstanceOf(Array)
    expect(result.buckets[0].keywords.length).toBeGreaterThan(0)
    expect(result.buckets[0].keywords.length).toBeLessThanOrEqual(3)
  })

  it('should handle empty changes array', () => {
    const result = clusterChanges([])
    
    expect(result.buckets).toEqual([])
    expect(result.assignedChangeIds).toEqual([])
    expect(result.unassignedChangeIds).toEqual([])
    expect(result.stats.totalChanges).toBe(0)
    expect(result.stats.totalBuckets).toBe(0)
  })

  it('should calculate correct statistics', () => {
    const changes: Change[] = [
      createChange('c1', 'doc1', ['8', 'Termination'], 'text'),
      createChange('c2', 'doc1', ['8', 'Termination'], 'text'),
      createChange('c3', 'doc1', ['5', 'Payment'], 'text'),
      createChange('c4', 'doc1', ['5', 'Payment'], 'text'),
    ]
    
    const result = clusterChanges(changes)
    
    expect(result.stats.totalChanges).toBe(4)
    expect(result.stats.totalBuckets).toBeGreaterThan(0)
    expect(result.stats.averageChangesPerBucket).toBeGreaterThan(0)
    expect(result.stats.averageConfidence).toBeGreaterThan(0)
    expect(result.stats.averageConfidence).toBeLessThanOrEqual(1)
  })

  it('should identify unassigned changes', () => {
    const changes: Change[] = [
      createChange('c1', 'doc1', ['8', 'Termination'], 'text'),
      createChange('c2', 'doc1', ['8', 'Termination'], 'text'),
      createChange('c3', 'doc1', ['8', 'Termination'], 'text'),
      createChange('c4', 'doc1', ['5', 'Payment'], 'text'),
    ]
    
    const result = clusterChanges(changes, {
      minChangesPerBucket: 2,
    })
    
    // Payment with only 1 change should be unassigned
    expect(result.unassignedChangeIds).toContain('c4')
  })
})

describe('clusterByDocument', () => {
  it('should create one bucket per document', () => {
    const changes: Change[] = [
      createChange('c1', 'doc1', ['8'], 'text'),
      createChange('c2', 'doc1', ['8'], 'text'),
      createChange('c3', 'doc2', ['5'], 'text'),
      createChange('c4', 'doc2', ['5'], 'text'),
    ]
    
    const buckets = clusterByDocument(changes)
    
    expect(buckets.length).toBe(2)
    
    // Each bucket should contain changes from one document
    buckets.forEach(bucket => {
      const changeIds = new Set(bucket.changeIds)
      const docIds = new Set(
        changes
          .filter(c => changeIds.has(c.changeId))
          .map(c => c.docId)
      )
      expect(docIds.size).toBe(1)
    })
  })

  it('should generate topics based on document content', () => {
    const changes: Change[] = [
      createChange('c1', 'doc1', ['8'], 'Payment terms'),
      createChange('c2', 'doc1', ['8'], 'Payment schedule'),
    ]
    
    const buckets = clusterByDocument(changes)
    
    expect(buckets.length).toBe(1)
    expect(buckets[0].suggestedTopic).toBeTruthy()
    expect(buckets[0].method).toBe('document')
  })

  it('should handle empty changes array', () => {
    const buckets = clusterByDocument([])
    expect(buckets).toEqual([])
  })
})

describe('applyBucketsToChanges', () => {
  it('should update changes with suggested topics', () => {
    const changes: Change[] = [
      createChange('c1', 'doc1', ['8'], 'text'),
      createChange('c2', 'doc1', ['8'], 'text'),
    ]
    
    const result = clusterChanges(changes)
    const updatedChanges = applyBucketsToChanges(changes, result.buckets)
    
    // At least one change should have a suggested topic
    const withSuggestions = updatedChanges.filter(c => c.suggestedThread !== null)
    expect(withSuggestions.length).toBeGreaterThan(0)
  })

  it('should not modify threadId', () => {
    const changes: Change[] = [
      createChange('c1', 'doc1', ['8'], 'text'),
    ]
    
    const result = clusterChanges(changes)
    const updatedChanges = applyBucketsToChanges(changes, result.buckets)
    
    // threadId should remain null
    updatedChanges.forEach(change => {
      expect(change.threadId).toBeNull()
    })
  })

  it('should handle changes not in any bucket', () => {
    const changes: Change[] = [
      createChange('c1', 'doc1', ['8'], 'text'),
      createChange('c2', 'doc1', ['5'], 'text'),
    ]
    
    const result = clusterChanges(changes, {
      minChangesPerBucket: 5, // Forces some changes to be unassigned
    })
    
    const updatedChanges = applyBucketsToChanges(changes, result.buckets)
    
    // Some changes should have no suggested thread
    const withoutSuggestions = updatedChanges.filter(c => c.suggestedThread === null)
    expect(withoutSuggestions.length).toBeGreaterThan(0)
  })
})
