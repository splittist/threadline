/**
 * Types for clustering and topic suggestion (Phase 2.1)
 */

/**
 * A bucket is a suggested grouping of changes before thread creation
 * Buckets help organize changes for user review
 */
export interface Bucket {
  /** Unique bucket identifier */
  bucketId: string
  /** Suggested topic/title based on keywords */
  suggestedTopic: string
  /** Keywords extracted from changes in this bucket */
  keywords: string[]
  /** Change IDs in this bucket */
  changeIds: string[]
  /** Confidence score (0-1) for this grouping */
  confidence: number
  /** Method used to create this bucket */
  method: 'clause-path' | 'keyword' | 'document'
  /** Timestamp when bucket was created */
  createdAt: string
}

/**
 * Keyword with its importance score
 */
export interface Keyword {
  /** The keyword text */
  term: string
  /** TF-IDF or frequency score */
  score: number
  /** Number of occurrences */
  frequency: number
}

/**
 * Parameters for clustering algorithm
 */
export interface ClusteringParams {
  /** Maximum number of buckets to create (default: 15) */
  maxBuckets?: number
  /** Minimum similarity threshold for clause paths (0-1, default: 0.7) */
  clauseSimilarityThreshold?: number
  /** Minimum changes per bucket (default: 1) */
  minChangesPerBucket?: number
  /** Maximum keywords per bucket (default: 5) */
  maxKeywordsPerBucket?: number
}

/**
 * Result of clustering operation
 */
export interface ClusteringResult {
  /** Created buckets */
  buckets: Bucket[]
  /** Change IDs that were assigned to buckets */
  assignedChangeIds: string[]
  /** Change IDs that remain unassigned */
  unassignedChangeIds: string[]
  /** Clustering statistics */
  stats: {
    totalChanges: number
    totalBuckets: number
    averageChangesPerBucket: number
    averageConfidence: number
  }
}

/**
 * Message for clustering worker
 */
export interface ClusteringWorkerMessage {
  type: 'CLUSTER_CHANGES'
  data: {
    changes: Array<{
      changeId: string
      docId: string
      clausePath: string[]
      changedText: string
      textBefore: string
      textAfter: string
    }>
    params?: ClusteringParams
  }
}

/**
 * Response from clustering worker
 */
export interface ClusteringWorkerResponse {
  type: 'CLUSTERING_COMPLETE' | 'CLUSTERING_ERROR'
  data?: ClusteringResult
  error?: string
}
