// 资源类型枚举
export type ResourceType = 'study' | 'movie' | 'music' | 'game' | 'novel' | 'software';

// 资源类型配置
export const RESOURCE_TYPES: Record<ResourceType, { label: string; icon: string; color: string; gradient: string }> = {
  study: { label: '学习资料', icon: '📚', color: '#3b82f6', gradient: 'from-blue-500 to-blue-700' },
  movie: { label: '影视剧', icon: '🎬', color: '#ef4444', gradient: 'from-red-500 to-red-700' },
  music: { label: '音乐', icon: '🎵', color: '#ec4899', gradient: 'from-pink-500 to-pink-700' },
  game: { label: '游戏', icon: '🎮', color: '#8b5cf6', gradient: 'from-purple-500 to-purple-700' },
  novel: { label: '小说', icon: '📖', color: '#10b981', gradient: 'from-emerald-500 to-emerald-700' },
  software: { label: '实用软件', icon: '💻', color: '#f59e0b', gradient: 'from-amber-500 to-amber-700' },
};

// 资源分类
export interface ResourceCategory {
  id: number;
  name: string;
  slug: string;
  resource_type: ResourceType;
  parent_id: number | null;
  icon: string | null;
  sort_order: number;
  children?: ResourceCategory[];
}

// 资源
export interface Resource {
  id: number;
  title: string;
  description: string | null;
  cover_url: string | null;
  resource_type: ResourceType;
  category_id: number | null;
  author: string | null;
  tags: string[] | Array<{ id: number; name: string }>;
  avg_rating: number;
  rating_count: number;
  view_count: number;
  like_count: number;
  unlock_points: number;
  is_featured: boolean;
  is_published: boolean;
  extra_data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  // 关联数据
  category?: ResourceCategory;
  download_links?: DownloadLink[];
  user_rating?: number;
  is_favorited?: boolean;
  is_unlocked?: boolean;
}

// 下载链接
export interface DownloadLink {
  id: number;
  resource_id: number;
  title: string;
  url: string;
  platform: string | null;
  is_free: boolean;
  sort_order: number;
}

// 标签
export interface ResourceTag {
  id: number;
  name: string;
  slug: string;
  resource_type: ResourceType | null;
  usage_count: number;
}

// 评论
export interface Comment {
  id: number;
  resource_id: number;
  user_id: string;
  username: string;
  nickname: string;
  avatar_url: string | null;
  content: string;
  parent_id: number | null;
  likes: number;
  created_at: string;
  replies?: Comment[];
}

// 评分
export interface Rating {
  id: number;
  resource_id: number;
  user_id: string;
  score: number;
  created_at: string;
}

// 用户
export interface User {
  id: string;
  username: string | null;
  avatar_url: string | null;
  email: string | null;
  phone: string | null;
  points: number;
  level: number;
  invite_code: string | null;
  invited_by: string | null;
  checkin_days: number;
  last_checkin_at: string | null;
  created_at: string;
  updated_at: string;
}

// 用户等级
export interface UserLevel {
  level: number;
  name: string;
  min_points: number;
  minPoints: number;
  color: string;
  icon: string;
  bgColor: string;
  textColor: string;
  next_level_points: number;
  nextLevelPoints: number;
}

export const USER_LEVELS: UserLevel[] = [
  { level: 1, name: '新手', min_points: 0, minPoints: 0, color: '#9ca3af', icon: '🌱', bgColor: 'bg-gray-500/20', textColor: 'text-gray-400', next_level_points: 50, nextLevelPoints: 50 },
  { level: 2, name: '探索者', min_points: 50, minPoints: 50, color: '#3b82f6', icon: '🔍', bgColor: 'bg-blue-500/20', textColor: 'text-blue-400', next_level_points: 200, nextLevelPoints: 200 },
  { level: 3, name: '收藏家', min_points: 200, minPoints: 200, color: '#8b5cf6', icon: '💎', bgColor: 'bg-purple-500/20', textColor: 'text-purple-400', next_level_points: 500, nextLevelPoints: 500 },
  { level: 4, name: '鉴赏家', min_points: 500, minPoints: 500, color: '#ec4899', icon: '👑', bgColor: 'bg-pink-500/20', textColor: 'text-pink-400', next_level_points: 1000, nextLevelPoints: 1000 },
  { level: 5, name: '大师', min_points: 1000, minPoints: 1000, color: '#f59e0b', icon: '🏆', bgColor: 'bg-amber-500/20', textColor: 'text-amber-400', next_level_points: 3000, nextLevelPoints: 3000 },
  { level: 6, name: '传奇', min_points: 3000, minPoints: 3000, color: '#ef4444', icon: '⭐', bgColor: 'bg-red-500/20', textColor: 'text-red-400', next_level_points: Infinity, nextLevelPoints: Infinity },
];

export function getUserLevel(points: number): UserLevel {
  for (let i = USER_LEVELS.length - 1; i >= 0; i--) {
    if (points >= USER_LEVELS[i].min_points) return USER_LEVELS[i];
  }
  return USER_LEVELS[0];
}

// 收藏
export interface UserFavorite {
  id: number;
  user_id: string;
  resource_id: number;
  created_at: string;
  resource?: Resource;
}

// 心愿单
export interface WishlistItem {
  id: number;
  user_id: string;
  title: string;
  description: string | null;
  resource_type: ResourceType | null;
  status: string;
  votes: number;
  created_at: string;
}

// 通知
export interface Notification {
  id: number;
  user_id: string;
  title: string;
  content: string | null;
  type: string;
  is_read: boolean;
  created_at: string;
}

// 积分商品
export interface PointShopItem {
  id: number;
  name: string;
  description: string | null;
  image_url: string | null;
  points_cost: number;
  stock: number;
  category: string;
  is_active: boolean;
}

// 公告
export interface Announcement {
  id: number;
  title: string;
  content: string;
  type: string;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
}

// FAQ
export interface FAQ {
  id: number;
  question: string;
  answer: string;
  category: string;
  sort_order: number;
  is_active: boolean;
}

// 音乐曲目
export interface MusicTrack {
  id: number;
  title: string;
  artist: string | null;
  cover_image: string | null;
  file_url: string;
  duration: number | null;
  is_active: boolean;
  sort_order: number;
}

// 站点设置
export interface SiteSettings {
  id: number;
  site_name: string;
  site_description: string | null;
  footer_text: string | null;
  contact_qq: string | null;
  contact_wechat: string | null;
  contact_email: string | null;
  contact_telegram: string | null;
  contact_github: string | null;
  wechat_qr_code: string | null;
  share_template: string | null;
  footer_links: Array<{ label: string; url: string }>;
}

// ===== 向下兼容旧类型（供旧管理页面使用） =====
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Game = Record<string, any> & {
  id: number;
  title: string;
  description: string | null;
  cover_url: string | null;
  cover_image: string | null;
  category_id: number;
  category_slug: string;
  tags: string[] | Array<{ id: number; name: string }>;
  avg_rating: number;
  rating_count: number;
  view_count: number;
  like_count: number;
  likes: number;
  unlock_points: number;
  is_featured: boolean;
  download_links: DownloadLink[];
  created_at: string;
  updated_at: string;
};

export interface Category {
  id: number;
  name: string;
  slug: string;
  icon: string | null;
  sort_order: number;
}

export interface Tag {
  id: number;
  name: string;
  slug: string;
  usage_count: number;
}

// Alias for backward compatibility
export type GameTag = Tag;

export interface Collection {
  id: number;
  title: string;
  description: string | null;
  cover_url: string | null;
  cover_image: string | null;
  is_featured: boolean;
  games: Game[];
  created_at: string;
}
