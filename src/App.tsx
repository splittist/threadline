import { DocumentTextIcon } from '@heroicons/react/24/outline'
import { FileUpload } from './components/FileUpload'
import { DocumentParser } from './components/DocumentParser'
import { ClusteringEngine } from './components/ClusteringEngine'
import { ParsedDocumentList } from './components/ParsedDocumentList'
import { ChangesAndThreadsDisplay } from './components/ChangesAndThreadsDisplay'

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

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Phase 2.1: Heuristic Clustering (NEW)
          </h2>
          <p className="text-gray-600 mb-4">
            This implementation includes:
          </p>
          <ul className="list-disc list-inside mt-4 space-y-2 text-gray-700">
            <li>Clause-based clustering using Levenshtein distance for similarity</li>
            <li>Keyword extraction using TF-IDF algorithm</li>
            <li>Topic suggestions generated from extracted keywords</li>
            <li>Buckets stored as suggested groupings (max 15-20)</li>
            <li>Clustering runs in Web Worker for non-blocking performance</li>
            <li>Changes with similar clause paths automatically grouped</li>
            <li>Related changes across documents identified</li>
            <li>All buckets remain in "Unassigned" state for user review</li>
          </ul>
          <p className="text-gray-600 mt-4">
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
