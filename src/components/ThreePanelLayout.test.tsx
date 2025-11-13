import { render, screen } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { ThreePanelLayout } from './ThreePanelLayout'
import { useStore } from '../store/useStore'

describe('ThreePanelLayout', () => {
  beforeEach(() => {
    // Reset store state before each test
    useStore.setState({
      changes: new Map(),
      threads: new Map(),
      normalizedDocuments: new Map(),
      selection: {
        selectedThreadId: null,
        selectedChangeIds: new Set(),
        activeDocumentId: null,
      },
      panelState: {
        showThreadList: true,
        showChangeList: true,
        showMetadata: true,
      },
    })
  })

  it('renders all three panels when panel state is true', () => {
    render(<ThreePanelLayout />)
    
    // Thread List Panel
    expect(screen.getByText('Threads')).toBeInTheDocument()
    
    // Change List Panel
    expect(screen.getByText('Changes')).toBeInTheDocument()
    
    // Thread Metadata Panel
    expect(screen.getByText('Details')).toBeInTheDocument()
  })

  it('shows unassigned changes message when no threads exist', () => {
    render(<ThreePanelLayout />)
    
    expect(screen.getByText('No threads yet')).toBeInTheDocument()
    expect(screen.getByText('No changes to display')).toBeInTheDocument()
    expect(screen.getByText('No thread selected')).toBeInTheDocument()
  })

  it('displays thread when one is created', () => {
    // Create a thread
    const thread = useStore.getState().createThread({
      title: 'Test Thread',
      userTopic: 'Test Topic',
      suggestedTopic: null,
      rationale: 'Test rationale',
      changeIds: [],
      status: 'proposed',
      notes: [],
    })
    
    render(<ThreePanelLayout />)
    
    expect(screen.getByText('Test Thread')).toBeInTheDocument()
    expect(screen.getByText('Test Topic')).toBeInTheDocument()
  })

  it('displays changes when they exist', () => {
    // Add a change
    useStore.getState().addChange({
      changeId: 'test-change-1',
      docId: 'test-doc-1',
      type: 'insertion',
      author: 'Test Author',
      timestamp: new Date().toISOString(),
      clausePath: ['Section 1'],
      textBefore: 'Before text',
      changedText: 'Changed text',
      textAfter: 'After text',
      threadId: null,
      suggestedThread: null,
    })
    
    render(<ThreePanelLayout />)
    
    expect(screen.getByText('1 change unassigned')).toBeInTheDocument()
    expect(screen.getByText('Changed text')).toBeInTheDocument()
    expect(screen.getByText('by Test Author')).toBeInTheDocument()
  })

  it('shows thread metadata when thread is selected', () => {
    // Create a thread with notes
    const thread = useStore.getState().createThread({
      title: 'Selected Thread',
      userTopic: 'Selected Topic',
      suggestedTopic: null,
      rationale: 'This is a test rationale',
      changeIds: [],
      status: 'approved',
      notes: [],
    })
    
    // Select the thread
    useStore.getState().setSelectedThread(thread.threadId)
    
    render(<ThreePanelLayout />)
    
    // Should show thread details in metadata panel  
    // Thread title appears in both list and metadata, so use getAllByText
    expect(screen.getAllByText('Selected Thread').length).toBeGreaterThanOrEqual(2)
    // Topic appears multiple times
    expect(screen.getAllByText('Selected Topic').length).toBeGreaterThan(0)
    // Rationale only appears in metadata panel
    expect(screen.getByText('This is a test rationale')).toBeInTheDocument()
    // Status badge appears in both panels
    expect(screen.getAllByText('Approved').length).toBeGreaterThan(0)
  })
})
