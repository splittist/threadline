/**
 * Type definitions for DOCX structure and parsing
 */

/**
 * Parsed document structure
 */
export interface ParsedDocument {
  /** Unique document identifier */
  docId: string
  /** Original file name */
  name: string
  /** SHA-256 hash of document content */
  hash: string
  /** Timestamp when uploaded */
  uploadedAt: string
  /** Timestamp when parsing completed */
  parsedAt: string
  /** Document hierarchy with all paragraphs */
  hierarchy: DocumentHierarchy
  /** Heading structure for clause paths */
  headings: HeadingNode[]
  /** Tracked changes extracted from document */
  changes: TrackedChange[]
}

/**
 * Document hierarchy containing all content
 */
export interface DocumentHierarchy {
  /** All paragraphs in document order */
  paragraphs: Paragraph[]
  /** Document sections (if any) */
  sections: Section[]
}

/**
 * A paragraph in the document
 */
export interface Paragraph {
  /** Unique paragraph ID */
  id: string
  /** Paragraph text content */
  text: string
  /** Style ID applied to this paragraph */
  styleId: string | null
  /** Resolved style name (e.g., "Heading 1", "Normal") */
  styleName: string | null
  /** Heading level (1-9) if this is a heading, null otherwise */
  headingLevel: number | null
  /** Numbering info if paragraph is numbered */
  numbering: NumberingInfo | null
  /** Text runs with formatting */
  runs: TextRun[]
  /** Whether this paragraph is a heading */
  isHeading: boolean
}

/**
 * A text run within a paragraph
 */
export interface TextRun {
  /** Text content */
  text: string
  /** Bold formatting */
  bold?: boolean
  /** Italic formatting */
  italic?: boolean
  /** Underline formatting */
  underline?: boolean
}

/**
 * Document section information
 */
export interface Section {
  /** Section index */
  index: number
  /** Paragraphs in this section */
  paragraphIds: string[]
}

/**
 * Heading node in the document hierarchy tree
 */
export interface HeadingNode {
  /** Unique ID */
  id: string
  /** Heading level (1-9) */
  level: number
  /** Heading text */
  text: string
  /** Computed number/prefix (e.g., "8.2" or "a.") */
  number: string | null
  /** Full clause path to this heading */
  clausePath: string[]
  /** Paragraph ID this heading corresponds to */
  paragraphId: string
  /** Child headings */
  children: HeadingNode[]
}

/**
 * Numbering information for a paragraph
 */
export interface NumberingInfo {
  /** Numbering definition ID */
  numId: string
  /** Indent level (0-based) */
  level: number
  /** Computed number text */
  numberText: string | null
}

/**
 * Style definition from styles.xml
 */
export interface StyleDefinition {
  /** Style ID */
  styleId: string
  /** Style name */
  name: string
  /** Style type (paragraph, character, etc.) */
  type: string
  /** Base style ID this inherits from */
  basedOn: string | null
  /** Whether this is a heading style */
  isHeading: boolean
  /** Heading level if this is a heading (1-9) */
  headingLevel: number | null
  /** Outline level */
  outlineLevel: number | null
}

/**
 * Numbering definition from numbering.xml
 */
export interface NumberingDefinition {
  /** Abstract numbering ID */
  abstractNumId: string
  /** Numbering instance ID */
  numId: string
  /** Level definitions */
  levels: NumberingLevel[]
}

/**
 * Numbering level definition
 */
export interface NumberingLevel {
  /** Level index (0-based) */
  level: number
  /** Number format (decimal, lowerLetter, etc.) */
  format: string
  /** Level text template (e.g., "%1.") */
  levelText: string
  /** Start value */
  start: number
}

/**
 * Type of tracked change
 */
export type ChangeType = 'insertion' | 'deletion' | 'moveFrom' | 'moveTo'

/**
 * Tracked change in a document
 */
export interface TrackedChange {
  /** Unique change identifier (docId + changeId) */
  changeId: string
  /** Document ID this change belongs to */
  docId: string
  /** Type of change */
  type: ChangeType
  /** Author of the change */
  author: string
  /** Timestamp of the change (ISO 8601) */
  timestamp: string
  /** Original change ID from OOXML (w:id attribute) */
  originalId: string
  /** Changed text content */
  changedText: string
  /** Text runs with formatting for the changed text */
  textRuns: TextRun[]
  /** Text before the change (context window) */
  textBefore: string
  /** Text after the change (context window) */
  textAfter: string
  /** Clause path where change occurs */
  clausePath: string[]
  /** Paragraph ID where change is located */
  paragraphId: string
}

/**
 * Message sent to the document worker
 */
export interface DocumentWorkerMessage {
  type: 'PARSE_DOCUMENT'
  data: {
    fileId: string
    fileName: string
    fileBuffer: ArrayBuffer
  }
}

/**
 * Response from the document worker
 */
export interface DocumentWorkerResponse {
  type: 'DOCUMENT_PARSED' | 'PARSE_ERROR'
  data?: ParsedDocument
  error?: string
  fileId?: string
}
