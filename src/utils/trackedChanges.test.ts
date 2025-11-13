/**
 * Tests for tracked changes extraction
 */

import { describe, it, expect } from 'vitest'
import { extractTrackedChanges } from './trackedChanges'
import type { Paragraph, HeadingNode } from '../types/docx'

describe('trackedChanges', () => {
  describe('extractTrackedChanges', () => {
    it('should return empty array for empty XML', () => {
      const changes = extractTrackedChanges('', 'doc-1', [], [])
      expect(changes).toEqual([])
    })

    it('should extract insertion with metadata', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
          <w:body>
            <w:p>
              <w:ins w:id="1" w:author="John Doe" w:date="2024-01-15T10:30:00Z">
                <w:r>
                  <w:t>Inserted text</w:t>
                </w:r>
              </w:ins>
            </w:p>
          </w:body>
        </w:document>`

      const paragraphs: Paragraph[] = [
        {
          id: 'p-0',
          text: 'Inserted text',
          styleId: null,
          styleName: null,
          headingLevel: null,
          numbering: null,
          runs: [{ text: 'Inserted text' }],
          isHeading: false,
        },
      ]

      const changes = extractTrackedChanges(xml, 'doc-1', paragraphs, [])

      expect(changes).toHaveLength(1)
      expect(changes[0].type).toBe('insertion')
      expect(changes[0].author).toBe('John Doe')
      expect(changes[0].changedText).toBe('Inserted text')
      expect(changes[0].originalId).toBe('1')
      expect(changes[0].changeId).toBe('doc-1-1')
      expect(changes[0].paragraphId).toBe('p-0')
    })

    it('should extract deletion with metadata', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
          <w:body>
            <w:p>
              <w:del w:id="2" w:author="Jane Smith" w:date="2024-01-16T14:20:00Z">
                <w:r>
                  <w:t>Deleted text</w:t>
                </w:r>
              </w:del>
            </w:p>
          </w:body>
        </w:document>`

      const paragraphs: Paragraph[] = [
        {
          id: 'p-0',
          text: '',
          styleId: null,
          styleName: null,
          headingLevel: null,
          numbering: null,
          runs: [],
          isHeading: false,
        },
      ]

      const changes = extractTrackedChanges(xml, 'doc-1', paragraphs, [])

      expect(changes).toHaveLength(1)
      expect(changes[0].type).toBe('deletion')
      expect(changes[0].author).toBe('Jane Smith')
      expect(changes[0].changedText).toBe('Deleted text')
      expect(changes[0].originalId).toBe('2')
    })

    it('should extract moveFrom and moveTo changes', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
          <w:body>
            <w:p>
              <w:moveFrom w:id="3" w:author="Author" w:date="2024-01-17T09:00:00Z">
                <w:r>
                  <w:t>Moved text</w:t>
                </w:r>
              </w:moveFrom>
            </w:p>
            <w:p>
              <w:moveTo w:id="4" w:author="Author" w:date="2024-01-17T09:00:00Z">
                <w:r>
                  <w:t>Moved text</w:t>
                </w:r>
              </w:moveTo>
            </w:p>
          </w:body>
        </w:document>`

      const paragraphs: Paragraph[] = [
        {
          id: 'p-0',
          text: 'Moved text',
          styleId: null,
          styleName: null,
          headingLevel: null,
          numbering: null,
          runs: [{ text: 'Moved text' }],
          isHeading: false,
        },
        {
          id: 'p-1',
          text: 'Moved text',
          styleId: null,
          styleName: null,
          headingLevel: null,
          numbering: null,
          runs: [{ text: 'Moved text' }],
          isHeading: false,
        },
      ]

      const changes = extractTrackedChanges(xml, 'doc-1', paragraphs, [])

      expect(changes).toHaveLength(2)
      expect(changes[0].type).toBe('moveFrom')
      expect(changes[0].changedText).toBe('Moved text')
      expect(changes[1].type).toBe('moveTo')
      expect(changes[1].changedText).toBe('Moved text')
    })

    it('should extract multiple changes from same paragraph', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
          <w:body>
            <w:p>
              <w:r><w:t>Normal text </w:t></w:r>
              <w:ins w:id="5" w:author="User1" w:date="2024-01-18T10:00:00Z">
                <w:r><w:t>inserted</w:t></w:r>
              </w:ins>
              <w:r><w:t> more text </w:t></w:r>
              <w:del w:id="6" w:author="User2" w:date="2024-01-18T11:00:00Z">
                <w:r><w:t>deleted</w:t></w:r>
              </w:del>
            </w:p>
          </w:body>
        </w:document>`

      const paragraphs: Paragraph[] = [
        {
          id: 'p-0',
          text: 'Normal text inserted more text deleted',
          styleId: null,
          styleName: null,
          headingLevel: null,
          numbering: null,
          runs: [],
          isHeading: false,
        },
      ]

      const changes = extractTrackedChanges(xml, 'doc-1', paragraphs, [])

      expect(changes).toHaveLength(2)
      expect(changes[0].type).toBe('insertion')
      expect(changes[0].changedText).toBe('inserted')
      expect(changes[1].type).toBe('deletion')
      expect(changes[1].changedText).toBe('deleted')
    })

    it('should handle missing author gracefully', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
          <w:body>
            <w:p>
              <w:ins w:id="7" w:date="2024-01-19T10:00:00Z">
                <w:r><w:t>Text without author</w:t></w:r>
              </w:ins>
            </w:p>
          </w:body>
        </w:document>`

      const paragraphs: Paragraph[] = [
        {
          id: 'p-0',
          text: 'Text without author',
          styleId: null,
          styleName: null,
          headingLevel: null,
          numbering: null,
          runs: [],
          isHeading: false,
        },
      ]

      const changes = extractTrackedChanges(xml, 'doc-1', paragraphs, [])

      expect(changes).toHaveLength(1)
      expect(changes[0].author).toBe('Unknown')
    })

    it('should normalize timestamp to ISO 8601', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
          <w:body>
            <w:p>
              <w:ins w:id="8" w:author="Test" w:date="2024-01-20T15:30:00Z">
                <w:r><w:t>Test text</w:t></w:r>
              </w:ins>
            </w:p>
          </w:body>
        </w:document>`

      const paragraphs: Paragraph[] = [
        {
          id: 'p-0',
          text: 'Test text',
          styleId: null,
          styleName: null,
          headingLevel: null,
          numbering: null,
          runs: [],
          isHeading: false,
        },
      ]

      const changes = extractTrackedChanges(xml, 'doc-1', paragraphs, [])

      expect(changes).toHaveLength(1)
      expect(changes[0].timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    })

    it('should extract context from surrounding paragraphs', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
          <w:body>
            <w:p><w:r><w:t>Before paragraph</w:t></w:r></w:p>
            <w:p>
              <w:ins w:id="9" w:author="Test" w:date="2024-01-21T10:00:00Z">
                <w:r><w:t>Inserted</w:t></w:r>
              </w:ins>
            </w:p>
            <w:p><w:r><w:t>After paragraph</w:t></w:r></w:p>
          </w:body>
        </w:document>`

      const paragraphs: Paragraph[] = [
        {
          id: 'p-0',
          text: 'Before paragraph',
          styleId: null,
          styleName: null,
          headingLevel: null,
          numbering: null,
          runs: [{ text: 'Before paragraph' }],
          isHeading: false,
        },
        {
          id: 'p-1',
          text: 'Inserted',
          styleId: null,
          styleName: null,
          headingLevel: null,
          numbering: null,
          runs: [{ text: 'Inserted' }],
          isHeading: false,
        },
        {
          id: 'p-2',
          text: 'After paragraph',
          styleId: null,
          styleName: null,
          headingLevel: null,
          numbering: null,
          runs: [{ text: 'After paragraph' }],
          isHeading: false,
        },
      ]

      const changes = extractTrackedChanges(xml, 'doc-1', paragraphs, [])

      expect(changes).toHaveLength(1)
      expect(changes[0].textBefore).toBe('Before paragraph')
      expect(changes[0].textAfter).toBe('After paragraph')
    })

    it('should link changes to clause paths', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
          <w:body>
            <w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>Section 1</w:t></w:r></w:p>
            <w:p>
              <w:ins w:id="10" w:author="Test" w:date="2024-01-22T10:00:00Z">
                <w:r><w:t>Change under heading</w:t></w:r>
              </w:ins>
            </w:p>
          </w:body>
        </w:document>`

      const paragraphs: Paragraph[] = [
        {
          id: 'p-0',
          text: 'Section 1',
          styleId: 'Heading1',
          styleName: 'Heading 1',
          headingLevel: 1,
          numbering: null,
          runs: [{ text: 'Section 1' }],
          isHeading: true,
        },
        {
          id: 'p-1',
          text: 'Change under heading',
          styleId: null,
          styleName: null,
          headingLevel: null,
          numbering: null,
          runs: [{ text: 'Change under heading' }],
          isHeading: false,
        },
      ]

      const headings: HeadingNode[] = [
        {
          id: 'h-0',
          level: 1,
          text: 'Section 1',
          number: '1',
          clausePath: ['1', 'Section 1'],
          paragraphId: 'p-0',
          children: [],
        },
      ]

      const changes = extractTrackedChanges(xml, 'doc-1', paragraphs, headings)

      expect(changes).toHaveLength(1)
      expect(changes[0].clausePath).toEqual(['1', 'Section 1'])
    })

    it('should handle documents with no tracked changes', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
          <w:body>
            <w:p><w:r><w:t>Normal paragraph</w:t></w:r></w:p>
            <w:p><w:r><w:t>Another paragraph</w:t></w:r></w:p>
          </w:body>
        </w:document>`

      const paragraphs: Paragraph[] = [
        {
          id: 'p-0',
          text: 'Normal paragraph',
          styleId: null,
          styleName: null,
          headingLevel: null,
          numbering: null,
          runs: [{ text: 'Normal paragraph' }],
          isHeading: false,
        },
        {
          id: 'p-1',
          text: 'Another paragraph',
          styleId: null,
          styleName: null,
          headingLevel: null,
          numbering: null,
          runs: [{ text: 'Another paragraph' }],
          isHeading: false,
        },
      ]

      const changes = extractTrackedChanges(xml, 'doc-1', paragraphs, [])

      expect(changes).toEqual([])
    })

    it('should handle text with multiple runs', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
          <w:body>
            <w:p>
              <w:ins w:id="11" w:author="Test" w:date="2024-01-23T10:00:00Z">
                <w:r><w:t xml:space="preserve">First </w:t></w:r>
                <w:r><w:t xml:space="preserve">second </w:t></w:r>
                <w:r><w:t>third</w:t></w:r>
              </w:ins>
            </w:p>
          </w:body>
        </w:document>`

      const paragraphs: Paragraph[] = [
        {
          id: 'p-0',
          text: 'First second third',
          styleId: null,
          styleName: null,
          headingLevel: null,
          numbering: null,
          runs: [],
          isHeading: false,
        },
      ]

      const changes = extractTrackedChanges(xml, 'doc-1', paragraphs, [])

      expect(changes).toHaveLength(1)
      expect(changes[0].changedText).toBe('First second third')
    })
  })
})
