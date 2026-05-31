import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
const supabase = getSupabaseClient();
import { getCurrentUserId } from '@/lib/user-auth';

// Get user profile
export async function GET() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, role, points, created_at')
      .eq('id', userId)
      .single();

    if (error || !user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('nickname, avatar_url, bio')
      .eq('user_id', userId)
      .single();

    return NextResponse.json({
      user: {
        ...user,
        profile: profile || { nickname: '玩家', avatar_url: '', bio: '' },
      },
    });
  } catch {
    return NextResponse.json({ error: '获取资料失败' }, { status: 500 });
  }
}

// Update user profile
export async function PUT(request: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const { nickname, bio, avatar_url } = await request.json();

    const { error } = await supabase
      .from('user_profiles')
      .update({
        ...(nickname && { nickname }),
        ...(bio !== undefined && { bio }),
        ...(avatar_url !== undefined && { avatar_url }),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (error) {
      return NextResponse.json({ error: '更新资料失败' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: '更新资料失败' }, { status: 500 });
  }
}
