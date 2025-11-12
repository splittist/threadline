import { create } from 'zustand'

export interface DocumentFile {
  id: string
  file: File
  name: string
  size: number
}

interface AppState {
  documents: DocumentFile[]
  addDocument: (doc: DocumentFile) => void
  addDocuments: (docs: DocumentFile[]) => void
  removeDocument: (id: string) => void
}

export const useStore = create<AppState>((set) => ({
  documents: [],
  addDocument: (doc) =>
    set((state) => ({ documents: [...state.documents, doc] })),
  addDocuments: (docs) =>
    set((state) => ({ documents: [...state.documents, ...docs] })),
  removeDocument: (id) =>
    set((state) => ({
      documents: state.documents.filter((d) => d.id !== id),
    })),
}))
