export type AuthType = "cookie" | "oauth";

export interface LinkedYtAccount {
  accountName: string;
  channelHandle?: string | null;
  avatarUrl?: string | null;
  authType: AuthType;
  syncedAt?: number | null;
}

export interface UserProfile {
  id: string;
  displayName: string;
  avatarUrl?: string | null;
  createdAt: number;
  linkedAccount?: LinkedYtAccount | null;
}

export interface SyncStatus {
  isLinked: boolean;
  isSyncing: boolean;
  lastSynced?: number | null;
  totalSyncedTracks: number;
  totalSyncedPlaylists: number;
  error?: string | null;
}

export interface SyncSummary {
  likedSongsSynced: number;
  playlistsSynced: number;
  timestamp: number;
}
