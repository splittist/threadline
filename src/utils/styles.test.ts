import { describe, it, expect } from 'vitest'
import { parseStyles, resolveStyle } from './styles'

describe('parseStyles', () => {
  it('parses a simple heading style', () => {
    const xml = `<?xml version="1.0"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:style w:type="paragraph" w:styleId="Heading1">
    <w:name w:val="Heading 1"/>
    <w:pPr>
      <w:outlineLvl w:val="0"/>
    </w:pPr>
  </w:style>
</w:styles>`

    const styles = parseStyles(xml)
    expect(styles.size).toBeGreaterThan(0)

    const heading1 = styles.get('Heading1')
    expect(heading1).toBeDefined()
    expect(heading1?.name).toBe('Heading 1')
    expect(heading1?.isHeading).toBe(true)
    expect(heading1?.headingLevel).toBe(1)
    expect(heading1?.outlineLevel).toBe(0)
  })

  it('parses multiple heading styles', () => {
    const xml = `<?xml version="1.0"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:style w:type="paragraph" w:styleId="Heading1">
    <w:name w:val="Heading 1"/>
    <w:pPr>
      <w:outlineLvl w:val="0"/>
    </w:pPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading2">
    <w:name w:val="Heading 2"/>
    <w:pPr>
      <w:outlineLvl w:val="1"/>
    </w:pPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Normal">
    <w:name w:val="Normal"/>
  </w:style>
</w:styles>`

    const styles = parseStyles(xml)
    expect(styles.size).toBe(3)

    const heading1 = styles.get('Heading1')
    expect(heading1?.headingLevel).toBe(1)

    const heading2 = styles.get('Heading2')
    expect(heading2?.headingLevel).toBe(2)

    const normal = styles.get('Normal')
    expect(normal?.isHeading).toBe(false)
    expect(normal?.headingLevel).toBeNull()
  })

  it('handles style inheritance with basedOn', () => {
    const xml = `<?xml version="1.0"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:style w:type="paragraph" w:styleId="Heading1">
    <w:name w:val="Heading 1"/>
    <w:pPr>
      <w:outlineLvl w:val="0"/>
    </w:pPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="CustomHeading">
    <w:name w:val="Custom Heading"/>
    <w:basedOn w:val="Heading1"/>
  </w:style>
</w:styles>`

    const styles = parseStyles(xml)
    const customHeading = styles.get('CustomHeading')

    expect(customHeading?.basedOn).toBe('Heading1')
  })

  it('handles invalid XML gracefully', () => {
    const invalidXml = 'not valid xml'
    const styles = parseStyles(invalidXml)
    expect(styles.size).toBe(0)
  })

  it('handles empty styles', () => {
    const xml = `<?xml version="1.0"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
</w:styles>`

    const styles = parseStyles(xml)
    expect(styles.size).toBe(0)
  })
})

describe('resolveStyle', () => {
  it('resolves a simple style', () => {
    const xml = `<?xml version="1.0"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:style w:type="paragraph" w:styleId="Heading1">
    <w:name w:val="Heading 1"/>
    <w:pPr>
      <w:outlineLvl w:val="0"/>
    </w:pPr>
  </w:style>
</w:styles>`

    const styles = parseStyles(xml)
    const resolved = resolveStyle('Heading1', styles)

    expect(resolved).toBeDefined()
    expect(resolved?.name).toBe('Heading 1')
    expect(resolved?.headingLevel).toBe(1)
  })

  it('resolves style inheritance', () => {
    const xml = `<?xml version="1.0"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:style w:type="paragraph" w:styleId="Heading1">
    <w:name w:val="Heading 1"/>
    <w:pPr>
      <w:outlineLvl w:val="0"/>
    </w:pPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="CustomHeading">
    <w:name w:val="Custom Heading"/>
    <w:basedOn w:val="Heading1"/>
  </w:style>
</w:styles>`

    const styles = parseStyles(xml)
    const resolved = resolveStyle('CustomHeading', styles)

    expect(resolved).toBeDefined()
    expect(resolved?.name).toBe('Custom Heading')
    expect(resolved?.styleId).toBe('CustomHeading')
    // Should inherit heading properties from Heading1
    expect(resolved?.isHeading).toBe(true)
    expect(resolved?.headingLevel).toBe(1)
  })

  it('returns null for non-existent style', () => {
    const styles = new Map()
    const resolved = resolveStyle('NonExistent', styles)
    expect(resolved).toBeNull()
  })

  it('returns null for null styleId', () => {
    const styles = new Map()
    const resolved = resolveStyle(null, styles)
    expect(resolved).toBeNull()
  })
})
