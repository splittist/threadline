import { DocumentTextIcon } from '@heroicons/react/24/outline'
import { FileUpload } from './components/FileUpload'
import { DocumentParser } from './components/DocumentParser'
import { ClusteringEngine } from './components/ClusteringEngine'
import { ParsedDocumentList } from './components/ParsedDocumentList'
import { ChangesAndThreadsDisplay } from './components/ChangesAndThreadsDisplay'
import { LLMClusteringControls } from './components/LLMClusteringControls'
import { SuggestedTopics } from './components/SuggestedTopics'
import { ThreePanelLayout } from './components/ThreePanelLayout'
import { ToastContainer } from './components/Toast'
import { useStore } from './store/useStore'

function App() {
  const { changes, toasts, removeToast } = useStore()
  const hasChanges = changes.size > 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Document Parser - runs in background */}
      <DocumentParser />
      {/* Clustering Engine - runs after parsing (Phase 2.1) */}
      <ClusteringEngine />

      {/* Toast Notifications */}
      <ToastContainer 
        toasts={toasts.map(toast => ({ 
          ...toast, 
          onClose: () => removeToast(toast.id) 
        }))} 
      />

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <DocumentTextIcon className="h-10 w-10 text-blue-600" />
          <h1 className="text-4xl font-bold text-gray-900">Threadline</h1>
        </div>
        <p className="text-lg text-gray-600 mb-4">
          Bringing clarity to the chaos of redlines.
        </p>

        {/* File Upload Section */}
        <div className="mb-8">
          <FileUpload />
        </div>

        {/* Three-Panel Layout - Phase 3.1 (NEW) */}
        {hasChanges && (
          <div className="mb-8">
            <div className="bg-white rounded-lg shadow-md p-4">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Thread Management
              </h2>
              <ThreePanelLayout />
            </div>
          </div>
        )}

        {/* Parsed Documents Display */}
        <div className="mb-8">
          <ParsedDocumentList />
        </div>

        {/* Changes and Threads Display - Phase 1.4 */}
        <div className="mb-8">
          <ChangesAndThreadsDisplay />
        </div>

        {/* LLM Clustering Controls - Phase 2.2 */}
        <div className="mb-8">
          <LLMClusteringControls />
        </div>

        {/* Suggested Topics - Phase 2.1 & 2.2 */}
        <div className="mb-8">
          <SuggestedTopics />
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Phase 3.1: Three-Panel Layout (NEW)
          </h2>
          <p className="text-gray-600 mb-4">
            This implementation includes:
          </p>
          <ul className="list-disc list-inside mt-4 space-y-2 text-gray-700">
            <li>Responsive three-panel layout with Thread List, Change List, and Thread Metadata</li>
            <li>Panel state management in Zustand store</li>
            <li>Thread selection and navigation</li>
            <li>Unassigned changes bucket</li>
            <li>Change display with context and metadata</li>
            <li>Thread details with status, rationale, and notes</li>
            <li>Mobile-friendly responsive design (stacks on small screens)</li>
          </ul>
          <p className="text-gray-600 mt-4">
            <strong>Previous Phase 2.2 features:</strong> Export clustering packet as JSON with clear LLM instructions,
            import and validate LLM responses, security (all imported text sanitized), validation (ChangeIds, confidence scores),
            suggested topics displayed but never auto-applied, support for up to 500 changes per batch.
          </p>
          <p className="text-gray-600 mt-2">
            <strong>Previous Phase 2.1 features:</strong> Clause-based clustering using Levenshtein distance,
            keyword extraction using TF-IDF, topic suggestions, buckets stored as suggested groupings,
            clustering runs in Web Worker for performance.
          </p>
          <p className="text-gray-600 mt-2">
            <strong>Previous Phase 1.4 features:</strong> Core data structures (Document, Change, Thread),
            Zustand store slices, state update actions, computed selectors, and automatic change extraction.
          </p>
          <p className="text-gray-600 mt-2">
            <strong>Phase 1.2 features:</strong> Web Worker for non-blocking DOCX parsing,
            extraction of document.xml, styles.xml, and numbering.xml, parsing of OOXML structure,
            style resolution, heading hierarchy building, and SHA-256 document hashing.
          </p>
        </div>
      </div>
    </div>
  )
}

export default App
