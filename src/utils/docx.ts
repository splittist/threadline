import JSZip from 'jszip'

/**
 * Extracts a DOCX file and returns its content
 */
export async function extractDocx(file: File): Promise<JSZip> {
  const zip = new JSZip()
  return await zip.loadAsync(file)
}

/**
 * Reads the document.xml from a DOCX file
 */
export async function readDocumentXml(file: File): Promise<string> {
  const zip = await extractDocx(file)
  const documentXml = await zip.file('word/document.xml')?.async('text')
  return documentXml || ''
}

/**
 * Check if File System Access API is supported
 */
export function isFileSystemAccessSupported(): boolean {
  return 'showOpenFilePicker' in window
}

/**
 * Open a file using the File System Access API
 */
export async function openFileWithFSA(): Promise<File | null> {
  if (!isFileSystemAccessSupported()) {
    return null
  }

  try {
    const [fileHandle] = await (
      window as unknown as {
        showOpenFilePicker: (options: {
          types: Array<{
            description: string
            accept: Record<string, string[]>
          }>
        }) => Promise<FileSystemFileHandle[]>
      }
    ).showOpenFilePicker({
      types: [
        {
          description: 'Word Documents',
          accept: {
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
              ['.docx'],
          },
        },
      ],
    })
    return await fileHandle.getFile()
  } catch (error) {
    console.error('Error opening file:', error)
    return null
  }
}
