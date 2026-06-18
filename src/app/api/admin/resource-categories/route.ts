import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import verifyAdminRequest from '@/lib/admin-verify';

export async function GET() {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('resource_categories')
      .select('*')
      .order('sort_order');

    if (error) throw error;
    return NextResponse.json({ categories: data || [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authErr = await verifyAdminRequest(request);
    if (authErr) return authErr;

    const supabase = getSupabaseClient();
    const body = await request.json();

    // 自动生成 slug（如果未提供）
    let slug = body.slug;
    if (!slug) {
      const name = body.name || '';
      if (/^[a-zA-Z0-9-]+$/.test(name)) {
        slug = name.toLowerCase().replace(/\s+/g, '-');
      } else {
        slug = `cat-${Date.now().toString(36)}`;
      }
    }

    // 自动设置 resource_type（如果未提供）
    let resource_type = body.resource_type;
    if (!resource_type) {
      if (body.parent_id) {
        // 子分类：继承父分类的 resource_type
        const { data: parent } = await supabase
          .from('resource_categories')
          .select('resource_type, slug')
          .eq('id', body.parent_id)
          .single();
        resource_type = parent?.resource_type || parent?.slug || slug;
      } else {
        // 顶级分类：resource_type = slug
        resource_type = slug;
      }
    }

    const { data, error } = await supabase
      .from('resource_categories')
      .insert({
        name: body.name,
        slug,
        resource_type,
        parent_id: body.parent_id || null,
        icon: body.icon || null,
        sort_order: body.sort_order || 0,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ category: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
