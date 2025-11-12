/**
 * Integration test for the full DOCX parsing workflow
 */

import { describe, it, expect } from 'vitest'
import { parseStyles } from './styles'
import { parseNumbering } from './numbering'
import { parseDocumentXml } from './documentParser'
import { buildHeadingHierarchy, flattenHeadings } from './headingHierarchy'

describe('DOCX Parsing Integration', () => {
  it('parses a complete document with headings and clause paths', () => {
    // Sample styles.xml
    const stylesXml = `<?xml version="1.0"?>
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

    // Sample numbering.xml
    const numberingXml = `<?xml version="1.0"?>
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

    // Sample document.xml with headings
    const documentXml = `<?xml version="1.0"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:pPr>
        <w:pStyle w:val="Heading1"/>
        <w:numPr>
          <w:ilvl w:val="0"/>
          <w:numId w:val="1"/>
        </w:numPr>
      </w:pPr>
      <w:r>
        <w:t>Introduction</w:t>
      </w:r>
    </w:p>
    
    <w:p>
      <w:pPr>
        <w:pStyle w:val="Normal"/>
      </w:pPr>
      <w:r>
        <w:t>This is the introduction paragraph.</w:t>
      </w:r>
    </w:p>
    
    <w:p>
      <w:pPr>
        <w:pStyle w:val="Heading1"/>
        <w:numPr>
          <w:ilvl w:val="0"/>
          <w:numId w:val="1"/>
        </w:numPr>
      </w:pPr>
      <w:r>
        <w:t>Definitions</w:t>
      </w:r>
    </w:p>
    
    <w:p>
      <w:pPr>
        <w:pStyle w:val="Heading2"/>
      </w:pPr>
      <w:r>
        <w:t>Key Terms</w:t>
      </w:r>
    </w:p>
    
    <w:p>
      <w:pPr>
        <w:pStyle w:val="Normal"/>
      </w:pPr>
      <w:r>
        <w:t>Terms are defined here.</w:t>
      </w:r>
    </w:p>
  </w:body>
</w:document>`

    // Parse all components
    const styles = parseStyles(stylesXml)
    const numberings = parseNumbering(numberingXml)
    const hierarchy = parseDocumentXml(documentXml, styles)
    const headings = buildHeadingHierarchy(hierarchy.paragraphs, numberings)

    // Verify paragraphs were extracted
    expect(hierarchy.paragraphs).toHaveLength(5)

    // Verify headings were identified
    const headingParagraphs = hierarchy.paragraphs.filter((p) => p.isHeading)
    expect(headingParagraphs).toHaveLength(3)

    // Verify heading levels
    expect(headingParagraphs[0].headingLevel).toBe(1)
    expect(headingParagraphs[1].headingLevel).toBe(1)
    expect(headingParagraphs[2].headingLevel).toBe(2)

    // Verify heading text
    expect(headingParagraphs[0].text).toBe('Introduction')
    expect(headingParagraphs[1].text).toBe('Definitions')
    expect(headingParagraphs[2].text).toBe('Key Terms')

    // Verify heading hierarchy
    expect(headings).toHaveLength(2) // Two top-level headings

    const firstHeading = headings[0]
    expect(firstHeading.text).toBe('Introduction')
    expect(firstHeading.level).toBe(1)
    expect(firstHeading.number).toBe('1.')
    expect(firstHeading.children).toHaveLength(0)

    const secondHeading = headings[1]
    expect(secondHeading.text).toBe('Definitions')
    expect(secondHeading.level).toBe(1)
    expect(secondHeading.number).toBe('2.')
    expect(secondHeading.children).toHaveLength(1)

    // Verify nested heading
    const nestedHeading = secondHeading.children[0]
    expect(nestedHeading.text).toBe('Key Terms')
    expect(nestedHeading.level).toBe(2)

    // Verify clause paths
    expect(firstHeading.clausePath).toEqual(['1.'])
    expect(secondHeading.clausePath).toEqual(['2.'])
    expect(nestedHeading.clausePath).toEqual(['2.', 'Key Terms'])
  })

  it('parses document with manual numbering in heading text', () => {
    const stylesXml = `<?xml version="1.0"?>
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
</w:styles>`

    const documentXml = `<?xml version="1.0"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:pPr>
        <w:pStyle w:val="Heading1"/>
      </w:pPr>
      <w:r>
        <w:t>8. Termination</w:t>
      </w:r>
    </w:p>
    
    <w:p>
      <w:pPr>
        <w:pStyle w:val="Heading2"/>
      </w:pPr>
      <w:r>
        <w:t>8.1 Termination for Cause</w:t>
      </w:r>
    </w:p>
    
    <w:p>
      <w:pPr>
        <w:pStyle w:val="Heading2"/>
      </w:pPr>
      <w:r>
        <w:t>8.2 Force Majeure</w:t>
      </w:r>
    </w:p>
  </w:body>
</w:document>`

    const styles = parseStyles(stylesXml)
    const numberings = parseNumbering('')
    const hierarchy = parseDocumentXml(documentXml, styles)
    const headings = buildHeadingHierarchy(hierarchy.paragraphs, numberings)

    // Verify heading structure
    expect(headings).toHaveLength(1)

    const mainHeading = headings[0]
    expect(mainHeading.text).toBe('8. Termination')
    expect(mainHeading.number).toBe('8.')
    expect(mainHeading.children).toHaveLength(2)

    // Verify clause paths match the expected format from PRD
    expect(mainHeading.clausePath).toEqual(['8.'])

    const child1 = mainHeading.children[0]
    expect(child1.text).toBe('8.1 Termination for Cause')
    expect(child1.number).toBe('8.1')
    expect(child1.clausePath).toEqual(['8.', '8.1'])

    const child2 = mainHeading.children[1]
    expect(child2.text).toBe('8.2 Force Majeure')
    expect(child2.number).toBe('8.2')
    expect(child2.clausePath).toEqual(['8.', '8.2'])

    // Flatten headings to get all in order
    const allHeadings = flattenHeadings(headings)
    expect(allHeadings).toHaveLength(3)
    expect(allHeadings[0].clausePath).toEqual(['8.'])
    expect(allHeadings[1].clausePath).toEqual(['8.', '8.1'])
    expect(allHeadings[2].clausePath).toEqual(['8.', '8.2'])
  })

  it('handles documents with mixed heading styles', () => {
    const stylesXml = `<?xml version="1.0"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:style w:type="paragraph" w:styleId="Heading1">
    <w:name w:val="Heading 1"/>
    <w:pPr>
      <w:outlineLvl w:val="0"/>
    </w:pPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading3">
    <w:name w:val="Heading 3"/>
    <w:pPr>
      <w:outlineLvl w:val="2"/>
    </w:pPr>
  </w:style>
</w:styles>`

    const documentXml = `<?xml version="1.0"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:pPr>
        <w:pStyle w:val="Heading1"/>
      </w:pPr>
      <w:r>
        <w:t>Main Section</w:t>
      </w:r>
    </w:p>
    
    <w:p>
      <w:pPr>
        <w:pStyle w:val="Heading3"/>
      </w:pPr>
      <w:r>
        <w:t>Subsection</w:t>
      </w:r>
    </w:p>
  </w:body>
</w:document>`

    const styles = parseStyles(stylesXml)
    const numberings = parseNumbering('')
    const hierarchy = parseDocumentXml(documentXml, styles)
    const headings = buildHeadingHierarchy(hierarchy.paragraphs, numberings)

    // Should handle level jump (1 to 3) gracefully
    expect(headings).toHaveLength(1)
    expect(headings[0].level).toBe(1)
    expect(headings[0].children).toHaveLength(1)
    expect(headings[0].children[0].level).toBe(3)
  })
})
