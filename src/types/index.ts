export interface KidProfileData {
  id: string;
  parentId: string;
  name: string;
  avatarUrl: string;
  dailyLimitMinutes: number;
  allowedStartHour: number;
  allowedEndHour: number;
  passcode?: string | null;
  isLocked: boolean;
  usedMinutesToday: number;
}

export interface ApprovedVideoData {
  id: string;
  parentId: string;
  youtubeVideoId: string;
  title: string;
  thumbnailUrl: string | null;
  authorName: string | null;
  duration?: number | null;
  category: string;
  description?: string | null;
  createdAt: string | Date;
}

export interface WatchLogData {
  id: string;
  kidProfileId: string;
  youtubeVideoId: string;
  videoTitle: string;
  startedAt: string | Date;
  durationSeconds: number;
  completed: boolean;
}
