/**
 * Component to manage document parsing using Web Worker
 */

import { useEffect, useRef } from 'react'
import { useStore } from '../store/useStore'
import type {
  DocumentWorkerMessage,
  DocumentWorkerResponse,
} from '../types/docx'
import type { Document, Change } from '../types/dataModel'

export function DocumentParser() {
  const { 
    documents, 
    updateDocumentStatus, 
    addParsedDocument,
    addNormalizedDocument,
    addChanges,
  } = useStore()
  const workerRef = useRef<Worker | null>(null)

  useEffect(() => {
    // Create worker
    workerRef.current = new Worker(
      new URL('../workers/documentWorker.ts', import.meta.url),
      { type: 'module' }
    )

    // Handle messages from worker
    workerRef.current.onmessage = (event: MessageEvent<DocumentWorkerResponse>) => {
      const { type, data, error, fileId } = event.data

      if (type === 'DOCUMENT_PARSED' && data && fileId) {
        // Update status and store parsed document
        updateDocumentStatus(fileId, 'parsed')
        addParsedDocument(data)
        
        // Populate normalized document (Phase 1.4)
        const normalizedDoc: Document = {
          docId: data.docId,
          name: data.name,
          hash: data.hash,
          uploadedAt: data.uploadedAt,
          parsedAt: data.parsedAt,
        }
        addNormalizedDocument(normalizedDoc)
        
        // Populate changes (Phase 1.4)
        const changes: Change[] = data.changes.map((tc) => ({
          changeId: tc.changeId,
          docId: tc.docId,
          type: tc.type,
          author: tc.author,
          timestamp: tc.timestamp,
          clausePath: tc.clausePath,
          textBefore: tc.textBefore,
          changedText: tc.changedText,
          textAfter: tc.textAfter,
          threadId: null, // Initially unassigned
          suggestedThread: null, // Will be set by clustering in Phase 2
        }))
        addChanges(changes)
      } else if (type === 'PARSE_ERROR' && fileId) {
        // Update status with error
        updateDocumentStatus(fileId, 'error', error || 'Unknown error')
      }
    }

    // Cleanup on unmount
    return () => {
      workerRef.current?.terminate()
    }
  }, [updateDocumentStatus, addParsedDocument, addNormalizedDocument, addChanges])

  useEffect(() => {
    // Parse any pending documents
    documents.forEach(async (doc) => {
      if (doc.status === 'pending') {
        // Update status to parsing
        updateDocumentStatus(doc.id, 'parsing')

        try {
          // Convert File to ArrayBuffer
          const arrayBuffer = await doc.file.arrayBuffer()

          // Send to worker
          const message: DocumentWorkerMessage = {
            type: 'PARSE_DOCUMENT',
            data: {
              fileId: doc.id,
              fileName: doc.name,
              fileBuffer: arrayBuffer,
            },
          }

          workerRef.current?.postMessage(message)
        } catch (error) {
          console.error('Error reading file:', error)
          updateDocumentStatus(
            doc.id,
            'error',
            error instanceof Error ? error.message : 'Error reading file'
          )
        }
      }
    })
  }, [documents, updateDocumentStatus])

  // This component doesn't render anything
  return null
}
