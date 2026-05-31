'use client';

import { useEffect, useState, useCallback } from 'react';

interface Collection {
  id: string;
  title: string;
  description: string;
  cover_image: string;
  is_active: boolean;
  sort_order: number;
  games?: { id: string; title: string }[];
}

interface Game {
  id: string;
  title: string;
}

export default function AdminCollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Collection | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState(0);
  const [selectedGameIds, setSelectedGameIds] = useState<string[]>([]);

  const fetchCollections = useCallback(async () => {
    try {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('admin_token='))
        ?.split('=')[1];

      const res = await fetch('/api/collections?all=true', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setCollections(data.collections || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchGames = useCallback(async () => {
    try {
      const res = await fetch('/api/games?limit=100');
      const data = await res.json();
      setGames(data.games || []);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchCollections();
    fetchGames();
  }, [fetchCollections, fetchGames]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCoverImage('');
    setIsActive(true);
    setSortOrder(0);
    setSelectedGameIds([]);
    setEditing(null);
    setShowForm(false);
  };

  const handleEdit = (collection: Collection) => {
    setTitle(collection.title);
    setDescription(collection.description || '');
    setCoverImage(collection.cover_image || '');
    setIsActive(collection.is_active);
    setSortOrder(collection.sort_order);
    setSelectedGameIds(collection.games?.map(g => g.id) || []);
    setEditing(collection);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = document.cookie
      .split('; ')
      .find(row => row.startsWith('admin_token='))
      ?.split('=')[1];

    const body = {
      title,
      description: description || null,
      cover_image: coverImage || null,
      is_active: isActive,
      sort_order: sortOrder,
      game_ids: selectedGameIds,
    };

    try {
      const url = editing ? `/api/collections/${editing.id}` : '/api/collections';
      const method = editing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        resetForm();
        fetchCollections();
      }
    } catch {
      // ignore
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除此合集？')) return;
    const token = document.cookie
      .split('; ')
      .find(row => row.startsWith('admin_token='))
      ?.split('=')[1];

    try {
      await fetch(`/api/collections/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchCollections();
    } catch {
      // ignore
    }
  };

  const toggleGameSelection = (gameId: string) => {
    setSelectedGameIds(prev =>
      prev.includes(gameId) ? prev.filter(id => id !== gameId) : [...prev, gameId]
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">合集管理</h1>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="rounded-xl px-4 py-2 text-sm font-medium bg-primary text-white hover:bg-primary/90 transition-colors"
        >
          + 新建合集
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-6 rounded-2xl border border-border/50 bg-card">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            {editing ? '编辑合集' : '新建合集'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">合集名称 *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full rounded-xl border border-border/50 bg-secondary/30 px-4 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">封面图URL</label>
              <input
                type="text"
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                className="w-full rounded-xl border border-border/50 bg-secondary/30 px-4 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-foreground mb-1">描述</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full rounded-xl border border-border/50 bg-secondary/30 px-4 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">排序权重</label>
              <input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value))}
                className="w-full rounded-xl border border-border/50 bg-secondary/30 px-4 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
              />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded"
              />
              <label className="text-sm text-foreground">启用</label>
            </div>
          </div>

          {/* Game selection */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-foreground mb-2">选择游戏 (点击选择/取消)</label>
            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-2 rounded-xl border border-border/50 bg-secondary/20">
              {games.map(game => (
                <button
                  key={game.id}
                  type="button"
                  onClick={() => toggleGameSelection(game.id)}
                  className={`px-3 py-1 rounded-lg text-xs transition-colors ${
                    selectedGameIds.includes(game.id)
                      ? 'bg-primary text-white'
                      : 'bg-secondary/50 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {game.title}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 mt-4">
            <button
              type="submit"
              className="rounded-xl px-6 py-2 text-sm font-medium bg-primary text-white hover:bg-primary/90 transition-colors"
            >
              {editing ? '保存修改' : '创建合集'}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="rounded-xl px-6 py-2 text-sm font-medium text-foreground border border-border hover:bg-secondary/50 transition-colors"
            >
              取消
            </button>
          </div>
        </form>
      )}

      {/* Collection list */}
      {loading ? (
        <div className="flex items-center justify-center py-10">
          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="space-y-3">
          {collections.map(collection => (
            <div
              key={collection.id}
              className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-card"
            >
              <div className="flex items-center gap-3">
                {collection.cover_image && (
                  <img src={collection.cover_image} alt="" className="w-10 h-10 rounded-lg object-cover" />
                )}
                <div>
                  <p className="font-medium text-foreground">{collection.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {collection.games?.length || 0} 款游戏 · {collection.is_active ? '已启用' : '已禁用'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleEdit(collection)}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-primary border border-primary/30 hover:bg-primary/10 transition-colors"
                >
                  编辑
                </button>
                <button
                  onClick={() => handleDelete(collection.id)}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-400 border border-red-400/30 hover:bg-red-400/10 transition-colors"
                >
                  删除
                </button>
              </div>
            </div>
          ))}
          {collections.length === 0 && (
            <p className="text-center text-muted-foreground py-10">暂无合集，点击上方按钮创建</p>
          )}
        </div>
      )}
    </div>
  );
}
