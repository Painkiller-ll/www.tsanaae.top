export interface GameTag {
  id: string;
  name: string;
}

export interface GameCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
}

export interface DownloadLink {
  label: string;
  url: string;
  type?: string;
}

export interface Game {
  id: string;
  title: string;
  slug?: string;
  description?: string;
  cover_image?: string;
  category_id: string;
  developer?: string;
  publisher?: string;
  release_date?: string;
  platform: string;
  video_url?: string;
  screenshots?: string[];
  min_specs?: Record<string, string>;
  rec_specs?: Record<string, string>;
  likes: number;
  is_featured: boolean;
  download_url?: string;
  download_links?: DownloadLink[];
  download_count: number;
  unlock_points?: number;
  is_unlocked?: boolean;
  created_at: string;
  updated_at?: string;
  tags?: GameTag[];
  categories?: GameCategory;
  comments?: Comment[];
  related_games?: Game[];
  is_favorited?: boolean;
  avg_rating?: number;
  rating_count?: number;
  user_rating?: number;
}

export interface UserFavorite {
  id: string;
  user_id: string;
  game_id: string;
  created_at: string;
  game?: Game;
}

export interface GameRating {
  id: string;
  user_id: string;
  game_id: string;
  rating: number; // 1-5
  created_at: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'success' | 'error';
  is_active: boolean;
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at?: string;
}

export interface Comment {
  id: string;
  game_id: string;
  nickname: string;
  avatar?: string;
  content: string;
  created_at: string;
}

export interface PointShopItem {
  id: string;
  name: string;
  description?: string;
  type: 'virtual' | 'unlock' | 'avatar_frame' | 'title';
  cost: number;
  image_url?: string;
  stock: number;
  is_active: boolean;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface UserLevel {
  level: number;
  name: string;
  min_points: number;
  minPoints: number;
  color: string;
  bgColor: string;
  textColor: string;
  icon: string;
  nextLevelPoints: number;
}

// Level definitions
export const USER_LEVELS: UserLevel[] = [
  { level: 1, name: '新手玩家', min_points: 0, minPoints: 0, color: '#9ca3af', bgColor: 'bg-gray-500/10', textColor: 'text-gray-400', icon: '🌱', nextLevelPoints: 50 },
  { level: 2, name: '见习冒险家', min_points: 50, minPoints: 50, color: '#60a5fa', bgColor: 'bg-blue-500/10', textColor: 'text-blue-400', icon: '⚔️', nextLevelPoints: 200 },
  { level: 3, name: '资深探索者', min_points: 200, minPoints: 200, color: '#34d399', bgColor: 'bg-green-500/10', textColor: 'text-green-400', icon: '🛡️', nextLevelPoints: 500 },
  { level: 4, name: '精英猎手', min_points: 500, minPoints: 500, color: '#f59e0b', bgColor: 'bg-yellow-500/10', textColor: 'text-yellow-400', icon: '👑', nextLevelPoints: 1000 },
  { level: 5, name: '传奇大师', min_points: 1000, minPoints: 1000, color: '#ef4444', bgColor: 'bg-red-500/10', textColor: 'text-red-400', icon: '🏆', nextLevelPoints: 3000 },
  { level: 6, name: '至高王者', min_points: 3000, minPoints: 3000, color: '#a855f7', bgColor: 'bg-purple-500/10', textColor: 'text-purple-400', icon: '💎', nextLevelPoints: 9999 },
];

export function getUserLevel(points: number): UserLevel {
  let result = USER_LEVELS[0];
  for (const lvl of USER_LEVELS) {
    if (points >= lvl.min_points) result = lvl;
  }
  return result;
}

export interface Collection {
  id: string;
  title: string;
  description?: string;
  cover_image?: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at?: string;
  games?: Game[];
}

export interface ShareRecord {
  id: string;
  user_id: string;
  game_id: string;
  platform: string;
  created_at: string;
}

export interface PointTask {
  id: string;
  name: string;
  description: string;
  points: number;
  type: 'comment' | 'rate' | 'share' | 'favorite' | 'daily_limit';
  max_per_day: number;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'comment_reply' | 'rating' | 'system' | 'invite' | 'unlock' | 'purchase';
  title: string;
  content: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export interface WishlistItem {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  vote_count: number;
  status: 'pending' | 'approved' | 'completed' | 'rejected';
  created_at: string;
  updated_at: string | null;
  has_voted?: boolean;
}

export interface MusicTrack {
  id: string;
  title: string;
  artist: string | null;
  cover_image: string | null;
  file_key: string;
  file_url?: string; // 动态生成的签名URL
  duration: number;
  sort_order: number;
  is_active: boolean;
  play_count: number;
  created_at: string;
  updated_at: string | null;
}
