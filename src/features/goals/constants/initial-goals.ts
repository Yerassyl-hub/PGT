import { Goal } from '../types';

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

function getDayRange(): { start: Date; end: Date } {
  const today = new Date();
  const start = new Date(today);
  start.setHours(0, 0, 0, 0);
  const end = new Date(today);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

const dayRange = getDayRange();
const weekRange = getWeekRange();
const monthRange = getMonthRange();
const now = new Date();

export const INITIAL_GOALS: Goal[] = [
  {
    id: '1',
    title: 'Читать книги',
    subtitle: 'Минимум 20 страниц в день',
    icon: 'book',
    currentValue: 100,
    targetValue: 500,
    unit: 'стр.',
    category: 'monthly',
    color: 'emerald',
    incrementAmount: 10,
    periodStart: monthRange.start,
    periodEnd: monthRange.end,
    lastResetAt: now,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: '2',
    title: 'Пить воду',
    subtitle: '8 стаканов в день',
    icon: 'droplet',
    currentValue: 1500,
    targetValue: 2000,
    unit: 'мл',
    category: 'daily',
    color: 'cyan',
    incrementAmount: 250,
    periodStart: dayRange.start,
    periodEnd: dayRange.end,
    lastResetAt: now,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: '3',
    title: 'Накопления',
    subtitle: 'Финансовая подушка',
    icon: 'piggy-bank',
    currentValue: 45000,
    targetValue: 100000,
    unit: '₽',
    category: 'monthly',
    color: 'amber',
    incrementAmount: 1000,
    periodStart: monthRange.start,
    periodEnd: monthRange.end,
    lastResetAt: now,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: '4',
    title: 'Изучать код',
    subtitle: 'React и TypeScript',
    icon: 'code',
    currentValue: 24,
    targetValue: 50,
    unit: 'ч',
    category: 'weekly',
    color: 'violet',
    incrementAmount: 1,
    periodStart: weekRange.start,
    periodEnd: weekRange.end,
    lastResetAt: now,
    createdAt: now,
    updatedAt: now,
  },
];
