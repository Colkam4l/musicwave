export interface Song {
  videoId: string;
  title: string;
  artist: string;
  album: string | null;
  duration: string | null;
  durationSeconds: number | null;
  thumbnailUrl: string | null;
}

export interface SearchState {
  query: string;
  results: Song[];
  isLoading: boolean;
  error: string | null;
  hasSearched: boolean;
}
