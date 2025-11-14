import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { ThreadListPanel } from './ThreadListPanel'
import { useStore } from '../store/useStore'

describe('ThreadListPanel', () => {
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

  it('renders the panel with header', () => {
    render(<ThreadListPanel />)
    
    expect(screen.getByText('Threads')).toBeInTheDocument()
    expect(screen.getByText('0 threads')).toBeInTheDocument()
  })

  it('shows empty state when no threads or changes exist', () => {
    render(<ThreadListPanel />)
    
    expect(screen.getByText('No threads yet')).toBeInTheDocument()
    expect(screen.getByText('Upload documents to get started')).toBeInTheDocument()
  })

  it('displays Unassigned bucket when unassigned changes exist', () => {
    // Add an unassigned change
    useStore.getState().addChange({
      changeId: 'change-1',
      docId: 'doc-1',
      type: 'insertion',
      author: 'Author',
      timestamp: new Date().toISOString(),
      clausePath: ['Section 1'],
      textBefore: 'Before',
      changedText: 'Changed',
      textAfter: 'After',
      threadId: null,
      suggestedThread: null,
    })

    render(<ThreadListPanel />)
    
    expect(screen.getByText('Unassigned')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('Changes not yet assigned to a thread')).toBeInTheDocument()
  })

  it('displays multiple threads with correct information', () => {
    // Create threads
    useStore.getState().createThread({
      title: 'Thread 1',
      userTopic: 'Topic 1',
      rationale: 'Rationale 1',
      suggestedTopic: null,
      changeIds: [],
      status: 'proposed',
      notes: [],
    })

    useStore.getState().createThread({
      title: 'Thread 2',
      userTopic: 'Topic 2',
      rationale: 'Rationale 2',
      suggestedTopic: null,
      changeIds: [],
      status: 'approved',
      notes: [],
    })

    render(<ThreadListPanel />)
    
    expect(screen.getByText('2 threads')).toBeInTheDocument()
    expect(screen.getByText('Thread 1')).toBeInTheDocument()
    expect(screen.getByText('Topic 1')).toBeInTheDocument()
    expect(screen.getByText('Thread 2')).toBeInTheDocument()
    expect(screen.getByText('Topic 2')).toBeInTheDocument()
  })

  it('displays status badges correctly', () => {
    useStore.getState().createThread({
      title: 'Proposed Thread',
      userTopic: 'Topic',
      rationale: 'Rationale',
      suggestedTopic: null,
      changeIds: [],
      status: 'proposed',
      notes: [],
    })

    useStore.getState().createThread({
      title: 'Approved Thread',
      userTopic: 'Topic',
      rationale: 'Rationale',
      suggestedTopic: null,
      changeIds: [],
      status: 'approved',
      notes: [],
    })

    useStore.getState().createThread({
      title: 'Escalated Thread',
      userTopic: 'Topic',
      rationale: 'Rationale',
      suggestedTopic: null,
      changeIds: [],
      status: 'escalate',
      notes: [],
    })

    render(<ThreadListPanel />)
    
    expect(screen.getByText('Proposed')).toBeInTheDocument()
    expect(screen.getByText('Approved')).toBeInTheDocument()
    expect(screen.getByText('Escalate')).toBeInTheDocument()
  })

  it('shows correct change counts for threads', () => {
    const thread = useStore.getState().createThread({
      title: 'Thread with Changes',
      userTopic: 'Topic',
      rationale: 'Rationale',
      suggestedTopic: null,
      changeIds: [],
      status: 'proposed',
      notes: [],
    })

    // Add changes to the thread
    useStore.getState().addChange({
      changeId: 'change-1',
      docId: 'doc-1',
      type: 'insertion',
      author: 'Author',
      timestamp: new Date().toISOString(),
      clausePath: ['Section 1'],
      textBefore: 'Before',
      changedText: 'Changed 1',
      textAfter: 'After',
      threadId: thread.threadId,
      suggestedThread: null,
    })

    useStore.getState().addChange({
      changeId: 'change-2',
      docId: 'doc-1',
      type: 'deletion',
      author: 'Author',
      timestamp: new Date().toISOString(),
      clausePath: ['Section 2'],
      textBefore: 'Before',
      changedText: 'Changed 2',
      textAfter: 'After',
      threadId: thread.threadId,
      suggestedThread: null,
    })

    render(<ThreadListPanel />)
    
    expect(screen.getByText('2 changes')).toBeInTheDocument()
  })

  it('handles thread selection', () => {
    const thread = useStore.getState().createThread({
      title: 'Selectable Thread',
      userTopic: 'Topic',
      rationale: 'Rationale',
      suggestedTopic: null,
      changeIds: [],
      status: 'proposed',
      notes: [],
    })

    render(<ThreadListPanel />)
    
    const threadButton = screen.getByText('Selectable Thread').closest('button')
    expect(threadButton).toBeInTheDocument()
    
    if (threadButton) {
      fireEvent.click(threadButton)
    }
    
    expect(useStore.getState().selection.selectedThreadId).toBe(thread.threadId)
  })

  it('handles Unassigned selection', () => {
    useStore.getState().addChange({
      changeId: 'change-1',
      docId: 'doc-1',
      type: 'insertion',
      author: 'Author',
      timestamp: new Date().toISOString(),
      clausePath: ['Section 1'],
      textBefore: 'Before',
      changedText: 'Changed',
      textAfter: 'After',
      threadId: null,
      suggestedThread: null,
    })

    render(<ThreadListPanel />)
    
    const unassignedButton = screen.getByText('Unassigned').closest('button')
    expect(unassignedButton).toBeInTheDocument()
    
    if (unassignedButton) {
      fireEvent.click(unassignedButton)
    }
    
    expect(useStore.getState().selection.selectedThreadId).toBe(null)
  })

  it('opens create thread dialog when + button is clicked', () => {
    render(<ThreadListPanel />)
    
    const newThreadButton = screen.getByTitle('New Thread')
    fireEvent.click(newThreadButton)
    
    expect(screen.getByText('Create New Thread')).toBeInTheDocument()
    expect(screen.getByLabelText('Title *')).toBeInTheDocument()
    expect(screen.getByLabelText('Topic *')).toBeInTheDocument()
    expect(screen.getByLabelText('Rationale')).toBeInTheDocument()
  })

  it('creates a new thread with valid input', async () => {
    render(<ThreadListPanel />)
    
    const newThreadButton = screen.getByTitle('New Thread')
    fireEvent.click(newThreadButton)
    
    const titleInput = screen.getByLabelText('Title *')
    const topicInput = screen.getByLabelText('Topic *')
    const rationaleInput = screen.getByLabelText('Rationale')
    
    fireEvent.change(titleInput, { target: { value: 'New Thread Title' } })
    fireEvent.change(topicInput, { target: { value: 'New Topic' } })
    fireEvent.change(rationaleInput, { target: { value: 'New Rationale' } })
    
    const createButton = screen.getByText('Create Thread')
    fireEvent.click(createButton)
    
    await waitFor(() => {
      expect(screen.queryByText('Create New Thread')).not.toBeInTheDocument()
    })
    
    expect(screen.getByText('New Thread Title')).toBeInTheDocument()
    expect(screen.getByText('New Topic')).toBeInTheDocument()
  })

  it('disables create button when required fields are empty', () => {
    render(<ThreadListPanel />)
    
    const newThreadButton = screen.getByTitle('New Thread')
    fireEvent.click(newThreadButton)
    
    const createButton = screen.getByText('Create Thread')
    expect(createButton).toBeDisabled()
  })

  it('closes create dialog when Cancel is clicked', async () => {
    render(<ThreadListPanel />)
    
    const newThreadButton = screen.getByTitle('New Thread')
    fireEvent.click(newThreadButton)
    
    expect(screen.getByText('Create New Thread')).toBeInTheDocument()
    
    const cancelButton = screen.getByText('Cancel')
    fireEvent.click(cancelButton)
    
    await waitFor(() => {
      expect(screen.queryByText('Create New Thread')).not.toBeInTheDocument()
    })
  })

  it('opens delete confirmation dialog when delete button is clicked', () => {
    useStore.getState().createThread({
      title: 'Thread to Delete',
      userTopic: 'Topic',
      rationale: 'Rationale',
      suggestedTopic: null,
      changeIds: [],
      status: 'proposed',
      notes: [],
    })

    render(<ThreadListPanel />)
    
    const deleteButton = screen.getByTitle('Delete thread')
    fireEvent.click(deleteButton)
    
    expect(screen.getByText('Delete Thread')).toBeInTheDocument()
    expect(screen.getByText(/Are you sure you want to delete this thread?/)).toBeInTheDocument()
  })

  it('deletes thread when confirmed', async () => {
    const thread = useStore.getState().createThread({
      title: 'Thread to Delete',
      userTopic: 'Topic',
      rationale: 'Rationale',
      suggestedTopic: null,
      changeIds: [],
      status: 'proposed',
      notes: [],
    })

    render(<ThreadListPanel />)
    
    const deleteButton = screen.getByTitle('Delete thread')
    fireEvent.click(deleteButton)
    
    const confirmDeleteButton = screen.getByRole('button', { name: 'Delete' })
    fireEvent.click(confirmDeleteButton)
    
    await waitFor(() => {
      expect(screen.queryByText('Delete Thread')).not.toBeInTheDocument()
    })
    
    expect(screen.queryByText('Thread to Delete')).not.toBeInTheDocument()
    expect(useStore.getState().threads.has(thread.threadId)).toBe(false)
  })

  it('closes delete dialog when Cancel is clicked', async () => {
    useStore.getState().createThread({
      title: 'Thread to Keep',
      userTopic: 'Topic',
      rationale: 'Rationale',
      suggestedTopic: null,
      changeIds: [],
      status: 'proposed',
      notes: [],
    })

    render(<ThreadListPanel />)
    
    const deleteButton = screen.getByTitle('Delete thread')
    fireEvent.click(deleteButton)
    
    expect(screen.getByText('Delete Thread')).toBeInTheDocument()
    
    const cancelButton = screen.getAllByText('Cancel')[0]
    fireEvent.click(cancelButton)
    
    await waitFor(() => {
      expect(screen.queryByText('Delete Thread')).not.toBeInTheDocument()
    })
    
    expect(screen.getByText('Thread to Keep')).toBeInTheDocument()
  })

  it('highlights selected thread', () => {
    const thread = useStore.getState().createThread({
      title: 'Selected Thread',
      userTopic: 'Topic',
      rationale: 'Rationale',
      suggestedTopic: null,
      changeIds: [],
      status: 'proposed',
      notes: [],
    })

    useStore.getState().setSelectedThread(thread.threadId)

    render(<ThreadListPanel />)
    
    const threadButton = screen.getByText('Selected Thread').closest('button')
    const threadContainer = threadButton?.parentElement?.parentElement
    expect(threadContainer).toHaveClass('bg-blue-50')
  })

  it('shows singular "thread" label when there is 1 thread', () => {
    useStore.getState().createThread({
      title: 'Single Thread',
      userTopic: 'Topic',
      rationale: 'Rationale',
      suggestedTopic: null,
      changeIds: [],
      status: 'proposed',
      notes: [],
    })

    render(<ThreadListPanel />)
    
    expect(screen.getByText('1 thread')).toBeInTheDocument()
  })
})
