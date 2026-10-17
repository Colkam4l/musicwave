import { create } from "zustand";
import { Song } from "../types/music";

interface SearchStore {
  query: string;
  results: Song[];
  isLoading: boolean;
  error: string | null;
  hasSearched: boolean;
  setQuery: (query: string) => void;
  setResults: (results: Song[]) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  clearSearch: () => void;
}

export const useSearchStore = create<SearchStore>((set) => ({
  query: "",
  results: [],
  isLoading: false,
  error: null,
  hasSearched: false,
  setQuery: (query) => set({ query }),
  setResults: (results) => set({ results, isLoading: false, error: null, hasSearched: true }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error, isLoading: false, hasSearched: true }),
  clearSearch: () => set({ query: "", results: [], error: null, hasSearched: false }),
}));
