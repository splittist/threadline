import { describe, it, expect } from 'vitest'
import { parseNumbering, formatNumber, computeNumberText } from './numbering'

describe('parseNumbering', () => {
  it('parses a simple decimal numbering', () => {
    const xml = `<?xml version="1.0"?>
<w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:abstractNum w:abstractNumId="0">
    <w:lvl w:ilvl="0">
      <w:start w:val="1"/>
      <w:numFmt w:val="decimal"/>
      <w:lvlText w:val="%1."/>
    </w:lvl>
  </w:abstractNum>
  <w:num w:numId="1">
    <w:abstractNumId w:val="0"/>
  </w:num>
</w:numbering>`

    const numberings = parseNumbering(xml)
    expect(numberings.size).toBeGreaterThan(0)

    const num1 = numberings.get('1')
    expect(num1).toBeDefined()
    expect(num1?.abstractNumId).toBe('0')
    expect(num1?.levels).toHaveLength(1)
    expect(num1?.levels[0].level).toBe(0)
    expect(num1?.levels[0].format).toBe('decimal')
    expect(num1?.levels[0].levelText).toBe('%1.')
  })

  it('parses multi-level numbering', () => {
    const xml = `<?xml version="1.0"?>
<w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:abstractNum w:abstractNumId="0">
    <w:lvl w:ilvl="0">
      <w:start w:val="1"/>
      <w:numFmt w:val="decimal"/>
      <w:lvlText w:val="%1."/>
    </w:lvl>
    <w:lvl w:ilvl="1">
      <w:start w:val="1"/>
      <w:numFmt w:val="lowerLetter"/>
      <w:lvlText w:val="%1.%2."/>
    </w:lvl>
  </w:abstractNum>
  <w:num w:numId="1">
    <w:abstractNumId w:val="0"/>
  </w:num>
</w:numbering>`

    const numberings = parseNumbering(xml)
    const num1 = numberings.get('1')

    expect(num1?.levels).toHaveLength(2)
    expect(num1?.levels[1].level).toBe(1)
    expect(num1?.levels[1].format).toBe('lowerLetter')
    expect(num1?.levels[1].levelText).toBe('%1.%2.')
  })

  it('handles invalid XML gracefully', () => {
    const invalidXml = 'not valid xml'
    const numberings = parseNumbering(invalidXml)
    expect(numberings.size).toBe(0)
  })

  it('handles empty numbering', () => {
    const xml = `<?xml version="1.0"?>
<w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
</w:numbering>`

    const numberings = parseNumbering(xml)
    expect(numberings.size).toBe(0)
  })
})

describe('formatNumber', () => {
  it('formats decimal numbers', () => {
    expect(formatNumber(1, 'decimal')).toBe('1')
    expect(formatNumber(42, 'decimal')).toBe('42')
    expect(formatNumber(100, 'decimal')).toBe('100')
  })

  it('formats lowercase letters', () => {
    expect(formatNumber(1, 'lowerLetter')).toBe('a')
    expect(formatNumber(2, 'lowerLetter')).toBe('b')
    expect(formatNumber(26, 'lowerLetter')).toBe('z')
    expect(formatNumber(27, 'lowerLetter')).toBe('aa')
  })

  it('formats uppercase letters', () => {
    expect(formatNumber(1, 'upperLetter')).toBe('A')
    expect(formatNumber(2, 'upperLetter')).toBe('B')
    expect(formatNumber(26, 'upperLetter')).toBe('Z')
    expect(formatNumber(27, 'upperLetter')).toBe('AA')
  })

  it('formats lowercase Roman numerals', () => {
    expect(formatNumber(1, 'lowerRoman')).toBe('i')
    expect(formatNumber(4, 'lowerRoman')).toBe('iv')
    expect(formatNumber(9, 'lowerRoman')).toBe('ix')
    expect(formatNumber(10, 'lowerRoman')).toBe('x')
    expect(formatNumber(50, 'lowerRoman')).toBe('l')
  })

  it('formats uppercase Roman numerals', () => {
    expect(formatNumber(1, 'upperRoman')).toBe('I')
    expect(formatNumber(4, 'upperRoman')).toBe('IV')
    expect(formatNumber(9, 'upperRoman')).toBe('IX')
    expect(formatNumber(10, 'upperRoman')).toBe('X')
    expect(formatNumber(50, 'upperRoman')).toBe('L')
  })

  it('formats ordinal numbers', () => {
    expect(formatNumber(1, 'ordinal')).toBe('1st')
    expect(formatNumber(2, 'ordinal')).toBe('2nd')
    expect(formatNumber(3, 'ordinal')).toBe('3rd')
    expect(formatNumber(4, 'ordinal')).toBe('4th')
    expect(formatNumber(11, 'ordinal')).toBe('11th')
    expect(formatNumber(21, 'ordinal')).toBe('21st')
  })

  it('formats bullet', () => {
    expect(formatNumber(1, 'bullet')).toBe('•')
    expect(formatNumber(5, 'bullet')).toBe('•')
  })

  it('formats none as empty string', () => {
    expect(formatNumber(1, 'none')).toBe('')
    expect(formatNumber(10, 'none')).toBe('')
  })

  it('handles unknown format as decimal', () => {
    expect(formatNumber(5, 'unknown')).toBe('5')
  })
})

describe('computeNumberText', () => {
  it('computes single-level numbering', () => {
    const result = computeNumberText('%1.', [1], ['decimal'])
    expect(result).toBe('1.')
  })

  it('computes multi-level numbering', () => {
    const result = computeNumberText('%1.%2.', [1, 2], ['decimal', 'decimal'])
    expect(result).toBe('1.2.')
  })

  it('computes mixed format numbering', () => {
    const result = computeNumberText('%1.%2.', [1, 1], ['decimal', 'lowerLetter'])
    expect(result).toBe('1.a.')
  })

  it('computes three-level numbering', () => {
    const result = computeNumberText(
      '%1.%2.%3',
      [2, 3, 5],
      ['decimal', 'decimal', 'decimal']
    )
    expect(result).toBe('2.3.5')
  })

  it('handles partial replacement', () => {
    const result = computeNumberText('Section %1', [5], ['decimal'])
    expect(result).toBe('Section 5')
  })
})
