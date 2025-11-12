/**
 * Utilities for generating document IDs and content hashes
 */

/**
 * Generate a unique document ID
 */
export function generateDocumentId(): string {
  // Use timestamp + random string for uniqueness
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 9)
  return `doc-${timestamp}-${random}`
}

/**
 * Compute SHA-256 hash of document content
 * @param content - The content to hash (typically the document.xml)
 * @returns Promise resolving to hex string of the hash
 */
export async function computeDocumentHash(content: string): Promise<string> {
  // Convert string to ArrayBuffer
  const encoder = new TextEncoder()
  const data = encoder.encode(content)

  // Compute SHA-256 hash
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)

  // Convert ArrayBuffer to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')

  return hashHex
}

/**
 * Get ISO 8601 timestamp string
 */
export function getISOTimestamp(): string {
  return new Date().toISOString()
}
