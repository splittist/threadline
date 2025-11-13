/**
 * Types for LLM-Assisted Clustering (Phase 2.2)
 */

/**
 * A simplified change for LLM clustering
 * Contains minimal information needed for clustering
 */
export interface LLMChangeData {
  /** Unique change identifier */
  changeId: string
  /** Document ID this change belongs to */
  docId: string
  /** Type of change */
  type: 'insertion' | 'deletion' | 'moveFrom' | 'moveTo'
  /** Text that was changed */
  text: string
  /** Context before and after the change */
  context: string
  /** Clause path where change occurs */
  clausePath: string[]
  /** Author of the change */
  author: string
}

/**
 * LLM Clustering Packet
 * JSON structure to send to LLM for clustering suggestions
 */
export interface LLMClusteringPacket {
  /** Version of the packet format */
  version: '1.0'
  /** Timestamp when packet was created */
  createdAt: string
  /** Instructions for the LLM */
  instructions: string
  /** Example of expected response format */
  exampleResponse: LLMClusteringResponse
  /** Array of changes to cluster (max 500) */
  changes: LLMChangeData[]
  /** Response schema specification */
  responseSchema: {
    description: string
    type: 'object'
    required: string[]
    properties: Record<string, unknown>
  }
}

/**
 * A suggested cluster from the LLM
 */
export interface LLMSuggestedCluster {
  /** IDs of changes in this cluster */
  changeIds: string[]
  /** Suggested topic/title for this cluster */
  suggestedTopic: string
  /** Confidence score (0-1) */
  confidence: number
  /** Keywords that define this cluster */
  keywords: string[]
  /** Brief rationale for this clustering */
  rationale: string
}

/**
 * LLM Clustering Response
 * Expected format from LLM after processing the packet
 */
export interface LLMClusteringResponse {
  /** Version of response format */
  version: '1.0'
  /** Timestamp when response was created */
  respondedAt: string
  /** Array of suggested clusters */
  clusters: LLMSuggestedCluster[]
  /** Changes that couldn't be confidently clustered */
  unclusteredChangeIds: string[]
  /** Optional metadata from LLM */
  metadata?: {
    model?: string
    processingTime?: number
    notes?: string
  }
}

/**
 * Validation result for LLM response
 */
export interface LLMResponseValidation {
  /** Whether the response is valid */
  valid: boolean
  /** Array of validation errors (empty if valid) */
  errors: string[]
  /** Array of validation warnings (non-fatal issues) */
  warnings: string[]
}
