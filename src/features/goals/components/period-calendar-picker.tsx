'use client';

import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { GoalCategory } from '../types';
import { CATEGORY_OPTIONS, CATEGORY_LABELS } from '../constants';

interface PeriodCalendarPickerProps {
  category: GoalCategory;
  periodStart: Date;
  periodEnd: Date;
  onCategoryChange: (value: GoalCategory) => void;
  onPeriodChange: (start: Date, end: Date) => void;
}

const WEEKDAYS_RU = ['П', 'В', 'С', 'Ч', 'П', 'С', 'В'];
const MONTHS_RU = [
  'ЯНВАРЬ', 'ФЕВРАЛЬ', 'МАРТ', 'АПРЕЛЬ', 'МАЙ', 'ИЮНЬ',
  'ИЮЛЬ', 'АВГУСТ', 'СЕНТЯБРЬ', 'ОКТЯБРЬ', 'НОЯБРЬ', 'ДЕКАБРЬ'
];

function isSameDay(d1: Date, d2: Date): boolean {
  return d1.getDate() === d2.getDate() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getFullYear() === d2.getFullYear();
}

function isInRange(date: Date, start: Date, end: Date): boolean {
  const d = new Date(date);
  d.setHours(12, 0, 0, 0);
  const s = new Date(start);
  s.setHours(0, 0, 0, 0);
  const e = new Date(end);
  e.setHours(23, 59, 59, 999);
  return d >= s && d <= e;
}

function formatDateRange(start: Date, end: Date): string {
  const formatDate = (d: Date) => {
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  };

  if (isSameDay(start, end)) {
    return formatDate(start);
  }
  return `${formatDate(start)} - ${formatDate(end)}`;
}

function getDayRange(): { start: Date; end: Date } {
  const today = new Date();
  const start = new Date(today);
  start.setHours(0, 0, 0, 0);
  const end = new Date(today);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function getWeekRange(): { start: Date; end: Date } {
  const today = new Date();
  const day = today.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const start = new Date(today);
  start.setDate(today.getDate() + diff);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function getMonthRange(): { start: Date; end: Date } {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), 1);
  start.setHours(0, 0, 0, 0);
  const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export function PeriodCalendarPicker({
  category,
  periodStart,
  periodEnd,
  onCategoryChange,
  onPeriodChange
}: PeriodCalendarPickerProps) {
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(new Date());
  const [selectingStart, setSelectingStart] = useState(true);
  const [tempStart, setTempStart] = useState<Date | null>(null);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const calendarDays = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const startDayOfWeek = firstDay.getDay();
    const daysFromPrevMonth = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

    const days: { date: Date; isCurrentMonth: boolean }[] = [];

    const prevMonth = new Date(year, month, 0);
    for (let i = daysFromPrevMonth - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonth.getDate() - i),
        isCurrentMonth: false,
      });
    }

    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
      });
    }

    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
      });
    }

    return days;
  }, [viewDate]);

  const prevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  // Handle preset selection - auto-set period
  const handlePresetSelect = (preset: GoalCategory) => {
    let range: { start: Date; end: Date };

    switch (preset) {
      case 'daily':
        range = getDayRange();
        break;
      case 'weekly':
        range = getWeekRange();
        break;
      case 'monthly':
        range = getMonthRange();
        break;
      default:
        return;
    }

    onCategoryChange(preset);
    onPeriodChange(range.start, range.end);
    setTempStart(null);
    setSelectingStart(true);
  };

  // Handle manual date selection - sets category to custom
  const handleDayClick = (date: Date) => {
    if (selectingStart) {
      setTempStart(date);
      setSelectingStart(false);
    } else {
      const start = tempStart!;
      let finalStart = start;
      let finalEnd = date;

      if (date < start) {
        finalStart = date;
        finalEnd = start;
      }

      // Set to custom when manually selecting dates
      onCategoryChange('custom');
      onPeriodChange(finalStart, finalEnd);
      setTempStart(null);
      setSelectingStart(true);
    }
  };

  const isFirstInRange = (date: Date): boolean => {
    if (tempStart) return isSameDay(date, tempStart);
    return isSameDay(date, periodStart);
  };

  const isLastInRange = (date: Date): boolean => {
    if (tempStart) return false;
    return isSameDay(date, periodEnd);
  };

  const displayLabel = category === 'custom'
    ? `Свой период: ${formatDateRange(periodStart, periodEnd)}`
    : `${CATEGORY_LABELS[category]}: ${formatDateRange(periodStart, periodEnd)}`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start gap-2 bg-zinc-50 border-zinc-200 text-zinc-900 hover:bg-zinc-100 text-left"
        >
          <Calendar className="h-4 w-4 text-zinc-500 shrink-0" />
          <span className="truncate">{displayLabel}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 bg-white border-zinc-200" align="start">
        <div className="p-4">
          {/* Preset selection */}
          <div className="flex flex-col gap-1 mb-4">
            <p className="text-xs text-zinc-500 mb-1">По умолчанию:</p>
            {CATEGORY_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => handlePresetSelect(option.value)}
                className={`text-left px-3 py-2 rounded-md text-sm transition-colors ${
                  category === option.value
                    ? 'bg-emerald-100 text-emerald-700 font-medium'
                    : 'text-zinc-700 hover:bg-zinc-100'
                }`}
              >
                {option.label}
              </button>
            ))}
            {category === 'custom' && (
              <div className="px-3 py-2 rounded-md text-sm bg-violet-100 text-violet-700 font-medium">
                Свой период
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-zinc-200 my-3" />

          {/* Manual selection hint */}
          <div className="text-xs text-zinc-500 mb-3 text-center">
            {selectingStart ? 'Или выберите начало периода' : 'Выберите конец периода'}
          </div>

          {/* Calendar header */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={prevMonth}
              className="p-1 hover:bg-zinc-100 rounded-md transition-colors"
            >
              <ChevronLeft className="h-5 w-5 text-zinc-600" />
            </button>
            <span className="text-red-500 font-bold tracking-wide">
              {MONTHS_RU[viewDate.getMonth()]}
            </span>
            <button
              onClick={nextMonth}
              className="p-1 hover:bg-zinc-100 rounded-md transition-colors"
            >
              <ChevronRight className="h-5 w-5 text-zinc-600" />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {WEEKDAYS_RU.map((day, i) => (
              <div
                key={i}
                className="text-center text-sm font-medium text-zinc-500 w-9 h-6 flex items-center justify-center"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-y-1">
            {calendarDays.map(({ date, isCurrentMonth }, index) => {
              const isToday = isSameDay(date, today);
              const inRange = !tempStart && isInRange(date, periodStart, periodEnd);
              const isFirst = isFirstInRange(date);
              const isLast = isLastInRange(date);
              const isSingle = isFirst && isLast;

              return (
                <div
                  key={index}
                  className={`relative flex items-center justify-center h-9 ${
                    !isCurrentMonth ? 'opacity-30' : 'cursor-pointer'
                  }`}
                  onClick={() => isCurrentMonth && handleDayClick(date)}
                >
                  {/* Range highlight background */}
                  {inRange && isCurrentMonth && (
                    <div
                      className={`absolute inset-0 ${category === 'custom' ? 'bg-violet-100' : 'bg-emerald-100'} ${
                        isFirst && !isSingle ? 'rounded-l-full' : ''
                      } ${isLast && !isSingle ? 'rounded-r-full' : ''} ${
                        isSingle ? 'rounded-full' : ''
                      }`}
                    />
                  )}

                  {/* Day number */}
                  <span
                    className={`relative z-10 w-8 h-8 flex items-center justify-center text-sm font-medium rounded-full transition-colors ${
                      isToday
                        ? 'bg-red-500 text-white'
                        : isFirst || isLast
                        ? category === 'custom' ? 'bg-violet-500 text-white' : 'bg-emerald-500 text-white'
                        : isCurrentMonth
                        ? 'text-zinc-900 hover:bg-zinc-200'
                        : 'text-zinc-400'
                    }`}
                  >
                    {date.getDate()}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Selected range info */}
          <div className="mt-4 pt-3 border-t border-zinc-200 text-sm text-zinc-600 text-center">
            Период: {formatDateRange(periodStart, periodEnd)}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
