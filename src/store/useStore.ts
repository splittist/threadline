import { create } from 'zustand'

interface AppState {
  documents: string[]
  addDocument: (doc: string) => void
  removeDocument: (doc: string) => void
}

export const useStore = create<AppState>((set) => ({
  documents: [],
  addDocument: (doc) =>
    set((state) => ({ documents: [...state.documents, doc] })),
  removeDocument: (doc) =>
    set((state) => ({
      documents: state.documents.filter((d) => d !== doc),
    })),
}))
