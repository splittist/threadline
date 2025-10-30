import { DocumentTextIcon } from '@heroicons/react/24/outline'

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <DocumentTextIcon className="h-10 w-10 text-blue-600" />
          <h1 className="text-4xl font-bold text-gray-900">Threadline</h1>
        </div>
        <p className="text-lg text-gray-600 mb-4">
          Bringing clarity to the chaos of redlines.
        </p>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Welcome to Threadline
          </h2>
          <p className="text-gray-600">
            This application is built with:
          </p>
          <ul className="list-disc list-inside mt-4 space-y-2 text-gray-700">
            <li>Vite + TypeScript + React</li>
            <li>Tailwind CSS for styling</li>
            <li>Zustand for state management</li>
            <li>Headless UI + Heroicons for UI components</li>
            <li>JSZip & docx-preview for DOCX manipulation</li>
            <li>idb for IndexedDB storage</li>
            <li>Vitest + React Testing Library for testing</li>
            <li>ESLint with security plugin + Prettier</li>
            <li>DOMPurify for security</li>
            <li>react-window for performance</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default App
