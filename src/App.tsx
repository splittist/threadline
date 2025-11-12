import { DocumentTextIcon } from '@heroicons/react/24/outline'
import { FileUpload } from './components/FileUpload'
import { DocumentParser } from './components/DocumentParser'
import { ParsedDocumentList } from './components/ParsedDocumentList'

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

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Phase 1.2: DOCX Structure Extraction
          </h2>
          <p className="text-gray-600 mb-4">
            This implementation includes:
          </p>
          <ul className="list-disc list-inside mt-4 space-y-2 text-gray-700">
            <li>Web Worker for non-blocking DOCX parsing</li>
            <li>Extraction of document.xml, styles.xml, and numbering.xml</li>
            <li>Parsing of OOXML structure (paragraphs, sections, text runs)</li>
            <li>Style resolution to identify heading levels</li>
            <li>Numbering parsing for automatic numbering</li>
            <li>Heading hierarchy building with clause paths</li>
            <li>SHA-256 document hashing for identity</li>
            <li>Zustand state management for parsed documents</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default App
