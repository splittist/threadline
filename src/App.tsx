import { DocumentTextIcon } from '@heroicons/react/24/outline'
import { FileUpload } from './components/FileUpload'
import { DocumentParser } from './components/DocumentParser'
import { ParsedDocumentList } from './components/ParsedDocumentList'
import { ChangesAndThreadsDisplay } from './components/ChangesAndThreadsDisplay'

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Document Parser - runs in background */}
      <DocumentParser />

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
            Phase 1.4: Data Model Implementation
          </h2>
          <p className="text-gray-600 mb-4">
            This implementation includes:
          </p>
          <ul className="list-disc list-inside mt-4 space-y-2 text-gray-700">
            <li>Core data structures: Document, Change, and Thread</li>
            <li>Zustand store slices for documents, changes, threads, and selection</li>
            <li>State update actions for all entities</li>
            <li>Computed selectors for derived state</li>
            <li>Immutable state updates with TypeScript type safety</li>
            <li>Changes automatically extracted from parsed documents</li>
            <li>Display of changes and threads in UI</li>
            <li>State can be serialized/deserialized for persistence</li>
          </ul>
          <p className="text-gray-600 mt-4">
            <strong>Previous Phase 1.2 features:</strong> Web Worker for non-blocking DOCX parsing,
            extraction of document.xml, styles.xml, and numbering.xml, parsing of OOXML structure,
            style resolution, heading hierarchy building, and SHA-256 document hashing.
          </p>
        </div>
      </div>
    </div>
  )
}

export default App
