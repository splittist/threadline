/**
 * Utilities for parsing DOCX styles.xml
 */

import type { StyleDefinition } from '../types/docx'

/**
 * Parse styles.xml content and extract style definitions
 */
export function parseStyles(stylesXml: string): Map<string, StyleDefinition> {
  const parser = new DOMParser()
  const doc = parser.parseFromString(stylesXml, 'text/xml')
  const styles = new Map<string, StyleDefinition>()

  // Check for parsing errors
  const parserError = doc.querySelector('parsererror')
  if (parserError) {
    console.error('Error parsing styles.xml:', parserError.textContent)
    return styles
  }

  // Get all style elements
  const styleElements = doc.querySelectorAll('w\\:style, style')

  styleElements.forEach((styleEl) => {
    const styleId = styleEl.getAttribute('w:styleId') || styleEl.getAttribute('styleId')
    if (!styleId) return

    const type = styleEl.getAttribute('w:type') || styleEl.getAttribute('type') || 'paragraph'

    // Get style name
    const nameEl = styleEl.querySelector('w\\:name, name')
    const name = nameEl?.getAttribute('w:val') || nameEl?.getAttribute('val') || styleId

    // Get basedOn (parent style)
    const basedOnEl = styleEl.querySelector('w\\:basedOn, basedOn')
    const basedOn = basedOnEl?.getAttribute('w:val') || basedOnEl?.getAttribute('val') || null

    // Get outline level (pPr > outlineLvl)
    const outlineLvlEl = styleEl.querySelector('w\\:pPr w\\:outlineLvl, pPr outlineLvl')
    const outlineLevel = outlineLvlEl
      ? parseInt(outlineLvlEl.getAttribute('w:val') || outlineLvlEl.getAttribute('val') || '-1')
      : null

    // Determine if this is a heading style
    const isHeading = isHeadingStyle(name, styleId, outlineLevel)
    const headingLevel = isHeading ? getHeadingLevel(name, styleId, outlineLevel) : null

    styles.set(styleId, {
      styleId,
      name,
      type,
      basedOn,
      isHeading,
      headingLevel,
      outlineLevel,
    })
  })

  return styles
}

/**
 * Determine if a style is a heading style
 */
function isHeadingStyle(name: string, styleId: string, outlineLevel: number | null): boolean {
  // Check if name or ID contains "Heading"
  const nameUpper = name.toUpperCase()
  const idUpper = styleId.toUpperCase()

  if (nameUpper.includes('HEADING') || idUpper.includes('HEADING')) {
    return true
  }

  // Check if it has an outline level (0-8 for heading levels 1-9)
  if (outlineLevel !== null && outlineLevel >= 0 && outlineLevel <= 8) {
    return true
  }

  return false
}

/**
 * Extract heading level from style name, ID, or outline level
 */
function getHeadingLevel(
  name: string,
  styleId: string,
  outlineLevel: number | null
): number | null {
  // Try to extract from name (e.g., "Heading 1", "Heading1")
  const nameMatch = name.match(/heading\s*(\d+)/i)
  if (nameMatch) {
    const level = parseInt(nameMatch[1])
    if (level >= 1 && level <= 9) return level
  }

  // Try to extract from styleId
  const idMatch = styleId.match(/heading\s*(\d+)/i)
  if (idMatch) {
    const level = parseInt(idMatch[1])
    if (level >= 1 && level <= 9) return level
  }

  // Use outline level (0-based, so add 1)
  if (outlineLevel !== null && outlineLevel >= 0 && outlineLevel <= 8) {
    return outlineLevel + 1
  }

  return null
}

/**
 * Get effective style for a styleId, following the basedOn chain
 */
export function resolveStyle(
  styleId: string | null,
  styles: Map<string, StyleDefinition>
): StyleDefinition | null {
  if (!styleId) return null

  const style = styles.get(styleId)
  if (!style) return null

  // If this style has a basedOn, merge properties
  if (style.basedOn) {
    const baseStyle = resolveStyle(style.basedOn, styles)
    if (baseStyle) {
      // Merge with precedence: current style overrides base
      return {
        ...baseStyle,
        ...style,
        // Keep original IDs
        styleId: style.styleId,
        name: style.name,
      }
    }
  }

  return style
}
