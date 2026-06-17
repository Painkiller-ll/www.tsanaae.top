'use client';

import Link from 'next/link';
import { Resource } from '@/lib/types';

const TYPE_COLORS: Record<string, string> = {
  study: 'bg-blue-500/20 text-blue-400',
  movie: 'bg-red-500/20 text-red-400',
  music: 'bg-pink-500/20 text-pink-400',
  game: 'bg-purple-500/20 text-purple-400',
  novel: 'bg-emerald-500/20 text-emerald-400',
  software: 'bg-amber-500/20 text-amber-400',
};

const TYPE_LABELS: Record<string, string> = {
  study: '学习', movie: '影视', music: '音乐',
  game: '游戏', novel: '小说', software: '软件',
};

export default function ResourceCard({ resource }: { resource: Resource }) {
  const colorClass = TYPE_COLORS[resource.resource_type] || 'bg-gray-500/20 text-gray-400';
  const typeLabel = TYPE_LABELS[resource.resource_type] || resource.resource_type;

  return (
    <Link href={`/resource/${resource.id}`} className="group block">
      <div className="rounded-xl overflow-hidden bg-card border border-border transition-all hover:-translate-y-1 hover:shadow-lg hover:border-primary/30 active:scale-[0.98]">
        {/* 封面图 */}
        <div className="relative aspect-[3/4] bg-muted overflow-hidden">
          {resource.cover_url ? (
            <img
              src={resource.cover_url}
              alt={resource.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
              <span className="text-3xl sm:text-4xl opacity-30">
                {resource.resource_type === 'study' ? '📚' :
                 resource.resource_type === 'movie' ? '🎬' :
                 resource.resource_type === 'music' ? '🎵' :
                 resource.resource_type === 'game' ? '🎮' :
                 resource.resource_type === 'novel' ? '📖' :
                 resource.resource_type === 'software' ? '💻' : '📁'}
              </span>
            </div>
          )}
          {/* 类型标签 */}
          <span className={`absolute top-1.5 sm:top-2 left-1.5 sm:left-2 px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium ${colorClass} backdrop-blur-sm`}>
            {typeLabel}
          </span>
          {/* 积分标记 */}
          {resource.unlock_points > 0 && (
            <span className="absolute top-1.5 sm:top-2 right-1.5 sm:right-2 px-1.5 py-0.5 rounded-full text-[10px] sm:text-xs font-medium bg-amber-500/20 text-amber-400 backdrop-blur-sm">
              {resource.unlock_points}分
            </span>
          )}
        </div>
        {/* 信息 */}
        <div className="p-2 sm:p-3">
          <h3 className="font-medium text-xs sm:text-sm text-foreground line-clamp-2 leading-tight min-h-[2rem] sm:min-h-[2.5rem]">
            {resource.title}
          </h3>
          <div className="flex items-center gap-1 sm:gap-2 mt-1 sm:mt-1.5 text-[10px] sm:text-xs text-muted-foreground">
            {resource.author && <span className="truncate max-w-[60%]">{resource.author}</span>}
            {(resource.avg_rating ?? 0) > 0 && (
              <span className="flex items-center gap-0.5 shrink-0">
                <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-400 fill-amber-400" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                {resource.avg_rating}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
