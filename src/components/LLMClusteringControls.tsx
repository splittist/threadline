/**
 * LLM Clustering Export/Import Component (Phase 2.2)
 * Allows users to export clustering packets and import LLM responses
 */

import { useState, useRef } from 'react'
import { useStore } from '../store/useStore'
import {
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline'
import {
  generateClusteringPacket,
  exportClusteringPacketAsJSON,
  parseLLMResponse,
  convertLLMClustersToBuckets,
} from '../utils/llmClustering'

export function LLMClusteringControls() {
  const {
    changes,
    getUnassignedChanges,
    lastExportedPacket,
    setLastExportedPacket,
    addBuckets,
  } = useStore()

  const [exportStatus, setExportStatus] = useState<'idle' | 'exporting' | 'exported'>('idle')
  const [importStatus, setImportStatus] = useState<
    'idle' | 'importing' | 'success' | 'error'
  >('idle')
  const [importError, setImportError] = useState<string | null>(null)
  const [importWarnings, setImportWarnings] = useState<string[]>([])
  const [importedClustersCount, setImportedClustersCount] = useState<number>(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const allChanges = Array.from(changes.values())
  const unassignedChanges = getUnassignedChanges()

  // Use unassigned changes for export (more relevant for LLM clustering)
  const changesToExport = unassignedChanges.length > 0 ? unassignedChanges : allChanges

  const handleExport = () => {
    setExportStatus('exporting')

    // Generate clustering packet
    const packet = generateClusteringPacket(changesToExport)
    const json = exportClusteringPacketAsJSON(changesToExport)

    // Store packet for validation on import
    setLastExportedPacket(packet)

    // Create blob and download
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `threadline-clustering-packet-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    setExportStatus('exported')

    // Reset export status after 3 seconds
    setTimeout(() => {
      setExportStatus('idle')
    }, 3000)
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Reset states
    setImportStatus('importing')
    setImportError(null)
    setImportWarnings([])

    try {
      // Read file
      const text = await file.text()

      // Check if we have an exported packet for validation
      if (!lastExportedPacket) {
        setImportError(
          'No exported packet found. Please export a clustering packet before importing a response.'
        )
        setImportStatus('error')
        return
      }

      // Parse and validate response
      const result = parseLLMResponse(text, lastExportedPacket)

      if (!result) {
        setImportError(
          'Invalid response format. Please check the JSON structure and try again.'
        )
        setImportStatus('error')
        return
      }

      // Check validation
      if (!result.validation.valid) {
        setImportError(
          `Validation failed: ${result.validation.errors.join(', ')}`
        )
        setImportStatus('error')
        return
      }

      // Store warnings if any
      if (result.validation.warnings.length > 0) {
        setImportWarnings(result.validation.warnings)
      }

      // Convert LLM clusters to buckets
      const buckets = convertLLMClustersToBuckets(result.response.clusters)

      // Add buckets to store (does NOT auto-create threads)
      addBuckets(buckets)

      // Success!
      setImportedClustersCount(buckets.length)
      setImportStatus('success')

      // Reset success status after 5 seconds
      setTimeout(() => {
        setImportStatus('idle')
        setImportWarnings([])
        setImportedClustersCount(0)
      }, 5000)
    } catch (error) {
      setImportError(
        error instanceof Error ? error.message : 'Unknown error occurred'
      )
      setImportStatus('error')
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Don't render if no changes
  if (allChanges.length === 0) {
    return null
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center gap-2 mb-4">
        <SparklesIcon className="h-6 w-6 text-purple-600" />
        <h2 className="text-2xl font-semibold text-gray-800">
          LLM-Assisted Clustering
        </h2>
      </div>

      <p className="text-gray-600 mb-4">
        Export changes for LLM clustering, then import the response to get AI-suggested topics.
      </p>

      {/* Export Section */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-800 mb-2">
          1. Export Clustering Packet
        </h3>
        <p className="text-sm text-gray-600 mb-3">
          Exports {changesToExport.length} {changesToExport.length === 1 ? 'change' : 'changes'}{' '}
          {unassignedChanges.length > 0 ? '(unassigned only)' : ''} as a JSON file for LLM processing.
        </p>
        <button
          onClick={handleExport}
          disabled={changesToExport.length === 0 || exportStatus === 'exporting'}
          className={`
            inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium
            ${
              changesToExport.length === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : exportStatus === 'exported'
                ? 'bg-green-600 text-white'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }
            transition-colors
          `}
        >
          {exportStatus === 'exported' ? (
            <>
              <CheckCircleIcon className="h-5 w-5" />
              Exported!
            </>
          ) : (
            <>
              <ArrowDownTrayIcon className="h-5 w-5" />
              Export Packet
            </>
          )}
        </button>
      </div>

      {/* Import Section */}
      <div>
        <h3 className="text-lg font-medium text-gray-800 mb-2">
          2. Import LLM Response
        </h3>
        <p className="text-sm text-gray-600 mb-3">
          After processing with your LLM, import the response JSON file to get suggested topics.
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          onChange={handleFileSelect}
          className="hidden"
        />

        <button
          onClick={handleImportClick}
          disabled={!lastExportedPacket || importStatus === 'importing'}
          className={`
            inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium
            ${
              !lastExportedPacket
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : importStatus === 'success'
                ? 'bg-green-600 text-white'
                : importStatus === 'error'
                ? 'bg-red-600 text-white'
                : 'bg-purple-600 text-white hover:bg-purple-700'
            }
            transition-colors
          `}
        >
          {importStatus === 'importing' ? (
            <>
              <ArrowUpTrayIcon className="h-5 w-5 animate-pulse" />
              Importing...
            </>
          ) : importStatus === 'success' ? (
            <>
              <CheckCircleIcon className="h-5 w-5" />
              Imported {importedClustersCount} Clusters!
            </>
          ) : (
            <>
              <ArrowUpTrayIcon className="h-5 w-5" />
              Import Response
            </>
          )}
        </button>

        {!lastExportedPacket && (
          <p className="text-sm text-gray-500 mt-2 italic">
            You must export a packet first before importing a response.
          </p>
        )}
      </div>

      {/* Error Message */}
      {importStatus === 'error' && importError && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-2">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-red-800 mb-1">Import Failed</h4>
              <p className="text-sm text-red-700">{importError}</p>
            </div>
          </div>
        </div>
      )}

      {/* Warnings */}
      {importStatus === 'success' && importWarnings.length > 0 && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-2">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-800 mb-1">Warnings</h4>
              <ul className="text-sm text-yellow-700 list-disc list-inside">
                {importWarnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Success with suggested topics */}
      {importStatus === 'success' && importedClustersCount > 0 && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start gap-2">
            <CheckCircleIcon className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-green-800 mb-1">
                Successfully imported {importedClustersCount} suggested{' '}
                {importedClustersCount === 1 ? 'cluster' : 'clusters'}!
              </h4>
              <p className="text-sm text-green-700">
                The suggested topics are now available for review. They have NOT been
                automatically applied to threads. Scroll down to see the suggested topics.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Info box */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-medium text-blue-800 mb-2">How It Works</h4>
        <ol className="text-sm text-blue-700 list-decimal list-inside space-y-1">
          <li>Click "Export Packet" to download a JSON file with your changes</li>
          <li>Send the JSON file to your preferred LLM (ChatGPT, Claude, etc.)</li>
          <li>Ask the LLM to follow the instructions in the file</li>
          <li>Copy the LLM's response and save it as a JSON file</li>
          <li>Click "Import Response" to upload the LLM's clustering suggestions</li>
        </ol>
        <p className="text-sm text-blue-700 mt-2 font-medium">
          Note: Suggested topics are never automatically applied to threads. You remain in full
          control.
        </p>
      </div>
    </div>
  )
}
