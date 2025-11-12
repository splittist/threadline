import { useState, useRef } from 'react'
import type { DragEvent, ChangeEvent } from 'react'
import { ArrowUpTrayIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { DocumentTextIcon } from '@heroicons/react/24/solid'
import { useStore } from '../store/useStore'
import type { DocumentFile } from '../store/useStore'

const ACCEPTED_MIME_TYPE =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
const ACCEPT_EXTENSIONS = '.docx'

export function FileUpload() {
  const { documents, addDocuments, removeDocument } = useStore()
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = (file: File): string | null => {
    // Check file extension
    if (!file.name.toLowerCase().endsWith('.docx')) {
      return `${file.name}: Only .docx files are accepted`
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return `${file.name}: File size exceeds 50MB limit`
    }

    // Check MIME type (note: some systems may not set this correctly)
    if (
      file.type &&
      file.type !== ACCEPTED_MIME_TYPE &&
      file.type !== 'application/vnd.ms-word.document.macroEnabled.12'
    ) {
      return `${file.name}: Invalid file type. Expected .docx file`
    }

    return null
  }

  const processFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) {
      return
    }

    const files = Array.from(fileList)
    const validFiles: DocumentFile[] = []
    const errors: string[] = []

    files.forEach((file) => {
      const validationError = validateFile(file)
      if (validationError) {
        errors.push(validationError)
      } else {
        validFiles.push({
          id: `${file.name}-${Date.now()}-${Math.random()}`,
          file,
          name: file.name,
          size: file.size,
          status: 'pending',
        })
      }
    })

    if (errors.length > 0) {
      setError(errors.join('; '))
    } else {
      setError(null)
    }

    if (validFiles.length > 0) {
      addDocuments(validFiles)
    }
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    processFiles(files)
  }

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    processFiles(e.target.files)
    // Reset input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    let unit: string
    switch (i) {
      case 0:
        unit = 'Bytes'
        break
      case 1:
        unit = 'KB'
        break
      case 2:
        unit = 'MB'
        break
      case 3:
        unit = 'GB'
        break
      default:
        unit = i < 0 ? 'Bytes' : 'GB'
    }
    
    const divisor = i < 0 ? 0 : Math.min(i, 3)
    return Math.round((bytes / Math.pow(k, divisor)) * 100) / 100 + ' ' + unit
  }

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-colors duration-200
          ${
            isDragging
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50'
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPT_EXTENSIONS}
          multiple
          onChange={handleFileSelect}
          className="hidden"
          aria-label="Upload DOCX files"
        />

        <ArrowUpTrayIcon className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-4 text-lg font-medium text-gray-700">
          Drop DOCX files here or click to browse
        </p>
        <p className="mt-2 text-sm text-gray-500">
          Supports multiple file selection • Maximum 50MB per file
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* File List */}
      {documents.length > 0 && (
        <div className="bg-white border border-gray-300 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-900">
              Uploaded Files ({documents.length})
            </h3>
          </div>
          <ul className="divide-y divide-gray-200">
            {documents.map((doc) => (
              <li
                key={doc.id}
                className="flex items-center justify-between px-4 py-3 hover:bg-gray-50"
              >
                <div className="flex items-center flex-1 min-w-0">
                  <DocumentTextIcon className="h-5 w-5 text-blue-600 flex-shrink-0" />
                  <div className="ml-3 flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {doc.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatFileSize(doc.size)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => removeDocument(doc.id)}
                  className="ml-4 flex-shrink-0 p-1 rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label={`Remove ${doc.name}`}
                >
                  <XMarkIcon className="h-5 w-5 text-gray-500" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
