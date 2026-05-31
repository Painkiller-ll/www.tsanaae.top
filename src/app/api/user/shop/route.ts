import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { getCurrentUserId } from '@/lib/user-auth';

// GET - List shop items
export async function GET() {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('point_shop_items')
      .select('*')
      .eq('is_active', 'true' as unknown as boolean)
      .order('cost', { ascending: true });

    if (error) throw new Error(`Failed to fetch shop items: ${error.message}`);

    // Get user's purchases if logged in
    const userId = await getCurrentUserId();
    let purchasedIds: string[] = [];
    if (userId) {
      const { data: purchases } = await client
        .from('point_purchases')
        .select('item_id')
        .eq('user_id', userId);
      purchasedIds = (purchases || []).map((p: { item_id: string }) => p.item_id);
    }

    const items = (data || []).map((item: { id: string; stock: number }) => ({
      ...item,
      purchased: purchasedIds.includes(item.id),
      stock: item.stock === -1 ? Infinity : item.stock,
    }));

    return NextResponse.json({ items });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST - Purchase an item
export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const { item_id } = await request.json();
    if (!item_id) {
      return NextResponse.json({ error: '商品ID必填' }, { status: 400 });
    }

    const client = getSupabaseClient();

    // Get item info
    const { data: item, error: itemError } = await client
      .from('point_shop_items')
      .select('*')
      .eq('id', item_id)
      .maybeSingle();

    if (itemError || !item) {
      return NextResponse.json({ error: '商品不存在' }, { status: 404 });
    }

    if (!item.is_active) {
      return NextResponse.json({ error: '商品已下架' }, { status: 400 });
    }

    // Check stock
    if (item.stock !== -1 && item.stock <= 0) {
      return NextResponse.json({ error: '库存不足' }, { status: 400 });
    }

    // Check if already purchased (for non-consumable items)
    const { data: existingPurchase } = await client
      .from('point_purchases')
      .select('id')
      .eq('user_id', userId)
      .eq('item_id', item_id)
      .maybeSingle();

    if (existingPurchase && item.type !== 'consumable') {
      return NextResponse.json({ error: '你已经购买过该商品' }, { status: 400 });
    }

    // Check user points
    const { data: user } = await client
      .from('users')
      .select('points')
      .eq('id', userId)
      .maybeSingle();

    if (!user || user.points < item.cost) {
      return NextResponse.json({ error: `积分不足，需要 ${item.cost} 积分` }, { status: 400 });
    }

    // Deduct points
    const newPoints = user.points - item.cost;
    await client.from('users').update({ points: newPoints }).eq('id', userId);

    // Record transaction
    await client.from('point_transactions').insert({
      user_id: userId,
      amount: -item.cost,
      balance_after: newPoints,
      reason: `商城兑换: ${item.name}`,
      reference_id: item_id,
    });

    // Create purchase record
    await client.from('point_purchases').insert({
      user_id: userId,
      item_id,
      points_cost: item.cost,
    });

    // Update stock if limited
    if (item.stock !== -1) {
      await client.from('point_shop_items').update({ stock: item.stock - 1 }).eq('id', item_id);
    }

    return NextResponse.json({
      success: true,
      points_remaining: newPoints,
      item_name: item.name,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
