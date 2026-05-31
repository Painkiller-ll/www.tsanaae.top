'use client';

import Link from 'next/link';
import { Game } from '@/lib/types';

interface GameCardProps {
  game: Game;
}

export default function GameCard({ game }: GameCardProps) {
  return (
    <Link href={`/game/${game.id}`} className="game-card block group">
      <div className="overflow-hidden rounded-xl border border-border/50 bg-card">
        {/* Cover Image */}
        <div className="relative aspect-[16/9] overflow-hidden">
          {game.cover_image ? (
            <img
              src={game.cover_image}
              alt={game.title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-secondary">
              <svg className="h-12 w-12 text-muted-foreground/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            </div>
          )}
          {/* Platform badge */}
          <div className="absolute top-2 right-2">
            <span className="rounded-md bg-black/60 px-2 py-0.5 text-xs text-white/80 backdrop-blur-sm">
              {game.platform === 'pc' ? 'PC' : game.platform === 'mobile' ? '手机' : '网页'}
            </span>
          </div>
        </div>

        {/* Info */}
        <div className="p-3">
          <h3 className="truncate text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
            {game.title}
          </h3>
          <div className="mt-2 flex items-center justify-between">
            <div className="flex flex-wrap gap-1">
              {game.tags?.slice(0, 3).map((tag) => (
                <span
                  key={tag.id}
                  className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] text-primary/80 border border-primary/10"
                >
                  {tag.name}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
              <span className="text-xs">{game.likes}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
