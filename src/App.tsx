import { DocumentTextIcon } from '@heroicons/react/24/outline'
import { FileUpload } from './components/FileUpload'
import { DocumentParser } from './components/DocumentParser'
import { ClusteringEngine } from './components/ClusteringEngine'
import { ParsedDocumentList } from './components/ParsedDocumentList'
import { ChangesAndThreadsDisplay } from './components/ChangesAndThreadsDisplay'
import { LLMClusteringControls } from './components/LLMClusteringControls'
import { SuggestedTopics } from './components/SuggestedTopics'

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Document Parser - runs in background */}
      <DocumentParser />
      {/* Clustering Engine - runs after parsing (Phase 2.1) */}
      <ClusteringEngine />

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
            Phase 2.2: LLM-Assisted Clustering (NEW)
          </h2>
          <p className="text-gray-600 mb-4">
            This implementation includes:
          </p>
          <ul className="list-disc list-inside mt-4 space-y-2 text-gray-700">
            <li>Export clustering packet as JSON with clear LLM instructions</li>
            <li>Import and validate LLM responses with comprehensive checks</li>
            <li>Security: All imported text sanitized with DOMPurify</li>
            <li>Validation: ChangeIds, confidence scores, and schema checked</li>
            <li>Suggested topics displayed but never auto-applied to threads</li>
            <li>Support for up to 500 changes per batch</li>
            <li>Clear error messages for invalid responses</li>
          </ul>
          <p className="text-gray-600 mt-4">
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
