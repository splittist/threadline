import { create } from 'zustand'
import type { ParsedDocument } from '../types/docx'
import type { Document, Change, Thread, ThreadStatus, ThreadNote, SelectionState } from '../types/dataModel'
import type { Bucket, ClusteringResult } from '../types/clustering'
import type { LLMClusteringPacket } from '../types/llmClustering'

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

  // --- Phase 2.1: Clustering ---
  
  /** Suggested buckets from clustering */
  buckets: Map<string, Bucket>
  /** Clustering status */
  clusteringStatus: 'idle' | 'clustering' | 'complete' | 'error'
  /** Clustering error message */
  clusteringError: string | null

  // Bucket management actions
  addBucket: (bucket: Bucket) => void
  addBuckets: (buckets: Bucket[]) => void
  removeBucket: (bucketId: string) => void
  getBucket: (bucketId: string) => Bucket | undefined
  getAllBuckets: () => Bucket[]
  clearBuckets: () => void
  setClusteringStatus: (status: AppState['clusteringStatus'], error?: string) => void
  applyClusteringResult: (result: ClusteringResult) => void

  // --- Phase 2.2: LLM-Assisted Clustering ---
  
  /** Last exported clustering packet (for validation on import) */
  lastExportedPacket: LLMClusteringPacket | null
  /** Store the last exported packet for validation */
  setLastExportedPacket: (packet: LLMClusteringPacket | null) => void

  // --- Phase 3.1: Panel Layout ---
  
  /** Panel visibility and state */
  panelState: {
    showThreadList: boolean
    showChangeList: boolean
    showMetadata: boolean
  }
  
  // Panel state management actions
  setPanelVisibility: (panel: 'threadList' | 'changeList' | 'metadata', visible: boolean) => void
  togglePanel: (panel: 'threadList' | 'changeList' | 'metadata') => void

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
  mergeThreads: (threadIds: string[], targetTitle: string, targetTopic: string, targetRationale: string) => Thread
  splitThread: (sourceThreadId: string, changeIds: string[], newTitle: string, newTopic: string, newRationale: string) => Thread

  // Selection management actions
  setSelectedThread: (threadId: string | null) => void
  toggleChangeSelection: (changeId: string) => void
  selectChanges: (changeIds: string[]) => void
  clearChangeSelection: () => void
  setActiveDocument: (docId: string | null) => void
  selectedThreadIds: Set<string>
  toggleThreadSelection: (threadId: string) => void
  clearThreadSelection: () => void

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
  selectedThreadIds: new Set(),

  // --- Phase 2.1: Clustering Implementation ---
  
  buckets: new Map(),
  clusteringStatus: 'idle',
  clusteringError: null,

  // Bucket management
  addBucket: (bucket) =>
    set((state) => {
      const newBuckets = new Map(state.buckets)
      newBuckets.set(bucket.bucketId, bucket)
      return { buckets: newBuckets }
    }),

  addBuckets: (buckets) =>
    set((state) => {
      const newBuckets = new Map(state.buckets)
      buckets.forEach((bucket) => {
        newBuckets.set(bucket.bucketId, bucket)
      })
      return { buckets: newBuckets }
    }),

  removeBucket: (bucketId) =>
    set((state) => {
      const newBuckets = new Map(state.buckets)
      newBuckets.delete(bucketId)
      return { buckets: newBuckets }
    }),

  getBucket: (bucketId) => {
    return get().buckets.get(bucketId)
  },

  getAllBuckets: () => {
    return Array.from(get().buckets.values())
  },

  clearBuckets: () =>
    set({ buckets: new Map() }),

  setClusteringStatus: (status, error) =>
    set({ clusteringStatus: status, clusteringError: error || null }),

  applyClusteringResult: (result) =>
    set((state) => {
      // Add all buckets
      const newBuckets = new Map(state.buckets)
      result.buckets.forEach((bucket) => {
        newBuckets.set(bucket.bucketId, bucket)
      })

      // Update changes with suggested topics
      const newChanges = new Map(state.changes)
      result.buckets.forEach((bucket) => {
        bucket.changeIds.forEach((changeId) => {
          const change = newChanges.get(changeId)
          if (change) {
            newChanges.set(changeId, {
              ...change,
              suggestedThread: bucket.suggestedTopic,
            })
          }
        })
      })

      return {
        buckets: newBuckets,
        changes: newChanges,
        clusteringStatus: 'complete' as const,
        clusteringError: null,
      }
    }),

  // --- Phase 2.2: LLM-Assisted Clustering Implementation ---
  
  lastExportedPacket: null,

  setLastExportedPacket: (packet) =>
    set({ lastExportedPacket: packet }),

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

  mergeThreads: (threadIds, targetTitle, targetTopic, targetRationale) => {
    const state = get()
    const threadId = `th_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    const now = new Date().toISOString()
    
    // Collect all changes and notes from source threads
    const allChangeIds: string[] = []
    const allNotes: ThreadNote[] = []
    const rationales: string[] = []
    
    threadIds.forEach((tid) => {
      const thread = state.threads.get(tid)
      if (thread) {
        // Collect changes
        const threadChanges = Array.from(state.changes.values()).filter(
          (change) => change.threadId === tid
        )
        allChangeIds.push(...threadChanges.map((c) => c.changeId))
        
        // Collect notes
        allNotes.push(...thread.notes)
        
        // Collect rationales
        if (thread.rationale.trim()) {
          rationales.push(`${thread.title}: ${thread.rationale}`)
        }
      }
    })
    
    // Combine rationales
    let combinedRationale = targetRationale
    if (rationales.length > 0) {
      combinedRationale = targetRationale 
        ? `${targetRationale}\n\nMerged from:\n${rationales.join('\n')}`
        : `Merged from:\n${rationales.join('\n')}`
    }
    
    // Create merged thread
    const mergedThread: Thread = {
      threadId,
      title: targetTitle,
      userTopic: targetTopic,
      rationale: combinedRationale,
      suggestedTopic: null,
      changeIds: [],
      status: 'proposed',
      notes: allNotes,
      createdAt: now,
      updatedAt: now,
    }
    
    set((state) => {
      const newThreads = new Map(state.threads)
      const newChanges = new Map(state.changes)
      
      // Add merged thread
      newThreads.set(threadId, mergedThread)
      
      // Delete source threads
      threadIds.forEach((tid) => {
        newThreads.delete(tid)
      })
      
      // Reassign all changes to merged thread
      allChangeIds.forEach((changeId) => {
        const change = newChanges.get(changeId)
        if (change) {
          newChanges.set(changeId, { ...change, threadId })
        }
      })
      
      return {
        threads: newThreads,
        changes: newChanges,
        selection: {
          ...state.selection,
          selectedThreadId: threadId,
        },
        selectedThreadIds: new Set(),
      }
    })
    
    return mergedThread
  },

  splitThread: (sourceThreadId, changeIds, newTitle, newTopic, newRationale) => {
    const state = get()
    const sourceThread = state.threads.get(sourceThreadId)
    
    if (!sourceThread) {
      throw new Error('Source thread not found')
    }
    
    const newThreadId = `th_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    const now = new Date().toISOString()
    
    // Create new thread with split changes
    const newThread: Thread = {
      threadId: newThreadId,
      title: newTitle,
      userTopic: newTopic,
      rationale: newRationale,
      suggestedTopic: null,
      changeIds: [],
      status: 'proposed',
      notes: [],
      createdAt: now,
      updatedAt: now,
    }
    
    set((state) => {
      const newThreads = new Map(state.threads)
      const newChanges = new Map(state.changes)
      
      // Add new thread
      newThreads.set(newThreadId, newThread)
      
      // Reassign selected changes to new thread
      changeIds.forEach((changeId) => {
        const change = newChanges.get(changeId)
        if (change && change.threadId === sourceThreadId) {
          newChanges.set(changeId, { ...change, threadId: newThreadId })
        }
      })
      
      return {
        threads: newThreads,
        changes: newChanges,
        selection: {
          ...state.selection,
          selectedThreadId: newThreadId,
          selectedChangeIds: new Set(),
        },
      }
    })
    
    return newThread
  },

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

  toggleThreadSelection: (threadId) =>
    set((state) => {
      const newSelectedThreadIds = new Set(state.selectedThreadIds)
      if (newSelectedThreadIds.has(threadId)) {
        newSelectedThreadIds.delete(threadId)
      } else {
        newSelectedThreadIds.add(threadId)
      }
      return { selectedThreadIds: newSelectedThreadIds }
    }),

  clearThreadSelection: () =>
    set({ selectedThreadIds: new Set() }),

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

  // --- Phase 3.1: Panel Layout Implementation ---
  
  panelState: {
    showThreadList: true,
    showChangeList: true,
    showMetadata: true,
  },

  setPanelVisibility: (panel, visible) =>
    set((state) => ({
      panelState: {
        ...state.panelState,
        [`show${panel.charAt(0).toUpperCase() + panel.slice(1)}`]: visible,
      },
    })),

  togglePanel: (panel) =>
    set((state) => {
      const key = `show${panel.charAt(0).toUpperCase() + panel.slice(1)}` as keyof typeof state.panelState
      return {
        panelState: {
          ...state.panelState,
          [key]: !state.panelState[key],
        },
      }
    }),
}))
