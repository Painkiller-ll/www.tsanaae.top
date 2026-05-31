import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
const supabase = getSupabaseClient();
import { getCurrentUserId } from '@/lib/user-auth';

// Check-in points: base 10, consecutive days bonus
function calculatePoints(consecutiveDays: number): number {
  if (consecutiveDays >= 7) return 30;
  if (consecutiveDays >= 3) return 20;
  return 10;
}

export async function POST() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const today = new Date().toISOString().split('T')[0];

    // Check if already checked in today
    const { data: existing } = await supabase
      .from('check_in_records')
      .select('id')
      .eq('user_id', userId)
      .eq('check_in_date', today)
      .single();

    if (existing) {
      return NextResponse.json({ error: '今天已签到' }, { status: 400 });
    }

    // Calculate consecutive days
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const { data: yesterdayCheck } = await supabase
      .from('check_in_records')
      .select('id')
      .eq('user_id', userId)
      .eq('check_in_date', yesterday)
      .single();

    // Get current consecutive days from recent records
    let consecutiveDays = 1;
    if (yesterdayCheck) {
      // Count consecutive days
      const { data: recentChecks } = await supabase
        .from('check_in_records')
        .select('check_in_date')
        .eq('user_id', userId)
        .order('check_in_date', { ascending: false })
        .limit(30);

      if (recentChecks && recentChecks.length > 0) {
        let streak = 1;
        for (let i = 0; i < recentChecks.length - 1; i++) {
          const curr = new Date(recentChecks[i].check_in_date);
          const prev = new Date(recentChecks[i + 1].check_in_date);
          const diff = (curr.getTime() - prev.getTime()) / 86400000;
          if (Math.abs(diff - 1) < 0.1) {
            streak++;
          } else {
            break;
          }
        }
        consecutiveDays = streak + 1; // +1 for today
      }
    }

    const pointsEarned = calculatePoints(consecutiveDays);

    // Create check-in record
    const { error: checkInError } = await supabase
      .from('check_in_records')
      .insert({
        user_id: userId,
        check_in_date: today,
        points_earned: pointsEarned,
      });

    if (checkInError) {
      return NextResponse.json({ error: '签到失败' }, { status: 500 });
    }

    // Update user points
    const { data: user } = await supabase
      .from('users')
      .select('points')
      .eq('id', userId)
      .single();

    const newPoints = (user?.points || 0) + pointsEarned;

    await supabase
      .from('users')
      .update({ points: newPoints })
      .eq('id', userId);

    // Record transaction
    await supabase
      .from('point_transactions')
      .insert({
        user_id: userId,
        amount: pointsEarned,
        balance_after: newPoints,
        reason: `每日签到(连续${consecutiveDays}天)`,
      });

    return NextResponse.json({
      success: true,
      points_earned: pointsEarned,
      consecutive_days: consecutiveDays,
      total_points: newPoints,
    });
  } catch {
    return NextResponse.json({ error: '签到失败，请重试' }, { status: 500 });
  }
}

// Get check-in status
export async function GET() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const today = new Date().toISOString().split('T')[0];

    // Check today
    const { data: todayCheck } = await supabase
      .from('check_in_records')
      .select('id, points_earned')
      .eq('user_id', userId)
      .eq('check_in_date', today)
      .single();

    // Get recent check-ins
    const { data: recentChecks } = await supabase
      .from('check_in_records')
      .select('check_in_date, points_earned')
      .eq('user_id', userId)
      .order('check_in_date', { ascending: false })
      .limit(30);

    // Calculate consecutive days
    let consecutiveDays = 0;
    if (recentChecks && recentChecks.length > 0) {
      let streak = 1;
      for (let i = 0; i < recentChecks.length - 1; i++) {
        const curr = new Date(recentChecks[i].check_in_date);
        const prev = new Date(recentChecks[i + 1].check_in_date);
        const diff = (curr.getTime() - prev.getTime()) / 86400000;
        if (Math.abs(diff - 1) < 0.1) {
          streak++;
        } else {
          break;
        }
      }
      consecutiveDays = streak;
    }

    return NextResponse.json({
      checked_in_today: !!todayCheck,
      today_points: todayCheck?.points_earned || 0,
      consecutive_days: consecutiveDays,
      recent_checks: recentChecks || [],
    });
  } catch {
    return NextResponse.json({ error: '获取签到状态失败' }, { status: 500 });
  }
}
