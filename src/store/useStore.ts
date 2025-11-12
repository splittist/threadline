import { create } from 'zustand'
import type { ParsedDocument } from '../types/docx'

export interface DocumentFile {
  id: string
  file: File
  name: string
  size: number
  /** Parsing status */
  status: 'pending' | 'parsing' | 'parsed' | 'error'
  /** Error message if parsing failed */
  error?: string
}

interface AppState {
  /** Uploaded files */
  documents: DocumentFile[]
  /** Parsed document structures */
  parsedDocuments: Map<string, ParsedDocument>

  // Document actions
  addDocument: (doc: DocumentFile) => void
  addDocuments: (docs: DocumentFile[]) => void
  removeDocument: (id: string) => void
  updateDocumentStatus: (
    id: string,
    status: DocumentFile['status'],
    error?: string
  ) => void

  // Parsed document actions
  addParsedDocument: (parsed: ParsedDocument) => void
  getParsedDocument: (fileId: string) => ParsedDocument | undefined
}

export const useStore = create<AppState>((set, get) => ({
  documents: [],
  parsedDocuments: new Map(),

  addDocument: (doc) =>
    set((state) => ({ documents: [...state.documents, doc] })),

  addDocuments: (docs) =>
    set((state) => ({ documents: [...state.documents, ...docs] })),

  removeDocument: (id) =>
    set((state) => {
      const newParsedDocuments = new Map(state.parsedDocuments)
      newParsedDocuments.delete(id)
      return {
        documents: state.documents.filter((d) => d.id !== id),
        parsedDocuments: newParsedDocuments,
      }
    }),

  updateDocumentStatus: (id, status, error) =>
    set((state) => ({
      documents: state.documents.map((d) =>
        d.id === id ? { ...d, status, error } : d
      ),
    })),

  addParsedDocument: (parsed) =>
    set((state) => {
      const newParsedDocuments = new Map(state.parsedDocuments)
      newParsedDocuments.set(parsed.docId, parsed)
      return { parsedDocuments: newParsedDocuments }
    }),

  getParsedDocument: (fileId) => {
    return get().parsedDocuments.get(fileId)
  },
}))
