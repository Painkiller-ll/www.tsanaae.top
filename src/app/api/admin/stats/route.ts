import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function GET(request: Request) {
  try {
    const { verifyToken } = await import('@/lib/admin-auth');
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseClient();

    const [resourcesRes, categoriesRes, commentsRes, usersRes, recentRes] = await Promise.all([
      supabase.from('resources').select('resource_type', { count: 'exact' }),
      supabase.from('resource_categories').select('*', { count: 'exact', head: true }),
      supabase.from('comments').select('*', { count: 'exact', head: true }),
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('resources').select('id, title, resource_type, created_at').order('created_at', { ascending: false }).limit(10),
    ]);

    // 按类型统计
    const resourcesByType: Record<string, number> = {};
    (resourcesRes.data || []).forEach((r: { resource_type: string }) => {
      resourcesByType[r.resource_type] = (resourcesByType[r.resource_type] || 0) + 1;
    });

    return NextResponse.json({
      totalResources: resourcesRes.count || 0,
      totalCategories: categoriesRes.count || 0,
      totalComments: commentsRes.count || 0,
      totalUsers: usersRes.count || 0,
      resourcesByType,
      recentResources: recentRes.data || [],
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch stats';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
