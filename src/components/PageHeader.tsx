'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Home, ChevronRight } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: string;
  breadcrumbs?: BreadcrumbItem[];
  showBack?: boolean;
}

export default function PageHeader({ title, description, icon, breadcrumbs = [], showBack = true }: PageHeaderProps) {
  const router = useRouter();

  return (
    <div className="mb-6">
      {/* 面包屑 */}
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-3 flex-wrap">
        <Link href="/" className="hover:text-purple-400 transition-colors flex items-center gap-1">
          <Home className="w-3.5 h-3.5" />
          <span>首页</span>
        </Link>
        {breadcrumbs.map((item, index) => (
          <span key={index} className="flex items-center gap-1.5">
            <ChevronRight className="w-3 h-3 text-muted-foreground/50" />
            {item.href ? (
              <Link href={item.href} className="hover:text-purple-400 transition-colors">
                {item.label}
              </Link>
            ) : (
              <span className="text-foreground font-medium">{item.label}</span>
            )}
          </span>
        ))}
      </div>

      {/* 标题 + 返回按钮 */}
      <div className="flex items-center gap-3">
        {showBack && (
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-card border border-border text-sm text-muted-foreground hover:text-foreground hover:border-purple-500/50 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>返回</span>
          </button>
        )}
        {icon && <span className="text-2xl">{icon}</span>}
        <div>
          <h1 className="text-xl font-bold text-foreground">{title}</h1>
          {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
        </div>
      </div>
    </div>
  );
}
