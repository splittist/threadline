/**
 * Tests for ThreadMetadataPanel Component
 * Tests editable fields, auto-save, validation, and note management
 */

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach } from 'vitest'
import { ThreadMetadataPanel } from './ThreadMetadataPanel'
import { useStore } from '../store/useStore'

// Mock ResizeObserver for Headless UI
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

describe('ThreadMetadataPanel', () => {
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
    })
  })

  describe('Empty states', () => {
    it('shows message when no thread is selected', () => {
      render(<ThreadMetadataPanel />)
      
      expect(screen.getByText('No thread selected')).toBeInTheDocument()
      expect(screen.getByText('Select a thread to view details')).toBeInTheDocument()
    })

    it('shows error when thread not found', () => {
      useStore.setState({
        selection: {
          selectedThreadId: 'non-existent-thread',
          selectedChangeIds: new Set(),
          activeDocumentId: null,
        },
      })
      
      render(<ThreadMetadataPanel />)
      
      expect(screen.getByText('Thread not found')).toBeInTheDocument()
    })
  })

  describe('Display thread metadata', () => {
    it('displays thread information correctly', () => {
      const thread = useStore.getState().createThread({
        title: 'Test Thread Title',
        userTopic: 'Test Topic',
        suggestedTopic: 'AI Suggested Topic',
        rationale: 'Test rationale text',
        changeIds: [],
        status: 'proposed',
        notes: [],
      })

      useStore.getState().setSelectedThread(thread.threadId)
      
      render(<ThreadMetadataPanel />)
      
      // Check header shows title
      const headers = screen.getAllByText('Test Thread Title')
      expect(headers.length).toBeGreaterThan(0)
      
      // Check all form fields are populated
      expect(screen.getByDisplayValue('Test Topic')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Test rationale text')).toBeInTheDocument()
      
      // Check suggested topic label exists
      expect(screen.getByText('AI Suggested Topic', { selector: 'label' })).toBeInTheDocument()
      
      // Check status badge
      expect(screen.getByText('Proposed')).toBeInTheDocument()
    })

    it('displays timestamps correctly', () => {
      const thread = useStore.getState().createThread({
        title: 'Test Thread',
        userTopic: 'Test Topic',
        suggestedTopic: null,
        rationale: '',
        changeIds: [],
        status: 'proposed',
        notes: [],
      })

      useStore.getState().setSelectedThread(thread.threadId)
      
      render(<ThreadMetadataPanel />)
      
      expect(screen.getByText(/Created:/)).toBeInTheDocument()
      expect(screen.getByText(/Updated:/)).toBeInTheDocument()
    })
  })

  describe('Editable fields', () => {
    it('allows editing title field', async () => {
      const user = userEvent.setup()
      const thread = useStore.getState().createThread({
        title: 'Original Title',
        userTopic: 'Test Topic',
        suggestedTopic: null,
        rationale: '',
        changeIds: [],
        status: 'proposed',
        notes: [],
      })

      useStore.getState().setSelectedThread(thread.threadId)
      render(<ThreadMetadataPanel />)
      
      const titleInput = screen.getByDisplayValue('Original Title')
      await user.clear(titleInput)
      await user.type(titleInput, 'New Title')
      
      expect(titleInput).toHaveValue('New Title')
    })

    it('allows editing user topic field', async () => {
      const user = userEvent.setup()
      const thread = useStore.getState().createThread({
        title: 'Test Thread',
        userTopic: 'Original Topic',
        suggestedTopic: null,
        rationale: '',
        changeIds: [],
        status: 'proposed',
        notes: [],
      })

      useStore.getState().setSelectedThread(thread.threadId)
      render(<ThreadMetadataPanel />)
      
      const topicInput = screen.getByDisplayValue('Original Topic')
      await user.clear(topicInput)
      await user.type(topicInput, 'Updated Topic')
      
      expect(topicInput).toHaveValue('Updated Topic')
    })

    it('allows editing rationale field', async () => {
      const user = userEvent.setup()
      const thread = useStore.getState().createThread({
        title: 'Test Thread',
        userTopic: 'Test Topic',
        suggestedTopic: null,
        rationale: 'Original rationale',
        changeIds: [],
        status: 'proposed',
        notes: [],
      })

      useStore.getState().setSelectedThread(thread.threadId)
      render(<ThreadMetadataPanel />)
      
      const rationaleTextarea = screen.getByDisplayValue('Original rationale')
      await user.clear(rationaleTextarea)
      await user.type(rationaleTextarea, 'Updated rationale text')
      
      expect(rationaleTextarea).toHaveValue('Updated rationale text')
    })
  })

  describe('Status dropdown', () => {
    it('displays all status options', async () => {
      const user = userEvent.setup()
      const thread = useStore.getState().createThread({
        title: 'Test Thread',
        userTopic: 'Test Topic',
        suggestedTopic: null,
        rationale: '',
        changeIds: [],
        status: 'proposed',
        notes: [],
      })

      useStore.getState().setSelectedThread(thread.threadId)
      render(<ThreadMetadataPanel />)
      
      // Click the status dropdown button
      const statusButton = screen.getByRole('button', { name: /Proposed/i })
      await user.click(statusButton)
      
      // All status options should be visible
      await waitFor(() => {
        expect(screen.getByText('Under Review')).toBeInTheDocument()
        expect(screen.getByText('Approved')).toBeInTheDocument()
        expect(screen.getByText('Rejected')).toBeInTheDocument()
        expect(screen.getByText('Escalate')).toBeInTheDocument()
      })
    })

    it('changes status when option is selected', async () => {
      const user = userEvent.setup()
      const thread = useStore.getState().createThread({
        title: 'Test Thread',
        userTopic: 'Test Topic',
        suggestedTopic: null,
        rationale: '',
        changeIds: [],
        status: 'proposed',
        notes: [],
      })

      useStore.getState().setSelectedThread(thread.threadId)
      render(<ThreadMetadataPanel />)
      
      // Click the status dropdown button
      const statusButton = screen.getByRole('button', { name: /Proposed/i })
      await user.click(statusButton)
      
      // Select "Approved" option
      const approvedOption = screen.getByText('Approved')
      await user.click(approvedOption)
      
      // Status should update
      await waitFor(() => {
        const updatedThread = useStore.getState().getThread(thread.threadId)
        expect(updatedThread?.status).toBe('approved')
      })
    })
  })

  describe('Auto-save functionality', () => {
    it('auto-saves changes after typing', async () => {
      const user = userEvent.setup()
      const thread = useStore.getState().createThread({
        title: 'Original Title',
        userTopic: 'Original Topic',
        suggestedTopic: null,
        rationale: 'Original rationale',
        changeIds: [],
        status: 'proposed',
        notes: [],
      })

      useStore.getState().setSelectedThread(thread.threadId)
      render(<ThreadMetadataPanel />)
      
      // Edit the title
      const titleInput = screen.getByLabelText('Title')
      await user.clear(titleInput)
      await user.type(titleInput, 'Auto-saved Title')
      
      // Wait for auto-save to complete
      await waitFor(() => {
        const updatedThread = useStore.getState().getThread(thread.threadId)
        expect(updatedThread?.title).toBe('Auto-saved Title')
      }, { timeout: 1000 })
    })
  })

  describe('Validation', () => {
    it('shows validation error when user topic is empty', async () => {
      const user = userEvent.setup()
      const thread = useStore.getState().createThread({
        title: 'Test Thread',
        userTopic: 'Original Topic',
        suggestedTopic: null,
        rationale: '',
        changeIds: [],
        status: 'proposed',
        notes: [],
      })

      useStore.getState().setSelectedThread(thread.threadId)
      render(<ThreadMetadataPanel />)
      
      // Clear the user topic field
      const topicInput = screen.getByLabelText(/User Topic/)
      await user.clear(topicInput)
      
      // Validation error should appear after a delay
      await waitFor(() => {
        expect(screen.getByText('User topic is required')).toBeInTheDocument()
      }, { timeout: 1000 })
    })

    it('clears validation error when user topic is provided', async () => {
      const user = userEvent.setup()
      const thread = useStore.getState().createThread({
        title: 'Test Thread',
        userTopic: 'Original Topic',
        suggestedTopic: null,
        rationale: '',
        changeIds: [],
        status: 'proposed',
        notes: [],
      })

      useStore.getState().setSelectedThread(thread.threadId)
      render(<ThreadMetadataPanel />)
      
      // Clear the user topic field
      const topicInput = screen.getByLabelText(/User Topic/)
      await user.clear(topicInput)
      
      // Validation error should appear
      await waitFor(() => {
        expect(screen.getByText('User topic is required')).toBeInTheDocument()
      }, { timeout: 1000 })
      
      // Type a new topic
      await user.type(topicInput, 'New Topic')
      
      // Validation error should disappear
      await waitFor(() => {
        expect(screen.queryByText('User topic is required')).not.toBeInTheDocument()
      }, { timeout: 1000 })
    })
  })

  describe('Notes management', () => {
    it('displays existing notes', () => {
      const thread = useStore.getState().createThread({
        title: 'Test Thread',
        userTopic: 'Test Topic',
        suggestedTopic: null,
        rationale: '',
        changeIds: [],
        status: 'proposed',
        notes: [
          {
            noteId: 'note-1',
            text: 'First note',
            timestamp: new Date().toISOString(),
            author: 'Test User',
          },
          {
            noteId: 'note-2',
            text: 'Second note',
            timestamp: new Date().toISOString(),
          },
        ],
      })

      useStore.getState().setSelectedThread(thread.threadId)
      render(<ThreadMetadataPanel />)
      
      expect(screen.getByText('First note')).toBeInTheDocument()
      expect(screen.getByText('Second note')).toBeInTheDocument()
      expect(screen.getByText('Test User')).toBeInTheDocument()
      expect(screen.getByText('Notes (2)')).toBeInTheDocument()
    })

    it('allows adding a new note', async () => {
      const user = userEvent.setup()
      const thread = useStore.getState().createThread({
        title: 'Test Thread',
        userTopic: 'Test Topic',
        suggestedTopic: null,
        rationale: '',
        changeIds: [],
        status: 'proposed',
        notes: [],
      })

      useStore.getState().setSelectedThread(thread.threadId)
      render(<ThreadMetadataPanel />)
      
      // Type a note
      const noteTextarea = screen.getByPlaceholderText(/Add a note/)
      await user.type(noteTextarea, 'This is a new note')
      
      // Click add button
      const addButton = screen.getByTitle('Add note')
      await user.click(addButton)
      
      // Note should be added and textarea cleared
      await waitFor(() => {
        expect(screen.getByText('This is a new note')).toBeInTheDocument()
        expect(noteTextarea).toHaveValue('')
      }, { timeout: 1000 })
    })

    it('does not add empty notes', async () => {
      const thread = useStore.getState().createThread({
        title: 'Test Thread',
        userTopic: 'Test Topic',
        suggestedTopic: null,
        rationale: '',
        changeIds: [],
        status: 'proposed',
        notes: [],
      })

      useStore.getState().setSelectedThread(thread.threadId)
      render(<ThreadMetadataPanel />)
      
      // Try to add empty note
      const addButton = screen.getByTitle('Add note')
      expect(addButton).toBeDisabled()
    })

    it('adds note with Ctrl+Enter keyboard shortcut', async () => {
      const user = userEvent.setup()
      const thread = useStore.getState().createThread({
        title: 'Test Thread',
        userTopic: 'Test Topic',
        suggestedTopic: null,
        rationale: '',
        changeIds: [],
        status: 'proposed',
        notes: [],
      })

      useStore.getState().setSelectedThread(thread.threadId)
      render(<ThreadMetadataPanel />)
      
      // Type a note
      const noteTextarea = screen.getByPlaceholderText(/Add a note/)
      await user.type(noteTextarea, 'Note added with keyboard')
      
      // Press Ctrl+Enter
      await user.keyboard('{Control>}{Enter}{/Control}')
      
      // Note should be added
      await waitFor(() => {
        expect(screen.getByText('Note added with keyboard')).toBeInTheDocument()
      }, { timeout: 1000 })
    })
  })

  describe('Change IDs debugging', () => {
    it('toggles change IDs display', async () => {
      const user = userEvent.setup()
      
      // Create thread with some changes
      const thread = useStore.getState().createThread({
        title: 'Test Thread',
        userTopic: 'Test Topic',
        suggestedTopic: null,
        rationale: '',
        changeIds: ['change-1', 'change-2'],
        status: 'proposed',
        notes: [],
      })
      
      // Add changes to store
      useStore.getState().addChanges([
        {
          changeId: 'change-1',
          docId: 'doc-1',
          type: 'insertion',
          author: 'Author',
          timestamp: new Date().toISOString(),
          clausePath: [],
          textBefore: '',
          changedText: 'Text',
          textAfter: '',
          threadId: thread.threadId,
          suggestedThread: null,
        },
        {
          changeId: 'change-2',
          docId: 'doc-1',
          type: 'deletion',
          author: 'Author',
          timestamp: new Date().toISOString(),
          clausePath: [],
          textBefore: '',
          changedText: 'Text',
          textAfter: '',
          threadId: thread.threadId,
          suggestedThread: null,
        },
      ])

      useStore.getState().setSelectedThread(thread.threadId)
      render(<ThreadMetadataPanel />)
      
      // Change IDs should not be visible initially
      expect(screen.queryByText('change-1')).not.toBeInTheDocument()
      
      // Click to show change IDs
      const toggleButton = screen.getByText(/Change IDs \(2\)/)
      await user.click(toggleButton)
      
      // Change IDs should now be visible
      await waitFor(() => {
        expect(screen.getByText('change-1')).toBeInTheDocument()
        expect(screen.getByText('change-2')).toBeInTheDocument()
      }, { timeout: 1000 })
    })
  })
})
