/**
 * Utilities for LLM-Assisted Clustering (Phase 2.2)
 * Handles export of clustering packets and import/validation of LLM responses
 */

import DOMPurify from 'dompurify'
import type { Change } from '../types/dataModel'
import type {
  LLMChangeData,
  LLMClusteringPacket,
  LLMClusteringResponse,
  LLMSuggestedCluster,
  LLMResponseValidation,
} from '../types/llmClustering'
import type { Bucket } from '../types/clustering'

/**
 * Maximum changes per clustering packet
 */
const MAX_CHANGES_PER_PACKET = 500

/**
 * Instructions for the LLM
 */
const LLM_INSTRUCTIONS = `You are an AI assistant helping to cluster related document changes.

**Task:** Analyze the provided changes and group related changes into clusters based on:
1. Similar clause paths (changes in the same or related sections)
2. Semantic similarity (changes about the same topic)
3. Author patterns (optional, but can be useful)

**Guidelines:**
- Each cluster should represent a coherent topic or theme
- A change can only belong to ONE cluster
- Aim for 5-15 clusters (fewer is better if changes are highly related)
- Provide a clear, concise suggestedTopic for each cluster (2-5 words)
- Extract 3-5 keywords that best describe each cluster
- Assign confidence scores (0.0-1.0) based on how strongly changes relate
- Only cluster changes you're confident about (confidence >= 0.6)
- Leave uncertain changes in unclusteredChangeIds

**Response Format:**
Return a JSON object matching the responseSchema with:
- clusters: Array of suggested clusters with changeIds, suggestedTopic, confidence, keywords, and rationale
- unclusteredChangeIds: Array of changeIds that don't fit well into any cluster

Example is provided below in the "exampleResponse" field.`

/**
 * Example response for the LLM
 */
const EXAMPLE_RESPONSE: LLMClusteringResponse = {
  version: '1.0',
  respondedAt: '2025-11-13T12:00:00.000Z',
  clusters: [
    {
      changeIds: ['doc1-change1', 'doc1-change2', 'doc2-change5'],
      suggestedTopic: 'Force Majeure',
      confidence: 0.85,
      keywords: ['force majeure', 'termination', 'event', 'liability'],
      rationale: 'Changes related to force majeure clause and termination provisions',
    },
    {
      changeIds: ['doc1-change3', 'doc2-change1'],
      suggestedTopic: 'Payment Terms',
      confidence: 0.92,
      keywords: ['payment', 'invoice', 'due date', 'currency'],
      rationale: 'Changes modifying payment schedule and currency provisions',
    },
  ],
  unclusteredChangeIds: ['doc2-change3'],
  metadata: {
    model: 'gpt-4',
    processingTime: 1234,
    notes: 'One change had insufficient context for confident clustering',
  },
}

/**
 * Response schema specification
 */
const RESPONSE_SCHEMA = {
  description: 'LLM clustering response format',
  type: 'object' as const,
  required: ['version', 'respondedAt', 'clusters', 'unclusteredChangeIds'],
  properties: {
    version: {
      type: 'string',
      enum: ['1.0'],
      description: 'Version of response format',
    },
    respondedAt: {
      type: 'string',
      format: 'date-time',
      description: 'ISO 8601 timestamp when response was created',
    },
    clusters: {
      type: 'array',
      description: 'Array of suggested clusters',
      items: {
        type: 'object',
        required: ['changeIds', 'suggestedTopic', 'confidence', 'keywords', 'rationale'],
        properties: {
          changeIds: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of change IDs in this cluster',
          },
          suggestedTopic: {
            type: 'string',
            minLength: 1,
            maxLength: 100,
            description: 'Suggested topic/title for this cluster',
          },
          confidence: {
            type: 'number',
            minimum: 0,
            maximum: 1,
            description: 'Confidence score (0-1)',
          },
          keywords: {
            type: 'array',
            items: { type: 'string' },
            minItems: 1,
            maxItems: 10,
            description: 'Keywords that define this cluster',
          },
          rationale: {
            type: 'string',
            maxLength: 500,
            description: 'Brief rationale for this clustering',
          },
        },
      },
    },
    unclusteredChangeIds: {
      type: 'array',
      items: { type: 'string' },
      description: 'Changes that could not be confidently clustered',
    },
    metadata: {
      type: 'object',
      description: 'Optional metadata from LLM',
      properties: {
        model: { type: 'string' },
        processingTime: { type: 'number' },
        notes: { type: 'string' },
      },
    },
  },
}

/**
 * Convert a Change to LLMChangeData
 */
function convertChangeToLLMData(change: Change): LLMChangeData {
  // Combine textBefore, changedText, and textAfter for context
  const context = [
    change.textBefore,
    change.changedText,
    change.textAfter,
  ]
    .filter(Boolean)
    .join(' ')
    .trim()

  return {
    changeId: change.changeId,
    docId: change.docId,
    type: change.type,
    text: change.changedText,
    context,
    clausePath: change.clausePath,
    author: change.author,
  }
}

/**
 * Generate a clustering packet for LLM processing
 * @param changes Array of changes to cluster (max 500)
 * @returns LLM clustering packet ready for export
 */
export function generateClusteringPacket(changes: Change[]): LLMClusteringPacket {
  // Limit to max changes per packet
  const limitedChanges = changes.slice(0, MAX_CHANGES_PER_PACKET)

  // Convert changes to LLM format
  const llmChanges = limitedChanges.map(convertChangeToLLMData)

  return {
    version: '1.0',
    createdAt: new Date().toISOString(),
    instructions: LLM_INSTRUCTIONS,
    exampleResponse: EXAMPLE_RESPONSE,
    changes: llmChanges,
    responseSchema: RESPONSE_SCHEMA,
  }
}

/**
 * Export clustering packet as JSON file
 * @param changes Array of changes to cluster
 * @returns JSON string ready for download
 */
export function exportClusteringPacketAsJSON(changes: Change[]): string {
  const packet = generateClusteringPacket(changes)
  return JSON.stringify(packet, null, 2)
}

/**
 * Sanitize a string using DOMPurify
 */
function sanitizeString(text: string): string {
  // Use DOMPurify to strip any HTML/script tags
  return DOMPurify.sanitize(text, { ALLOWED_TAGS: [] })
}

/**
 * Validate the structure of an LLM response
 */
function validateResponseStructure(response: unknown): LLMResponseValidation {
  const errors: string[] = []
  const warnings: string[] = []

  // Check if response is an object
  if (typeof response !== 'object' || response === null) {
    return {
      valid: false,
      errors: ['Response must be a JSON object'],
      warnings: [],
    }
  }

  const resp = response as Record<string, unknown>

  // Check required fields
  if (resp.version !== '1.0') {
    errors.push('Invalid or missing version field (expected "1.0")')
  }

  if (typeof resp.respondedAt !== 'string') {
    errors.push('Missing or invalid respondedAt field (expected ISO 8601 string)')
  } else {
    // Validate ISO 8601 format
    const date = new Date(resp.respondedAt)
    if (isNaN(date.getTime())) {
      errors.push('respondedAt is not a valid ISO 8601 date')
    }
  }

  if (!Array.isArray(resp.clusters)) {
    errors.push('Missing or invalid clusters field (expected array)')
  }

  if (!Array.isArray(resp.unclusteredChangeIds)) {
    errors.push('Missing or invalid unclusteredChangeIds field (expected array)')
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Validate clusters in the response
 */
function validateClusters(
  clusters: unknown,
  validChangeIds: Set<string>
): LLMResponseValidation {
  const errors: string[] = []
  const warnings: string[] = []

  if (!Array.isArray(clusters)) {
    return {
      valid: false,
      errors: ['Clusters must be an array'],
      warnings: [],
    }
  }

  const seenChangeIds = new Set<string>()

  clusters.forEach((cluster, index) => {
    if (typeof cluster !== 'object' || cluster === null) {
      errors.push(`Cluster ${index} is not an object`)
      return
    }

    const c = cluster as Record<string, unknown>

    // Validate required fields
    if (!Array.isArray(c.changeIds) || c.changeIds.length === 0) {
      errors.push(`Cluster ${index}: changeIds must be a non-empty array`)
    } else {
      // Check if changeIds are valid strings and exist in original packet
      c.changeIds.forEach((id: unknown) => {
        if (typeof id !== 'string') {
          errors.push(`Cluster ${index}: changeId must be a string`)
        } else {
          if (!validChangeIds.has(id)) {
            errors.push(`Cluster ${index}: changeId "${id}" not found in original packet`)
          }
          if (seenChangeIds.has(id)) {
            errors.push(`Cluster ${index}: changeId "${id}" appears in multiple clusters`)
          }
          seenChangeIds.add(id)
        }
      })
    }

    if (typeof c.suggestedTopic !== 'string' || c.suggestedTopic.length === 0) {
      errors.push(`Cluster ${index}: suggestedTopic must be a non-empty string`)
    } else if (c.suggestedTopic.length > 100) {
      warnings.push(`Cluster ${index}: suggestedTopic is very long (${c.suggestedTopic.length} chars)`)
    }

    if (typeof c.confidence !== 'number' || c.confidence < 0 || c.confidence > 1) {
      errors.push(`Cluster ${index}: confidence must be a number between 0 and 1`)
    } else if (c.confidence < 0.6) {
      warnings.push(`Cluster ${index}: low confidence score (${c.confidence})`)
    }

    if (!Array.isArray(c.keywords) || c.keywords.length === 0) {
      errors.push(`Cluster ${index}: keywords must be a non-empty array`)
    } else if (c.keywords.length > 10) {
      warnings.push(`Cluster ${index}: too many keywords (${c.keywords.length})`)
    } else {
      // Check keywords are strings
      c.keywords.forEach((kw: unknown, kwIndex: number) => {
        if (typeof kw !== 'string') {
          errors.push(`Cluster ${index}: keyword ${kwIndex} must be a string`)
        }
      })
    }

    if (typeof c.rationale !== 'string') {
      errors.push(`Cluster ${index}: rationale must be a string`)
    } else if (c.rationale.length > 500) {
      warnings.push(`Cluster ${index}: rationale is very long (${c.rationale.length} chars)`)
    }
  })

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Validate LLM response against original packet
 * @param response The LLM response to validate
 * @param originalPacket The original packet sent to the LLM
 * @returns Validation result
 */
export function validateLLMResponse(
  response: unknown,
  originalPacket: LLMClusteringPacket
): LLMResponseValidation {
  // First, validate structure
  const structureValidation = validateResponseStructure(response)
  if (!structureValidation.valid) {
    return structureValidation
  }

  const resp = response as LLMClusteringResponse

  // Build set of valid changeIds from original packet
  const validChangeIds = new Set(originalPacket.changes.map((c) => c.changeId))

  // Validate clusters
  const clusterValidation = validateClusters(resp.clusters, validChangeIds)
  if (!clusterValidation.valid) {
    return {
      valid: false,
      errors: [...structureValidation.errors, ...clusterValidation.errors],
      warnings: [...structureValidation.warnings, ...clusterValidation.warnings],
    }
  }

  // Validate unclusteredChangeIds
  const errors: string[] = []
  const warnings: string[] = [...structureValidation.warnings, ...clusterValidation.warnings]

  resp.unclusteredChangeIds.forEach((id) => {
    if (typeof id !== 'string') {
      errors.push('unclusteredChangeIds must contain only strings')
    } else if (!validChangeIds.has(id)) {
      errors.push(`Unclustered changeId "${id}" not found in original packet`)
    }
  })

  // Check if all changeIds are accounted for
  const clusteredIds = new Set<string>()
  resp.clusters.forEach((cluster) => {
    cluster.changeIds.forEach((id) => clusteredIds.add(id))
  })

  const unclusteredSet = new Set(resp.unclusteredChangeIds)
  const totalAccountedFor = clusteredIds.size + unclusteredSet.size

  if (totalAccountedFor < validChangeIds.size) {
    const missingCount = validChangeIds.size - totalAccountedFor
    warnings.push(`${missingCount} changes are neither clustered nor marked as unclustered`)
  } else if (totalAccountedFor > validChangeIds.size) {
    errors.push('Response accounts for more changes than were in the original packet')
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Sanitize an LLM response
 * Removes any potentially malicious content from text fields
 */
export function sanitizeLLMResponse(response: LLMClusteringResponse): LLMClusteringResponse {
  return {
    ...response,
    clusters: response.clusters.map((cluster) => ({
      ...cluster,
      suggestedTopic: sanitizeString(cluster.suggestedTopic),
      keywords: cluster.keywords.map(sanitizeString),
      rationale: sanitizeString(cluster.rationale),
    })),
    metadata: response.metadata
      ? {
          ...response.metadata,
          model: response.metadata.model ? sanitizeString(response.metadata.model) : undefined,
          notes: response.metadata.notes ? sanitizeString(response.metadata.notes) : undefined,
        }
      : undefined,
  }
}

/**
 * Convert LLM suggested clusters to Buckets
 * Does NOT auto-assign changes to threads
 */
export function convertLLMClustersToBuckets(
  clusters: LLMSuggestedCluster[]
): Bucket[] {
  return clusters.map((cluster) => ({
    bucketId: `llm-bucket_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    suggestedTopic: cluster.suggestedTopic,
    keywords: cluster.keywords,
    changeIds: cluster.changeIds,
    confidence: cluster.confidence,
    method: 'keyword', // LLM uses semantic analysis, closest to keyword method
    createdAt: new Date().toISOString(),
  }))
}

/**
 * Parse and validate LLM response from JSON string
 * @param jsonString JSON string from LLM
 * @param originalPacket Original packet for validation
 * @returns Validated and sanitized response, or null if invalid
 */
export function parseLLMResponse(
  jsonString: string,
  originalPacket: LLMClusteringPacket
): { response: LLMClusteringResponse; validation: LLMResponseValidation } | null {
  try {
    const parsed = JSON.parse(jsonString)
    const validation = validateLLMResponse(parsed, originalPacket)

    if (!validation.valid) {
      return null
    }

    // Sanitize the response
    const sanitized = sanitizeLLMResponse(parsed as LLMClusteringResponse)

    return {
      response: sanitized,
      validation,
    }
  } catch {
    // JSON parse error or other error
    return null
  }
}
