/**
 * Core data model types for Threadline application
 * Based on PRD v0.1, Section 8
 */

/**
 * Document metadata
 * Represents a document that has been uploaded and parsed
 */
export interface Document {
  /** Unique document identifier */
  docId: string
  /** Original file name */
  name: string
  /** SHA-256 hash of document content */
  hash: string
  /** Timestamp when uploaded (ISO 8601) */
  uploadedAt: string
  /** Timestamp when parsing completed (ISO 8601) */
  parsedAt: string
}

/**
 * Type of tracked change in a document
 */
export type ChangeType = 'insertion' | 'deletion' | 'moveFrom' | 'moveTo'

/**
 * A tracked change extracted from a document
 * Represents an atomic edit (insertion, deletion, etc.)
 */
export interface Change {
  /** Unique change identifier (format: docId-changeId) */
  changeId: string
  /** Document ID this change belongs to */
  docId: string
  /** Type of change */
  type: ChangeType
  /** Author of the change */
  author: string
  /** Timestamp of the change (ISO 8601) */
  timestamp: string
  /** Clause path where change occurs (e.g., ["8", "Termination", "8.2 Force Majeure"]) */
  clausePath: string[]
  /** Text before the change (context window) */
  textBefore: string
  /** Changed text content */
  changedText: string
  /** Text after the change (context window) */
  textAfter: string
  /** Thread this change is assigned to (null if unassigned) */
  threadId: string | null
  /** Suggested thread from automatic clustering (optional) */
  suggestedThread: string | null
}

/**
 * Thread status values
 */
export type ThreadStatus = 'proposed' | 'approved' | 'rejected' | 'under-review' | 'escalate'

/**
 * Note attached to a thread
 */
export interface ThreadNote {
  /** Unique note identifier */
  noteId: string
  /** Note content */
  text: string
  /** Timestamp when note was created (ISO 8601) */
  timestamp: string
  /** Author of the note (optional, for multi-user future) */
  author?: string
}

/**
 * Thread - a thematic grouping of related changes
 * Similar to a software pull request, represents a coherent change set
 */
export interface Thread {
  /** Unique thread identifier */
  threadId: string
  /** Thread title */
  title: string
  /** User-assigned topic (required for export) */
  userTopic: string
  /** AI/heuristic suggested topic (optional, displayed as hint) */
  suggestedTopic: string | null
  /** Rationale explaining the purpose of these changes */
  rationale: string
  /** Array of change IDs belonging to this thread */
  changeIds: string[]
  /** Current status of the thread */
  status: ThreadStatus
  /** Notes attached to this thread */
  notes: ThreadNote[]
  /** Timestamp when thread was created (ISO 8601) */
  createdAt: string
  /** Timestamp when thread was last updated (ISO 8601) */
  updatedAt: string
}

/**
 * Selection state for UI interactions
 */
export interface SelectionState {
  /** Currently selected thread ID (null if none selected) */
  selectedThreadId: string | null
  /** Set of selected change IDs (for bulk operations) */
  selectedChangeIds: Set<string>
  /** Currently active document ID for filtering (null shows all) */
  activeDocumentId: string | null
}
