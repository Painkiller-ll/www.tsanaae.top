'use client';

import { useEffect, useState } from 'react';
import { Game } from '@/lib/types';
import GameCard from './GameCard';

export default function GameGrid() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/games?limit=20')
      .then((res) => res.json())
      .then((data) => {
        if (data.games) setGames(data.games);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border/50 bg-card overflow-hidden">
            <div className="aspect-[16/9] bg-secondary animate-pulse" />
            <div className="p-3 space-y-2">
              <div className="h-4 w-2/3 bg-secondary rounded animate-pulse" />
              <div className="flex gap-1">
                <div className="h-4 w-12 bg-secondary rounded-full animate-pulse" />
                <div className="h-4 w-12 bg-secondary rounded-full animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">暂无游戏数据</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {games.map((game) => (
        <GameCard key={game.id} game={game} />
      ))}
    </div>
  );
}
