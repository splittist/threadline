/**
 * Three Panel Layout Component (Phase 3.1)
 * Responsive layout with Thread List, Change List, and Thread Metadata panels
 */

import { ThreadListPanel } from './ThreadListPanel'
import { ChangeListPanel } from './ChangeListPanel'
import { ThreadMetadataPanel } from './ThreadMetadataPanel'
import { useStore } from '../store/useStore'

export function ThreePanelLayout() {
  const { panelState } = useStore()

  return (
    <div className="h-[calc(100vh-12rem)] flex flex-col lg:flex-row gap-0">
      {/* Left Panel - Thread List */}
      {panelState.showThreadList && (
        <div className="lg:w-80 flex-shrink-0 h-full overflow-hidden">
          <ThreadListPanel />
        </div>
      )}

      {/* Center Panel - Change List */}
      {panelState.showChangeList && (
        <div className="flex-1 h-full overflow-hidden min-w-0">
          <ChangeListPanel />
        </div>
      )}

      {/* Right Panel - Thread Metadata */}
      {panelState.showMetadata && (
        <div className="lg:w-96 flex-shrink-0 h-full overflow-hidden">
          <ThreadMetadataPanel />
        </div>
      )}
    </div>
  )
}
