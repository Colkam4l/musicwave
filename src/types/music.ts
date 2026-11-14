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

export interface LyricLine {
  time: number;
  text: string;
}

export interface LyricsResponse {
  plainLyrics?: string | null;
  syncedLyrics?: LyricLine[] | null;
  source: string;
}

export interface HomeShelf {
  id: string;
  title: string;
  subtitle?: string | null;
  items: Song[];
}

export interface MoodCategoryItem {
  title: string;
  params: string;
}

export interface HomeShelves {
  quickPicks: HomeShelf;
  trending: HomeShelf;
  moods: MoodCategoryItem[];
}

export type RepeatMode = "off" | "all" | "one";

export interface UserPlaylist {
  id: string;
  name: string;
  description?: string | null;
  createdAt: number;
  updatedAt: number;
  tracks: Song[];
}
