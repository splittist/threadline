/**
 * Component to display changes and threads (Phase 1.4)
 * Shows feedback below the file drop box about changes and threads
 */

import { useStore } from '../store/useStore'
import { 
  DocumentTextIcon, 
  FolderIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'
import type { ThreadStatus } from '../types/dataModel'

export function ChangesAndThreadsDisplay() {
  const { 
    changes, 
    normalizedDocuments,
    getAllThreads,
    getUnassignedChanges,
  } = useStore()

  const allChanges = Array.from(changes.values())
  const allThreads = getAllThreads()
  const unassignedChanges = getUnassignedChanges()
  const allDocs = Array.from(normalizedDocuments.values())

  // Don't render if no changes
  if (allChanges.length === 0) {
    return null
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">
        Changes & Threads Overview
      </h2>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={<DocumentTextIcon className="h-6 w-6" />}
          label="Documents"
          value={allDocs.length}
          color="blue"
        />
        <StatCard
          icon={<FolderIcon className="h-6 w-6" />}
          label="Tracked Changes"
          value={allChanges.length}
          color="purple"
        />
        <StatCard
          icon={<CheckCircleIcon className="h-6 w-6" />}
          label="Threads"
          value={allThreads.length}
          color="green"
        />
        <StatCard
          icon={<ExclamationCircleIcon className="h-6 w-6" />}
          label="Unassigned"
          value={unassignedChanges.length}
          color="amber"
        />
      </div>

      {/* Changes by Type */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-800 mb-3">
          Changes by Type
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <ChangeTypeBadge
            label="Insertions"
            count={allChanges.filter((c) => c.type === 'insertion').length}
            color="green"
          />
          <ChangeTypeBadge
            label="Deletions"
            count={allChanges.filter((c) => c.type === 'deletion').length}
            color="red"
          />
          <ChangeTypeBadge
            label="Move From"
            count={allChanges.filter((c) => c.type === 'moveFrom').length}
            color="blue"
          />
          <ChangeTypeBadge
            label="Move To"
            count={allChanges.filter((c) => c.type === 'moveTo').length}
            color="blue"
          />
        </div>
      </div>

      {/* Threads List */}
      {allThreads.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-800 mb-3">
            Threads
          </h3>
          <div className="space-y-2">
            {allThreads.map((thread) => (
              <ThreadCard key={thread.threadId} thread={thread} />
            ))}
          </div>
        </div>
      )}

      {/* Unassigned Changes Sample */}
      {unassignedChanges.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-gray-800 mb-3">
            Sample Unassigned Changes
          </h3>
          <div className="space-y-2">
            {unassignedChanges.slice(0, 5).map((change) => (
              <ChangeCard key={change.changeId} change={change} />
            ))}
            {unassignedChanges.length > 5 && (
              <p className="text-sm text-gray-500 italic">
                ...and {unassignedChanges.length - 5} more unassigned changes
              </p>
            )}
          </div>
        </div>
      )}

      {/* Info Message */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Phase 1.4 Complete:</strong> Data model implemented with Document, Change, 
          and Thread structures. Changes are extracted from parsed documents and stored in 
          the Zustand store. Thread creation and management UI will be added in Phase 3.
        </p>
      </div>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: number
  color: 'blue' | 'purple' | 'green' | 'amber'
}) {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-50',
    purple: 'text-purple-600 bg-purple-50',
    green: 'text-green-600 bg-green-50',
    amber: 'text-amber-600 bg-amber-50',
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className={`${colorClasses[color]} p-2 rounded`}>
          {icon}
        </div>
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-sm text-gray-600">{label}</div>
    </div>
  )
}

function ChangeTypeBadge({
  label,
  count,
  color,
}: {
  label: string
  count: number
  color: 'green' | 'red' | 'blue'
}) {
  const colorClasses = {
    green: 'bg-green-100 text-green-800',
    red: 'bg-red-100 text-red-800',
    blue: 'bg-blue-100 text-blue-800',
  }

  return (
    <div className={`${colorClasses[color]} px-3 py-2 rounded-lg text-center`}>
      <div className="text-lg font-semibold">{count}</div>
      <div className="text-xs">{label}</div>
    </div>
  )
}

function ThreadCard({ thread }: { thread: { threadId: string; title: string; userTopic: string; status: ThreadStatus; changeIds: string[] } }) {
  return (
    <div className="border border-gray-200 rounded-lg p-3 hover:border-blue-300 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-gray-900">{thread.title}</h4>
            <ThreadStatusBadge status={thread.status} />
          </div>
          <p className="text-sm text-gray-600">
            Topic: <span className="font-medium">{thread.userTopic}</span>
          </p>
        </div>
        <div className="text-sm font-medium text-blue-600">
          {thread.changeIds.length} {thread.changeIds.length === 1 ? 'change' : 'changes'}
        </div>
      </div>
    </div>
  )
}

function ThreadStatusBadge({ status }: { status: ThreadStatus }) {
  const statusConfig = {
    proposed: { label: 'Proposed', icon: ClockIcon, classes: 'bg-blue-100 text-blue-800' },
    'under-review': { label: 'Under Review', icon: ClockIcon, classes: 'bg-yellow-100 text-yellow-800' },
    approved: { label: 'Approved', icon: CheckCircleIcon, classes: 'bg-green-100 text-green-800' },
    rejected: { label: 'Rejected', icon: XCircleIcon, classes: 'bg-red-100 text-red-800' },
    escalate: { label: 'Escalate', icon: ExclamationTriangleIcon, classes: 'bg-orange-100 text-orange-800' },
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

function ChangeCard({ change }: { change: { changeId: string; type: string; author: string; changedText: string; docId: string } }) {
  const typeColors = {
    insertion: 'text-green-600 bg-green-50',
    deletion: 'text-red-600 bg-red-50',
    moveFrom: 'text-blue-600 bg-blue-50',
    moveTo: 'text-blue-600 bg-blue-50',
  }

  const typeColor = typeColors[change.type as keyof typeof typeColors] || 'text-gray-600 bg-gray-50'

  return (
    <div className="border border-gray-200 rounded-lg p-3">
      <div className="flex items-start gap-3">
        <span className={`px-2 py-1 rounded text-xs font-medium ${typeColor}`}>
          {change.type}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-900 truncate">
            {change.changedText}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            by {change.author}
          </p>
        </div>
      </div>
    </div>
  )
}
