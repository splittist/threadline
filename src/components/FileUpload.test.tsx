import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { FileUpload } from './FileUpload'
import { useStore } from '../store/useStore'

// Helper to create a mock File
function createMockFile(
  name: string,
  size: number,
  type: string = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
): File {
  const file = new File(['a'.repeat(size)], name, { type })
  return file
}

// Helper to create drag event with files
function createDragEvent(files: File[]) {
  const dataTransfer = {
    files,
    items: files.map((file) => ({
      kind: 'file' as const,
      type: file.type,
      getAsFile: () => file,
    })),
    types: ['Files'],
  }
  return { dataTransfer }
}

describe('FileUpload', () => {
  beforeEach(() => {
    // Clear the store before each test
    useStore.setState({ documents: [] })
  })

  describe('Rendering', () => {
    it('renders the upload zone', () => {
      render(<FileUpload />)
      expect(
        screen.getByText(/Drop DOCX files here or click to browse/i)
      ).toBeInTheDocument()
    })

    it('displays file size limit information', () => {
      render(<FileUpload />)
      expect(
        screen.getByText(/Supports multiple file selection • Maximum 50MB per file/i)
      ).toBeInTheDocument()
    })

    it('has a hidden file input with correct attributes', () => {
      render(<FileUpload />)
      const input = screen.getByLabelText('Upload DOCX files')
      expect(input).toBeInTheDocument()
      expect(input).toHaveAttribute('type', 'file')
      expect(input).toHaveAttribute('accept', '.docx')
      expect(input).toHaveAttribute('multiple')
    })
  })

  describe('File Selection', () => {
    it('accepts valid .docx files', async () => {
      render(<FileUpload />)
      const input = screen.getByLabelText('Upload DOCX files')
      const file = createMockFile('test.docx', 1000)

      Object.defineProperty(input, 'files', {
        value: [file],
        configurable: true,
      })

      fireEvent.change(input)

      await waitFor(() => {
        const state = useStore.getState()
        expect(state.documents).toHaveLength(1)
        expect(state.documents[0].name).toBe('test.docx')
        expect(state.documents[0].size).toBe(1000)
      })
    })

    it('accepts multiple files', async () => {
      render(<FileUpload />)
      const input = screen.getByLabelText('Upload DOCX files')
      const file1 = createMockFile('test1.docx', 1000)
      const file2 = createMockFile('test2.docx', 2000)

      Object.defineProperty(input, 'files', {
        value: [file1, file2],
        configurable: true,
      })

      fireEvent.change(input)

      await waitFor(() => {
        const state = useStore.getState()
        expect(state.documents).toHaveLength(2)
        expect(state.documents[0].name).toBe('test1.docx')
        expect(state.documents[1].name).toBe('test2.docx')
      })
    })

    it('rejects non-docx files based on extension', async () => {
      render(<FileUpload />)
      const input = screen.getByLabelText('Upload DOCX files')
      const file = createMockFile('test.pdf', 1000, 'application/pdf')

      Object.defineProperty(input, 'files', {
        value: [file],
        configurable: true,
      })

      fireEvent.change(input)

      await waitFor(() => {
        expect(
          screen.getByText(/test.pdf: Only .docx files are accepted/i)
        ).toBeInTheDocument()
      })

      const state = useStore.getState()
      expect(state.documents).toHaveLength(0)
    })

    it('rejects files larger than 50MB', async () => {
      render(<FileUpload />)
      const input = screen.getByLabelText('Upload DOCX files')
      const largeFile = createMockFile('large.docx', 51 * 1024 * 1024)

      Object.defineProperty(input, 'files', {
        value: [largeFile],
        configurable: true,
      })

      fireEvent.change(input)

      await waitFor(() => {
        expect(
          screen.getByText(/large.docx: File size exceeds 50MB limit/i)
        ).toBeInTheDocument()
      })

      const state = useStore.getState()
      expect(state.documents).toHaveLength(0)
    })

    it('validates mixed valid and invalid files', async () => {
      render(<FileUpload />)
      const input = screen.getByLabelText('Upload DOCX files')
      const validFile = createMockFile('valid.docx', 1000)
      const invalidFile = createMockFile('invalid.pdf', 1000, 'application/pdf')

      Object.defineProperty(input, 'files', {
        value: [validFile, invalidFile],
        configurable: true,
      })

      fireEvent.change(input)

      await waitFor(() => {
        expect(
          screen.getByText(/invalid.pdf: Only .docx files are accepted/i)
        ).toBeInTheDocument()
      })

      const state = useStore.getState()
      expect(state.documents).toHaveLength(1)
      expect(state.documents[0].name).toBe('valid.docx')
    })
  })

  describe('Drag and Drop', () => {
    it('handles drag over event', () => {
      render(<FileUpload />)
      const dropZone = screen
        .getByText(/Drop DOCX files here or click to browse/i)
        .closest('div')

      fireEvent.dragOver(dropZone!, createDragEvent([]))

      expect(dropZone).toHaveClass('border-blue-500')
    })

    it('handles drag leave event', () => {
      render(<FileUpload />)
      const dropZone = screen
        .getByText(/Drop DOCX files here or click to browse/i)
        .closest('div')

      fireEvent.dragOver(dropZone!, createDragEvent([]))
      expect(dropZone).toHaveClass('border-blue-500')

      fireEvent.dragLeave(dropZone!, createDragEvent([]))
      expect(dropZone).not.toHaveClass('border-blue-500')
    })

    it('handles file drop', async () => {
      render(<FileUpload />)
      const dropZone = screen
        .getByText(/Drop DOCX files here or click to browse/i)
        .closest('div')

      const file = createMockFile('dropped.docx', 1000)
      fireEvent.drop(dropZone!, createDragEvent([file]))

      await waitFor(() => {
        const state = useStore.getState()
        expect(state.documents).toHaveLength(1)
        expect(state.documents[0].name).toBe('dropped.docx')
      })
    })
  })

  describe('File List Display', () => {
    it('does not show file list when no files uploaded', () => {
      render(<FileUpload />)
      expect(screen.queryByText(/Uploaded Files/i)).not.toBeInTheDocument()
    })

    it('displays uploaded files in list', async () => {
      render(<FileUpload />)
      const input = screen.getByLabelText('Upload DOCX files')
      const file = createMockFile('document.docx', 1024)

      Object.defineProperty(input, 'files', {
        value: [file],
        configurable: true,
      })

      fireEvent.change(input)

      await waitFor(() => {
        expect(screen.getByText(/Uploaded Files \(1\)/i)).toBeInTheDocument()
        expect(screen.getByText('document.docx')).toBeInTheDocument()
        expect(screen.getByText('1 KB')).toBeInTheDocument()
      })
    })

    it('shows correct file count in header', async () => {
      render(<FileUpload />)
      const input = screen.getByLabelText('Upload DOCX files')
      const file1 = createMockFile('doc1.docx', 1000)
      const file2 = createMockFile('doc2.docx', 2000)

      Object.defineProperty(input, 'files', {
        value: [file1, file2],
        configurable: true,
      })

      fireEvent.change(input)

      await waitFor(() => {
        expect(screen.getByText(/Uploaded Files \(2\)/i)).toBeInTheDocument()
      })
    })

    it('formats file sizes correctly', async () => {
      render(<FileUpload />)
      const input = screen.getByLabelText('Upload DOCX files')

      // Test different file sizes
      const tests = [
        { size: 0, expected: '0 Bytes' },
        { size: 500, expected: '500 Bytes' },
        { size: 1024, expected: '1 KB' },
        { size: 1024 * 1024, expected: '1 MB' },
        { size: 1.5 * 1024 * 1024, expected: '1.5 MB' },
      ]

      for (const test of tests) {
        useStore.setState({ documents: [] })
        const file = createMockFile(`test-${test.size}.docx`, test.size)

        Object.defineProperty(input, 'files', {
          value: [file],
          configurable: true,
        })

        fireEvent.change(input)

        await waitFor(() => {
          expect(screen.getByText(test.expected)).toBeInTheDocument()
        })
      }
    })
  })

  describe('File Removal', () => {
    it('removes a file when remove button is clicked', async () => {
      render(<FileUpload />)
      const input = screen.getByLabelText('Upload DOCX files')
      const file = createMockFile('removeme.docx', 1000)

      Object.defineProperty(input, 'files', {
        value: [file],
        configurable: true,
      })

      fireEvent.change(input)

      await waitFor(() => {
        expect(screen.getByText('removeme.docx')).toBeInTheDocument()
      })

      const removeButton = screen.getByLabelText('Remove removeme.docx')
      fireEvent.click(removeButton)

      await waitFor(() => {
        expect(screen.queryByText('removeme.docx')).not.toBeInTheDocument()
        expect(screen.queryByText(/Uploaded Files/i)).not.toBeInTheDocument()
      })

      const state = useStore.getState()
      expect(state.documents).toHaveLength(0)
    })

    it('removes the correct file when multiple files exist', async () => {
      render(<FileUpload />)
      const input = screen.getByLabelText('Upload DOCX files')
      const file1 = createMockFile('keep.docx', 1000)
      const file2 = createMockFile('remove.docx', 2000)

      Object.defineProperty(input, 'files', {
        value: [file1, file2],
        configurable: true,
      })

      fireEvent.change(input)

      await waitFor(() => {
        expect(screen.getByText('keep.docx')).toBeInTheDocument()
        expect(screen.getByText('remove.docx')).toBeInTheDocument()
      })

      const removeButton = screen.getByLabelText('Remove remove.docx')
      fireEvent.click(removeButton)

      await waitFor(() => {
        expect(screen.getByText('keep.docx')).toBeInTheDocument()
        expect(screen.queryByText('remove.docx')).not.toBeInTheDocument()
      })

      const state = useStore.getState()
      expect(state.documents).toHaveLength(1)
      expect(state.documents[0].name).toBe('keep.docx')
    })
  })

  describe('Click to Upload', () => {
    it('opens file dialog when drop zone is clicked', () => {
      render(<FileUpload />)
      const input = screen.getByLabelText(
        'Upload DOCX files'
      ) as HTMLInputElement
      const clickSpy = vi.spyOn(input, 'click')

      const dropZone = screen
        .getByText(/Drop DOCX files here or click to browse/i)
        .closest('div')

      fireEvent.click(dropZone!)

      expect(clickSpy).toHaveBeenCalled()
      clickSpy.mockRestore()
    })
  })

  describe('Error Display', () => {
    it('displays error message for invalid files', async () => {
      render(<FileUpload />)
      const input = screen.getByLabelText('Upload DOCX files')
      const file = createMockFile('test.txt', 1000, 'text/plain')

      Object.defineProperty(input, 'files', {
        value: [file],
        configurable: true,
      })

      fireEvent.change(input)

      await waitFor(() => {
        const errorDiv = screen.getByText(/test.txt: Only .docx files are accepted/i)
        expect(errorDiv).toBeInTheDocument()
        expect(errorDiv.closest('div')).toHaveClass('bg-red-50')
      })
    })

    it('clears error message when valid file is uploaded', async () => {
      render(<FileUpload />)
      const input = screen.getByLabelText('Upload DOCX files')

      // Upload invalid file first
      const invalidFile = createMockFile('test.txt', 1000, 'text/plain')
      Object.defineProperty(input, 'files', {
        value: [invalidFile],
        configurable: true,
      })
      fireEvent.change(input)

      await waitFor(() => {
        expect(
          screen.getByText(/test.txt: Only .docx files are accepted/i)
        ).toBeInTheDocument()
      })

      // Upload valid file
      const validFile = createMockFile('valid.docx', 1000)
      Object.defineProperty(input, 'files', {
        value: [validFile],
        configurable: true,
      })
      fireEvent.change(input)

      await waitFor(() => {
        expect(
          screen.queryByText(/test.txt: Only .docx files are accepted/i)
        ).not.toBeInTheDocument()
      })
    })
  })

  describe('Case Insensitivity', () => {
    it('accepts .DOCX extension in uppercase', async () => {
      render(<FileUpload />)
      const input = screen.getByLabelText('Upload DOCX files')
      const file = createMockFile('test.DOCX', 1000)

      Object.defineProperty(input, 'files', {
        value: [file],
        configurable: true,
      })

      fireEvent.change(input)

      await waitFor(() => {
        const state = useStore.getState()
        expect(state.documents).toHaveLength(1)
        expect(state.documents[0].name).toBe('test.DOCX')
      })
    })

    it('accepts .Docx extension in mixed case', async () => {
      render(<FileUpload />)
      const input = screen.getByLabelText('Upload DOCX files')
      const file = createMockFile('test.Docx', 1000)

      Object.defineProperty(input, 'files', {
        value: [file],
        configurable: true,
      })

      fireEvent.change(input)

      await waitFor(() => {
        const state = useStore.getState()
        expect(state.documents).toHaveLength(1)
      })
    })
  })
})
