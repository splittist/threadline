/**
 * Change List Panel (Phase 3.1 - Center Panel)
 * Displays changes for the selected thread or unassigned changes
 */

import { useStore } from '../store/useStore'
import { 
  DocumentTextIcon,
  FolderIcon,
} from '@heroicons/react/24/outline'

export function ChangeListPanel() {
  const {
    getChangesByThread,
    getUnassignedChanges,
    getNormalizedDocument,
    selection,
  } = useStore()

  const selectedThreadId = selection.selectedThreadId
  const changes = selectedThreadId 
    ? getChangesByThread(selectedThreadId)
    : getUnassignedChanges()

  return (
    <div className="h-full flex flex-col bg-white border-r border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-2 mb-2">
          <DocumentTextIcon className="h-5 w-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Changes</h2>
        </div>
        <p className="text-sm text-gray-500">
          {changes.length} {changes.length === 1 ? 'change' : 'changes'}
          {selectedThreadId ? ' in this thread' : ' unassigned'}
        </p>
      </div>

      {/* Change List */}
      <div className="flex-1 overflow-y-auto">
        {changes.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <FolderIcon className="h-12 w-12 mx-auto text-gray-300 mb-2" />
            <p className="text-sm">No changes to display</p>
            <p className="text-xs mt-1">
              {selectedThreadId 
                ? 'This thread has no changes assigned yet'
                : 'All changes are assigned to threads'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {changes.map((change) => {
              const doc = getNormalizedDocument(change.docId)
              
              return (
                <div
                  key={change.changeId}
                  className="p-4 hover:bg-gray-50 transition-colors"
                >
                  {/* Change Type Badge */}
                  <div className="flex items-start gap-3 mb-2">
                    <ChangeTypeBadge type={change.type} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 line-clamp-2">
                        {change.changedText || '(empty change)'}
                      </p>
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                    <span>by {change.author}</span>
                    {doc && (
                      <span className="truncate">in {doc.name}</span>
                    )}
                  </div>

                  {/* Clause Path */}
                  {change.clausePath.length > 0 && (
                    <div className="mt-2 text-xs text-gray-500">
                      <span className="font-medium">Location: </span>
                      {change.clausePath.join(' → ')}
                    </div>
                  )}

                  {/* Context Preview */}
                  {(change.textBefore || change.textAfter) && (
                    <details className="mt-2">
                      <summary className="text-xs text-blue-600 cursor-pointer hover:text-blue-800">
                        Show context
                      </summary>
                      <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                        {change.textBefore && (
                          <p className="text-gray-600 mb-1">
                            <span className="font-medium">Before: </span>
                            {change.textBefore.substring(0, 100)}
                            {change.textBefore.length > 100 && '...'}
                          </p>
                        )}
                        {change.textAfter && (
                          <p className="text-gray-600">
                            <span className="font-medium">After: </span>
                            {change.textAfter.substring(0, 100)}
                            {change.textAfter.length > 100 && '...'}
                          </p>
                        )}
                      </div>
                    </details>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
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
    classes: 'bg-gray-100 text-gray-800' 
  }

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${config.classes}`}>
      {config.label}
    </span>
  )
}
