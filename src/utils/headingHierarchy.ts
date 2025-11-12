/**
 * Utilities for building heading hierarchy and clause paths
 */

import type {
  HeadingNode,
  Paragraph,
  NumberingDefinition,
  NumberingInfo,
} from '../types/docx'
import { computeNumberText } from './numbering'

/**
 * Build heading hierarchy tree from paragraphs
 */
export function buildHeadingHierarchy(
  paragraphs: Paragraph[],
  numberings: Map<string, NumberingDefinition>
): HeadingNode[] {
  const headingParagraphs = paragraphs.filter((p) => p.isHeading)
  const roots: HeadingNode[] = []
  const stack: HeadingNode[] = []

  // Track counters for numbered headings
  const numberingCounters = new Map<string, Map<number, number>>()

  headingParagraphs.forEach((paragraph) => {
    const level = paragraph.headingLevel || 1

    // Compute number for this heading
    const number = computeHeadingNumber(paragraph, numberings, numberingCounters)

    // Create heading node
    const node: HeadingNode = {
      id: `h-${paragraph.id}`,
      level,
      text: paragraph.text.trim(),
      number,
      clausePath: [], // Will be computed below
      paragraphId: paragraph.id,
      children: [],
    }

    // Find parent in the stack
    while (stack.length > 0 && stack[stack.length - 1].level >= level) {
      stack.pop()
    }

    if (stack.length === 0) {
      // This is a root heading
      roots.push(node)
    } else {
      // Add as child of the last item in stack
      stack[stack.length - 1].children.push(node)
    }

    stack.push(node)
  })

  // Compute clause paths for all nodes
  computeClausePaths(roots, [])

  return roots
}

/**
 * Compute heading number based on numbering or manual numbering
 */
function computeHeadingNumber(
  paragraph: Paragraph,
  numberings: Map<string, NumberingDefinition>,
  counterMap: Map<string, Map<number, number>>
): string | null {
  // Check if paragraph has numbering
  if (paragraph.numbering) {
    return computeNumberingText(paragraph.numbering, numberings, counterMap)
  }

  // Try to extract number from the text itself (e.g., "8. Termination")
  // eslint-disable-next-line security/detect-unsafe-regex
  const match = paragraph.text.match(/^(\d+(?:\.\d+)*\.?)\s+/)
  if (match) {
    return match[1]
  }

  return null
}

/**
 * Compute numbering text for a paragraph with numbering
 */
function computeNumberingText(
  numbering: NumberingInfo,
  numberings: Map<string, NumberingDefinition>,
  counterMap: Map<string, Map<number, number>>
): string | null {
  const numDef = numberings.get(numbering.numId)
  if (!numDef) return null

  const level = numbering.level

  // Get or create counter map for this numbering definition
  let counters = counterMap.get(numbering.numId)
  if (!counters) {
    counters = new Map<number, number>()
    counterMap.set(numbering.numId, counters)
  }

  // Increment counter for this level
  const currentCount = (counters.get(level) || 0) + 1
  counters.set(level, currentCount)

  // Reset counters for deeper levels
  for (let l = level + 1; l < 10; l++) {
    counters.set(l, 0)
  }

  // Get level definition
  const levelDef = numDef.levels.find((l) => l.level === level)
  if (!levelDef) return null

  // Build counter array and format array for all levels up to current
  const counterArray: number[] = []
  const formatArray: string[] = []

  for (let l = 0; l <= level; l++) {
    const lvlDef = numDef.levels.find((d) => d.level === l)
    const count = counters.get(l) || (lvlDef?.start || 1)
    counterArray.push(count)
    formatArray.push(lvlDef?.format || 'decimal')
  }

  // Compute the number text
  return computeNumberText(levelDef.levelText, counterArray, formatArray)
}

/**
 * Recursively compute clause paths for heading nodes
 */
function computeClausePaths(nodes: HeadingNode[], parentPath: string[]): void {
  nodes.forEach((node) => {
    // Build clause path: parent path + (number if exists, otherwise text)
    const pathElement = node.number || node.text
    node.clausePath = [...parentPath, pathElement]

    // Recursively compute for children
    if (node.children.length > 0) {
      computeClausePaths(node.children, node.clausePath)
    }
  })
}

/**
 * Get all heading nodes as a flat list (depth-first traversal)
 */
export function flattenHeadings(headings: HeadingNode[]): HeadingNode[] {
  const result: HeadingNode[] = []

  function traverse(nodes: HeadingNode[]): void {
    nodes.forEach((node) => {
      result.push(node)
      if (node.children.length > 0) {
        traverse(node.children)
      }
    })
  }

  traverse(headings)
  return result
}

/**
 * Find heading node by paragraph ID
 */
export function findHeadingByParagraphId(
  headings: HeadingNode[],
  paragraphId: string
): HeadingNode | null {
  for (const heading of headings) {
    if (heading.paragraphId === paragraphId) {
      return heading
    }
    if (heading.children.length > 0) {
      const found = findHeadingByParagraphId(heading.children, paragraphId)
      if (found) return found
    }
  }
  return null
}

/**
 * Get the clause path for a given paragraph ID
 * Returns the clause path of the most recent heading before this paragraph
 */
export function getClausePathForParagraph(
  paragraphId: string,
  paragraphs: Paragraph[],
  headings: HeadingNode[]
): string[] {
  // Find the paragraph index
  const paragraphIndex = paragraphs.findIndex((p) => p.id === paragraphId)
  if (paragraphIndex === -1) return []

  // Find the most recent heading before this paragraph
  for (let i = paragraphIndex; i >= 0; i--) {
    // eslint-disable-next-line security/detect-object-injection
    const paragraph = paragraphs[i]
    if (paragraph.isHeading) {
      const heading = findHeadingByParagraphId(headings, paragraph.id)
      if (heading) {
        return heading.clausePath
      }
    }
  }

  return []
}
