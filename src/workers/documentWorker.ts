/**
 * Web Worker for processing DOCX documents in the background
 * This worker handles parsing DOCX files without blocking the UI
 */

import JSZip from 'jszip'
import type {
  DocumentWorkerMessage,
  DocumentWorkerResponse,
  ParsedDocument,
} from '../types/docx'
import { parseStyles } from '../utils/styles'
import { parseNumbering } from '../utils/numbering'
import { parseDocumentXml } from '../utils/documentParser'
import { buildHeadingHierarchy } from '../utils/headingHierarchy'
import { computeDocumentHash, getISOTimestamp } from '../utils/documentId'

self.onmessage = async (event: MessageEvent<DocumentWorkerMessage>) => {
  const { type, data } = event.data

  switch (type) {
    case 'PARSE_DOCUMENT':
      await parseDocument(data.fileId, data.fileName, data.fileBuffer)
      break
    default:
      self.postMessage({
        type: 'PARSE_ERROR',
        error: 'Unknown message type',
        fileId: data.fileId,
      } as DocumentWorkerResponse)
  }
}

async function parseDocument(
  fileId: string,
  fileName: string,
  fileBuffer: ArrayBuffer
): Promise<void> {
  try {
    // Load DOCX as ZIP
    const zip = new JSZip()
    await zip.loadAsync(fileBuffer)

    // Extract XML files
    const documentXml = (await zip.file('word/document.xml')?.async('text')) || ''
    const stylesXml = (await zip.file('word/styles.xml')?.async('text')) || ''
    const numberingXml = (await zip.file('word/numbering.xml')?.async('text')) || ''

    if (!documentXml) {
      throw new Error('document.xml not found in DOCX file')
    }

    // Parse styles and numbering
    const styles = parseStyles(stylesXml)
    const numberings = parseNumbering(numberingXml)

    // Parse document structure
    const hierarchy = parseDocumentXml(documentXml, styles)

    // Build heading hierarchy and clause paths
    const headings = buildHeadingHierarchy(hierarchy.paragraphs, numberings)

    // Compute document hash
    const hash = await computeDocumentHash(documentXml)

    // Create parsed document
    const parsedDocument: ParsedDocument = {
      docId: fileId,
      name: fileName,
      hash,
      uploadedAt: getISOTimestamp(),
      parsedAt: getISOTimestamp(),
      hierarchy,
      headings,
    }

    // Send result back to main thread
    self.postMessage({
      type: 'DOCUMENT_PARSED',
      data: parsedDocument,
      fileId,
    } as DocumentWorkerResponse)
  } catch (error) {
    console.error('Error parsing document:', error)
    self.postMessage({
      type: 'PARSE_ERROR',
      error: error instanceof Error ? error.message : 'Unknown error',
      fileId,
    } as DocumentWorkerResponse)
  }
}

export {}
