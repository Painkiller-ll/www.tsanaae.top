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
  created_at: string;
  updated_at?: string;
  tags?: GameTag[];
  categories?: GameCategory;
  comments?: Comment[];
  related_games?: Game[];
}

export interface Comment {
  id: string;
  game_id: string;
  nickname: string;
  avatar?: string;
  content: string;
  created_at: string;
}
