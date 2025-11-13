/**
 * Thread Metadata Panel (Phase 3.1 - Right Panel)
 * Displays metadata for the selected thread
 */

import { useStore } from '../store/useStore'
import { 
  InformationCircleIcon,
  ChatBubbleLeftIcon,
  CalendarIcon,
  UserIcon,
} from '@heroicons/react/24/outline'

export function ThreadMetadataPanel() {
  const {
    getThread,
    selection,
  } = useStore()

  const selectedThreadId = selection.selectedThreadId
  const thread = selectedThreadId ? getThread(selectedThreadId) : null

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
        <h2 className="text-lg font-semibold text-gray-900 mb-1">
          {thread.title}
        </h2>
        <p className="text-sm text-gray-600">Thread Details</p>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 space-y-6">
        {/* Topic */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Topic</h3>
          <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded">
            {thread.userTopic}
          </p>
        </div>

        {/* Status */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Status</h3>
          <StatusDisplay status={thread.status} />
        </div>

        {/* Rationale */}
        {thread.rationale && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Rationale</h3>
            <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded whitespace-pre-wrap">
              {thread.rationale}
            </p>
          </div>
        )}

        {/* Suggested Topic (if different from user topic) */}
        {thread.suggestedTopic && thread.suggestedTopic !== thread.userTopic && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              AI Suggested Topic
            </h3>
            <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded border border-blue-200">
              {thread.suggestedTopic}
            </p>
          </div>
        )}

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
          {thread.notes.length === 0 ? (
            <p className="text-sm text-gray-500 italic">No notes yet</p>
          ) : (
            <div className="space-y-3">
              {thread.notes.map((note) => (
                <div key={note.noteId} className="bg-gray-50 p-3 rounded">
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

function StatusDisplay({ status }: { status: string }) {
  const statusConfig = {
    proposed: { label: 'Proposed', classes: 'bg-blue-100 text-blue-800' },
    'under-review': { label: 'Under Review', classes: 'bg-yellow-100 text-yellow-800' },
    approved: { label: 'Approved', classes: 'bg-green-100 text-green-800' },
    rejected: { label: 'Rejected', classes: 'bg-red-100 text-red-800' },
  }

  const config = statusConfig[status as keyof typeof statusConfig] || {
    label: status,
    classes: 'bg-gray-100 text-gray-800',
  }

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.classes}`}>
      {config.label}
    </span>
  )
}
