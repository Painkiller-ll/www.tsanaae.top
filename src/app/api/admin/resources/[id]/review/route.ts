import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import verifyAdminRequest from '@/lib/admin-verify';

// PATCH /api/admin/resources/[id]/review - 审核投稿资源
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authErr = await verifyAdminRequest(request);
    if (authErr) return authErr;

    const { id } = await params;
    const body = await request.json();
    const { action } = body; // 'approve' | 'reject'

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: '无效操作，只支持 approve 或 reject' }, { status: 400 });
    }

    const supabase = getSupabaseClient();

    if (action === 'approve') {
      const { error } = await supabase
        .from('resources')
        .update({
          status: 'approved',
          is_published: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);
      if (error) throw error;
      return NextResponse.json({ success: true, message: '已审核通过并发布' });
    }

    if (action === 'reject') {
      const { error } = await supabase
        .from('resources')
        .update({
          status: 'rejected',
          is_published: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);
      if (error) throw error;
      return NextResponse.json({ success: true, message: '已拒绝' });
    }

    return NextResponse.json({ error: '未知操作' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || '审核失败' }, { status: 500 });
  }
}
