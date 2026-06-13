'use client';

import Link from 'next/link';
import { RESOURCE_TYPES, type Resource, type ResourceType } from '@/lib/types';

interface ResourceCardProps {
  resource: Resource;
}

export default function ResourceCard({ resource }: ResourceCardProps) {
  const typeConfig = RESOURCE_TYPES[resource.resource_type];
  const isNew = (Date.now() - new Date(resource.updated_at).getTime()) < 7 * 24 * 60 * 60 * 1000;

  return (
    <Link href={`/resource/${resource.id}`} className="group block">
      <div className="rounded-xl bg-card border border-border overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/30">
        {/* 封面图 */}
        <div className="relative aspect-[3/4] bg-black/20 overflow-hidden">
          {resource.cover_url ? (
            <img
              src={resource.cover_url}
              alt={resource.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-4xl">{typeConfig.icon}</span>
            </div>
          )}

          {/* 类型标签 */}
          <div className="absolute top-2 left-2">
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium text-white backdrop-blur-sm"
              style={{ backgroundColor: `${typeConfig.color}cc` }}
            >
              <span>{typeConfig.icon}</span>
              {typeConfig.label}
            </span>
          </div>

          {/* NEW 标签 */}
          {isNew && (
            <div className="absolute top-2 right-2">
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-500 text-white">NEW</span>
            </div>
          )}

          {/* 积分标签 */}
          {resource.unlock_points > 0 && (
            <div className="absolute bottom-2 right-2">
              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-yellow-500/90 text-black">
                {resource.unlock_points}积分
              </span>
            </div>
          )}
        </div>

        {/* 信息区 */}
        <div className="p-3">
          <h3 className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
            {resource.title}
          </h3>
          {(resource.author || resource.extra_data) && (
            <p className="text-xs text-muted-foreground mt-1 truncate">
              {resource.author || (resource.extra_data as Record<string, string>)?.artist || (resource.extra_data as Record<string, string>)?.developer || (resource.extra_data as Record<string, string>)?.director || ''}
            </p>
          )}
          <div className="flex items-center gap-2 mt-2">
            {resource.avg_rating > 0 && (
              <div className="flex items-center gap-0.5">
                <svg className="h-3 w-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                <span className="text-[10px] text-muted-foreground">{resource.avg_rating.toFixed(1)}</span>
              </div>
            )}
            {resource.view_count > 0 && (
              <span className="text-[10px] text-muted-foreground">{resource.view_count}浏览</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
