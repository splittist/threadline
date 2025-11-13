/**
 * Web Worker for clustering changes in the background
 * This worker handles clustering without blocking the UI
 */

import type {
  ClusteringWorkerMessage,
  ClusteringWorkerResponse,
} from '../types/clustering'
import type { Change } from '../types/dataModel'
import { clusterChanges } from '../utils/clustering'

self.onmessage = async (event: MessageEvent<ClusteringWorkerMessage>) => {
  const { type, data } = event.data

  switch (type) {
    case 'CLUSTER_CHANGES':
      await performClustering(data.changes, data.params)
      break
    default:
      self.postMessage({
        type: 'CLUSTERING_ERROR',
        error: 'Unknown message type',
      } as ClusteringWorkerResponse)
  }
}

async function performClustering(
  changeData: Array<{
    changeId: string
    docId: string
    clausePath: string[]
    changedText: string
    textBefore: string
    textAfter: string
  }>,
  params?: Parameters<typeof clusterChanges>[1]
): Promise<void> {
  try {
    // Convert to full Change objects (with minimal required fields)
    const changes: Change[] = changeData.map(c => ({
      changeId: c.changeId,
      docId: c.docId,
      type: 'insertion', // Type doesn't affect clustering
      author: '',
      timestamp: '',
      clausePath: c.clausePath,
      textBefore: c.textBefore,
      changedText: c.changedText,
      textAfter: c.textAfter,
      threadId: null,
      suggestedThread: null,
    }))

    // Perform clustering
    const result = clusterChanges(changes, params)

    // Send result back to main thread
    self.postMessage({
      type: 'CLUSTERING_COMPLETE',
      data: result,
    } as ClusteringWorkerResponse)
  } catch (error) {
    console.error('Error during clustering:', error)
    self.postMessage({
      type: 'CLUSTERING_ERROR',
      error: error instanceof Error ? error.message : 'Unknown error during clustering',
    } as ClusteringWorkerResponse)
  }
}
