/**
 * Utilities for parsing DOCX document.xml and extracting structure
 */

import type {
  Paragraph,
  TextRun,
  DocumentHierarchy,
  Section,
  NumberingInfo,
  StyleDefinition,
} from '../types/docx'
import { resolveStyle } from './styles'

/**
 * Parse document.xml and extract document hierarchy
 */
export function parseDocumentXml(
  documentXml: string,
  styles: Map<string, StyleDefinition>
): DocumentHierarchy {
  const parser = new DOMParser()
  const doc = parser.parseFromString(documentXml, 'text/xml')

  // Check for parsing errors
  const parserError = doc.querySelector('parsererror')
  if (parserError) {
    console.error('Error parsing document.xml:', parserError.textContent)
    return { paragraphs: [], sections: [] }
  }

  const paragraphs: Paragraph[] = []
  const sections: Section[] = []

  // Get all paragraph elements
  const paragraphElements = doc.querySelectorAll('w\\:p, p')
  let currentSectionIndex = 0
  let currentSectionParagraphIds: string[] = []

  paragraphElements.forEach((pEl, index) => {
    const paragraph = parseParagraph(pEl, index, styles)
    paragraphs.push(paragraph)
    currentSectionParagraphIds.push(paragraph.id)

    // Check if this paragraph ends a section
    const sectPr = pEl.querySelector('w\\:pPr w\\:sectPr, pPr sectPr')
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

  return { paragraphs, sections }
}

/**
 * Parse a single paragraph element
 */
function parseParagraph(
  pEl: Element,
  index: number,
  styles: Map<string, StyleDefinition>
): Paragraph {
  const id = `p-${index}`

  // Get paragraph properties
  const pPr = pEl.querySelector('w\\:pPr, pPr')

  // Get style ID
  const pStyleEl = pPr?.querySelector('w\\:pStyle, pStyle')
  const styleId = pStyleEl?.getAttribute('w:val') || pStyleEl?.getAttribute('val') || null

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
function parseNumberingInfo(pPr: Element | null): NumberingInfo | null {
  if (!pPr) return null

  const numPr = pPr.querySelector('w\\:numPr, numPr')
  if (!numPr) return null

  // Get numbering ID
  const numIdEl = numPr.querySelector('w\\:numId, numId')
  const numId = numIdEl?.getAttribute('w:val') || numIdEl?.getAttribute('val')

  // Get level
  const ilvlEl = numPr.querySelector('w\\:ilvl, ilvl')
  const level = ilvlEl
    ? parseInt(ilvlEl.getAttribute('w:val') || ilvlEl.getAttribute('val') || '0')
    : 0

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
function parseTextRuns(pEl: Element): TextRun[] {
  const runs: TextRun[] = []
  const runElements = pEl.querySelectorAll('w\\:r, r')

  runElements.forEach((rEl) => {
    // Get run properties
    const rPr = rEl.querySelector('w\\:rPr, rPr')

    const bold = !!rPr?.querySelector('w\\:b, b')
    const italic = !!rPr?.querySelector('w\\:i, i')
    const underline = !!rPr?.querySelector('w\\:u, u')

    // Get text content
    const textElements = rEl.querySelectorAll('w\\:t, t')
    textElements.forEach((tEl) => {
      const text = tEl.textContent || ''
      if (text) {
        runs.push({
          text,
          bold: bold || undefined,
          italic: italic || undefined,
          underline: underline || undefined,
        })
      }
    })

    // Handle tab characters
    const tabElements = rEl.querySelectorAll('w\\:tab, tab')
    tabElements.forEach(() => {
      runs.push({ text: '\t' })
    })

    // Handle line breaks
    const brElements = rEl.querySelectorAll('w\\:br, br')
    brElements.forEach(() => {
      runs.push({ text: '\n' })
    })
  })

  return runs
}
