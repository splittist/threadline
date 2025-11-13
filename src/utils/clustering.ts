/**
 * Clustering algorithm for grouping tracked changes
 * Implements Phase 2.1: Heuristic Clustering
 */

import type { Change } from '../types/dataModel'
import type { 
  Bucket, 
  ClusteringParams, 
  ClusteringResult,
} from '../types/clustering'
import { areClausePathsSimilar, normalizeClausePath } from './stringSimilarity'
import { extractAggregatedKeywords, generateTopicFromKeywords } from './keywordExtraction'

/**
 * Default clustering parameters
 */
const DEFAULT_PARAMS: Required<ClusteringParams> = {
  maxBuckets: 15,
  clauseSimilarityThreshold: 0.7,
  minChangesPerBucket: 1,
  maxKeywordsPerBucket: 5,
}

/**
 * Group changes by exact clause path
 * First pass: exact matches
 */
function groupByExactClausePath(changes: Change[]): Map<string, Change[]> {
  const groups = new Map<string, Change[]>()
  
  changes.forEach(change => {
    const key = normalizeClausePath(change.clausePath)
    const group = groups.get(key) || []
    group.push(change)
    groups.set(key, group)
  })
  
  return groups
}

/**
 * Merge similar clause path groups
 * Second pass: merge groups with similar clause paths
 */
function mergeSimilarGroups(
  groups: Map<string, Change[]>,
  threshold: number
): Map<string, Change[]> {
  const groupKeys = Array.from(groups.keys())
  const merged = new Map<string, Change[]>()
  const processed = new Set<string>()
  
  groupKeys.forEach(key1 => {
    if (processed.has(key1)) return
    
    // Get the clause path for this key
    const changes1 = groups.get(key1) || []
    if (changes1.length === 0) return
    
    const path1 = changes1[0].clausePath
    const mergedGroup = [...changes1]
    processed.add(key1)
    
    // Find similar groups to merge
    groupKeys.forEach(key2 => {
      if (key1 === key2 || processed.has(key2)) return
      
      const changes2 = groups.get(key2) || []
      if (changes2.length === 0) return
      
      const path2 = changes2[0].clausePath
      
      // Check if paths are similar
      if (areClausePathsSimilar(path1, path2, threshold)) {
        mergedGroup.push(...changes2)
        processed.add(key2)
      }
    })
    
    merged.set(key1, mergedGroup)
  })
  
  return merged
}

/**
 * Create a bucket from a group of changes
 */
function createBucket(
  changes: Change[],
  method: 'clause-path' | 'keyword' | 'document',
  maxKeywords: number
): Bucket {
  // Extract keywords from all change texts
  const texts = changes.map(c => 
    [c.changedText, c.textBefore, c.textAfter].join(' ')
  )
  
  const keywords = extractAggregatedKeywords(texts, maxKeywords)
  const suggestedTopic = generateTopicFromKeywords(keywords, 3)
  
  // Calculate confidence based on group size and keyword scores
  const avgKeywordScore = keywords.length > 0
    ? keywords.reduce((sum, k) => sum + k.score, 0) / keywords.length
    : 0
  
  // Higher confidence for larger groups with stronger keywords
  const sizeScore = Math.min(changes.length / 5, 1.0) // Cap at 5 changes
  const confidence = Math.min((sizeScore * 0.5 + avgKeywordScore * 0.5), 1.0)
  
  return {
    bucketId: `bucket_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    suggestedTopic,
    keywords: keywords.map(k => k.term),
    changeIds: changes.map(c => c.changeId),
    confidence,
    method,
    createdAt: new Date().toISOString(),
  }
}

/**
 * Sort and limit buckets
 */
function sortAndLimitBuckets(
  buckets: Bucket[],
  maxBuckets: number
): Bucket[] {
  // Sort by confidence (descending) and size (descending)
  const sorted = buckets.sort((a, b) => {
    if (Math.abs(a.confidence - b.confidence) > 0.1) {
      return b.confidence - a.confidence
    }
    return b.changeIds.length - a.changeIds.length
  })
  
  // Take top maxBuckets
  return sorted.slice(0, maxBuckets)
}

/**
 * Main clustering function
 * Groups changes by clause path similarity and extracts keywords for topic suggestions
 */
export function clusterChanges(
  changes: Change[],
  params?: Partial<ClusteringParams>
): ClusteringResult {
  // Merge with defaults
  const config: Required<ClusteringParams> = {
    ...DEFAULT_PARAMS,
    ...params,
  }
  
  // Step 1: Group by exact clause path
  const exactGroups = groupByExactClausePath(changes)
  
  // Step 2: Merge similar groups
  const mergedGroups = mergeSimilarGroups(
    exactGroups,
    config.clauseSimilarityThreshold
  )
  
  // Step 3: Create buckets from groups
  const buckets: Bucket[] = []
  mergedGroups.forEach((groupChanges) => {
    if (groupChanges.length >= config.minChangesPerBucket) {
      const bucket = createBucket(
        groupChanges,
        'clause-path',
        config.maxKeywordsPerBucket
      )
      buckets.push(bucket)
    }
  })
  
  // Step 4: Sort and limit buckets
  const limitedBuckets = sortAndLimitBuckets(buckets, config.maxBuckets)
  
  // Step 5: Calculate statistics
  const assignedChangeIds = new Set<string>()
  limitedBuckets.forEach(bucket => {
    bucket.changeIds.forEach(id => assignedChangeIds.add(id))
  })
  
  const unassignedChangeIds = changes
    .filter(c => !assignedChangeIds.has(c.changeId))
    .map(c => c.changeId)
  
  const totalConfidence = limitedBuckets.reduce((sum, b) => sum + b.confidence, 0)
  const avgConfidence = limitedBuckets.length > 0 
    ? totalConfidence / limitedBuckets.length 
    : 0
  
  const totalChangesInBuckets = Array.from(assignedChangeIds).length
  const avgChangesPerBucket = limitedBuckets.length > 0
    ? totalChangesInBuckets / limitedBuckets.length
    : 0
  
  return {
    buckets: limitedBuckets,
    assignedChangeIds: Array.from(assignedChangeIds),
    unassignedChangeIds,
    stats: {
      totalChanges: changes.length,
      totalBuckets: limitedBuckets.length,
      averageChangesPerBucket: avgChangesPerBucket,
      averageConfidence: avgConfidence,
    },
  }
}

/**
 * Group changes by document
 * Alternative clustering strategy that groups by document ID
 */
export function clusterByDocument(
  changes: Change[],
  maxKeywords: number = 5
): Bucket[] {
  const groupsByDoc = new Map<string, Change[]>()
  
  changes.forEach(change => {
    const group = groupsByDoc.get(change.docId) || []
    group.push(change)
    groupsByDoc.set(change.docId, group)
  })
  
  const buckets: Bucket[] = []
  groupsByDoc.forEach((groupChanges) => {
    if (groupChanges.length > 0) {
      const bucket = createBucket(groupChanges, 'document', maxKeywords)
      buckets.push(bucket)
    }
  })
  
  return buckets
}

/**
 * Apply buckets to changes by updating their suggestedThread field
 * This doesn't assign changes to threads, just sets suggestions
 */
export function applyBucketsToChanges(
  changes: Change[],
  buckets: Bucket[]
): Change[] {
  // Create a map of changeId to bucket topic
  const changeToTopic = new Map<string, string>()
  
  buckets.forEach(bucket => {
    bucket.changeIds.forEach(changeId => {
      changeToTopic.set(changeId, bucket.suggestedTopic)
    })
  })
  
  // Update changes with suggested topics
  return changes.map(change => ({
    ...change,
    suggestedThread: changeToTopic.get(change.changeId) || null,
  }))
}
