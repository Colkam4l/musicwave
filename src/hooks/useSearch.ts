import { useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useSearchStore } from "../store/searchStore";
import { Song } from "../types/music";

export const useSearch = () => {
  const {
    query,
    results,
    isLoading,
    error,
    hasSearched,
    setQuery,
    setResults,
    setLoading,
    setError,
    clearSearch,
  } = useSearchStore();

  const search = useCallback(
    async (searchQuery?: string) => {
      const q = (searchQuery ?? query).trim();
      if (!q) return;

      setLoading(true);
      setError(null);

      try {
        const data = await invoke<Song[]>("search_songs", { query: q });
        setResults(data);
      } catch (err) {
        const errorMsg =
          typeof err === "string"
            ? err
            : err instanceof Error
            ? err.message
            : "Failed to search songs. Please check your connection and try again.";
        setError(errorMsg);
      }
    },
    [query, setLoading, setError, setResults]
  );

  return {
    query,
    results,
    isLoading,
    error,
    hasSearched,
    setQuery,
    search,
    clearSearch,
  };
};
