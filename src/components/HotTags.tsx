'use client';

import { useEffect, useState } from 'react';
import { GameTag } from '@/lib/types';
import Link from 'next/link';

export default function HotTags() {
  const [tags, setTags] = useState<GameTag[]>([]);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    fetch('/api/tags')
      .then((res) => res.json())
      .then((data) => {
        if (data.tags) setTags(data.tags);
      })
      .catch(() => {});
  }, []);

  const displayTags = showAll ? tags : tags.slice(0, 20);

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {displayTags.map((tag) => (
          <Link
            key={tag.id}
            href={`/search?tag=${encodeURIComponent(tag.name)}`}
            className="tag-pill"
          >
            {tag.name}
          </Link>
        ))}
      </div>
      {tags.length > 20 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="mt-3 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {showAll ? '收起标签 ▲' : '展开更多标签 ▼'}
        </button>
      )}
    </div>
  );
}
