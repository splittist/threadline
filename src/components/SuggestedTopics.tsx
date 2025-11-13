/**
 * Component to display suggested topics from clustering (Phase 2.1 & 2.2)
 * Shows buckets as suggested groupings for user review
 */

import { useStore } from '../store/useStore'
import { FolderIcon, SparklesIcon, LightBulbIcon } from '@heroicons/react/24/outline'

export function SuggestedTopics() {
  const { getAllBuckets, changes } = useStore()

  const buckets = getAllBuckets()

  // Don't render if no buckets
  if (buckets.length === 0) {
    return null
  }

  // Sort buckets by confidence (descending) and size (descending)
  const sortedBuckets = [...buckets].sort((a, b) => {
    if (Math.abs(a.confidence - b.confidence) > 0.1) {
      return b.confidence - a.confidence
    }
    return b.changeIds.length - a.changeIds.length
  })

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center gap-2 mb-4">
        <LightBulbIcon className="h-6 w-6 text-yellow-600" />
        <h2 className="text-2xl font-semibold text-gray-800">Suggested Topics</h2>
      </div>

      <p className="text-gray-600 mb-4">
        These are suggested groupings of related changes. Review and use them to create threads.
      </p>

      {/* Buckets List */}
      <div className="space-y-3">
        {sortedBuckets.map((bucket) => (
          <BucketCard
            key={bucket.bucketId}
            bucket={bucket}
            changes={changes}
          />
        ))}
      </div>

      {/* Info Message */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> These are suggestions only. Changes have NOT been assigned to
          threads automatically. Use Phase 3's UI (coming soon) to review and create threads from
          these suggestions.
        </p>
      </div>
    </div>
  )
}

function BucketCard({
  bucket,
  changes,
}: {
  bucket: {
    bucketId: string
    suggestedTopic: string
    keywords: string[]
    changeIds: string[]
    confidence: number
    method: 'clause-path' | 'keyword' | 'document'
    createdAt: string
  }
  changes: Map<string, unknown>
}) {
  // Count valid changes (changes that still exist)
  const validChangeCount = bucket.changeIds.filter((id) => changes.has(id)).length

  // Determine method icon and label
  const methodConfig = {
    'clause-path': {
      label: 'Clause-Based',
      icon: FolderIcon,
      color: 'text-blue-600 bg-blue-50',
    },
    keyword: {
      label: 'Keyword-Based',
      icon: SparklesIcon,
      color: 'text-purple-600 bg-purple-50',
    },
    document: {
      label: 'Document-Based',
      icon: FolderIcon,
      color: 'text-green-600 bg-green-50',
    },
  }

  const config = methodConfig[bucket.method]
  const Icon = config.icon

  // Determine confidence badge color
  const confidenceColor =
    bucket.confidence >= 0.8
      ? 'bg-green-100 text-green-800'
      : bucket.confidence >= 0.6
      ? 'bg-yellow-100 text-yellow-800'
      : 'bg-red-100 text-red-800'

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {bucket.suggestedTopic}
          </h3>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Method Badge */}
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${config.color}`}>
              <Icon className="h-3 w-3" />
              {config.label}
            </span>
            {/* Confidence Badge */}
            <span className={`px-2 py-1 rounded text-xs font-medium ${confidenceColor}`}>
              {Math.round(bucket.confidence * 100)}% confidence
            </span>
            {/* Change Count */}
            <span className="text-xs text-gray-600">
              {validChangeCount} {validChangeCount === 1 ? 'change' : 'changes'}
            </span>
          </div>
        </div>
      </div>

      {/* Keywords */}
      {bucket.keywords.length > 0 && (
        <div className="mb-2">
          <div className="text-xs font-medium text-gray-600 mb-1">Keywords:</div>
          <div className="flex flex-wrap gap-1">
            {bucket.keywords.map((keyword, index) => (
              <span
                key={index}
                className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs"
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Change IDs (collapsed by default, for debugging) */}
      <details className="mt-2">
        <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
          View change IDs ({bucket.changeIds.length})
        </summary>
        <div className="mt-2 p-2 bg-gray-50 rounded text-xs font-mono text-gray-600 max-h-32 overflow-y-auto">
          {bucket.changeIds.map((id) => (
            <div key={id} className={changes.has(id) ? '' : 'text-red-600'}>
              {id} {!changes.has(id) && '(not found)'}
            </div>
          ))}
        </div>
      </details>
    </div>
  )
}
