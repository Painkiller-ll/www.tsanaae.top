import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = request.headers.get('x-session');
    if (!session) return NextResponse.json({ error: '请先登录' }, { status: 401 });

    const { score } = await request.json();
    if (!score || score < 1 || score > 5) return NextResponse.json({ error: '评分需1-5分' }, { status: 400 });

    const supabase = getSupabaseClient();

    // Upsert 评分
    const { error } = await supabase
      .from('ratings')
      .upsert({ resource_id: parseInt(id), user_id: session, score }, { onConflict: 'resource_id,user_id' });
    if (error) throw error;

    // 重新计算平均分
    const { data: ratings } = await supabase
      .from('ratings')
      .select('score')
      .eq('resource_id', id);
    
    if (ratings && ratings.length > 0) {
      const avg = ratings.reduce((sum: number, r: any) => sum + r.score, 0) / ratings.length;
      await supabase
        .from('resources')
        .update({ avg_rating: Math.round(avg * 100) / 100, rating_count: ratings.length })
        .eq('id', id);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
