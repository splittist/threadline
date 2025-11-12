/**
 * Utilities for parsing DOCX numbering.xml
 */

import type { NumberingDefinition, NumberingLevel } from '../types/docx'

/**
 * Parse numbering.xml content and extract numbering definitions
 */
export function parseNumbering(numberingXml: string): Map<string, NumberingDefinition> {
  const parser = new DOMParser()
  const doc = parser.parseFromString(numberingXml, 'text/xml')
  const numberings = new Map<string, NumberingDefinition>()

  // Check for parsing errors
  const parserError = doc.querySelector('parsererror')
  if (parserError) {
    console.error('Error parsing numbering.xml:', parserError.textContent)
    return numberings
  }

  // First, parse abstract numbering definitions
  const abstractNums = new Map<string, NumberingLevel[]>()
  const abstractNumElements = doc.querySelectorAll('w\\:abstractNum, abstractNum')

  abstractNumElements.forEach((abstractNumEl) => {
    const abstractNumId =
      abstractNumEl.getAttribute('w:abstractNumId') || abstractNumEl.getAttribute('abstractNumId')
    if (!abstractNumId) return

    const levels = parseLevels(abstractNumEl)
    abstractNums.set(abstractNumId, levels)
  })

  // Then, parse numbering instances that reference abstract numberings
  const numElements = doc.querySelectorAll('w\\:num, num')

  numElements.forEach((numEl) => {
    const numId = numEl.getAttribute('w:numId') || numEl.getAttribute('numId')
    if (!numId) return

    // Get the abstract numbering ID this references
    const abstractNumIdEl = numEl.querySelector('w\\:abstractNumId, abstractNumId')
    const abstractNumId =
      abstractNumIdEl?.getAttribute('w:val') || abstractNumIdEl?.getAttribute('val')

    if (!abstractNumId) return

    const levels = abstractNums.get(abstractNumId) || []

    numberings.set(numId, {
      abstractNumId,
      numId,
      levels,
    })
  })

  return numberings
}

/**
 * Parse level definitions from an abstract numbering or numbering element
 */
function parseLevels(parent: Element): NumberingLevel[] {
  const levels: NumberingLevel[] = []
  const lvlElements = parent.querySelectorAll('w\\:lvl, lvl')

  lvlElements.forEach((lvlEl) => {
    const levelAttr = lvlEl.getAttribute('w:ilvl') || lvlEl.getAttribute('ilvl')
    if (levelAttr === null) return

    const level = parseInt(levelAttr)

    // Get number format
    const numFmtEl = lvlEl.querySelector('w\\:numFmt, numFmt')
    const format = numFmtEl?.getAttribute('w:val') || numFmtEl?.getAttribute('val') || 'decimal'

    // Get level text (e.g., "%1.", "%1.%2.", etc.)
    const lvlTextEl = lvlEl.querySelector('w\\:lvlText, lvlText')
    const levelText = lvlTextEl?.getAttribute('w:val') || lvlTextEl?.getAttribute('val') || ''

    // Get start value
    const startEl = lvlEl.querySelector('w\\:start, start')
    const start = startEl
      ? parseInt(startEl.getAttribute('w:val') || startEl.getAttribute('val') || '1')
      : 1

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
