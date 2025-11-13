/**
 * Tests for LLM-Assisted Clustering utilities
 */

import { describe, it, expect } from 'vitest'
import type { Change } from '../types/dataModel'
import type {
  LLMClusteringResponse,
  LLMSuggestedCluster,
} from '../types/llmClustering'
import {
  generateClusteringPacket,
  exportClusteringPacketAsJSON,
  validateLLMResponse,
  sanitizeLLMResponse,
  convertLLMClustersToBuckets,
  parseLLMResponse,
} from './llmClustering'

describe('llmClustering', () => {
  // Sample changes for testing
  const sampleChanges: Change[] = [
    {
      changeId: 'doc1-change1',
      docId: 'doc1',
      type: 'insertion',
      author: 'John Doe',
      timestamp: '2025-11-13T10:00:00.000Z',
      clausePath: ['8', 'Termination', '8.2 Force Majeure'],
      textBefore: 'In the event of',
      changedText: 'force majeure',
      textAfter: 'the parties shall',
      threadId: null,
      suggestedThread: null,
    },
    {
      changeId: 'doc1-change2',
      docId: 'doc1',
      type: 'deletion',
      author: 'Jane Smith',
      timestamp: '2025-11-13T10:05:00.000Z',
      clausePath: ['5', 'Payment', '5.1 Terms'],
      textBefore: 'Payment shall be due',
      changedText: 'within 30 days',
      textAfter: 'of invoice date',
      threadId: null,
      suggestedThread: null,
    },
    {
      changeId: 'doc2-change1',
      docId: 'doc2',
      type: 'insertion',
      author: 'John Doe',
      timestamp: '2025-11-13T10:10:00.000Z',
      clausePath: ['8', 'Termination', '8.1 General'],
      textBefore: 'Either party may terminate',
      changedText: 'upon written notice',
      textAfter: 'to the other party',
      threadId: null,
      suggestedThread: null,
    },
  ]

  describe('generateClusteringPacket', () => {
    it('should generate a valid clustering packet', () => {
      const packet = generateClusteringPacket(sampleChanges)

      expect(packet.version).toBe('1.0')
      expect(packet.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
      expect(packet.instructions).toContain('cluster related document changes')
      expect(packet.exampleResponse).toBeDefined()
      expect(packet.changes).toHaveLength(3)
      expect(packet.responseSchema).toBeDefined()
    })

    it('should convert changes to LLM format correctly', () => {
      const packet = generateClusteringPacket(sampleChanges)
      const firstChange = packet.changes[0]

      expect(firstChange.changeId).toBe('doc1-change1')
      expect(firstChange.docId).toBe('doc1')
      expect(firstChange.type).toBe('insertion')
      expect(firstChange.text).toBe('force majeure')
      expect(firstChange.context).toContain('In the event of')
      expect(firstChange.context).toContain('force majeure')
      expect(firstChange.context).toContain('the parties shall')
      expect(firstChange.clausePath).toEqual(['8', 'Termination', '8.2 Force Majeure'])
      expect(firstChange.author).toBe('John Doe')
    })

    it('should limit to 500 changes', () => {
      // Create 600 changes
      const manyChanges: Change[] = Array.from({ length: 600 }, (_, i) => ({
        changeId: `change-${i}`,
        docId: 'doc1',
        type: 'insertion' as const,
        author: 'Author',
        timestamp: '2025-11-13T10:00:00.000Z',
        clausePath: ['1'],
        textBefore: 'before',
        changedText: `text ${i}`,
        textAfter: 'after',
        threadId: null,
        suggestedThread: null,
      }))

      const packet = generateClusteringPacket(manyChanges)
      expect(packet.changes).toHaveLength(500)
    })

    it('should include response schema', () => {
      const packet = generateClusteringPacket(sampleChanges)

      expect(packet.responseSchema).toBeDefined()
      expect(packet.responseSchema.type).toBe('object')
      expect(packet.responseSchema.required).toContain('version')
      expect(packet.responseSchema.required).toContain('clusters')
      expect(packet.responseSchema.properties).toBeDefined()
    })
  })

  describe('exportClusteringPacketAsJSON', () => {
    it('should export packet as formatted JSON string', () => {
      const json = exportClusteringPacketAsJSON(sampleChanges)
      const parsed = JSON.parse(json)

      expect(parsed.version).toBe('1.0')
      expect(parsed.changes).toHaveLength(3)
      expect(json).toContain('\n') // Check it's formatted
    })
  })

  describe('validateLLMResponse', () => {
    const packet = generateClusteringPacket(sampleChanges)

    it('should validate a correct response', () => {
      const response: LLMClusteringResponse = {
        version: '1.0',
        respondedAt: '2025-11-13T12:00:00.000Z',
        clusters: [
          {
            changeIds: ['doc1-change1', 'doc2-change1'],
            suggestedTopic: 'Termination',
            confidence: 0.85,
            keywords: ['termination', 'force majeure', 'notice'],
            rationale: 'Changes related to termination clauses',
          },
        ],
        unclusteredChangeIds: ['doc1-change2'],
      }

      const validation = validateLLMResponse(response, packet)
      expect(validation.valid).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })

    it('should reject response with invalid version', () => {
      const response = {
        version: '2.0',
        respondedAt: '2025-11-13T12:00:00.000Z',
        clusters: [],
        unclusteredChangeIds: [],
      }

      const validation = validateLLMResponse(response, packet)
      expect(validation.valid).toBe(false)
      expect(validation.errors).toContain('Invalid or missing version field (expected "1.0")')
    })

    it('should reject response with invalid respondedAt', () => {
      const response = {
        version: '1.0',
        respondedAt: 'invalid-date',
        clusters: [],
        unclusteredChangeIds: [],
      }

      const validation = validateLLMResponse(response, packet)
      expect(validation.valid).toBe(false)
      expect(validation.errors.some((e) => e.includes('respondedAt'))).toBe(true)
    })

    it('should reject response with missing required fields', () => {
      const response = {
        version: '1.0',
      }

      const validation = validateLLMResponse(response, packet)
      expect(validation.valid).toBe(false)
      expect(validation.errors.length).toBeGreaterThan(0)
    })

    it('should reject response with invalid changeId', () => {
      const response: LLMClusteringResponse = {
        version: '1.0',
        respondedAt: '2025-11-13T12:00:00.000Z',
        clusters: [
          {
            changeIds: ['invalid-id'],
            suggestedTopic: 'Test',
            confidence: 0.8,
            keywords: ['test'],
            rationale: 'Test',
          },
        ],
        unclusteredChangeIds: [],
      }

      const validation = validateLLMResponse(response, packet)
      expect(validation.valid).toBe(false)
      expect(validation.errors.some((e) => e.includes('invalid-id'))).toBe(true)
    })

    it('should reject response with duplicate changeIds', () => {
      const response: LLMClusteringResponse = {
        version: '1.0',
        respondedAt: '2025-11-13T12:00:00.000Z',
        clusters: [
          {
            changeIds: ['doc1-change1'],
            suggestedTopic: 'Topic 1',
            confidence: 0.8,
            keywords: ['test'],
            rationale: 'Test',
          },
          {
            changeIds: ['doc1-change1'], // Duplicate
            suggestedTopic: 'Topic 2',
            confidence: 0.7,
            keywords: ['test'],
            rationale: 'Test',
          },
        ],
        unclusteredChangeIds: [],
      }

      const validation = validateLLMResponse(response, packet)
      expect(validation.valid).toBe(false)
      expect(validation.errors.some((e) => e.includes('multiple clusters'))).toBe(true)
    })

    it('should reject response with invalid confidence score', () => {
      const response: LLMClusteringResponse = {
        version: '1.0',
        respondedAt: '2025-11-13T12:00:00.000Z',
        clusters: [
          {
            changeIds: ['doc1-change1'],
            suggestedTopic: 'Test',
            confidence: 1.5, // Invalid: > 1
            keywords: ['test'],
            rationale: 'Test',
          },
        ],
        unclusteredChangeIds: [],
      }

      const validation = validateLLMResponse(response, packet)
      expect(validation.valid).toBe(false)
      expect(validation.errors.some((e) => e.includes('confidence'))).toBe(true)
    })

    it('should warn on low confidence scores', () => {
      const response: LLMClusteringResponse = {
        version: '1.0',
        respondedAt: '2025-11-13T12:00:00.000Z',
        clusters: [
          {
            changeIds: ['doc1-change1'],
            suggestedTopic: 'Test',
            confidence: 0.5, // Low confidence
            keywords: ['test'],
            rationale: 'Test',
          },
        ],
        unclusteredChangeIds: [],
      }

      const validation = validateLLMResponse(response, packet)
      expect(validation.warnings.some((w) => w.includes('low confidence'))).toBe(true)
    })

    it('should reject response with empty suggestedTopic', () => {
      const response: LLMClusteringResponse = {
        version: '1.0',
        respondedAt: '2025-11-13T12:00:00.000Z',
        clusters: [
          {
            changeIds: ['doc1-change1'],
            suggestedTopic: '',
            confidence: 0.8,
            keywords: ['test'],
            rationale: 'Test',
          },
        ],
        unclusteredChangeIds: [],
      }

      const validation = validateLLMResponse(response, packet)
      expect(validation.valid).toBe(false)
      expect(validation.errors.some((e) => e.includes('suggestedTopic'))).toBe(true)
    })

    it('should reject response with empty keywords array', () => {
      const response: LLMClusteringResponse = {
        version: '1.0',
        respondedAt: '2025-11-13T12:00:00.000Z',
        clusters: [
          {
            changeIds: ['doc1-change1'],
            suggestedTopic: 'Test',
            confidence: 0.8,
            keywords: [],
            rationale: 'Test',
          },
        ],
        unclusteredChangeIds: [],
      }

      const validation = validateLLMResponse(response, packet)
      expect(validation.valid).toBe(false)
      expect(validation.errors.some((e) => e.includes('keywords'))).toBe(true)
    })

    it('should warn if not all changes are accounted for', () => {
      const response: LLMClusteringResponse = {
        version: '1.0',
        respondedAt: '2025-11-13T12:00:00.000Z',
        clusters: [
          {
            changeIds: ['doc1-change1'],
            suggestedTopic: 'Test',
            confidence: 0.8,
            keywords: ['test'],
            rationale: 'Test',
          },
        ],
        unclusteredChangeIds: [], // Missing doc1-change2 and doc2-change1
      }

      const validation = validateLLMResponse(response, packet)
      expect(validation.warnings.some((w) => w.includes('neither clustered nor marked'))).toBe(
        true
      )
    })
  })

  describe('sanitizeLLMResponse', () => {
    it('should sanitize malicious content from suggestedTopic', () => {
      const response: LLMClusteringResponse = {
        version: '1.0',
        respondedAt: '2025-11-13T12:00:00.000Z',
        clusters: [
          {
            changeIds: ['doc1-change1'],
            suggestedTopic: '<script>alert("xss")</script>Force Majeure',
            confidence: 0.8,
            keywords: ['test'],
            rationale: 'Test',
          },
        ],
        unclusteredChangeIds: [],
      }

      const sanitized = sanitizeLLMResponse(response)
      expect(sanitized.clusters[0].suggestedTopic).not.toContain('<script>')
      expect(sanitized.clusters[0].suggestedTopic).toBe('Force Majeure')
    })

    it('should sanitize malicious content from keywords', () => {
      const response: LLMClusteringResponse = {
        version: '1.0',
        respondedAt: '2025-11-13T12:00:00.000Z',
        clusters: [
          {
            changeIds: ['doc1-change1'],
            suggestedTopic: 'Test',
            confidence: 0.8,
            keywords: ['<img src=x onerror=alert(1)>', 'normal keyword'],
            rationale: 'Test',
          },
        ],
        unclusteredChangeIds: [],
      }

      const sanitized = sanitizeLLMResponse(response)
      expect(sanitized.clusters[0].keywords[0]).not.toContain('<img')
      expect(sanitized.clusters[0].keywords[1]).toBe('normal keyword')
    })

    it('should sanitize malicious content from rationale', () => {
      const response: LLMClusteringResponse = {
        version: '1.0',
        respondedAt: '2025-11-13T12:00:00.000Z',
        clusters: [
          {
            changeIds: ['doc1-change1'],
            suggestedTopic: 'Test',
            confidence: 0.8,
            keywords: ['test'],
            rationale: 'Normal text <script>malicious()</script> more text',
          },
        ],
        unclusteredChangeIds: [],
      }

      const sanitized = sanitizeLLMResponse(response)
      expect(sanitized.clusters[0].rationale).not.toContain('<script>')
      expect(sanitized.clusters[0].rationale).toBe('Normal text  more text')
    })

    it('should sanitize metadata fields', () => {
      const response: LLMClusteringResponse = {
        version: '1.0',
        respondedAt: '2025-11-13T12:00:00.000Z',
        clusters: [],
        unclusteredChangeIds: [],
        metadata: {
          model: '<b>gpt-4</b>',
          notes: 'Test <script>alert(1)</script>',
        },
      }

      const sanitized = sanitizeLLMResponse(response)
      expect(sanitized.metadata?.model).toBe('gpt-4')
      expect(sanitized.metadata?.notes).not.toContain('<script>')
    })
  })

  describe('convertLLMClustersToBuckets', () => {
    it('should convert LLM clusters to buckets', () => {
      const clusters: LLMSuggestedCluster[] = [
        {
          changeIds: ['doc1-change1', 'doc2-change1'],
          suggestedTopic: 'Termination',
          confidence: 0.85,
          keywords: ['termination', 'force majeure'],
          rationale: 'Related to termination',
        },
        {
          changeIds: ['doc1-change2'],
          suggestedTopic: 'Payment',
          confidence: 0.9,
          keywords: ['payment', 'invoice'],
          rationale: 'Related to payment',
        },
      ]

      const buckets = convertLLMClustersToBuckets(clusters)

      expect(buckets).toHaveLength(2)
      expect(buckets[0].suggestedTopic).toBe('Termination')
      expect(buckets[0].keywords).toEqual(['termination', 'force majeure'])
      expect(buckets[0].changeIds).toEqual(['doc1-change1', 'doc2-change1'])
      expect(buckets[0].confidence).toBe(0.85)
      expect(buckets[0].method).toBe('keyword')
      expect(buckets[0].bucketId).toMatch(/^llm-bucket_/)

      expect(buckets[1].suggestedTopic).toBe('Payment')
      expect(buckets[1].confidence).toBe(0.9)
    })
  })

  describe('parseLLMResponse', () => {
    const packet = generateClusteringPacket(sampleChanges)

    it('should parse and validate a correct JSON response', () => {
      const responseObj: LLMClusteringResponse = {
        version: '1.0',
        respondedAt: '2025-11-13T12:00:00.000Z',
        clusters: [
          {
            changeIds: ['doc1-change1'],
            suggestedTopic: 'Test',
            confidence: 0.8,
            keywords: ['test'],
            rationale: 'Test rationale',
          },
        ],
        unclusteredChangeIds: ['doc1-change2', 'doc2-change1'],
      }

      const json = JSON.stringify(responseObj)
      const result = parseLLMResponse(json, packet)

      expect(result).not.toBeNull()
      expect(result?.response.clusters).toHaveLength(1)
      expect(result?.validation.valid).toBe(true)
    })

    it('should return null for invalid JSON', () => {
      const invalidJson = '{ invalid json }'
      const result = parseLLMResponse(invalidJson, packet)

      expect(result).toBeNull()
    })

    it('should return null for invalid response structure', () => {
      const invalidResponse = {
        version: '2.0', // Wrong version
        clusters: [],
      }

      const json = JSON.stringify(invalidResponse)
      const result = parseLLMResponse(json, packet)

      expect(result).toBeNull()
    })

    it('should sanitize the response before returning', () => {
      const responseObj: LLMClusteringResponse = {
        version: '1.0',
        respondedAt: '2025-11-13T12:00:00.000Z',
        clusters: [
          {
            changeIds: ['doc1-change1'],
            suggestedTopic: '<script>alert("xss")</script>Test',
            confidence: 0.8,
            keywords: ['<b>keyword</b>'],
            rationale: 'Test',
          },
        ],
        unclusteredChangeIds: ['doc1-change2', 'doc2-change1'],
      }

      const json = JSON.stringify(responseObj)
      const result = parseLLMResponse(json, packet)

      expect(result).not.toBeNull()
      expect(result?.response.clusters[0].suggestedTopic).not.toContain('<script>')
      expect(result?.response.clusters[0].keywords[0]).toBe('keyword')
    })
  })
})
