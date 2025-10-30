/**
 * Example component demonstrating react-window for virtual scrolling
 * 
 * Note: This is a simple placeholder component. The actual react-window
 * integration will depend on the specific use case and data structure.
 */

interface DocumentListProps {
  documents: string[]
}

export function DocumentList({ documents }: DocumentListProps) {
  return (
    <div className="border border-gray-300 rounded-lg">
      <div className="max-h-96 overflow-y-auto">
        {documents.map((doc, index) => (
          <div
            key={index}
            className="flex items-center px-4 py-3 border-b border-gray-200 last:border-b-0"
          >
            <span className="text-gray-700">{doc}</span>
          </div>
        ))}
      </div>
      <p className="px-4 py-2 text-sm text-gray-500 bg-gray-50 rounded-b-lg">
        react-window is available for efficient virtual scrolling of large lists
      </p>
    </div>
  )
}
