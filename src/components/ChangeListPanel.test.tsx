/**
 * Tests for ChangeListPanel (Phase 3.3)
 * Tests checkbox selection, search/filter, move operations, and diff display
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { ChangeListPanel } from './ChangeListPanel'
import { useStore } from '../store/useStore'
import type { Change } from '../types/dataModel'

// Mock ResizeObserver for Headless UI
class ResizeObserverMock {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
global.ResizeObserver = ResizeObserverMock as any

describe('ChangeListPanel', () => {
  beforeEach(() => {
    // Reset store state before each test
    const store = useStore.getState()
    store.changes.clear()
    store.threads.clear()
    store.normalizedDocuments.clear()
    store.selection.selectedThreadId = null
    store.selection.selectedChangeIds.clear()
  })

  describe('Display and Basic Functionality', () => {
    it('displays changes for selected thread', () => {
      const store = useStore.getState()

      // Create a thread
      const thread = store.createThread({
        title: 'Test Thread',
        userTopic: 'Test Topic',
        rationale: 'Test rationale',
        suggestedTopic: null,
        changeIds: [],
        status: 'proposed',
        notes: [],
      })

      // Add a change
      const change: Change = {
        changeId: 'change1',
        docId: 'doc1',
        type: 'insertion',
        author: 'John Doe',
        timestamp: '2025-11-14T00:00:00Z',
        clausePath: ['Section 1', 'Subsection 1.1'],
        textBefore: 'Before text',
        changedText: 'New text',
      textRuns: [],
        textAfter: 'After text',
        threadId: thread.threadId,
        suggestedThread: null,
      }
      store.addChange(change)

      // Select the thread
      store.setSelectedThread(thread.threadId)

      render(<ChangeListPanel />)

      expect(screen.getByText('Changes')).toBeInTheDocument()
      expect(screen.getByText('1 change in this thread')).toBeInTheDocument()
      expect(screen.getByText('New text')).toBeInTheDocument()
      expect(screen.getByText('by John Doe')).toBeInTheDocument()
    })

    it('displays unassigned changes when no thread selected', () => {
      const store = useStore.getState()

      const change: Change = {
        changeId: 'change1',
        docId: 'doc1',
        type: 'deletion',
        author: 'Jane Smith',
        timestamp: '2025-11-14T00:00:00Z',
        clausePath: [],
        textBefore: '',
        changedText: 'Deleted text',
      textRuns: [],
        textAfter: '',
        threadId: null,
        suggestedThread: null,
      }
      store.addChange(change)

      render(<ChangeListPanel />)

      expect(screen.getByText('1 change unassigned')).toBeInTheDocument()
      expect(screen.getByText('Deleted text')).toBeInTheDocument()
    })

    it('displays empty state when no changes', () => {
      render(<ChangeListPanel />)

      expect(screen.getByText('No changes to display')).toBeInTheDocument()
      expect(screen.getByText('All changes are assigned to threads')).toBeInTheDocument()
    })
  })

  describe('Diff View and Color Coding', () => {
    it('displays insertions with minimal styling', () => {
      const store = useStore.getState()

      const change: Change = {
        changeId: 'change1',
        docId: 'doc1',
        type: 'insertion',
        author: 'Author',
        timestamp: '2025-11-14T00:00:00Z',
        clausePath: [],
        textBefore: '',
        changedText: 'Inserted text',
      textRuns: [],
        textAfter: '',
        threadId: null,
        suggestedThread: null,
      }
      store.addChange(change)

      render(<ChangeListPanel />)

      const insertedText = screen.getByText('Inserted text')
      expect(insertedText).toBeInTheDocument()
      // Check that the parent element has correct styling
      const parentSpan = insertedText.parentElement
      expect(parentSpan).toHaveClass('text-gray-900')
    })

    it('displays deletions with strikethrough and gray text', () => {
      const store = useStore.getState()

      const change: Change = {
        changeId: 'change1',
        docId: 'doc1',
        type: 'deletion',
        author: 'Author',
        timestamp: '2025-11-14T00:00:00Z',
        clausePath: [],
        textBefore: '',
        changedText: 'Deleted text',
      textRuns: [],
        textAfter: '',
        threadId: null,
        suggestedThread: null,
      }
      store.addChange(change)

      render(<ChangeListPanel />)

      const deletedText = screen.getByText('Deleted text')
      expect(deletedText).toBeInTheDocument()
      // Check that the text has strikethrough and gray styling
      expect(deletedText).toHaveClass('line-through')
      expect(deletedText).toHaveClass('text-gray-500')
    })

    it('renders bold and italic formatting in text runs', () => {
      const store = useStore.getState()

      const change: Change = {
        changeId: 'change1',
        docId: 'doc1',
        type: 'insertion',
        author: 'Author',
        timestamp: '2025-11-14T00:00:00Z',
        clausePath: [],
        textBefore: '',
        changedText: 'Normal bold italic bold-italic',
        textRuns: [
          { text: 'Normal ' },
          { text: 'bold ', bold: true },
          { text: 'italic ', italic: true },
          { text: 'bold-italic', bold: true, italic: true },
        ],
        textAfter: '',
        threadId: null,
        suggestedThread: null,
      }
      store.addChange(change)

      render(<ChangeListPanel />)

      // Check the full change text is present
      expect(screen.getByText('Normal', { exact: false })).toBeInTheDocument()
      
      // Get the container and check structure using querySelector
      const container = screen.getByText('Normal').closest('.text-sm')
      expect(container).toBeInTheDocument()
      
      // Check for bold elements
      const boldElements = container?.querySelectorAll('.font-bold')
      expect(boldElements?.length).toBeGreaterThanOrEqual(2)
      
      // Check for italic elements
      const italicElements = container?.querySelectorAll('.italic')
      expect(italicElements?.length).toBeGreaterThanOrEqual(2)
    })

    it('renders bold and italic formatting in deletions', () => {
      const store = useStore.getState()

      const change: Change = {
        changeId: 'change1',
        docId: 'doc1',
        type: 'deletion',
        author: 'Author',
        timestamp: '2025-11-14T00:00:00Z',
        clausePath: [],
        textBefore: '',
        changedText: 'Deleted bold text',
        textRuns: [
          { text: 'Deleted ' },
          { text: 'bold', bold: true },
          { text: ' text' },
        ],
        textAfter: '',
        threadId: null,
        suggestedThread: null,
      }
      store.addChange(change)

      render(<ChangeListPanel />)

      // Check that bold text in deletion has both bold and strikethrough
      const boldText = screen.getByText('bold')
      expect(boldText).toBeInTheDocument()
      expect(boldText).toHaveClass('font-bold')
      expect(boldText).toHaveClass('line-through')
      expect(boldText).toHaveClass('text-gray-500')
    })

    it('displays change type badges', () => {
      const store = useStore.getState()

      store.addChanges([
        {
          changeId: 'change1',
          docId: 'doc1',
          type: 'insertion',
          author: 'Author',
          timestamp: '2025-11-14T00:00:00Z',
          clausePath: [],
          textBefore: '',
          changedText: 'Text 1',
      textRuns: [],
          textAfter: '',
          threadId: null,
          suggestedThread: null,
        },
        {
          changeId: 'change2',
          docId: 'doc1',
          type: 'deletion',
          author: 'Author',
          timestamp: '2025-11-14T00:00:00Z',
          clausePath: [],
          textBefore: '',
          changedText: 'Text 2',
      textRuns: [],
          textAfter: '',
          threadId: null,
          suggestedThread: null,
        },
      ])

      render(<ChangeListPanel />)

      expect(screen.getByText('Insert')).toBeInTheDocument()
      expect(screen.getByText('Delete')).toBeInTheDocument()
    })
  })

  describe('Clause Path Breadcrumb', () => {
    it('displays clause path as breadcrumb navigation', () => {
      const store = useStore.getState()

      const change: Change = {
        changeId: 'change1',
        docId: 'doc1',
        type: 'insertion',
        author: 'Author',
        timestamp: '2025-11-14T00:00:00Z',
        clausePath: ['8', 'Termination', '8.2 Force Majeure'],
        textBefore: '',
        changedText: 'Text',
      textRuns: [],
        textAfter: '',
        threadId: null,
        suggestedThread: null,
      }
      store.addChange(change)

      render(<ChangeListPanel />)

      expect(screen.getByText('Location:')).toBeInTheDocument()
      expect(screen.getByText('8')).toBeInTheDocument()
      expect(screen.getByText('Termination')).toBeInTheDocument()
      expect(screen.getByText('8.2 Force Majeure')).toBeInTheDocument()
    })
  })

  describe('Context Window', () => {
    it('displays context window when expanded', async () => {
      const user = userEvent.setup()
      const store = useStore.getState()

      const change: Change = {
        changeId: 'change1',
        docId: 'doc1',
        type: 'insertion',
        author: 'Author',
        timestamp: '2025-11-14T00:00:00Z',
        clausePath: [],
        textBefore: 'This is the text before the change.',
        changedText: 'New text',
      textRuns: [],
        textAfter: 'This is the text after the change.',
        threadId: null,
        suggestedThread: null,
      }
      store.addChange(change)

      render(<ChangeListPanel />)

      const showContextButton = screen.getByText('Show context')
      await user.click(showContextButton)

      expect(screen.getByText(/Before:/)).toBeInTheDocument()
      expect(screen.getByText(/This is the text before the change\./)).toBeInTheDocument()
      expect(screen.getByText(/After:/)).toBeInTheDocument()
      expect(screen.getByText(/This is the text after the change\./)).toBeInTheDocument()
    })
  })

  describe('Search and Filter', () => {
    beforeEach(() => {
      const store = useStore.getState()

      store.addNormalizedDocument({
        docId: 'doc1',
        name: 'Contract.docx',
        hash: 'hash1',
        uploadedAt: '2025-11-14T00:00:00Z',
        parsedAt: '2025-11-14T00:00:00Z',
      })

      store.addChanges([
        {
          changeId: 'change1',
          docId: 'doc1',
          type: 'insertion',
          author: 'John Doe',
          timestamp: '2025-11-14T00:00:00Z',
          clausePath: ['Termination'],
          textBefore: '',
          changedText: 'Termination clause text',
      textRuns: [],
          textAfter: '',
          threadId: null,
          suggestedThread: null,
        },
        {
          changeId: 'change2',
          docId: 'doc1',
          type: 'deletion',
          author: 'Jane Smith',
          timestamp: '2025-11-14T00:00:00Z',
          clausePath: ['Payment'],
          textBefore: '',
          changedText: 'Payment terms text',
      textRuns: [],
          textAfter: '',
          threadId: null,
          suggestedThread: null,
        },
      ])
    })

    it('filters changes by search query', async () => {
      const user = userEvent.setup()
      render(<ChangeListPanel />)

      expect(screen.getByText('2 changes unassigned')).toBeInTheDocument()
      expect(screen.getByText('Termination clause text')).toBeInTheDocument()
      expect(screen.getByText('Payment terms text')).toBeInTheDocument()

      const searchInput = screen.getByPlaceholderText('Search changes...')
      await user.type(searchInput, 'Termination')

      expect(screen.getByText('1 change unassigned')).toBeInTheDocument()
      expect(screen.getByText('Termination clause text')).toBeInTheDocument()
      expect(screen.queryByText('Payment terms text')).not.toBeInTheDocument()
    })

    it('filters changes by author', async () => {
      const user = userEvent.setup()
      render(<ChangeListPanel />)

      const searchInput = screen.getByPlaceholderText('Search changes...')
      await user.type(searchInput, 'Jane')

      expect(screen.getByText('1 change unassigned')).toBeInTheDocument()
      expect(screen.getByText('Payment terms text')).toBeInTheDocument()
      expect(screen.queryByText('Termination clause text')).not.toBeInTheDocument()
    })

    it('shows empty state when search has no results', async () => {
      const user = userEvent.setup()
      render(<ChangeListPanel />)

      const searchInput = screen.getByPlaceholderText('Search changes...')
      await user.type(searchInput, 'nonexistent')

      expect(screen.getByText('No changes match your search')).toBeInTheDocument()
    })
  })

  describe('Checkbox Selection', () => {
    beforeEach(() => {
      const store = useStore.getState()

      store.addChanges([
        {
          changeId: 'change1',
          docId: 'doc1',
          type: 'insertion',
          author: 'Author',
          timestamp: '2025-11-14T00:00:00Z',
          clausePath: [],
          textBefore: '',
          changedText: 'Change 1',
      textRuns: [],
          textAfter: '',
          threadId: null,
          suggestedThread: null,
        },
        {
          changeId: 'change2',
          docId: 'doc1',
          type: 'deletion',
          author: 'Author',
          timestamp: '2025-11-14T00:00:00Z',
          clausePath: [],
          textBefore: '',
          changedText: 'Change 2',
      textRuns: [],
          textAfter: '',
          threadId: null,
          suggestedThread: null,
        },
      ])
    })

    it('allows selecting individual changes', async () => {
      const user = userEvent.setup()
      render(<ChangeListPanel />)

      const checkboxes = screen.getAllByRole('checkbox')
      const change1Checkbox = checkboxes[1] // First checkbox is select all

      await user.click(change1Checkbox)

      expect(change1Checkbox).toBeChecked()
      expect(screen.getByText('1 selected')).toBeInTheDocument()
    })

    it('allows bulk select all', async () => {
      const user = userEvent.setup()
      render(<ChangeListPanel />)

      const selectAllCheckbox = screen.getByLabelText(/Select all/)
      await user.click(selectAllCheckbox)

      expect(selectAllCheckbox).toBeChecked()
      expect(screen.getByText('2 selected')).toBeInTheDocument()

      const checkboxes = screen.getAllByRole('checkbox')
      checkboxes.slice(1).forEach((checkbox) => {
        expect(checkbox).toBeChecked()
      })
    })

    it('allows bulk deselect all', async () => {
      const user = userEvent.setup()
      render(<ChangeListPanel />)

      // Select all first
      const selectAllCheckbox = screen.getByLabelText(/Select all/)
      await user.click(selectAllCheckbox)
      expect(screen.getByText('2 selected')).toBeInTheDocument()

      // Deselect all
      await user.click(selectAllCheckbox)
      expect(screen.getByText('Select all')).toBeInTheDocument()
      expect(screen.queryByText('2 selected')).not.toBeInTheDocument()
    })

    it('shows Move to... button when changes are selected', async () => {
      const user = userEvent.setup()
      render(<ChangeListPanel />)

      expect(screen.queryByText('Move to...')).not.toBeInTheDocument()

      const checkboxes = screen.getAllByRole('checkbox')
      await user.click(checkboxes[1])

      expect(screen.getByText('Move to...')).toBeInTheDocument()
    })
  })

  describe('Move to Thread Operation', () => {
    beforeEach(() => {
      const store = useStore.getState()

      // Create threads
      const thread1 = store.createThread({
        title: 'Thread 1',
        userTopic: 'Topic 1',
        rationale: 'Rationale 1',
        suggestedTopic: null,
        changeIds: [],
        status: 'proposed',
        notes: [],
      })

      store.createThread({
        title: 'Thread 2',
        userTopic: 'Topic 2',
        rationale: 'Rationale 2',
        suggestedTopic: null,
        changeIds: [],
        status: 'proposed',
        notes: [],
      })

      // Add changes to thread 1
      store.addChanges([
        {
          changeId: 'change1',
          docId: 'doc1',
          type: 'insertion',
          author: 'Author',
          timestamp: '2025-11-14T00:00:00Z',
          clausePath: [],
          textBefore: '',
          changedText: 'Change 1',
      textRuns: [],
          textAfter: '',
          threadId: thread1.threadId,
          suggestedThread: null,
        },
        {
          changeId: 'change2',
          docId: 'doc1',
          type: 'deletion',
          author: 'Author',
          timestamp: '2025-11-14T00:00:00Z',
          clausePath: [],
          textBefore: '',
          changedText: 'Change 2',
      textRuns: [],
          textAfter: '',
          threadId: thread1.threadId,
          suggestedThread: null,
        },
      ])

      store.setSelectedThread(thread1.threadId)
    })

    it('displays move to dropdown with other threads', async () => {
      const user = userEvent.setup()
      render(<ChangeListPanel />)

      // Select a change
      const checkboxes = screen.getAllByRole('checkbox')
      await user.click(checkboxes[1])

      // Click Move to... button
      const moveButton = screen.getByText('Move to...')
      await user.click(moveButton)

      // Should show unassigned option and other threads
      expect(screen.getByText('Unassigned')).toBeInTheDocument()
      expect(screen.getByText('Thread 2')).toBeInTheDocument()
      expect(screen.queryByText('Thread 1')).not.toBeInTheDocument() // Current thread should not be in list
    })

    it('moves selected changes to another thread', async () => {
      const user = userEvent.setup()
      const store = useStore.getState()

      render(<ChangeListPanel />)

      // Select a change
      const checkboxes = screen.getAllByRole('checkbox')
      await user.click(checkboxes[1])

      // Click Move to... button
      const moveButton = screen.getByText('Move to...')
      await user.click(moveButton)

      // Click Thread 2
      const thread2Button = screen.getByText('Thread 2')
      await user.click(thread2Button)

      // Verify change was moved
      const change = store.getChange('change1')
      expect(change?.threadId).not.toBe(store.selection.selectedThreadId)
      expect(store.selection.selectedChangeIds.size).toBe(0)
    })

    it('moves selected changes to unassigned', async () => {
      const user = userEvent.setup()
      const store = useStore.getState()

      render(<ChangeListPanel />)

      // Select a change
      const checkboxes = screen.getAllByRole('checkbox')
      await user.click(checkboxes[1])

      // Click Move to... button
      const moveButton = screen.getByText('Move to...')
      await user.click(moveButton)

      // Click Unassigned
      const unassignedButton = screen.getByText('Unassigned')
      await user.click(unassignedButton)

      // Verify change was moved to unassigned
      const change = store.getChange('change1')
      expect(change?.threadId).toBeNull()
    })
  })

  describe('Create New Thread', () => {
    beforeEach(() => {
      const store = useStore.getState()

      store.addChanges([
        {
          changeId: 'change1',
          docId: 'doc1',
          type: 'insertion',
          author: 'Author',
          timestamp: '2025-11-14T00:00:00Z',
          clausePath: [],
          textBefore: '',
          changedText: 'Change 1',
      textRuns: [],
          textAfter: '',
          threadId: null,
          suggestedThread: null,
        },
      ])
    })

    it('opens create thread dialog from move dropdown', async () => {
      const user = userEvent.setup()
      render(<ChangeListPanel />)

      // Select a change
      const checkboxes = screen.getAllByRole('checkbox')
      await user.click(checkboxes[1])

      // Click Move to... button
      const moveButton = screen.getByText('Move to...')
      await user.click(moveButton)

      // Click Create new thread
      const createButton = screen.getByText('Create new thread')
      await user.click(createButton)

      expect(screen.getByText('Create New Thread')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Brief description of changes')).toBeInTheDocument()
    })

    it('creates new thread and moves selected changes', async () => {
      const user = userEvent.setup()
      const store = useStore.getState()

      render(<ChangeListPanel />)

      // Select a change
      const checkboxes = screen.getAllByRole('checkbox')
      await user.click(checkboxes[1])

      // Open create thread dialog
      const moveButton = screen.getByText('Move to...')
      await user.click(moveButton)
      const createButton = screen.getByText('Create new thread')
      await user.click(createButton)

      // Fill in the form
      const titleInput = screen.getByPlaceholderText('Brief description of changes')
      await user.type(titleInput, 'New Thread Title')

      const topicInput = screen.getByPlaceholderText('e.g., Termination Clause')
      await user.type(topicInput, 'New Topic')

      // Submit
      const createAndMoveButton = screen.getByText('Create & Move')
      await user.click(createAndMoveButton)

      // Verify thread was created and change was moved
      const threads = store.getAllThreads()
      expect(threads.length).toBe(1)
      expect(threads[0].title).toBe('New Thread Title')
      expect(threads[0].userTopic).toBe('New Topic')

      const change = store.getChange('change1')
      expect(change?.threadId).toBe(threads[0].threadId)
    })

    it('disables create button when required fields are empty', async () => {
      const user = userEvent.setup()
      render(<ChangeListPanel />)

      // Select a change
      const checkboxes = screen.getAllByRole('checkbox')
      await user.click(checkboxes[1])

      // Open create thread dialog
      const moveButton = screen.getByText('Move to...')
      await user.click(moveButton)
      const createButton = screen.getByText('Create new thread')
      await user.click(createButton)

      const createAndMoveButton = screen.getByText('Create & Move')
      expect(createAndMoveButton).toBeDisabled()
    })
  })
})
