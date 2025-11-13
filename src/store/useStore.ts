import { create } from 'zustand'
import type { ParsedDocument } from '../types/docx'
import type { Document, Change, Thread, ThreadStatus, ThreadNote, SelectionState } from '../types/dataModel'

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

  // --- Phase 1.4: Enhanced Data Model ---

  /** Normalized documents (metadata only) */
  normalizedDocuments: Map<string, Document>
  /** All changes from all documents */
  changes: Map<string, Change>
  /** All threads */
  threads: Map<string, Thread>
  /** Selection state for UI */
  selection: SelectionState

  // Document management actions
  addNormalizedDocument: (doc: Document) => void
  getNormalizedDocument: (docId: string) => Document | undefined

  // Change management actions
  addChange: (change: Change) => void
  addChanges: (changes: Change[]) => void
  updateChange: (changeId: string, updates: Partial<Change>) => void
  getChange: (changeId: string) => Change | undefined
  getChangesByDocument: (docId: string) => Change[]
  getChangesByThread: (threadId: string) => Change[]
  getUnassignedChanges: () => Change[]
  assignChangesToThread: (changeIds: string[], threadId: string | null) => void

  // Thread management actions
  createThread: (thread: Omit<Thread, 'threadId' | 'createdAt' | 'updatedAt'>) => Thread
  updateThread: (threadId: string, updates: Partial<Omit<Thread, 'threadId' | 'createdAt'>>) => void
  deleteThread: (threadId: string) => void
  getThread: (threadId: string) => Thread | undefined
  getAllThreads: () => Thread[]
  addNoteToThread: (threadId: string, noteText: string) => void
  updateThreadStatus: (threadId: string, status: ThreadStatus) => void

  // Selection management actions
  setSelectedThread: (threadId: string | null) => void
  toggleChangeSelection: (changeId: string) => void
  selectChanges: (changeIds: string[]) => void
  clearChangeSelection: () => void
  setActiveDocument: (docId: string | null) => void

  // Computed selectors
  getFilteredChanges: () => Change[]
  getThreadChangeCount: (threadId: string) => number
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

  // --- Phase 1.4: Enhanced Data Model Implementation ---

  normalizedDocuments: new Map(),
  changes: new Map(),
  threads: new Map(),
  selection: {
    selectedThreadId: null,
    selectedChangeIds: new Set(),
    activeDocumentId: null,
  },

  // Document management
  addNormalizedDocument: (doc) =>
    set((state) => {
      const newDocs = new Map(state.normalizedDocuments)
      newDocs.set(doc.docId, doc)
      return { normalizedDocuments: newDocs }
    }),

  getNormalizedDocument: (docId) => {
    return get().normalizedDocuments.get(docId)
  },

  // Change management
  addChange: (change) =>
    set((state) => {
      const newChanges = new Map(state.changes)
      newChanges.set(change.changeId, change)
      return { changes: newChanges }
    }),

  addChanges: (changes) =>
    set((state) => {
      const newChanges = new Map(state.changes)
      changes.forEach((change) => {
        newChanges.set(change.changeId, change)
      })
      return { changes: newChanges }
    }),

  updateChange: (changeId, updates) =>
    set((state) => {
      const newChanges = new Map(state.changes)
      const existing = newChanges.get(changeId)
      if (existing) {
        newChanges.set(changeId, { ...existing, ...updates })
      }
      return { changes: newChanges }
    }),

  getChange: (changeId) => {
    return get().changes.get(changeId)
  },

  getChangesByDocument: (docId) => {
    const changes = Array.from(get().changes.values())
    return changes.filter((change) => change.docId === docId)
  },

  getChangesByThread: (threadId) => {
    const changes = Array.from(get().changes.values())
    return changes.filter((change) => change.threadId === threadId)
  },

  getUnassignedChanges: () => {
    const changes = Array.from(get().changes.values())
    return changes.filter((change) => change.threadId === null)
  },

  assignChangesToThread: (changeIds, threadId) =>
    set((state) => {
      const newChanges = new Map(state.changes)
      changeIds.forEach((changeId) => {
        const change = newChanges.get(changeId)
        if (change) {
          newChanges.set(changeId, { ...change, threadId })
        }
      })
      return { changes: newChanges }
    }),

  // Thread management
  createThread: (threadData) => {
    const threadId = `th_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    const now = new Date().toISOString()
    const thread: Thread = {
      threadId,
      ...threadData,
      createdAt: now,
      updatedAt: now,
    }
    
    set((state) => {
      const newThreads = new Map(state.threads)
      newThreads.set(threadId, thread)
      return { threads: newThreads }
    })
    
    return thread
  },

  updateThread: (threadId, updates) =>
    set((state) => {
      const newThreads = new Map(state.threads)
      const existing = newThreads.get(threadId)
      if (existing) {
        newThreads.set(threadId, {
          ...existing,
          ...updates,
          updatedAt: new Date().toISOString(),
        })
      }
      return { threads: newThreads }
    }),

  deleteThread: (threadId) =>
    set((state) => {
      const newThreads = new Map(state.threads)
      const newChanges = new Map(state.changes)
      
      // Unassign all changes from this thread
      newChanges.forEach((change) => {
        if (change.threadId === threadId) {
          newChanges.set(change.changeId, { ...change, threadId: null })
        }
      })
      
      newThreads.delete(threadId)
      
      return {
        threads: newThreads,
        changes: newChanges,
        selection: {
          ...state.selection,
          selectedThreadId: state.selection.selectedThreadId === threadId 
            ? null 
            : state.selection.selectedThreadId,
        },
      }
    }),

  getThread: (threadId) => {
    return get().threads.get(threadId)
  },

  getAllThreads: () => {
    return Array.from(get().threads.values())
  },

  addNoteToThread: (threadId, noteText) =>
    set((state) => {
      const newThreads = new Map(state.threads)
      const thread = newThreads.get(threadId)
      if (thread) {
        const note: ThreadNote = {
          noteId: `note_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          text: noteText,
          timestamp: new Date().toISOString(),
        }
        newThreads.set(threadId, {
          ...thread,
          notes: [...thread.notes, note],
          updatedAt: new Date().toISOString(),
        })
      }
      return { threads: newThreads }
    }),

  updateThreadStatus: (threadId, status) =>
    set((state) => {
      const newThreads = new Map(state.threads)
      const thread = newThreads.get(threadId)
      if (thread) {
        newThreads.set(threadId, {
          ...thread,
          status,
          updatedAt: new Date().toISOString(),
        })
      }
      return { threads: newThreads }
    }),

  // Selection management
  setSelectedThread: (threadId) =>
    set((state) => ({
      selection: { ...state.selection, selectedThreadId: threadId },
    })),

  toggleChangeSelection: (changeId) =>
    set((state) => {
      const newSelectedIds = new Set(state.selection.selectedChangeIds)
      if (newSelectedIds.has(changeId)) {
        newSelectedIds.delete(changeId)
      } else {
        newSelectedIds.add(changeId)
      }
      return {
        selection: { ...state.selection, selectedChangeIds: newSelectedIds },
      }
    }),

  selectChanges: (changeIds) =>
    set((state) => ({
      selection: {
        ...state.selection,
        selectedChangeIds: new Set(changeIds),
      },
    })),

  clearChangeSelection: () =>
    set((state) => ({
      selection: { ...state.selection, selectedChangeIds: new Set() },
    })),

  setActiveDocument: (docId) =>
    set((state) => ({
      selection: { ...state.selection, activeDocumentId: docId },
    })),

  // Computed selectors
  getFilteredChanges: () => {
    const state = get()
    const allChanges = Array.from(state.changes.values())
    const { selectedThreadId, activeDocumentId } = state.selection

    let filtered = allChanges

    // Filter by active document if set
    if (activeDocumentId) {
      filtered = filtered.filter((change) => change.docId === activeDocumentId)
    }

    // Filter by selected thread if set
    if (selectedThreadId) {
      filtered = filtered.filter((change) => change.threadId === selectedThreadId)
    }

    return filtered
  },

  getThreadChangeCount: (threadId) => {
    const changes = Array.from(get().changes.values())
    return changes.filter((change) => change.threadId === threadId).length
  },
}))
