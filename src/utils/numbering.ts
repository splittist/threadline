/**
 * Utilities for parsing DOCX numbering.xml
 */

import { XMLParser } from 'fast-xml-parser'
import type { NumberingDefinition, NumberingLevel } from '../types/docx'

// Type definitions for XML parsed structures
interface XmlElement {
  [key: string]: unknown
}

/**
 * Parse numbering.xml content and extract numbering definitions
 */
export function parseNumbering(numberingXml: string): Map<string, NumberingDefinition> {
  const numberings = new Map<string, NumberingDefinition>()

  if (!numberingXml || numberingXml.trim() === '') {
    return numberings
  }

  try {
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      removeNSPrefix: true, // Remove namespace prefixes like 'w:'
      parseAttributeValue: false, // Keep attribute values as strings
      parseTagValue: false, // Keep tag values as strings
    })

    const result = parser.parse(numberingXml) as XmlElement

    // Navigate to the numbering element
    const numberingElement = result?.numbering as XmlElement | undefined
    if (!numberingElement) {
      return numberings
    }

    // First, parse abstract numbering definitions
    const abstractNums = new Map<string, NumberingLevel[]>()
    let abstractNumElements = numberingElement.abstractNum as XmlElement[] | XmlElement | undefined

    if (abstractNumElements) {
      // Ensure it's an array
      if (!Array.isArray(abstractNumElements)) {
        abstractNumElements = [abstractNumElements]
      }

      abstractNumElements.forEach((abstractNumEl: XmlElement) => {
        const abstractNumId = abstractNumEl['@_abstractNumId'] as string | undefined
        if (!abstractNumId) return

        const levels = parseLevels(abstractNumEl)
        abstractNums.set(abstractNumId, levels)
      })
    }

    // Then, parse numbering instances that reference abstract numberings
    let numElements = numberingElement.num as XmlElement[] | XmlElement | undefined

    if (numElements) {
      // Ensure it's an array
      if (!Array.isArray(numElements)) {
        numElements = [numElements]
      }

      numElements.forEach((numEl: XmlElement) => {
        const numId = numEl['@_numId'] as string | undefined
        if (!numId) return

        // Get the abstract numbering ID this references
        const abstractNumIdEl = numEl.abstractNumId as XmlElement | undefined
        const abstractNumId = abstractNumIdEl?.['@_val'] as string | undefined

        if (!abstractNumId) return

        const levels = abstractNums.get(abstractNumId) || []

        numberings.set(numId, {
          abstractNumId,
          numId,
          levels,
        })
      })
    }
  } catch (error) {
    console.error('Error parsing numbering.xml:', error instanceof Error ? error.message : error)
  }

  return numberings
}

/**
 * Parse level definitions from an abstract numbering or numbering element
 */
function parseLevels(parent: XmlElement): NumberingLevel[] {
  const levels: NumberingLevel[] = []

  let lvlElements = parent.lvl as XmlElement[] | XmlElement | undefined
  if (!lvlElements) {
    return levels
  }

  // Ensure it's an array
  if (!Array.isArray(lvlElements)) {
    lvlElements = [lvlElements]
  }

  lvlElements.forEach((lvlEl: XmlElement) => {
    const levelAttr = lvlEl['@_ilvl'] as string | undefined
    if (levelAttr === null || levelAttr === undefined) return

    const level = parseInt(levelAttr)

    // Get number format
    const numFmtEl = lvlEl.numFmt as XmlElement | undefined
    const format = (numFmtEl?.['@_val'] as string | undefined) || 'decimal'

    // Get level text (e.g., "%1.", "%1.%2.", etc.)
    const lvlTextEl = lvlEl.lvlText as XmlElement | undefined
    const levelText = (lvlTextEl?.['@_val'] as string | undefined) || ''

    // Get start value
    const startEl = lvlEl.start as XmlElement | undefined
    const start = startEl ? parseInt((startEl['@_val'] as string | undefined) || '1') : 1

    levels.push({
      level,
      format,
      levelText,
      start,
    })
  })

  return levels
}

/**
 * Format a number according to the specified format
 */
export function formatNumber(value: number, format: string): string {
  switch (format.toLowerCase()) {
    case 'decimal':
      return value.toString()
    case 'lowerletter':
      return toLowerLetter(value)
    case 'upperletter':
      return toUpperLetter(value)
    case 'lowerroman':
      return toLowerRoman(value)
    case 'upperroman':
      return toUpperRoman(value)
    case 'ordinal':
      return toOrdinal(value)
    case 'bullet':
      return '•'
    case 'none':
      return ''
    default:
      return value.toString()
  }
}

/**
 * Convert number to lowercase letter (1=a, 2=b, ..., 27=aa)
 */
function toLowerLetter(value: number): string {
  let result = ''
  let n = value - 1

  while (n >= 0) {
    result = String.fromCharCode(97 + (n % 26)) + result
    n = Math.floor(n / 26) - 1
  }

  return result
}

/**
 * Convert number to uppercase letter (1=A, 2=B, ..., 27=AA)
 */
function toUpperLetter(value: number): string {
  return toLowerLetter(value).toUpperCase()
}

/**
 * Convert number to lowercase Roman numeral
 */
function toLowerRoman(value: number): string {
  return toRomanNumeral(value).toLowerCase()
}

/**
 * Convert number to uppercase Roman numeral
 */
function toUpperRoman(value: number): string {
  return toRomanNumeral(value)
}

/**
 * Convert number to Roman numeral
 */
function toRomanNumeral(num: number): string {
  if (num <= 0 || num >= 4000) return num.toString()

  const romanNumerals: [number, string][] = [
    [1000, 'M'],
    [900, 'CM'],
    [500, 'D'],
    [400, 'CD'],
    [100, 'C'],
    [90, 'XC'],
    [50, 'L'],
    [40, 'XL'],
    [10, 'X'],
    [9, 'IX'],
    [5, 'V'],
    [4, 'IV'],
    [1, 'I'],
  ]

  let result = ''
  let remaining = num

  for (const [value, numeral] of romanNumerals) {
    while (remaining >= value) {
      result += numeral
      remaining -= value
    }
  }

  return result
}

/**
 * Convert number to ordinal (1st, 2nd, 3rd, etc.)
 */
function toOrdinal(value: number): string {
  const suffixes = ['th', 'st', 'nd', 'rd']
  const v = value % 100
  // eslint-disable-next-line security/detect-object-injection
  return value + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0])
}

/**
 * Compute the number text for a specific level based on the level text template
 * @param levelText - The template (e.g., "%1.", "%1.%2.", "%1.%2.%3")
 * @param counters - Array of counter values for each level
 * @param formats - Array of format types for each level
 */
export function computeNumberText(
  levelText: string,
  counters: number[],
  formats: string[]
): string {
  let result = levelText

  // Replace placeholders %1, %2, %3, etc. with formatted numbers
  for (let i = 0; i < counters.length; i++) {
    const placeholder = `%${i + 1}`
    // eslint-disable-next-line security/detect-object-injection
    const format = formats[i] || 'decimal'
    // eslint-disable-next-line security/detect-object-injection
    const formattedNumber = formatNumber(counters[i], format)
    result = result.replace(placeholder, formattedNumber)
  }

  return result
}
