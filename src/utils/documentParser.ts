/**
 * Utilities for parsing DOCX document.xml and extracting structure
 */

import { XMLParser } from 'fast-xml-parser'
import type {
  Paragraph,
  TextRun,
  DocumentHierarchy,
  Section,
  NumberingInfo,
  StyleDefinition,
} from '../types/docx'
import { resolveStyle } from './styles'

// Type definitions for XML parsed structures
interface XmlElement {
  [key: string]: unknown
}

/**
 * Parse document.xml and extract document hierarchy
 */
export function parseDocumentXml(
  documentXml: string,
  styles: Map<string, StyleDefinition>
): DocumentHierarchy {
  const paragraphs: Paragraph[] = []
  const sections: Section[] = []

  if (!documentXml || documentXml.trim() === '') {
    return { paragraphs, sections }
  }

  try {
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      removeNSPrefix: true, // Remove namespace prefixes like 'w:'
      parseAttributeValue: false, // Keep attribute values as strings
      parseTagValue: false, // Keep tag values as strings
      isArray: (name) => {
        // These tags can appear multiple times and should always be arrays
        return ['p', 'r', 't', 'tab', 'br'].includes(name)
      },
    })

    const result = parser.parse(documentXml) as XmlElement

    // Navigate to the body element
    const document = result?.document as XmlElement | undefined
    const body = document?.body as XmlElement | undefined
    if (!body) {
      return { paragraphs, sections }
    }

    // Get all paragraph elements
    const paragraphElements = body.p as XmlElement[] | undefined
    if (!paragraphElements || !Array.isArray(paragraphElements)) {
      return { paragraphs, sections }
    }

    let currentSectionIndex = 0
    let currentSectionParagraphIds: string[] = []

    paragraphElements.forEach((pEl: XmlElement, index: number) => {
      const paragraph = parseParagraph(pEl, index, styles)
      paragraphs.push(paragraph)
      currentSectionParagraphIds.push(paragraph.id)

      // Check if this paragraph ends a section
      const pPr = pEl.pPr as XmlElement | undefined
      const sectPr = pPr?.sectPr
      if (sectPr) {
        sections.push({
          index: currentSectionIndex,
          paragraphIds: [...currentSectionParagraphIds],
        })
        currentSectionIndex++
        currentSectionParagraphIds = []
      }
    })

    // Add final section if there are remaining paragraphs
    if (currentSectionParagraphIds.length > 0) {
      sections.push({
        index: currentSectionIndex,
        paragraphIds: currentSectionParagraphIds,
      })
    }
  } catch (error) {
    console.error('Error parsing document.xml:', error instanceof Error ? error.message : error)
  }

  return { paragraphs, sections }
}

/**
 * Parse a single paragraph element
 */
function parseParagraph(
  pEl: XmlElement,
  index: number,
  styles: Map<string, StyleDefinition>
): Paragraph {
  const id = `p-${index}`

  // Get paragraph properties
  const pPr = pEl.pPr as XmlElement | undefined

  // Get style ID
  const pStyleEl = pPr?.pStyle as XmlElement | undefined
  const styleId = (pStyleEl?.['@_val'] as string | undefined) || null

  // Resolve style to get heading info
  const resolvedStyle = styleId ? resolveStyle(styleId, styles) : null
  const styleName = resolvedStyle?.name || null
  const isHeading = resolvedStyle?.isHeading || false
  const headingLevel = resolvedStyle?.headingLevel || null

  // Get numbering info
  const numbering = parseNumberingInfo(pPr)

  // Parse text runs
  const runs = parseTextRuns(pEl)

  // Get full paragraph text
  const text = runs.map((r) => r.text).join('')

  return {
    id,
    text,
    styleId,
    styleName,
    headingLevel,
    numbering,
    runs,
    isHeading,
  }
}

/**
 * Parse numbering information from paragraph properties
 */
function parseNumberingInfo(pPr: XmlElement | undefined): NumberingInfo | null {
  if (!pPr) return null

  const numPr = pPr.numPr as XmlElement | undefined
  if (!numPr) return null

  // Get numbering ID
  const numIdEl = numPr.numId as XmlElement | undefined
  const numId = numIdEl?.['@_val'] as string | undefined

  // Get level
  const ilvlEl = numPr.ilvl as XmlElement | undefined
  const level = ilvlEl ? parseInt((ilvlEl['@_val'] as string) || '0') : 0

  if (!numId) return null

  return {
    numId,
    level,
    numberText: null, // Will be computed later with full context
  }
}

/**
 * Parse text runs from a paragraph element
 */
function parseTextRuns(pEl: XmlElement): TextRun[] {
  const runs: TextRun[] = []

  let runElements = pEl.r as XmlElement[] | XmlElement | undefined
  if (!runElements) {
    return runs
  }

  // Ensure it's an array
  if (!Array.isArray(runElements)) {
    runElements = [runElements]
  }

  runElements.forEach((rEl: XmlElement) => {
    // Get run properties
    const rPr = rEl.rPr as XmlElement | undefined

    const bold = !!rPr?.b
    const italic = !!rPr?.i
    const underline = !!rPr?.u

    // Get text content
    const textElement = rEl.t as XmlElement[] | XmlElement | string | undefined
    if (textElement !== undefined) {
      // Ensure it's an array
      const textElements = Array.isArray(textElement) ? textElement : [textElement]

      textElements.forEach((tEl: XmlElement | string) => {
        // The text content is stored as #text or directly in the element
        const text = typeof tEl === 'string' ? tEl : ((tEl['#text'] as string) || '')
        if (text) {
          runs.push({
            text,
            bold: bold || undefined,
            italic: italic || undefined,
            underline: underline || undefined,
          })
        }
      })
    }

    // Handle tab characters
    let tabElements = rEl.tab as XmlElement[] | XmlElement | undefined
    if (tabElements) {
      if (!Array.isArray(tabElements)) {
        tabElements = [tabElements]
      }
      tabElements.forEach(() => {
        runs.push({ text: '\t' })
      })
    }

    // Handle line breaks
    let brElements = rEl.br as XmlElement[] | XmlElement | undefined
    if (brElements) {
      if (!Array.isArray(brElements)) {
        brElements = [brElements]
      }
      brElements.forEach(() => {
        runs.push({ text: '\n' })
      })
    }
  })

  return runs
}
