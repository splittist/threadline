/**
 * Thread List Panel (Phase 3.2 - Left Panel)
 * Displays all threads and an "Unassigned" bucket
 * Supports thread creation, deletion, and selection
 */

import { useState } from 'react'
import { useStore } from '../store/useStore'
import { 
  FolderIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import type { ThreadStatus } from '../types/dataModel'

export function ThreadListPanel() {
  const {
    getAllThreads,
    getUnassignedChanges,
    getThreadChangeCount,
    setSelectedThread,
    selection,
    createThread,
    deleteThread,
  } = useStore()

  const threads = getAllThreads()
  const unassignedChanges = getUnassignedChanges()
  const selectedThreadId = selection.selectedThreadId

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [threadToDelete, setThreadToDelete] = useState<string | null>(null)
  const [newThreadForm, setNewThreadForm] = useState({
    title: '',
    userTopic: '',
    rationale: '',
  })

  const handleThreadSelect = (threadId: string | null) => {
    setSelectedThread(threadId)
  }

  const handleCreateThread = () => {
    if (newThreadForm.title.trim() && newThreadForm.userTopic.trim()) {
      createThread({
        title: newThreadForm.title.trim(),
        userTopic: newThreadForm.userTopic.trim(),
        rationale: newThreadForm.rationale.trim(),
        suggestedTopic: null,
        changeIds: [],
        status: 'proposed',
        notes: [],
      })
      setNewThreadForm({ title: '', userTopic: '', rationale: '' })
      setIsCreateDialogOpen(false)
    }
  }

  const handleDeleteThread = () => {
    if (threadToDelete) {
      deleteThread(threadToDelete)
      setThreadToDelete(null)
      setIsDeleteDialogOpen(false)
    }
  }

  const openDeleteDialog = (threadId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setThreadToDelete(threadId)
    setIsDeleteDialogOpen(true)
  }

  return (
    <div className="h-full flex flex-col bg-white border-r border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-gray-900">Threads</h2>
          <button
            onClick={() => setIsCreateDialogOpen(true)}
            className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
            title="New Thread"
          >
            <PlusIcon className="h-5 w-5 text-gray-600" />
          </button>
        </div>
        <p className="text-sm text-gray-500">
          {threads.length} {threads.length === 1 ? 'thread' : 'threads'}
        </p>
      </div>

      {/* Thread List */}
      <div className="flex-1 overflow-y-auto">
        {/* Unassigned Changes */}
        {unassignedChanges.length > 0 && (
          <button
            onClick={() => handleThreadSelect(null)}
            className={`w-full text-left p-4 border-b border-gray-200 hover:bg-gray-50 transition-colors ${
              selectedThreadId === null ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ExclamationCircleIcon className="h-5 w-5 text-amber-600" />
                <span className="font-medium text-gray-900">Unassigned</span>
              </div>
              <span className="text-sm font-medium text-amber-600">
                {unassignedChanges.length}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Changes not yet assigned to a thread
            </p>
          </button>
        )}

        {/* Thread Items */}
        {threads.length === 0 && unassignedChanges.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <FolderIcon className="h-12 w-12 mx-auto text-gray-300 mb-2" />
            <p className="text-sm">No threads yet</p>
            <p className="text-xs mt-1">Upload documents to get started</p>
          </div>
        ) : (
          // Render all threads (virtualization can be added later if needed)
          threads.map((thread) => {
            const changeCount = getThreadChangeCount(thread.threadId)
            const isSelected = selectedThreadId === thread.threadId

            return (
              <div
                key={thread.threadId}
                className={`relative border-b border-gray-200 transition-colors ${
                  isSelected ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                }`}
              >
                <button
                  onClick={() => handleThreadSelect(thread.threadId)}
                  className="w-full text-left p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-gray-900 text-sm pr-2 flex-1">
                      {thread.title}
                    </h3>
                    <div className="flex items-center gap-2">
                      <ThreadStatusBadge status={thread.status} />
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">
                    {thread.userTopic}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {changeCount} {changeCount === 1 ? 'change' : 'changes'}
                    </span>
                  </div>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    openDeleteDialog(thread.threadId, e)
                  }}
                  className="absolute top-4 right-4 p-1 rounded hover:bg-red-100 transition-colors z-10"
                  title="Delete thread"
                >
                  <TrashIcon className="h-4 w-4 text-gray-500 hover:text-red-600" />
                </button>
              </div>
            )
          })
        )}
      </div>

      {/* Create Thread Dialog */}
      <Dialog open={isCreateDialogOpen} onClose={() => setIsCreateDialogOpen(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="mx-auto max-w-md w-full bg-white rounded-lg shadow-xl p-6">
            <DialogTitle className="text-lg font-semibold text-gray-900 mb-4">
              Create New Thread
            </DialogTitle>
            <div className="space-y-4">
              <div>
                <label htmlFor="thread-title" className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  id="thread-title"
                  type="text"
                  value={newThreadForm.title}
                  onChange={(e) => setNewThreadForm({ ...newThreadForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Payment Terms Update"
                />
              </div>
              <div>
                <label htmlFor="thread-topic" className="block text-sm font-medium text-gray-700 mb-1">
                  Topic *
                </label>
                <input
                  id="thread-topic"
                  type="text"
                  value={newThreadForm.userTopic}
                  onChange={(e) => setNewThreadForm({ ...newThreadForm, userTopic: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Payment"
                />
              </div>
              <div>
                <label htmlFor="thread-rationale" className="block text-sm font-medium text-gray-700 mb-1">
                  Rationale
                </label>
                <textarea
                  id="thread-rationale"
                  value={newThreadForm.rationale}
                  onChange={(e) => setNewThreadForm({ ...newThreadForm, rationale: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Explain the purpose of this thread..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setIsCreateDialogOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateThread}
                disabled={!newThreadForm.title.trim() || !newThreadForm.userTopic.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Create Thread
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onClose={() => setIsDeleteDialogOpen(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="mx-auto max-w-md w-full bg-white rounded-lg shadow-xl p-6">
            <DialogTitle className="text-lg font-semibold text-gray-900 mb-4">
              Delete Thread
            </DialogTitle>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete this thread? All changes will be unassigned and moved to the Unassigned bucket. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsDeleteDialogOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteThread}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </div>
  )
}

function ThreadStatusBadge({ status }: { status: ThreadStatus }) {
  const statusConfig = {
    proposed: { 
      icon: ClockIcon, 
      classes: 'bg-blue-100 text-blue-700',
      label: 'Proposed'
    },
    'under-review': { 
      icon: ClockIcon, 
      classes: 'bg-yellow-100 text-yellow-700',
      label: 'Review'
    },
    approved: { 
      icon: CheckCircleIcon, 
      classes: 'bg-green-100 text-green-700',
      label: 'Approved'
    },
    rejected: { 
      icon: XCircleIcon, 
      classes: 'bg-red-100 text-red-700',
      label: 'Rejected'
    },
    escalate: { 
      icon: ExclamationTriangleIcon, 
      classes: 'bg-orange-100 text-orange-700',
      label: 'Escalate'
    },
  }

  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${config.classes}`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  )
}
