/**
 * Clustering Controls Component
 * Allows users to configure clustering parameters and rerun clustering
 */

import { useState } from 'react'
import { useStore } from '../store/useStore'
import { 
  Cog6ToothIcon, 
  ArrowPathIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline'

export function ClusteringControls() {
  const {
    clusteringParams,
    clusteringStatus,
    changes,
    setClusteringParams,
    triggerReclustering,
  } = useStore()

  const [isExpanded, setIsExpanded] = useState(false)
  const [localParams, setLocalParams] = useState(clusteringParams)

  const hasChanges = changes.size > 0
  const isClustering = clusteringStatus === 'clustering'

  const handleApplyAndRecluster = () => {
    setClusteringParams(localParams)
    triggerReclustering()
  }

  const handleReset = () => {
    const defaultParams = {
      maxBuckets: 15,
      clauseSimilarityThreshold: 0.7,
      minChangesPerBucket: 1,
      maxKeywordsPerBucket: 5,
      useDefinedTerms: false,
    }
    setLocalParams(defaultParams)
    setClusteringParams(defaultParams)
  }

  if (!hasChanges) {
    return null
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Cog6ToothIcon className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-800">
            Clustering Configuration
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
            title={isExpanded ? 'Collapse settings' : 'Expand settings'}
          >
            {isExpanded ? (
              <ChevronUpIcon className="h-5 w-5" />
            ) : (
              <ChevronDownIcon className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Expanded Settings */}
      {isExpanded && (
        <div className="space-y-4 mb-4 pb-4 border-b border-gray-200">
          {/* Clustering Method */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <input
                type="checkbox"
                checked={localParams.useDefinedTerms || false}
                onChange={(e) =>
                  setLocalParams({ ...localParams, useDefinedTerms: e.target.checked })
                }
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              Use Defined-Term Clustering
            </label>
            <p className="text-xs text-gray-500 ml-6">
              When enabled, groups changes by legal defined terms instead of clause paths.
              {localParams.useDefinedTerms ? ' (Term-based clustering active)' : ' (Clause-based clustering active)'}
            </p>
          </div>

          {/* Common Parameters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Buckets
              </label>
              <input
                type="number"
                min="1"
                max="30"
                value={localParams.maxBuckets || 15}
                onChange={(e) =>
                  setLocalParams({
                    ...localParams,
                    maxBuckets: parseInt(e.target.value) || 15,
                  })
                }
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Maximum number of suggested topic groups (1-30)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min Changes per Bucket
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={localParams.minChangesPerBucket || 1}
                onChange={(e) =>
                  setLocalParams({
                    ...localParams,
                    minChangesPerBucket: parseInt(e.target.value) || 1,
                  })
                }
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Minimum changes required to form a bucket
              </p>
            </div>
          </div>

          {/* Clause-based Parameters */}
          {!localParams.useDefinedTerms && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-blue-50 rounded-md">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Clause Similarity Threshold
                </label>
                <input
                  type="number"
                  min="0"
                  max="1"
                  step="0.1"
                  value={localParams.clauseSimilarityThreshold || 0.7}
                  onChange={(e) =>
                    setLocalParams({
                      ...localParams,
                      clauseSimilarityThreshold: parseFloat(e.target.value) || 0.7,
                    })
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  How similar clause paths must be to group (0.0-1.0)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Keywords per Bucket
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={localParams.maxKeywordsPerBucket || 5}
                  onChange={(e) =>
                    setLocalParams({
                      ...localParams,
                      maxKeywordsPerBucket: parseInt(e.target.value) || 5,
                    })
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Maximum keywords to extract per topic
                </p>
              </div>
            </div>
          )}

          {/* Defined-Term Parameters */}
          {localParams.useDefinedTerms && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-amber-50 rounded-md">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  DT Score Threshold
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  step="0.5"
                  value={localParams.dtScoreThreshold || 1.0}
                  onChange={(e) =>
                    setLocalParams({
                      ...localParams,
                      dtScoreThreshold: parseFloat(e.target.value) || 1.0,
                    })
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Minimum score for term assignment (0-10)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Strong Match Weight
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  step="0.5"
                  value={localParams.dtStrongWeight || 3.0}
                  onChange={(e) =>
                    setLocalParams({
                      ...localParams,
                      dtStrongWeight: parseFloat(e.target.value) || 3.0,
                    })
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Weight for direct term matches (0-10)
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={handleReset}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Reset to Defaults
            </button>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {clusteringStatus === 'complete' && (
            <span className="text-green-600 font-medium">✓ Clustering complete</span>
          )}
          {clusteringStatus === 'clustering' && (
            <span className="text-blue-600 font-medium">⟳ Clustering in progress...</span>
          )}
          {clusteringStatus === 'error' && (
            <span className="text-red-600 font-medium">✗ Clustering failed</span>
          )}
          {clusteringStatus === 'idle' && (
            <span className="text-gray-500">Ready to cluster</span>
          )}
        </div>
        
        <button
          onClick={handleApplyAndRecluster}
          disabled={isClustering}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ArrowPathIcon className={`h-4 w-4 ${isClustering ? 'animate-spin' : ''}`} />
          {isClustering ? 'Clustering...' : 'Apply & Recluster'}
        </button>
      </div>

      {/* Info */}
      {!isExpanded && (
        <p className="text-xs text-gray-500 mt-2">
          Click the expand button to configure clustering parameters.
          Current method: {localParams.useDefinedTerms ? 'Defined-Term' : 'Clause-Path'}
        </p>
      )}
    </div>
  )
}
