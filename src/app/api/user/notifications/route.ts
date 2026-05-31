import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyUserToken } from '@/lib/user-auth';

// GET 获取用户通知列表
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('user_token')?.value;
    if (!token) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }
    const userId = await verifyUserToken(token);
    if (!userId) {
      return NextResponse.json({ error: '无效的用户凭证' }, { status: 401 });
    }

    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unread') === 'true';
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (unreadOnly) {
      query = query.eq('is_read', false);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    // 获取未读总数
    const { count: unreadCount } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    return NextResponse.json({
      notifications: data || [],
      total: count || 0,
      unread_count: unreadCount || 0,
    });
  } catch (err) {
    console.error('获取通知失败:', err);
    return NextResponse.json({ error: '获取通知失败' }, { status: 500 });
  }
}

// PUT 标记通知为已读
export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get('user_token')?.value;
    if (!token) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }
    const userId = await verifyUserToken(token);
    if (!userId) {
      return NextResponse.json({ error: '无效的用户凭证' }, { status: 401 });
    }

    const body = await request.json();
    const { notification_id, mark_all } = body;

    const supabase = getSupabaseClient();

    if (mark_all) {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);
      if (error) throw error;
      return NextResponse.json({ success: true, message: '全部已读' });
    }

    if (notification_id) {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notification_id)
        .eq('user_id', userId);
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: '缺少参数' }, { status: 400 });
  } catch (err) {
    console.error('标记已读失败:', err);
    return NextResponse.json({ error: '操作失败' }, { status: 500 });
  }
}
