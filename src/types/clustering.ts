/**
 * Types for clustering and topic suggestion (Phase 2.1)
 * Extended with Defined-Term (DT) clustering support
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
  method: 'clause-path' | 'keyword' | 'document' | 'defined-term'
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
  /** Use defined-term clustering (default: false) */
  useDefinedTerms?: boolean
  /** Minimum DT score for thread assignment (default: 1.0) */
  dtScoreThreshold?: number
  /** Weight for strong DT matches (default: 3.0) */
  dtStrongWeight?: number
  /** Weight for context DT matches (default: 1.5) */
  dtContextWeight?: number
  /** Weight for document-wide DT matches (default: 0.5) */
  dtDocwideWeight?: number
  /** Boost weight for changes in definition sections (default: 1.5) */
  dtDefinitionBoost?: number
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

/**
 * Defined Term extracted from documents
 */
export interface DefinedTerm {
  /** The normalized term text */
  term: string
  /** Original form as it appears in the document */
  originalForm: string
  /** Source of the definition */
  source: 'definitions-section' | 'capitalized-span' | 'quoted-introduction' | 'heading'
  /** Document ID where this term was found */
  docId: string
  /** Confidence level of this being a defined term (0-1) */
  confidence: number
}

/**
 * Statistics about a defined term across the corpus
 */
export interface DTStats {
  /** The term */
  term: string
  /** Document frequency: number of contexts containing this term */
  df: number
  /** Inverse document frequency: log(1 + total_contexts / df) */
  idf: number
}

/**
 * Match of a defined term in a change
 */
export interface DTMatch {
  /** The defined term that matched */
  term: string
  /** Weight/score for this match */
  weight: number
  /** Type of match */
  kind: 'strong' | 'context' | 'docwide'
}

/**
 * Extended change data with DT scoring
 */
export interface ChangeWithDT {
  /** The original change ID */
  changeId: string
  /** Defined term matches found in this change */
  dtMatches: DTMatch[]
  /** Total DT score for this change */
  dtScore: number
  /** Primary (highest-scoring) defined term for this change */
  primaryDT: string | null
}
