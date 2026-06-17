import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import verifyAdminRequest from '@/lib/admin-verify';
// PUT 更新心愿单状态
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authErr = await verifyAdminRequest(request);
  if (authErr) return authErr;

    const { id } = await params;
    const { status } = await request.json();

    if (!['pending', 'approved', 'completed', 'rejected'].includes(status)) {
      return NextResponse.json({ error: '无效状态' }, { status: 400 });
    }

    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('wishlist')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // 如果状态变为 approved，通知提交者
    if (status === 'approved' && data.user_id) {
      await supabase.from('notifications').insert({
        user_id: data.user_id,
        type: 'system',
        title: '你的心愿被采纳了！',
        content: `你提交的游戏「${data.title}」已被采纳，感谢你的建议！`,
        link: '/wishlist',
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('更新心愿失败:', err);
    return NextResponse.json({ error: '操作失败' }, { status: 500 });
  }
}

// DELETE 删除心愿
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authErr = await verifyAdminRequest(request);
  if (authErr) return authErr;

    const { id } = await params;
    const supabase = getSupabaseClient();
    const { error } = await supabase.from('wishlist').delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('删除心愿失败:', err);
    return NextResponse.json({ error: '操作失败' }, { status: 500 });
  }
}
