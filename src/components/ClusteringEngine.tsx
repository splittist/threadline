/**
 * Component to manage clustering of changes using Web Worker
 * Triggers clustering automatically after documents are parsed
 */

import { useEffect, useRef } from 'react'
import { useStore } from '../store/useStore'
import type {
  ClusteringWorkerMessage,
  ClusteringWorkerResponse,
} from '../types/clustering'

export function ClusteringEngine() {
  const {
    changes,
    clusteringStatus,
    setClusteringStatus,
    applyClusteringResult,
  } = useStore()
  const workerRef = useRef<Worker | null>(null)
  const hasClusteredRef = useRef(false)

  useEffect(() => {
    // Create clustering worker
    workerRef.current = new Worker(
      new URL('../workers/clusteringWorker.ts', import.meta.url),
      { type: 'module' }
    )

    // Handle messages from worker
    workerRef.current.onmessage = (event: MessageEvent<ClusteringWorkerResponse>) => {
      const { type, data, error } = event.data

      if (type === 'CLUSTERING_COMPLETE' && data) {
        // Apply clustering results to store
        applyClusteringResult(data)
      } else if (type === 'CLUSTERING_ERROR') {
        // Handle error
        setClusteringStatus('error', error || 'Unknown clustering error')
        console.error('Clustering error:', error)
      }
    }

    // Cleanup on unmount
    return () => {
      workerRef.current?.terminate()
    }
  }, [applyClusteringResult, setClusteringStatus])

  useEffect(() => {
    // Trigger clustering when we have changes and haven't clustered yet
    const allChanges = Array.from(changes.values())
    
    if (
      allChanges.length > 0 && 
      clusteringStatus === 'idle' &&
      !hasClusteredRef.current
    ) {
      hasClusteredRef.current = true
      setClusteringStatus('clustering')

      // Prepare data for worker (only send necessary fields)
      const changeData = allChanges.map(c => ({
        changeId: c.changeId,
        docId: c.docId,
        clausePath: c.clausePath,
        changedText: c.changedText,
        textBefore: c.textBefore,
        textAfter: c.textAfter,
      }))

      // Send to worker
      const message: ClusteringWorkerMessage = {
        type: 'CLUSTER_CHANGES',
        data: {
          changes: changeData,
          params: {
            maxBuckets: 15,
            clauseSimilarityThreshold: 0.7,
            minChangesPerBucket: 1,
            maxKeywordsPerBucket: 5,
          },
        },
      }

      workerRef.current?.postMessage(message)
    }
  }, [changes, clusteringStatus, setClusteringStatus])

  // This component doesn't render anything
  return null
}
