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
