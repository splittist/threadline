/**
 * Change List Panel (Phase 3.3 - Center Panel)
 * Displays changes for the selected thread or unassigned changes
 * with selection, bulk operations, search/filter, split, and virtualization
 */

import { useState, useMemo } from 'react'
import { useStore } from '../store/useStore'
import {
  DocumentTextIcon,
  FolderIcon,
  MagnifyingGlassIcon,
  ArrowsRightLeftIcon,
  PlusIcon,
  ChevronRightIcon,
  ScissorsIcon,
} from '@heroicons/react/24/outline'
import { Menu, MenuButton, MenuItems, MenuItem, Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import type { Change, Document } from '../types/dataModel'

export function ChangeListPanel() {
  const {
    getChangesByThread,
    getUnassignedChanges,
    getNormalizedDocument,
    getAllThreads,
    getThread,
    selection,
    toggleChangeSelection,
    selectChanges,
    clearChangeSelection,
    assignChangesToThread,
    createThread,
    splitThread,
  } = useStore()

  const selectedThreadId = selection.selectedThreadId
  const allChanges = selectedThreadId
    ? getChangesByThread(selectedThreadId)
    : getUnassignedChanges()
  const threads = getAllThreads()
  const currentThread = selectedThreadId ? getThread(selectedThreadId) : null

  const [searchQuery, setSearchQuery] = useState('')
  const [isCreateThreadDialogOpen, setIsCreateThreadDialogOpen] = useState(false)
  const [isSplitDialogOpen, setIsSplitDialogOpen] = useState(false)
  const [newThreadForm, setNewThreadForm] = useState({
    title: '',
    userTopic: '',
    rationale: '',
  })
  const [splitThreadForm, setSplitThreadForm] = useState({
    title: '',
    userTopic: '',
    rationale: '',
  })

  // Filter changes based on search query
  const filteredChanges = useMemo(() => {
    if (!searchQuery.trim()) return allChanges

    const query = searchQuery.toLowerCase()
    return allChanges.filter((change) => {
      const doc = getNormalizedDocument(change.docId)
      return (
        change.changedText.toLowerCase().includes(query) ||
        change.author.toLowerCase().includes(query) ||
        change.clausePath.some((path) => path.toLowerCase().includes(query)) ||
        change.textBefore.toLowerCase().includes(query) ||
        change.textAfter.toLowerCase().includes(query) ||
        (doc && doc.name.toLowerCase().includes(query))
      )
    })
  }, [allChanges, searchQuery, getNormalizedDocument])

  const selectedChangeIds = selection.selectedChangeIds
  const hasSelection = selectedChangeIds.size > 0
  const allSelected = filteredChanges.length > 0 && filteredChanges.every((c) => selectedChangeIds.has(c.changeId))

  // Handle bulk select/deselect
  const handleSelectAll = () => {
    if (allSelected) {
      clearChangeSelection()
    } else {
      selectChanges(filteredChanges.map((c) => c.changeId))
    }
  }

  // Handle moving changes to a thread
  const handleMoveToThread = (targetThreadId: string | null) => {
    const changeIds = Array.from(selectedChangeIds)
    assignChangesToThread(changeIds, targetThreadId)
    clearChangeSelection()
  }

  // Handle creating new thread with selected changes
  const handleCreateThreadWithChanges = () => {
    if (newThreadForm.title.trim() && newThreadForm.userTopic.trim()) {
      const changeIds = Array.from(selectedChangeIds)
      const thread = createThread({
        title: newThreadForm.title.trim(),
        userTopic: newThreadForm.userTopic.trim(),
        rationale: newThreadForm.rationale.trim(),
        suggestedTopic: null,
        changeIds: [],
        status: 'proposed',
        notes: [],
      })
      assignChangesToThread(changeIds, thread.threadId)
      setNewThreadForm({ title: '', userTopic: '', rationale: '' })
      setIsCreateThreadDialogOpen(false)
      clearChangeSelection()
    }
  }

  // Handle splitting thread by moving selected changes to new thread
  const handleSplitThread = () => {
    if (splitThreadForm.title.trim() && splitThreadForm.userTopic.trim() && selectedThreadId) {
      const changeIds = Array.from(selectedChangeIds)
      splitThread(
        selectedThreadId,
        changeIds,
        splitThreadForm.title.trim(),
        splitThreadForm.userTopic.trim(),
        splitThreadForm.rationale.trim()
      )
      setSplitThreadForm({ title: '', userTopic: '', rationale: '' })
      setIsSplitDialogOpen(false)
    }
  }

  const openSplitDialog = () => {
    if (currentThread) {
      setSplitThreadForm({
        title: `${currentThread.title} (Split)`,
        userTopic: currentThread.userTopic,
        rationale: '',
      })
    }
    setIsSplitDialogOpen(true)
  }

  return (
    <div className="h-full flex flex-col bg-white border-r border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DocumentTextIcon className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Changes</h2>
          </div>
          <p className="text-sm text-gray-500">
            {filteredChanges.length} {filteredChanges.length === 1 ? 'change' : 'changes'}
            {selectedThreadId ? ' in this thread' : ' unassigned'}
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search changes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Bulk Actions */}
        {filteredChanges.length > 0 && (
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={handleSelectAll}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span>
                {hasSelection
                  ? `${selectedChangeIds.size} selected`
                  : 'Select all'}
              </span>
            </label>

            {hasSelection && (
              <div className="flex items-center gap-2">
                {/* Split button - only show when viewing a thread */}
                {selectedThreadId && (
                  <button
                    onClick={openSplitDialog}
                    className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                    title="Split selected changes into a new thread"
                  >
                    <ScissorsIcon className="h-4 w-4" />
                    Split to New Thread
                  </button>
                )}
                
                {/* Move to... menu */}
                <Menu as="div" className="relative">
                  <MenuButton className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    <ArrowsRightLeftIcon className="h-4 w-4" />
                    Move to...
                  </MenuButton>
                <MenuItems className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <div className="py-1 max-h-60 overflow-y-auto">
                    {selectedThreadId && (
                      <MenuItem>
                        {({ focus }) => (
                          <button
                            onClick={() => handleMoveToThread(null)}
                            className={`${
                              focus ? 'bg-gray-100' : ''
                            } w-full text-left px-4 py-2 text-sm text-gray-700`}
                          >
                            Unassigned
                          </button>
                        )}
                      </MenuItem>
                    )}
                    {threads
                      .filter((t) => t.threadId !== selectedThreadId)
                      .map((thread) => (
                        <MenuItem key={thread.threadId}>
                          {({ focus }) => (
                            <button
                              onClick={() => handleMoveToThread(thread.threadId)}
                              className={`${
                                focus ? 'bg-gray-100' : ''
                              } w-full text-left px-4 py-2 text-sm text-gray-700`}
                            >
                              {thread.title}
                            </button>
                          )}
                        </MenuItem>
                      ))}
                    <div className="border-t border-gray-100">
                      <MenuItem>
                        {({ focus }) => (
                          <button
                            onClick={() => setIsCreateThreadDialogOpen(true)}
                            className={`${
                              focus ? 'bg-gray-100' : ''
                            } w-full text-left px-4 py-2 text-sm text-blue-600 font-medium flex items-center gap-2`}
                          >
                            <PlusIcon className="h-4 w-4" />
                            Create new thread
                          </button>
                        )}
                      </MenuItem>
                    </div>
                  </div>
                </MenuItems>
              </Menu>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Change List */}
      <div className="flex-1 overflow-y-auto">
        {filteredChanges.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <FolderIcon className="h-12 w-12 mx-auto text-gray-300 mb-2" />
            <p className="text-sm">
              {searchQuery ? 'No changes match your search' : 'No changes to display'}
            </p>
            <p className="text-xs mt-1">
              {selectedThreadId
                ? 'This thread has no changes assigned yet'
                : 'All changes are assigned to threads'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredChanges.map((change) => (
              <ChangeItem
                key={change.changeId}
                change={change}
                isSelected={selectedChangeIds.has(change.changeId)}
                onToggleSelection={() => toggleChangeSelection(change.changeId)}
                getNormalizedDocument={getNormalizedDocument}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Thread Dialog */}
      <Dialog open={isCreateThreadDialogOpen} onClose={() => setIsCreateThreadDialogOpen(false)}>
        <div className="fixed inset-0 bg-black/30 z-50" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
          <DialogPanel className="w-full max-w-md bg-white rounded-lg shadow-xl p-6">
            <DialogTitle className="text-lg font-semibold text-gray-900 mb-4">
              Create New Thread
            </DialogTitle>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={newThreadForm.title}
                  onChange={(e) =>
                    setNewThreadForm({ ...newThreadForm, title: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Brief description of changes"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Topic *
                </label>
                <input
                  type="text"
                  value={newThreadForm.userTopic}
                  onChange={(e) =>
                    setNewThreadForm({ ...newThreadForm, userTopic: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Termination Clause"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rationale
                </label>
                <textarea
                  value={newThreadForm.rationale}
                  onChange={(e) =>
                    setNewThreadForm({ ...newThreadForm, rationale: e.target.value })
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Why these changes belong together..."
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setIsCreateThreadDialogOpen(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateThreadWithChanges}
                disabled={!newThreadForm.title.trim() || !newThreadForm.userTopic.trim()}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create & Move
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>

      {/* Split Thread Dialog */}
      <Dialog open={isSplitDialogOpen} onClose={() => setIsSplitDialogOpen(false)}>
        <div className="fixed inset-0 bg-black/30 z-50" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
          <DialogPanel className="w-full max-w-md bg-white rounded-lg shadow-xl p-6">
            <DialogTitle className="text-lg font-semibold text-gray-900 mb-4">
              Split Thread
            </DialogTitle>
            <p className="text-sm text-gray-600 mb-4">
              Moving {selectedChangeIds.size} {selectedChangeIds.size === 1 ? 'change' : 'changes'} to a new thread. The original thread will keep its remaining changes.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={splitThreadForm.title}
                  onChange={(e) =>
                    setSplitThreadForm({ ...splitThreadForm, title: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="New thread title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Topic *
                </label>
                <input
                  type="text"
                  value={splitThreadForm.userTopic}
                  onChange={(e) =>
                    setSplitThreadForm({ ...splitThreadForm, userTopic: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="New thread topic"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rationale
                </label>
                <textarea
                  value={splitThreadForm.rationale}
                  onChange={(e) =>
                    setSplitThreadForm({ ...splitThreadForm, rationale: e.target.value })
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Why these changes should be in a separate thread..."
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setIsSplitDialogOpen(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                onClick={handleSplitThread}
                disabled={!splitThreadForm.title.trim() || !splitThreadForm.userTopic.trim()}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Split Thread
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </div>
  )
}

// Individual change item component
interface ChangeItemProps {
  change: Change
  isSelected: boolean
  onToggleSelection: () => void
  getNormalizedDocument: (docId: string) => Document | undefined
}

function ChangeItem({ change, isSelected, onToggleSelection, getNormalizedDocument }: ChangeItemProps) {
  const doc = getNormalizedDocument(change.docId)

  return (
    <div
      className={`p-4 hover:bg-gray-50 transition-colors ${
        isSelected ? 'bg-blue-50' : ''
      }`}
    >
      {/* Checkbox and Change Type Badge */}
      <div className="flex items-start gap-3 mb-2">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggleSelection}
          className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
        <ChangeTypeBadge type={change.type} />
        <div className="flex-1 min-w-0">
          <DiffView change={change} />
        </div>
      </div>

      {/* Metadata */}
      <div className="flex items-center gap-4 text-xs text-gray-500 mt-2 ml-7">
        <span className="font-medium">by {change.author}</span>
        {doc && <span className="truncate">in {doc.name}</span>}
        {change.timestamp && (
          <span>{new Date(change.timestamp).toLocaleDateString()}</span>
        )}
      </div>

      {/* Clause Path as Breadcrumb */}
      {change.clausePath.length > 0 && (
        <div className="mt-2 ml-7 flex items-center gap-1 text-xs text-gray-500 flex-wrap">
          <span className="font-medium">Location:</span>
          {change.clausePath.map((segment, index) => (
            <span key={index} className="flex items-center gap-1">
              {index > 0 && <ChevronRightIcon className="h-3 w-3 text-gray-400" />}
              <span className="px-1.5 py-0.5 bg-gray-100 rounded">{segment}</span>
            </span>
          ))}
        </div>
      )}

      {/* Context Window */}
      {(change.textBefore || change.textAfter) && (
        <details className="mt-2 ml-7">
          <summary className="text-xs text-blue-600 cursor-pointer hover:text-blue-800">
            Show context
          </summary>
          <div className="mt-2 p-3 bg-gray-50 rounded text-xs space-y-2">
            {change.textBefore && (
              <div>
                <span className="font-medium text-gray-700">Before: </span>
                <span className="text-gray-600">{change.textBefore}</span>
              </div>
            )}
            {change.textAfter && (
              <div>
                <span className="font-medium text-gray-700">After: </span>
                <span className="text-gray-600">{change.textAfter}</span>
              </div>
            )}
          </div>
        </details>
      )}
    </div>
  )
}

// Diff view component with color coding
function DiffView({ change }: { change: Change }) {
  if (change.type === 'insertion') {
    return (
      <div className="text-sm">
        <span className="bg-green-100 text-green-900 px-1 rounded">
          {change.changedText || '(empty change)'}
        </span>
      </div>
    )
  }

  if (change.type === 'deletion') {
    return (
      <div className="text-sm">
        <span className="bg-red-100 text-red-900 px-1 rounded line-through">
          {change.changedText || '(empty change)'}
        </span>
      </div>
    )
  }

  // For moveFrom and moveTo, show as is
  return (
    <p className="text-sm text-gray-900">
      {change.changedText || '(empty change)'}
    </p>
  )
}

function ChangeTypeBadge({ type }: { type: string }) {
  const typeConfig = {
    insertion: { label: 'Insert', classes: 'bg-green-100 text-green-800' },
    deletion: { label: 'Delete', classes: 'bg-red-100 text-red-800' },
    moveFrom: { label: 'Move From', classes: 'bg-blue-100 text-blue-800' },
    moveTo: { label: 'Move To', classes: 'bg-blue-100 text-blue-800' },
  }

  const config = typeConfig[type as keyof typeof typeConfig] || {
    label: type,
    classes: 'bg-gray-100 text-gray-800',
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${config.classes}`}
    >
      {config.label}
    </span>
  )
}
