/**
 * Example Web Worker for processing documents in the background
 */

interface WorkerMessage {
  type: string
  data: unknown
}

self.onmessage = (event: MessageEvent<WorkerMessage>) => {
  const { type, data } = event.data

  switch (type) {
    case 'PROCESS_DOCUMENT':
      // Simulate document processing
      processDocument(data)
      break
    default:
      self.postMessage({ type: 'ERROR', error: 'Unknown message type' })
  }
}

function processDocument(data: unknown) {
  // Simulate some heavy processing
  const result = {
    ...(typeof data === 'object' && data !== null ? data : {}),
    processed: true,
    timestamp: Date.now(),
  }

  self.postMessage({
    type: 'DOCUMENT_PROCESSED',
    data: result,
  })
}

export {}
