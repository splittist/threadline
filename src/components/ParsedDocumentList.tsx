/**
 * Component to display parsed document information
 */

import type { HeadingNode } from '../types/docx'
import { useStore } from '../store/useStore'
import { DocumentTextIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'

export function ParsedDocumentList() {
  const { documents, parsedDocuments } = useStore()

  if (documents.length === 0) {
    return null
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        Document Parsing Status
      </h2>

      <div className="space-y-3">
        {documents.map((doc) => {
          const parsed = parsedDocuments.get(doc.id)

          return (
            <div
              key={doc.id}
              className="border border-gray-200 rounded-lg p-4"
            >
              <div className="flex items-start gap-3">
                <DocumentTextIcon className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium text-gray-900 truncate">
                      {doc.name}
                    </h3>
                    <StatusBadge status={doc.status} />
                  </div>

                  {doc.error && (
                    <p className="text-sm text-red-600 mt-1">{doc.error}</p>
                  )}

                  {parsed && doc.status === 'parsed' && (
                    <div className="mt-3 text-sm text-gray-600 space-y-1">
                      <div>
                        <span className="font-medium">Paragraphs:</span>{' '}
                        {parsed.hierarchy.paragraphs.length}
                      </div>
                      <div>
                        <span className="font-medium">Headings:</span>{' '}
                        {countHeadings(parsed.headings)}
                      </div>
                      <div>
                        <span className="font-medium">Hash:</span>{' '}
                        <code className="text-xs bg-gray-100 px-1 rounded">
                          {parsed.hash.substring(0, 16)}...
                        </code>
                      </div>

                      {parsed.headings.length > 0 && (
                        <details className="mt-2">
                          <summary className="cursor-pointer font-medium text-blue-600 hover:text-blue-800">
                            View Heading Structure
                          </summary>
                          <div className="mt-2 pl-4 border-l-2 border-gray-200">
                            <HeadingTree headings={parsed.headings} />
                          </div>
                        </details>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'pending':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
          Pending
        </span>
      )
    case 'parsing':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
          Parsing...
        </span>
      )
    case 'parsed':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
          <CheckCircleIcon className="h-3 w-3" />
          Parsed
        </span>
      )
    case 'error':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
          <XCircleIcon className="h-3 w-3" />
          Error
        </span>
      )
    default:
      return null
  }
}

function HeadingTree({ headings }: { headings: HeadingNode[] }) {
  if (headings.length === 0) return null

  return (
    <ul className="space-y-1 text-sm">
      {headings.map((heading, index) => (
        <li key={index}>
          <div className="flex items-start gap-2">
            <span className="text-gray-500 font-mono text-xs">
              L{heading.level}
            </span>
            <div className="flex-1">
              <div className="font-medium text-gray-900">
                {heading.number && (
                  <span className="text-blue-600 mr-2">{heading.number}</span>
                )}
                {heading.text}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">
                Path: {heading.clausePath.join(' → ')}
              </div>
            </div>
          </div>
          {heading.children && heading.children.length > 0 && (
            <div className="ml-6 mt-1 border-l border-gray-200 pl-4">
              <HeadingTree headings={heading.children} />
            </div>
          )}
        </li>
      ))}
    </ul>
  )
}

function countHeadings(headings: HeadingNode[]): number {
  let count = headings.length
  headings.forEach((h) => {
    if (h.children && h.children.length > 0) {
      count += countHeadings(h.children)
    }
  })
  return count
}
