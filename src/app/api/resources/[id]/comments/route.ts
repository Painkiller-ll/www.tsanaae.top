import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('resource_id', id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return NextResponse.json({ data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = request.headers.get('x-session');
    if (!session) return NextResponse.json({ error: '请先登录' }, { status: 401 });

    const { content, parent_id } = await request.json();
    if (!content?.trim()) return NextResponse.json({ error: '评论内容不能为空' }, { status: 400 });

    const supabase = getSupabaseClient();

    // 获取用户信息
    const { data: user } = await supabase.from('users').select('username, avatar_url').eq('id', session).single();

    const { data, error } = await supabase
      .from('comments')
      .insert({
        resource_id: parseInt(id),
        user_id: session,
        username: user?.username || '匿名用户',
        avatar_url: user?.avatar_url,
        content: content.trim(),
        parent_id: parent_id || null,
      })
      .select()
      .single();

    if (error) throw error;

    // 评论+2积分
    try { await supabase.rpc('add_points', { user_id: session, amount: 2 }); } catch {}
    
    // 重新计算积分
    const { data: pts } = await supabase.from('users').select('points').eq('id', session).single();
    if (pts) {
      await supabase.from('users').update({ points: pts.points + 2 }).eq('id', session);
    }

    return NextResponse.json({ data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
