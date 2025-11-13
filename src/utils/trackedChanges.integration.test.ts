/**
 * Integration test for tracked changes extraction with real DOCX files
 */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import JSZip from 'jszip'
import { extractTrackedChanges } from './trackedChanges'
import { parseStyles } from './styles'
import { parseNumbering } from './numbering'
import { parseDocumentXml } from './documentParser'
import { buildHeadingHierarchy } from './headingHierarchy'

describe('trackedChanges integration', () => {
  it('should extract tracked changes from complex_word.docx', async () => {
    // Load the test fixture
    const fixturePath = resolve(
      __dirname,
      '../test/fixtures/documents/complex_word.docx'
    )
    const fileBuffer = readFileSync(fixturePath)

    // Extract DOCX contents
    const zip = new JSZip()
    await zip.loadAsync(fileBuffer)

    const documentXml = (await zip.file('word/document.xml')?.async('text')) || ''
    const stylesXml = (await zip.file('word/styles.xml')?.async('text')) || ''
    const numberingXml = (await zip.file('word/numbering.xml')?.async('text')) || ''

    expect(documentXml).toBeTruthy()

    // Parse the document structure
    const styles = parseStyles(stylesXml)
    const numberings = parseNumbering(numberingXml)
    const hierarchy = parseDocumentXml(documentXml, styles)
    const headings = buildHeadingHierarchy(hierarchy.paragraphs, numberings)

    // Extract tracked changes
    const changes = extractTrackedChanges(documentXml, 'test-doc', hierarchy.paragraphs, headings)

    // Verify that tracked changes were found
    expect(changes.length).toBeGreaterThan(0)

    // Check for different change types
    const hasInsertion = changes.some((c) => c.type === 'insertion')
    const hasDeletion = changes.some((c) => c.type === 'deletion')
    const hasMoveFrom = changes.some((c) => c.type === 'moveFrom')
    const hasMoveTo = changes.some((c) => c.type === 'moveTo')

    expect(hasInsertion).toBe(true)
    expect(hasDeletion).toBe(true)
    expect(hasMoveFrom).toBe(true)
    expect(hasMoveTo).toBe(true)

    // Verify change structure
    for (const change of changes) {
      expect(change.changeId).toBeTruthy()
      expect(change.docId).toBe('test-doc')
      expect(change.type).toMatch(/insertion|deletion|moveFrom|moveTo/)
      expect(change.author).toBeTruthy()
      expect(change.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
      expect(change.originalId).toBeTruthy()
      expect(change.paragraphId).toBeTruthy()
      expect(change.clausePath).toBeDefined()
      expect(change.textBefore).toBeDefined()
      expect(change.textAfter).toBeDefined()
      expect(change.changedText).toBeDefined()
    }

    // Log a sample change for inspection
    console.log('Sample tracked change:', changes[0])
  })

  it('should handle documents with no tracked changes', async () => {
    // Load the simple test fixture
    const fixturePath = resolve(__dirname, '../test/fixtures/documents/simple_word.docx')
    const fileBuffer = readFileSync(fixturePath)

    // Extract DOCX contents
    const zip = new JSZip()
    await zip.loadAsync(fileBuffer)

    const documentXml = (await zip.file('word/document.xml')?.async('text')) || ''
    const stylesXml = (await zip.file('word/styles.xml')?.async('text')) || ''
    const numberingXml = (await zip.file('word/numbering.xml')?.async('text')) || ''

    // Parse the document structure
    const styles = parseStyles(stylesXml)
    const numberings = parseNumbering(numberingXml)
    const hierarchy = parseDocumentXml(documentXml, styles)
    const headings = buildHeadingHierarchy(hierarchy.paragraphs, numberings)

    // Extract tracked changes
    const changes = extractTrackedChanges(documentXml, 'test-doc', hierarchy.paragraphs, headings)

    // Should have no tracked changes
    expect(changes).toEqual([])
  })
})
