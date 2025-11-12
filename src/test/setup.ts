import '@testing-library/jest-dom'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Mock Worker for tests
class MockWorker {
  url: string | URL
  onmessage: ((event: MessageEvent) => void) | null = null

  constructor(url: string | URL) {
    this.url = url
  }

  postMessage() {
    // Mock implementation - does nothing
  }

  terminate() {
    // Mock implementation - does nothing
  }
}

// Worker may not exist in test environment
global.Worker = MockWorker as unknown as typeof Worker
