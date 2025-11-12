import { describe, it, expect } from 'vitest'
import { generateDocumentId, computeDocumentHash, getISOTimestamp } from './documentId'

describe('generateDocumentId', () => {
  it('generates a unique document ID', () => {
    const id1 = generateDocumentId()
    const id2 = generateDocumentId()

    expect(id1).toMatch(/^doc-[a-z0-9]+-[a-z0-9]+$/)
    expect(id2).toMatch(/^doc-[a-z0-9]+-[a-z0-9]+$/)
    expect(id1).not.toBe(id2)
  })

  it('generates IDs with doc- prefix', () => {
    const id = generateDocumentId()
    expect(id.startsWith('doc-')).toBe(true)
  })

  it('generates multiple unique IDs', () => {
    const ids = new Set()
    for (let i = 0; i < 100; i++) {
      ids.add(generateDocumentId())
    }
    expect(ids.size).toBe(100)
  })
})

describe('computeDocumentHash', () => {
  it('computes SHA-256 hash of content', async () => {
    const content = 'Hello, World!'
    const hash = await computeDocumentHash(content)

    expect(hash).toBe('dffd6021bb2bd5b0af676290809ec3a53191dd81c7f70a4b28688a362182986f')
    expect(hash).toHaveLength(64) // SHA-256 produces 64 hex characters
  })

  it('computes different hashes for different content', async () => {
    const hash1 = await computeDocumentHash('content 1')
    const hash2 = await computeDocumentHash('content 2')

    expect(hash1).not.toBe(hash2)
  })

  it('computes same hash for same content', async () => {
    const content = 'Same content'
    const hash1 = await computeDocumentHash(content)
    const hash2 = await computeDocumentHash(content)

    expect(hash1).toBe(hash2)
  })

  it('handles empty string', async () => {
    const hash = await computeDocumentHash('')
    expect(hash).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855')
    expect(hash).toHaveLength(64)
  })

  it('handles unicode characters', async () => {
    const content = '你好世界 🌍'
    const hash = await computeDocumentHash(content)
    expect(hash).toHaveLength(64)
  })
})

describe('getISOTimestamp', () => {
  it('returns a valid ISO 8601 timestamp', () => {
    const timestamp = getISOTimestamp()
    expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
  })

  it('returns a parseable date', () => {
    const timestamp = getISOTimestamp()
    const date = new Date(timestamp)
    expect(date).toBeInstanceOf(Date)
    expect(isNaN(date.getTime())).toBe(false)
  })

  it('returns different timestamps when called sequentially', async () => {
    const timestamp1 = getISOTimestamp()
    // Small delay to ensure different timestamps
    await new Promise((resolve) => setTimeout(resolve, 5))
    const timestamp2 = getISOTimestamp()

    expect(timestamp1).not.toBe(timestamp2)
  })
})
