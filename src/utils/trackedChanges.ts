/**
 * Utilities for extracting and parsing tracked changes from DOCX documents
 */

import { XMLParser } from 'fast-xml-parser'
import type { TrackedChange, ChangeType, Paragraph, HeadingNode, TextRun } from '../types/docx'

// Type definitions for XML parsed structures
interface XmlElement {
  [key: string]: unknown
}

/**
 * Context window size (number of paragraphs to include before/after)
 */
const CONTEXT_WINDOW_SIZE = 1

/**
 * Extract all tracked changes from document XML
 */
export function extractTrackedChanges(
  documentXml: string,
  docId: string,
  paragraphs: Paragraph[],
  headings: HeadingNode[]
): TrackedChange[] {
  const changes: TrackedChange[] = []

  if (!documentXml || documentXml.trim() === '') {
    return changes
  }

  try {
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      removeNSPrefix: true, // Remove namespace prefixes like 'w:'
      parseAttributeValue: false,
      parseTagValue: false,
      trimValues: false, // Don't trim whitespace from text values
      preserveOrder: false,
      isArray: (name) => {
        // These tags can appear multiple times and should always be arrays
        return ['p', 'r', 't', 'delText', 'ins', 'del', 'moveFrom', 'moveTo'].includes(name)
      },
    })

    const result = parser.parse(documentXml) as XmlElement

    // Navigate to the body element
    const document = result?.document as XmlElement | undefined
    const body = document?.body as XmlElement | undefined
    if (!body) {
      return changes
    }

    // Get all paragraph elements
    const paragraphElements = body.p as XmlElement[] | undefined
    if (!paragraphElements || !Array.isArray(paragraphElements)) {
      return changes
    }

    // Process each paragraph to find tracked changes
    paragraphElements.forEach((pEl: XmlElement, index: number) => {
      const paragraphId = `p-${index}`
      const trackedChanges = extractTrackedChangesFromParagraph(
        pEl,
        paragraphId,
        docId,
        paragraphs,
        headings
      )
      changes.push(...trackedChanges)
    })
  } catch (error) {
    console.error(
      'Error extracting tracked changes:',
      error instanceof Error ? error.message : error
    )
  }

  return changes
}

/**
 * Extract tracked changes from a single paragraph
 */
function extractTrackedChangesFromParagraph(
  pEl: XmlElement,
  paragraphId: string,
  docId: string,
  paragraphs: Paragraph[],
  headings: HeadingNode[]
): TrackedChange[] {
  const changes: TrackedChange[] = []

  // Look for insertion elements
  const insElements = pEl.ins as XmlElement[] | undefined
  if (insElements && Array.isArray(insElements)) {
    for (const insEl of insElements) {
      const change = parseTrackedChange(
        insEl,
        'insertion',
        paragraphId,
        docId,
        paragraphs,
        headings
      )
      if (change) changes.push(change)
    }
  }

  // Look for deletion elements
  const delElements = pEl.del as XmlElement[] | undefined
  if (delElements && Array.isArray(delElements)) {
    for (const delEl of delElements) {
      const change = parseTrackedChange(delEl, 'deletion', paragraphId, docId, paragraphs, headings)
      if (change) changes.push(change)
    }
  }

  // Look for moveFrom elements
  const moveFromElements = pEl.moveFrom as XmlElement[] | undefined
  if (moveFromElements && Array.isArray(moveFromElements)) {
    for (const moveFromEl of moveFromElements) {
      const change = parseTrackedChange(
        moveFromEl,
        'moveFrom',
        paragraphId,
        docId,
        paragraphs,
        headings
      )
      if (change) changes.push(change)
    }
  }

  // Look for moveTo elements
  const moveToElements = pEl.moveTo as XmlElement[] | undefined
  if (moveToElements && Array.isArray(moveToElements)) {
    for (const moveToEl of moveToElements) {
      const change = parseTrackedChange(
        moveToEl,
        'moveTo',
        paragraphId,
        docId,
        paragraphs,
        headings
      )
      if (change) changes.push(change)
    }
  }

  return changes
}

/**
 * Parse a single tracked change element
 */
function parseTrackedChange(
  changeEl: XmlElement,
  type: ChangeType,
  paragraphId: string,
  docId: string,
  paragraphs: Paragraph[],
  headings: HeadingNode[]
): TrackedChange | null {
  // Extract metadata
  const originalId = (changeEl['@_id'] as string | undefined) || ''
  const author = (changeEl['@_author'] as string | undefined) || 'Unknown'
  
  // Try both w16du:dateUtc and w:date attributes
  const dateUtc = (changeEl['@_w16du:dateUtc'] as string | undefined) || 
                   (changeEl['@_dateUtc'] as string | undefined) ||
                   (changeEl['@_date'] as string | undefined) || 
                   ''
  const timestamp = normalizeTimestamp(dateUtc)

  // Extract text content and formatted text runs
  const changedText = extractTextFromElement(changeEl)
  const textRuns = extractTextRunsFromElement(changeEl)

  // Find clause path for this paragraph
  const clausePath = findClausePathForParagraph(paragraphId, paragraphs, headings)

  // Extract context
  const { textBefore, textAfter } = extractContext(paragraphId, paragraphs)

  return {
    changeId: `${docId}-${originalId}`,
    docId,
    type,
    author,
    timestamp,
    originalId,
    changedText,
    textRuns,
    textBefore,
    textAfter,
    clausePath,
    paragraphId,
  }
}

/**
 * Extract text content from a tracked change element
 */
function extractTextFromElement(element: XmlElement): string {
  const textParts: string[] = []

  // Look for run elements
  let runElements = element.r as XmlElement[] | XmlElement | undefined
  if (!runElements) {
    return ''
  }

  // Ensure it's an array
  if (!Array.isArray(runElements)) {
    runElements = [runElements]
  }

  // Extract text from each run
  for (const rEl of runElements) {
    // Check for regular text element (w:t)
    const textElement = rEl.t as XmlElement[] | XmlElement | string | undefined
    if (textElement !== undefined) {
      // Ensure it's an array
      const textElements = Array.isArray(textElement) ? textElement : [textElement]

      for (const tEl of textElements) {
        // The text content is stored as #text or directly in the element
        const text = typeof tEl === 'string' ? tEl : ((tEl['#text'] as string) || '')
        if (text) {
          textParts.push(text)
        }
      }
    }

    // Check for deleted text element (w:delText) used in deletions
    const delTextElement = rEl.delText as XmlElement[] | XmlElement | string | undefined
    if (delTextElement !== undefined) {
      // Ensure it's an array
      const delTextElements = Array.isArray(delTextElement) ? delTextElement : [delTextElement]

      for (const dtEl of delTextElements) {
        // The text content is stored as #text or directly in the element
        const text = typeof dtEl === 'string' ? dtEl : ((dtEl['#text'] as string) || '')
        if (text) {
          textParts.push(text)
        }
      }
    }
  }

  return textParts.join('')
}

/**
 * Extract text runs with formatting from a tracked change element
 */
function extractTextRunsFromElement(element: XmlElement): TextRun[] {
  const textRuns: TextRun[] = []

  // Look for run elements
  let runElements = element.r as XmlElement[] | XmlElement | undefined
  if (!runElements) {
    return textRuns
  }

  // Ensure it's an array
  if (!Array.isArray(runElements)) {
    runElements = [runElements]
  }

  // Extract text and formatting from each run
  for (const rEl of runElements) {
    // Get run properties (rPr) for formatting
    const rPr = rEl.rPr as XmlElement | undefined
    const bold = !!rPr?.b
    const italic = !!rPr?.i

    // Check for regular text element (w:t)
    const textElement = rEl.t as XmlElement[] | XmlElement | string | undefined
    if (textElement !== undefined) {
      // Ensure it's an array
      const textElements = Array.isArray(textElement) ? textElement : [textElement]

      for (const tEl of textElements) {
        // The text content is stored as #text or directly in the element
        const text = typeof tEl === 'string' ? tEl : ((tEl['#text'] as string) || '')
        if (text) {
          textRuns.push({
            text,
            bold: bold || undefined,
            italic: italic || undefined,
          })
        }
      }
    }

    // Check for deleted text element (w:delText) used in deletions
    const delTextElement = rEl.delText as XmlElement[] | XmlElement | string | undefined
    if (delTextElement !== undefined) {
      // Ensure it's an array
      const delTextElements = Array.isArray(delTextElement) ? delTextElement : [delTextElement]

      for (const dtEl of delTextElements) {
        // The text content is stored as #text or directly in the element
        const text = typeof dtEl === 'string' ? dtEl : ((dtEl['#text'] as string) || '')
        if (text) {
          textRuns.push({
            text,
            bold: bold || undefined,
            italic: italic || undefined,
          })
        }
      }
    }
  }

  return textRuns
}

/**
 * Find the clause path for a given paragraph
 */
function findClausePathForParagraph(
  paragraphId: string,
  paragraphs: Paragraph[],
  headings: HeadingNode[]
): string[] {
  // Find the paragraph index
  const paragraphIndex = paragraphs.findIndex((p) => p.id === paragraphId)
  if (paragraphIndex === -1) {
    return []
  }

  // Find the most recent heading before this paragraph
  let currentHeading: HeadingNode | null = null
  for (let i = paragraphIndex; i >= 0; i--) {
    // eslint-disable-next-line security/detect-object-injection
    const para = paragraphs[i]
    if (para.isHeading) {
      // Find this heading in the heading hierarchy
      currentHeading = findHeadingByParagraphId(para.id, headings)
      if (currentHeading) break
    }
  }

  return currentHeading ? currentHeading.clausePath : []
}

/**
 * Find a heading node by its paragraph ID
 */
function findHeadingByParagraphId(
  paragraphId: string,
  headings: HeadingNode[]
): HeadingNode | null {
  for (const heading of headings) {
    if (heading.paragraphId === paragraphId) {
      return heading
    }
    const found = findHeadingByParagraphId(paragraphId, heading.children)
    if (found) return found
  }
  return null
}

/**
 * Extract context text before and after a change
 */
function extractContext(
  paragraphId: string,
  paragraphs: Paragraph[]
): { textBefore: string; textAfter: string } {
  const paragraphIndex = paragraphs.findIndex((p) => p.id === paragraphId)
  if (paragraphIndex === -1) {
    return { textBefore: '', textAfter: '' }
  }

  // Get text before (from previous paragraphs)
  const beforeParagraphs = paragraphs.slice(
    Math.max(0, paragraphIndex - CONTEXT_WINDOW_SIZE),
    paragraphIndex
  )
  const textBefore = beforeParagraphs.map((p) => p.text).join(' ')

  // Get text after (from following paragraphs)
  const afterParagraphs = paragraphs.slice(
    paragraphIndex + 1,
    paragraphIndex + 1 + CONTEXT_WINDOW_SIZE
  )
  const textAfter = afterParagraphs.map((p) => p.text).join(' ')

  return { textBefore, textAfter }
}

/**
 * Normalize timestamp to ISO 8601 format
 */
function normalizeTimestamp(timestamp: string): string {
  if (!timestamp) {
    return new Date().toISOString()
  }

  try {
    // Try to parse as ISO 8601
    const date = new Date(timestamp)
    if (!isNaN(date.getTime())) {
      return date.toISOString()
    }
  } catch {
    // Ignore parse errors and fall through to default
  }

  // Return current timestamp as fallback
  return new Date().toISOString()
}
