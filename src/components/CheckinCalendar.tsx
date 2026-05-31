'use client';

import { useState, useEffect } from 'react';

interface CheckinCalendarProps {
  onClose?: () => void;
}

export default function CheckinCalendar({ onClose }: CheckinCalendarProps) {
  const [checkedDays, setCheckedDays] = useState<number[]>([]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCalendar();
  }, [year, month]);

  async function fetchCalendar() {
    setLoading(true);
    try {
      const res = await fetch(`/api/user/checkin/calendar?year=${year}&month=${month}`);
      if (res.ok) {
        const data = await res.json();
        setCheckedDays(data.checked_days || []);
      }
    } catch {
      // 静默
    } finally {
      setLoading(false);
    }
  }

  function getDaysInMonth(y: number, m: number) {
    return new Date(y, m, 0).getDate();
  }

  function getFirstDayOfMonth(y: number, m: number) {
    return new Date(y, m - 1, 1).getDay();
  }

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() + 1 === month;

  const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];

  function prevMonth() {
    if (month === 1) { setMonth(12); setYear(year - 1); }
    else { setMonth(month - 1); }
  }

  function nextMonth() {
    if (month === 12) { setMonth(1); setYear(year + 1); }
    else { setMonth(month + 1); }
  }

  return (
    <div className="bg-[#1a1a24] rounded-xl p-5 border border-white/5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-zinc-200">签到日历</h3>
        {onClose && (
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* 月份导航 */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="text-zinc-500 hover:text-zinc-300 transition-colors p-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-sm text-zinc-300 font-medium">{year}年 {monthNames[month - 1]}</span>
        <button onClick={nextMonth} className="text-zinc-500 hover:text-zinc-300 transition-colors p-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* 星期标头 */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {['日', '一', '二', '三', '四', '五', '六'].map(d => (
          <div key={d} className="text-center text-[10px] text-zinc-600 py-1">{d}</div>
        ))}
      </div>

      {/* 日期网格 */}
      {loading ? (
        <div className="text-center py-4 text-zinc-500 text-xs">加载中...</div>
      ) : (
        <div className="grid grid-cols-7 gap-1">
          {/* 前置空白 */}
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {/* 日期 */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const isChecked = checkedDays.includes(day);
            const isToday = isCurrentMonth && day === today.getDate();

            return (
              <div
                key={day}
                className={`text-center py-1.5 rounded-lg text-xs transition-colors ${
                  isChecked
                    ? 'bg-purple-600/30 text-purple-300 font-bold'
                    : isToday
                    ? 'bg-white/10 text-zinc-200 font-medium'
                    : 'text-zinc-600'
                }`}
              >
                {isChecked ? '✓' : day}
              </div>
            );
          })}
        </div>
      )}

      {/* 统计 */}
      <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
        <span className="text-xs text-zinc-500">
          本月已签到 <span className="text-purple-400 font-bold">{checkedDays.length}</span> 天
        </span>
        <span className="text-xs text-zinc-600">连续签到奖励更多</span>
      </div>
    </div>
  );
}
