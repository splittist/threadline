/**
 * Tests for ClusteringControls component
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { ClusteringControls } from './ClusteringControls'
import { useStore } from '../store/useStore'

describe('ClusteringControls', () => {
  beforeEach(() => {
    // Reset store before each test
    const store = useStore.getState()
    store.changes = new Map()
    store.buckets = new Map()
    store.clusteringStatus = 'idle'
    store.clusteringParams = {
      maxBuckets: 15,
      clauseSimilarityThreshold: 0.7,
      minChangesPerBucket: 1,
      maxKeywordsPerBucket: 5,
      useDefinedTerms: false,
    }
  })

  it('should not render when there are no changes', () => {
    render(<ClusteringControls />)
    expect(screen.queryByText('Clustering Configuration')).not.toBeInTheDocument()
  })

  it('should render when there are changes', () => {
    // Add a change to the store
    const store = useStore.getState()
    store.addChange({
      changeId: 'test-1',
      docId: 'doc-1',
      type: 'insertion',
      author: 'Test Author',
      timestamp: new Date().toISOString(),
      originalId: '1',
      changedText: 'Test change',
      textBefore: '',
      textAfter: '',
      clausePath: ['Section 1'],
      paragraphId: 'p-1',
      threadId: null,
      suggestedThread: null,
    })

    render(<ClusteringControls />)
    expect(screen.getByText('Clustering Configuration')).toBeInTheDocument()
  })

  it('should display Apply & Recluster button', () => {
    const store = useStore.getState()
    store.addChange({
      changeId: 'test-1',
      docId: 'doc-1',
      type: 'insertion',
      author: 'Test Author',
      timestamp: new Date().toISOString(),
      originalId: '1',
      changedText: 'Test change',
      textBefore: '',
      textAfter: '',
      clausePath: ['Section 1'],
      paragraphId: 'p-1',
      threadId: null,
      suggestedThread: null,
    })

    render(<ClusteringControls />)
    expect(screen.getByRole('button', { name: /Apply & Recluster/i })).toBeInTheDocument()
  })

  it('should expand settings when expand button is clicked', async () => {
    const user = userEvent.setup()
    const store = useStore.getState()
    store.addChange({
      changeId: 'test-1',
      docId: 'doc-1',
      type: 'insertion',
      author: 'Test Author',
      timestamp: new Date().toISOString(),
      originalId: '1',
      changedText: 'Test change',
      textBefore: '',
      textAfter: '',
      clausePath: ['Section 1'],
      paragraphId: 'p-1',
      threadId: null,
      suggestedThread: null,
    })

    render(<ClusteringControls />)
    
    // Settings should not be visible initially
    expect(screen.queryByText('Max Buckets')).not.toBeInTheDocument()
    
    // Click expand button
    const expandButton = screen.getAllByRole('button').find(btn => 
      btn.getAttribute('title')?.includes('Expand')
    )
    expect(expandButton).toBeDefined()
    await user.click(expandButton!)
    
    // Settings should now be visible
    expect(screen.getByText('Max Buckets')).toBeInTheDocument()
  })

  it('should show clustering status', () => {
    const store = useStore.getState()
    store.addChange({
      changeId: 'test-1',
      docId: 'doc-1',
      type: 'insertion',
      author: 'Test Author',
      timestamp: new Date().toISOString(),
      originalId: '1',
      changedText: 'Test change',
      textBefore: '',
      textAfter: '',
      clausePath: ['Section 1'],
      paragraphId: 'p-1',
      threadId: null,
      suggestedThread: null,
    })
    store.setClusteringStatus('complete')

    render(<ClusteringControls />)
    expect(screen.getByText(/Clustering complete/i)).toBeInTheDocument()
  })

  it('should disable recluster button when clustering is in progress', () => {
    const store = useStore.getState()
    store.addChange({
      changeId: 'test-1',
      docId: 'doc-1',
      type: 'insertion',
      author: 'Test Author',
      timestamp: new Date().toISOString(),
      originalId: '1',
      changedText: 'Test change',
      textBefore: '',
      textAfter: '',
      clausePath: ['Section 1'],
      paragraphId: 'p-1',
      threadId: null,
      suggestedThread: null,
    })
    store.setClusteringStatus('clustering')

    render(<ClusteringControls />)
    const button = screen.getByRole('button', { name: /Clustering.../i })
    expect(button).toBeDisabled()
    expect(screen.getByText(/Clustering in progress.../i)).toBeInTheDocument()
  })

  it('should show current clustering method', () => {
    const store = useStore.getState()
    store.addChange({
      changeId: 'test-1',
      docId: 'doc-1',
      type: 'insertion',
      author: 'Test Author',
      timestamp: new Date().toISOString(),
      originalId: '1',
      changedText: 'Test change',
      textBefore: '',
      textAfter: '',
      clausePath: ['Section 1'],
      paragraphId: 'p-1',
      threadId: null,
      suggestedThread: null,
    })

    render(<ClusteringControls />)
    expect(screen.getByText(/Current method: Clause-Path/i)).toBeInTheDocument()
  })
})
