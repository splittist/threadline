/**
 * Utilities for parsing DOCX styles.xml
 */

import { XMLParser } from 'fast-xml-parser'
import type { StyleDefinition } from '../types/docx'

// Type definitions for XML parsed structures
interface XmlElement {
  [key: string]: unknown
}

/**
 * Parse styles.xml content and extract style definitions
 */
export function parseStyles(stylesXml: string): Map<string, StyleDefinition> {
  const styles = new Map<string, StyleDefinition>()

  if (!stylesXml || stylesXml.trim() === '') {
    return styles
  }

  try {
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      removeNSPrefix: true, // Remove namespace prefixes like 'w:'
      parseAttributeValue: false, // Keep attribute values as strings
      parseTagValue: false, // Keep tag values as strings
    })

    const result = parser.parse(stylesXml) as XmlElement

    // Navigate to the styles element
    const stylesElement = result?.styles as XmlElement | undefined
    if (!stylesElement) {
      return styles
    }

    // Get all style elements - could be a single object or array
    let styleElements = stylesElement.style as XmlElement[] | XmlElement | undefined
    if (!styleElements) {
      return styles
    }

    // Ensure it's an array
    if (!Array.isArray(styleElements)) {
      styleElements = [styleElements]
    }

    // Process each style element
    styleElements.forEach((styleEl: XmlElement) => {
      const styleId = styleEl['@_styleId'] as string | undefined
      if (!styleId) return

      const type = (styleEl['@_type'] as string | undefined) || 'paragraph'

      // Get style name
      const nameEl = styleEl.name as XmlElement | undefined
      const name = (nameEl?.['@_val'] as string | undefined) || styleId

      // Get basedOn (parent style)
      const basedOnEl = styleEl.basedOn as XmlElement | undefined
      const basedOn = (basedOnEl?.['@_val'] as string | undefined) || null

      // Get outline level (pPr > outlineLvl)
      const pPr = styleEl.pPr as XmlElement | undefined
      const outlineLvlEl = pPr?.outlineLvl as XmlElement | undefined
      const outlineLevel = outlineLvlEl
        ? parseInt((outlineLvlEl['@_val'] as string | undefined) || '-1')
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
  } catch (error) {
    console.error('Error parsing styles.xml:', error instanceof Error ? error.message : error)
  }

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
      // But only override heading properties if they're explicitly set
      return {
        ...baseStyle,
        ...style,
        // Keep original IDs
        styleId: style.styleId,
        name: style.name,
        // Inherit heading properties from base if not explicitly set in current style
        isHeading: style.outlineLevel !== null ? style.isHeading : baseStyle.isHeading,
        headingLevel:
          style.outlineLevel !== null ? style.headingLevel : baseStyle.headingLevel,
      }
    }
  }

  return style
}
