/**
 * Tests for Phase 1.4 Data Model - Zustand Store
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { useStore } from './useStore'
import type { Document, Change } from '../types/dataModel'

describe('Phase 1.4 Data Model - Store', () => {
  beforeEach(() => {
    // Reset the store before each test
    const { normalizedDocuments, changes, threads } = useStore.getState()
    normalizedDocuments.clear()
    changes.clear()
    threads.clear()
    useStore.setState({
      selection: {
        selectedThreadId: null,
        selectedChangeIds: new Set(),
        activeDocumentId: null,
      },
    })
  })

  describe('Document Management', () => {
    it('should add a normalized document', () => {
      const doc: Document = {
        docId: 'doc_001',
        name: 'HMA.docx',
        hash: 'abc123',
        uploadedAt: '2025-10-21T09:00:00Z',
        parsedAt: '2025-10-21T09:00:05Z',
      }

      useStore.getState().addNormalizedDocument(doc)

      const retrieved = useStore.getState().getNormalizedDocument('doc_001')
      expect(retrieved).toEqual(doc)
    })

    it('should retrieve undefined for non-existent document', () => {
      const retrieved = useStore.getState().getNormalizedDocument('non_existent')
      expect(retrieved).toBeUndefined()
    })
  })

  describe('Change Management', () => {
    const sampleChange: Change = {
      changeId: 'chg_001',
      docId: 'doc_001',
      type: 'insertion',
      author: 'Jane Smith',
      timestamp: '2025-10-21T09:41:00Z',
      clausePath: ['8', 'Termination', '8.2 Force Majeure'],
      textBefore: 'prior text...',
      changedText: 'Force Majeure Event',
      textAfter: 'following text...',
      threadId: null,
      suggestedThread: null,
    }

    it('should add a single change', () => {
      useStore.getState().addChange(sampleChange)

      const retrieved = useStore.getState().getChange('chg_001')
      expect(retrieved).toEqual(sampleChange)
    })

    it('should add multiple changes', () => {
      const changes: Change[] = [
        { ...sampleChange, changeId: 'chg_001' },
        { ...sampleChange, changeId: 'chg_002', type: 'deletion' },
        { ...sampleChange, changeId: 'chg_003' },
      ]

      useStore.getState().addChanges(changes)

      expect(useStore.getState().changes.size).toBe(3)
      expect(useStore.getState().getChange('chg_001')).toBeDefined()
      expect(useStore.getState().getChange('chg_002')).toBeDefined()
      expect(useStore.getState().getChange('chg_003')).toBeDefined()
    })

    it('should update a change', () => {
      useStore.getState().addChange(sampleChange)

      useStore.getState().updateChange('chg_001', { threadId: 'th_001' })

      const updated = useStore.getState().getChange('chg_001')
      expect(updated?.threadId).toBe('th_001')
    })

    it('should get changes by document', () => {
      const changes: Change[] = [
        { ...sampleChange, changeId: 'chg_001', docId: 'doc_001' },
        { ...sampleChange, changeId: 'chg_002', docId: 'doc_001' },
        { ...sampleChange, changeId: 'chg_003', docId: 'doc_002' },
      ]

      useStore.getState().addChanges(changes)

      const doc1Changes = useStore.getState().getChangesByDocument('doc_001')
      expect(doc1Changes).toHaveLength(2)
      expect(doc1Changes.map((c) => c.changeId)).toEqual(['chg_001', 'chg_002'])
    })

    it('should get changes by thread', () => {
      const changes: Change[] = [
        { ...sampleChange, changeId: 'chg_001', threadId: 'th_001' },
        { ...sampleChange, changeId: 'chg_002', threadId: 'th_001' },
        { ...sampleChange, changeId: 'chg_003', threadId: 'th_002' },
      ]

      useStore.getState().addChanges(changes)

      const thread1Changes = useStore.getState().getChangesByThread('th_001')
      expect(thread1Changes).toHaveLength(2)
      expect(thread1Changes.map((c) => c.changeId)).toEqual(['chg_001', 'chg_002'])
    })

    it('should get unassigned changes', () => {
      const changes: Change[] = [
        { ...sampleChange, changeId: 'chg_001', threadId: 'th_001' },
        { ...sampleChange, changeId: 'chg_002', threadId: null },
        { ...sampleChange, changeId: 'chg_003', threadId: null },
      ]

      useStore.getState().addChanges(changes)

      const unassigned = useStore.getState().getUnassignedChanges()
      expect(unassigned).toHaveLength(2)
      expect(unassigned.map((c) => c.changeId)).toEqual(['chg_002', 'chg_003'])
    })

    it('should assign changes to a thread', () => {
      const changes: Change[] = [
        { ...sampleChange, changeId: 'chg_001', threadId: null },
        { ...sampleChange, changeId: 'chg_002', threadId: null },
      ]

      useStore.getState().addChanges(changes)

      useStore.getState().assignChangesToThread(['chg_001', 'chg_002'], 'th_001')

      const change1 = useStore.getState().getChange('chg_001')
      const change2 = useStore.getState().getChange('chg_002')
      expect(change1?.threadId).toBe('th_001')
      expect(change2?.threadId).toBe('th_001')
    })

    it('should unassign changes by setting threadId to null', () => {
      const change: Change = { ...sampleChange, changeId: 'chg_001', threadId: 'th_001' }
      useStore.getState().addChange(change)

      useStore.getState().assignChangesToThread(['chg_001'], null)

      const updated = useStore.getState().getChange('chg_001')
      expect(updated?.threadId).toBeNull()
    })
  })

  describe('Thread Management', () => {
    it('should create a thread with auto-generated ID and timestamps', () => {
      const thread = useStore.getState().createThread({
        title: 'Force Majeure alignment',
        userTopic: 'Force Majeure',
        suggestedTopic: null,
        rationale: 'Align FM definition across documents',
        changeIds: ['chg_001', 'chg_002'],
        status: 'proposed',
        notes: [],
      })

      expect(thread.threadId).toMatch(/^th_/)
      expect(thread.createdAt).toBeDefined()
      expect(thread.updatedAt).toBeDefined()
      expect(thread.title).toBe('Force Majeure alignment')

      const retrieved = useStore.getState().getThread(thread.threadId)
      expect(retrieved).toEqual(thread)
    })

    it('should update a thread', () => {
      const thread = useStore.getState().createThread({
        title: 'Original Title',
        userTopic: 'Original Topic',
        suggestedTopic: null,
        rationale: 'Original rationale',
        changeIds: [],
        status: 'proposed',
        notes: [],
      })

      useStore.getState().updateThread(thread.threadId, {
        title: 'Updated Title',
        rationale: 'Updated rationale',
      })

      const updated = useStore.getState().getThread(thread.threadId)
      expect(updated?.title).toBe('Updated Title')
      expect(updated?.rationale).toBe('Updated rationale')
      expect(updated?.userTopic).toBe('Original Topic') // unchanged
      // updatedAt should be different (though may be same if too fast)
      expect(updated?.updatedAt).toBeDefined()
    })

    it('should delete a thread and unassign its changes', () => {
      const thread = useStore.getState().createThread({
        title: 'Test Thread',
        userTopic: 'Test',
        suggestedTopic: null,
        rationale: 'Test rationale',
        changeIds: ['chg_001'],
        status: 'proposed',
        notes: [],
      })

      const change: Change = {
        changeId: 'chg_001',
        docId: 'doc_001',
        type: 'insertion',
        author: 'Jane',
        timestamp: '2025-10-21T09:00:00Z',
        clausePath: [],
        textBefore: '',
        changedText: 'test',
        textAfter: '',
        threadId: thread.threadId,
        suggestedThread: null,
      }
      useStore.getState().addChange(change)

      useStore.getState().deleteThread(thread.threadId)

      expect(useStore.getState().getThread(thread.threadId)).toBeUndefined()
      const updatedChange = useStore.getState().getChange('chg_001')
      expect(updatedChange?.threadId).toBeNull()
    })

    it('should get all threads', () => {
      useStore.getState().createThread({
        title: 'Thread 1',
        userTopic: 'Topic 1',
        suggestedTopic: null,
        rationale: 'Rationale 1',
        changeIds: [],
        status: 'proposed',
        notes: [],
      })
      useStore.getState().createThread({
        title: 'Thread 2',
        userTopic: 'Topic 2',
        suggestedTopic: null,
        rationale: 'Rationale 2',
        changeIds: [],
        status: 'proposed',
        notes: [],
      })

      const allThreads = useStore.getState().getAllThreads()
      expect(allThreads).toHaveLength(2)
    })

    it('should add a note to a thread', () => {
      const thread = useStore.getState().createThread({
        title: 'Test Thread',
        userTopic: 'Test',
        suggestedTopic: null,
        rationale: 'Test rationale',
        changeIds: [],
        status: 'proposed',
        notes: [],
      })

      useStore.getState().addNoteToThread(thread.threadId, 'This is a test note')

      const updated = useStore.getState().getThread(thread.threadId)
      expect(updated?.notes).toHaveLength(1)
      expect(updated?.notes[0].text).toBe('This is a test note')
      expect(updated?.notes[0].noteId).toMatch(/^note_/)
    })

    it('should update thread status', () => {
      const thread = useStore.getState().createThread({
        title: 'Test Thread',
        userTopic: 'Test',
        suggestedTopic: null,
        rationale: 'Test rationale',
        changeIds: [],
        status: 'proposed',
        notes: [],
      })

      useStore.getState().updateThreadStatus(thread.threadId, 'approved')

      const updated = useStore.getState().getThread(thread.threadId)
      expect(updated?.status).toBe('approved')
    })
  })

  describe('Selection Management', () => {
    it('should set selected thread', () => {
      useStore.getState().setSelectedThread('th_001')

      expect(useStore.getState().selection.selectedThreadId).toBe('th_001')
    })

    it('should toggle change selection', () => {
      useStore.getState().toggleChangeSelection('chg_001')
      expect(useStore.getState().selection.selectedChangeIds.has('chg_001')).toBe(true)

      useStore.getState().toggleChangeSelection('chg_001')
      expect(useStore.getState().selection.selectedChangeIds.has('chg_001')).toBe(false)
    })

    it('should select multiple changes', () => {
      useStore.getState().selectChanges(['chg_001', 'chg_002', 'chg_003'])

      const selected = useStore.getState().selection.selectedChangeIds
      expect(selected.size).toBe(3)
      expect(selected.has('chg_001')).toBe(true)
      expect(selected.has('chg_002')).toBe(true)
      expect(selected.has('chg_003')).toBe(true)
    })

    it('should clear change selection', () => {
      useStore.getState().selectChanges(['chg_001', 'chg_002'])
      useStore.getState().clearChangeSelection()

      expect(useStore.getState().selection.selectedChangeIds.size).toBe(0)
    })

    it('should set active document', () => {
      useStore.getState().setActiveDocument('doc_001')

      expect(useStore.getState().selection.activeDocumentId).toBe('doc_001')
    })

    it('should clear selected thread when that thread is deleted', () => {
      const thread = useStore.getState().createThread({
        title: 'Test Thread',
        userTopic: 'Test',
        suggestedTopic: null,
        rationale: 'Test rationale',
        changeIds: [],
        status: 'proposed',
        notes: [],
      })

      useStore.getState().setSelectedThread(thread.threadId)
      expect(useStore.getState().selection.selectedThreadId).toBe(thread.threadId)

      useStore.getState().deleteThread(thread.threadId)
      expect(useStore.getState().selection.selectedThreadId).toBeNull()
    })
  })

  describe('Computed Selectors', () => {
    beforeEach(() => {
      // Set up test data
      const changes: Change[] = [
        {
          changeId: 'chg_001',
          docId: 'doc_001',
          type: 'insertion',
          author: 'Jane',
          timestamp: '2025-10-21T09:00:00Z',
          clausePath: [],
          textBefore: '',
          changedText: 'text 1',
          textAfter: '',
          threadId: 'th_001',
          suggestedThread: null,
        },
        {
          changeId: 'chg_002',
          docId: 'doc_001',
          type: 'deletion',
          author: 'Jane',
          timestamp: '2025-10-21T09:01:00Z',
          clausePath: [],
          textBefore: '',
          changedText: 'text 2',
          textAfter: '',
          threadId: 'th_001',
          suggestedThread: null,
        },
        {
          changeId: 'chg_003',
          docId: 'doc_002',
          type: 'insertion',
          author: 'John',
          timestamp: '2025-10-21T09:02:00Z',
          clausePath: [],
          textBefore: '',
          changedText: 'text 3',
          textAfter: '',
          threadId: 'th_002',
          suggestedThread: null,
        },
      ]

      useStore.getState().addChanges(changes)
    })

    it('should get filtered changes by selected thread', () => {
      useStore.getState().setSelectedThread('th_001')

      const filtered = useStore.getState().getFilteredChanges()
      expect(filtered).toHaveLength(2)
      expect(filtered.map((c) => c.changeId)).toEqual(['chg_001', 'chg_002'])
    })

    it('should get filtered changes by active document', () => {
      useStore.getState().setActiveDocument('doc_001')

      const filtered = useStore.getState().getFilteredChanges()
      expect(filtered).toHaveLength(2)
      expect(filtered.map((c) => c.changeId)).toEqual(['chg_001', 'chg_002'])
    })

    it('should get filtered changes by both thread and document', () => {
      useStore.getState().setSelectedThread('th_001')
      useStore.getState().setActiveDocument('doc_001')

      const filtered = useStore.getState().getFilteredChanges()
      expect(filtered).toHaveLength(2)
      expect(filtered.map((c) => c.changeId)).toEqual(['chg_001', 'chg_002'])
    })

    it('should return all changes when no filters are set', () => {
      const filtered = useStore.getState().getFilteredChanges()
      expect(filtered).toHaveLength(3)
    })

    it('should get thread change count', () => {
      const count1 = useStore.getState().getThreadChangeCount('th_001')
      const count2 = useStore.getState().getThreadChangeCount('th_002')

      expect(count1).toBe(2)
      expect(count2).toBe(1)
    })
  })

  describe('State Serialization', () => {
    it('should serialize and deserialize state', () => {
      // Add test data
      const doc: Document = {
        docId: 'doc_001',
        name: 'test.docx',
        hash: 'abc123',
        uploadedAt: '2025-10-21T09:00:00Z',
        parsedAt: '2025-10-21T09:00:05Z',
      }
      useStore.getState().addNormalizedDocument(doc)

      const change: Change = {
        changeId: 'chg_001',
        docId: 'doc_001',
        type: 'insertion',
        author: 'Jane',
        timestamp: '2025-10-21T09:00:00Z',
        clausePath: [],
        textBefore: '',
        changedText: 'test',
        textAfter: '',
        threadId: null,
        suggestedThread: null,
      }
      useStore.getState().addChange(change)

      useStore.getState().createThread({
        title: 'Test Thread',
        userTopic: 'Test',
        suggestedTopic: null,
        rationale: 'Test rationale',
        changeIds: ['chg_001'],
        status: 'proposed',
        notes: [],
      })

      // Serialize
      const state = useStore.getState()
      const serialized = {
        normalizedDocuments: Array.from(state.normalizedDocuments.entries()),
        changes: Array.from(state.changes.entries()),
        threads: Array.from(state.threads.entries()),
      }

      // Verify serialization works (can convert to JSON)
      const json = JSON.stringify(serialized)
      expect(json).toBeDefined()

      // Deserialize
      const parsed = JSON.parse(json)
      expect(parsed.normalizedDocuments).toHaveLength(1)
      expect(parsed.changes).toHaveLength(1)
      expect(parsed.threads).toHaveLength(1)
    })
  })

  describe('Phase 2.1 - Clustering', () => {
    it('should add a bucket', () => {
      const bucket = {
        bucketId: 'bucket_001',
        suggestedTopic: 'Force Majeure',
        keywords: ['force', 'majeure', 'event'],
        changeIds: ['chg_001', 'chg_002'],
        confidence: 0.85,
        method: 'clause-path' as const,
        createdAt: '2025-11-13T12:00:00Z',
      }

      useStore.getState().addBucket(bucket)

      const retrieved = useStore.getState().getBucket('bucket_001')
      expect(retrieved).toEqual(bucket)
    })

    it('should add multiple buckets', () => {
      const buckets = [
        {
          bucketId: 'bucket_001',
          suggestedTopic: 'Force Majeure',
          keywords: ['force', 'majeure'],
          changeIds: ['chg_001'],
          confidence: 0.85,
          method: 'clause-path' as const,
          createdAt: '2025-11-13T12:00:00Z',
        },
        {
          bucketId: 'bucket_002',
          suggestedTopic: 'Payment Terms',
          keywords: ['payment', 'terms'],
          changeIds: ['chg_002'],
          confidence: 0.75,
          method: 'keyword' as const,
          createdAt: '2025-11-13T12:00:00Z',
        },
      ]

      useStore.getState().addBuckets(buckets)

      const allBuckets = useStore.getState().getAllBuckets()
      expect(allBuckets).toHaveLength(2)
    })

    it('should remove a bucket', () => {
      const bucket = {
        bucketId: 'bucket_001',
        suggestedTopic: 'Test',
        keywords: [],
        changeIds: [],
        confidence: 0.5,
        method: 'clause-path' as const,
        createdAt: '2025-11-13T12:00:00Z',
      }

      useStore.getState().addBucket(bucket)
      expect(useStore.getState().getBucket('bucket_001')).toBeDefined()

      useStore.getState().removeBucket('bucket_001')
      expect(useStore.getState().getBucket('bucket_001')).toBeUndefined()
    })

    it('should clear all buckets', () => {
      const buckets = [
        {
          bucketId: 'bucket_001',
          suggestedTopic: 'Test 1',
          keywords: [],
          changeIds: [],
          confidence: 0.5,
          method: 'clause-path' as const,
          createdAt: '2025-11-13T12:00:00Z',
        },
        {
          bucketId: 'bucket_002',
          suggestedTopic: 'Test 2',
          keywords: [],
          changeIds: [],
          confidence: 0.5,
          method: 'clause-path' as const,
          createdAt: '2025-11-13T12:00:00Z',
        },
      ]

      useStore.getState().addBuckets(buckets)
      expect(useStore.getState().getAllBuckets()).toHaveLength(2)

      useStore.getState().clearBuckets()
      expect(useStore.getState().getAllBuckets()).toHaveLength(0)
    })

    it('should set clustering status', () => {
      expect(useStore.getState().clusteringStatus).toBe('idle')

      useStore.getState().setClusteringStatus('clustering')
      expect(useStore.getState().clusteringStatus).toBe('clustering')
      expect(useStore.getState().clusteringError).toBeNull()

      useStore.getState().setClusteringStatus('error', 'Test error')
      expect(useStore.getState().clusteringStatus).toBe('error')
      expect(useStore.getState().clusteringError).toBe('Test error')
    })

    it('should apply clustering result', () => {
      // Add some changes first
      const changes = [
        {
          changeId: 'chg_001',
          docId: 'doc_001',
          type: 'insertion' as const,
          author: 'Author 1',
          timestamp: '2025-11-13T12:00:00Z',
          clausePath: ['8', 'Termination'],
          textBefore: 'before',
          changedText: 'Force Majeure',
          textAfter: 'after',
          threadId: null,
          suggestedThread: null,
        },
        {
          changeId: 'chg_002',
          docId: 'doc_001',
          type: 'insertion' as const,
          author: 'Author 1',
          timestamp: '2025-11-13T12:00:00Z',
          clausePath: ['8', 'Termination'],
          textBefore: 'before',
          changedText: 'Force Majeure event',
          textAfter: 'after',
          threadId: null,
          suggestedThread: null,
        },
      ]

      useStore.getState().addChanges(changes)

      // Apply clustering result
      const result = {
        buckets: [
          {
            bucketId: 'bucket_001',
            suggestedTopic: 'Force Majeure',
            keywords: ['force', 'majeure'],
            changeIds: ['chg_001', 'chg_002'],
            confidence: 0.9,
            method: 'clause-path' as const,
            createdAt: '2025-11-13T12:00:00Z',
          },
        ],
        assignedChangeIds: ['chg_001', 'chg_002'],
        unassignedChangeIds: [],
        stats: {
          totalChanges: 2,
          totalBuckets: 1,
          averageChangesPerBucket: 2,
          averageConfidence: 0.9,
        },
      }

      useStore.getState().applyClusteringResult(result)

      // Verify buckets were added
      expect(useStore.getState().getAllBuckets()).toHaveLength(1)

      // Verify changes were updated with suggested topics
      const change1 = useStore.getState().getChange('chg_001')
      const change2 = useStore.getState().getChange('chg_002')
      expect(change1?.suggestedThread).toBe('Force Majeure')
      expect(change2?.suggestedThread).toBe('Force Majeure')

      // Verify status was updated
      expect(useStore.getState().clusteringStatus).toBe('complete')
      expect(useStore.getState().clusteringError).toBeNull()
    })
  })
})
