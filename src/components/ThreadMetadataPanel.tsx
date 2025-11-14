/**
 * Thread Metadata Panel (Phase 3.4 - Right Panel)
 * Editable metadata panel for the selected thread with auto-save
 */

import { useState, useEffect, useRef } from 'react'
import { useStore } from '../store/useStore'
import { Listbox } from '@headlessui/react'
import { 
  InformationCircleIcon,
  ChatBubbleLeftIcon,
  CalendarIcon,
  UserIcon,
  CheckIcon,
  ChevronUpDownIcon,
  PlusIcon,
  CodeBracketIcon,
} from '@heroicons/react/24/outline'
import type { ThreadStatus } from '../types/dataModel'

// Debounce delay in milliseconds
const DEBOUNCE_DELAY = 300

// Status configuration
const STATUS_OPTIONS: { value: ThreadStatus; label: string; classes: string }[] = [
  { value: 'proposed', label: 'Proposed', classes: 'bg-blue-100 text-blue-800' },
  { value: 'under-review', label: 'Under Review', classes: 'bg-yellow-100 text-yellow-800' },
  { value: 'approved', label: 'Approved', classes: 'bg-green-100 text-green-800' },
  { value: 'rejected', label: 'Rejected', classes: 'bg-red-100 text-red-800' },
  { value: 'escalate', label: 'Escalate', classes: 'bg-purple-100 text-purple-800' },
]

export function ThreadMetadataPanel() {
  const {
    getThread,
    getChangesByThread,
    selection,
    updateThread,
    addNoteToThread,
  } = useStore()

  const selectedThreadId = selection.selectedThreadId
  const thread = selectedThreadId ? getThread(selectedThreadId) : null
  const changes = selectedThreadId ? getChangesByThread(selectedThreadId) : []

  // Local state for form fields
  const [title, setTitle] = useState('')
  const [userTopic, setUserTopic] = useState('')
  const [rationale, setRationale] = useState('')
  const [status, setStatus] = useState<ThreadStatus>('proposed')
  const [newNote, setNewNote] = useState('')
  const [showChangeIds, setShowChangeIds] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)

  // Refs for debounced auto-save
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const initialLoadRef = useRef(true)

  // Initialize form fields when thread changes
  useEffect(() => {
    if (thread) {
      setTitle(thread.title)
      setUserTopic(thread.userTopic)
      setRationale(thread.rationale)
      setStatus(thread.status)
      setValidationError(null)
      initialLoadRef.current = true
    }
  }, [selectedThreadId]) // Only re-run when thread ID changes, not when thread properties change

  // Debounced auto-save effect
  useEffect(() => {
    // Skip auto-save on initial load
    if (initialLoadRef.current) {
      initialLoadRef.current = false
      return
    }

    // Clear any existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // Validate required field
    if (!userTopic.trim()) {
      setValidationError('User topic is required')
      return
    } else {
      setValidationError(null)
    }

    // Set new timeout for auto-save
    saveTimeoutRef.current = setTimeout(() => {
      if (selectedThreadId && thread) {
        updateThread(selectedThreadId, {
          title,
          userTopic: userTopic.trim(),
          rationale,
          status,
        })
      }
    }, DEBOUNCE_DELAY)

    // Cleanup function
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [title, userTopic, rationale, status, selectedThreadId, thread, updateThread])

  const handleAddNote = () => {
    if (selectedThreadId && newNote.trim()) {
      addNoteToThread(selectedThreadId, newNote.trim())
      setNewNote('')
    }
  }

  const handleKeyPressNote = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleAddNote()
    }
  }

  if (!selectedThreadId) {
    return (
      <div className="h-full flex flex-col bg-white">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Details</h2>
        </div>
        <div className="flex-1 flex items-center justify-center p-4 text-center text-gray-500">
          <div>
            <InformationCircleIcon className="h-12 w-12 mx-auto text-gray-300 mb-2" />
            <p className="text-sm">No thread selected</p>
            <p className="text-xs mt-1">Select a thread to view details</p>
          </div>
        </div>
      </div>
    )
  }

  if (!thread) {
    return (
      <div className="h-full flex flex-col bg-white">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Details</h2>
        </div>
        <div className="flex-1 flex items-center justify-center p-4 text-center text-gray-500">
          <div>
            <InformationCircleIcon className="h-12 w-12 mx-auto text-gray-300 mb-2" />
            <p className="text-sm">Thread not found</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-white overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">{title || 'Thread Details'}</h2>
        <p className="text-xs text-gray-500">Changes save automatically</p>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 space-y-6">
        {/* Title */}
        <div>
          <label htmlFor="thread-title" className="block text-sm font-medium text-gray-700 mb-2">
            Title
          </label>
          <input
            id="thread-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            placeholder="Enter thread title"
          />
        </div>

        {/* User Topic (Required) */}
        <div>
          <label htmlFor="user-topic" className="block text-sm font-medium text-gray-700 mb-2">
            User Topic <span className="text-red-500">*</span>
          </label>
          <input
            id="user-topic"
            type="text"
            value={userTopic}
            onChange={(e) => setUserTopic(e.target.value)}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${
              validationError ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
            }`}
            placeholder="Enter user topic (required)"
            required
          />
          {validationError && (
            <p className="mt-1 text-xs text-red-600">{validationError}</p>
          )}
        </div>

        {/* Suggested Topic (Read-only hint) */}
        {thread.suggestedTopic && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              AI Suggested Topic
            </label>
            <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded border border-blue-200">
              {thread.suggestedTopic}
            </div>
          </div>
        )}

        {/* Rationale */}
        <div>
          <label htmlFor="rationale" className="block text-sm font-medium text-gray-700 mb-2">
            Rationale
          </label>
          <textarea
            id="rationale"
            value={rationale}
            onChange={(e) => setRationale(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-y"
            placeholder="Explain the purpose of these changes"
          />
        </div>

        {/* Status Dropdown */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
          <Listbox value={status} onChange={setStatus}>
            <div className="relative">
              <Listbox.Button className="relative w-full cursor-pointer rounded-md bg-white py-2 pl-3 pr-10 text-left border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm">
                <span className="block truncate">
                  <StatusBadge status={status} />
                </span>
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                  <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </span>
              </Listbox.Button>
              <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-sm shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                {STATUS_OPTIONS.map((option) => (
                  <Listbox.Option
                    key={option.value}
                    value={option.value}
                    className={({ active }) =>
                      `relative cursor-pointer select-none py-2 pl-10 pr-4 ${
                        active ? 'bg-blue-100 text-blue-900' : 'text-gray-900'
                      }`
                    }
                  >
                    {({ selected }) => (
                      <>
                        <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                          <StatusBadge status={option.value} />
                        </span>
                        {selected ? (
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600">
                            <CheckIcon className="h-5 w-5" aria-hidden="true" />
                          </span>
                        ) : null}
                      </>
                    )}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </div>
          </Listbox>
        </div>

        {/* Change IDs (Debug) */}
        <div>
          <button
            onClick={() => setShowChangeIds(!showChangeIds)}
            className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            <CodeBracketIcon className="h-4 w-4" />
            <span>Change IDs ({changes.length})</span>
          </button>
          {showChangeIds && (
            <div className="mt-2 bg-gray-50 p-3 rounded border border-gray-200 max-h-40 overflow-y-auto">
              {changes.length === 0 ? (
                <p className="text-xs text-gray-500 italic">No changes in this thread</p>
              ) : (
                <ul className="space-y-1">
                  {changes.map((change) => (
                    <li key={change.changeId} className="text-xs font-mono text-gray-700">
                      {change.changeId}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Timestamps */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <CalendarIcon className="h-4 w-4" />
            <span>Created: {new Date(thread.createdAt).toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <CalendarIcon className="h-4 w-4" />
            <span>Updated: {new Date(thread.updatedAt).toLocaleString()}</span>
          </div>
        </div>

        {/* Notes */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <ChatBubbleLeftIcon className="h-4 w-4 text-gray-700" />
            <h3 className="text-sm font-medium text-gray-700">
              Notes ({thread.notes.length})
            </h3>
          </div>
          
          {/* Add Note Form */}
          <div className="mb-3">
            <div className="flex gap-2">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                onKeyDown={handleKeyPressNote}
                rows={2}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none"
                placeholder="Add a note (Ctrl+Enter to save)"
              />
              <button
                onClick={handleAddNote}
                disabled={!newNote.trim()}
                className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                title="Add note"
              >
                <PlusIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Notes List */}
          {thread.notes.length === 0 ? (
            <p className="text-sm text-gray-500 italic">No notes yet</p>
          ) : (
            <div className="space-y-3">
              {thread.notes.map((note) => (
                <div key={note.noteId} className="bg-gray-50 p-3 rounded border border-gray-200">
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">
                    {note.text}
                  </p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                    {note.author && (
                      <>
                        <UserIcon className="h-3 w-3" />
                        <span>{note.author}</span>
                        <span>•</span>
                      </>
                    )}
                    <span>{new Date(note.timestamp).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: ThreadStatus }) {
  const config = STATUS_OPTIONS.find((opt) => opt.value === status) || {
    label: status,
    classes: 'bg-gray-100 text-gray-800',
  }

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.classes}`}>
      {config.label}
    </span>
  )
}
