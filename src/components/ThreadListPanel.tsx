/**
 * Thread List Panel (Phase 3.1 - Left Panel)
 * Displays all threads and an "Unassigned" bucket
 */

import { useStore } from '../store/useStore'
import { 
  FolderIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  PlusIcon,
} from '@heroicons/react/24/outline'
import type { ThreadStatus } from '../types/dataModel'

export function ThreadListPanel() {
  const {
    getAllThreads,
    getUnassignedChanges,
    getThreadChangeCount,
    setSelectedThread,
    selection,
  } = useStore()

  const threads = getAllThreads()
  const unassignedChanges = getUnassignedChanges()
  const selectedThreadId = selection.selectedThreadId

  const handleThreadSelect = (threadId: string | null) => {
    setSelectedThread(threadId)
  }

  return (
    <div className="h-full flex flex-col bg-white border-r border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-gray-900">Threads</h2>
          <button
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
          threads.map((thread) => {
            const changeCount = getThreadChangeCount(thread.threadId)
            const isSelected = selectedThreadId === thread.threadId

            return (
              <button
                key={thread.threadId}
                onClick={() => handleThreadSelect(thread.threadId)}
                className={`w-full text-left p-4 border-b border-gray-200 hover:bg-gray-50 transition-colors ${
                  isSelected ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-medium text-gray-900 text-sm pr-2">
                    {thread.title}
                  </h3>
                  <ThreadStatusBadge status={thread.status} />
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
            )
          })
        )}
      </div>
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
