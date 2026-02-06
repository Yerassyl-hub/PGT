'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { Goal, GoalFormData, GoalStats, GoalFilters } from '../types';
import {
  DEFAULT_GOALS_TITLE,
  addGoalToFirestore,
  deleteGoalFromFirestore,
  incrementGoalInFirestore,
  resetGoalsPeriodInFirestore,
  subscribeGoals,
  subscribeGoalsTitle,
  updateGoalInFirestore,
  updateGoalProgressInFirestore,
  updateGoalsTitleInFirestore,
} from '../lib/firestore-goals';

const DEFAULT_FILTERS: GoalFilters = {
  categories: [],
  status: 'all',
  sortDirection: 'asc',
};

function getNextPeriodStart(currentEnd: Date): Date {
  const next = new Date(currentEnd);
  next.setDate(next.getDate() + 1);
  next.setHours(0, 0, 0, 0);
  return next;
}

function getNextPeriodEnd(category: 'daily' | 'weekly' | 'monthly', start: Date): Date {
  const end = new Date(start);
  switch (category) {
    case 'daily':
      // Same day
      break;
    case 'weekly':
      end.setDate(end.getDate() + 6);
      break;
    case 'monthly':
      end.setMonth(end.getMonth() + 1);
      end.setDate(end.getDate() - 1);
      break;
  }
  end.setHours(23, 59, 59, 999);
  return end;
}

function shouldResetGoal(goal: Goal): boolean {
  // Custom periods don't auto-reset
  if (goal.category === 'custom') return false;

  const now = new Date();
  const periodEnd = new Date(goal.periodEnd);
  periodEnd.setHours(23, 59, 59, 999);
  return now > periodEnd;
}

export function useGoals() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [title, setTitle] = useState(DEFAULT_GOALS_TITLE);
  const [isGoalsLoading, setIsGoalsLoading] = useState(true);
  const [isTitleLoading, setIsTitleLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<GoalFilters>(DEFAULT_FILTERS);

  useEffect(() => {
    const unsubscribeGoals = subscribeGoals(
      (nextGoals) => {
        setGoals(nextGoals);
        setIsGoalsLoading(false);
      },
      (snapshotError) => {
        setError(snapshotError.message);
        setIsGoalsLoading(false);
      }
    );

    const unsubscribeTitle = subscribeGoalsTitle(
      (nextTitle) => {
        setTitle(nextTitle);
        setIsTitleLoading(false);
      },
      (snapshotError) => {
        setError(snapshotError.message);
        setIsTitleLoading(false);
      }
    );

    return () => {
      unsubscribeGoals();
      unsubscribeTitle();
    };
  }, []);

  const checkAndResetGoals = useCallback(async () => {
    const updates = goals
      .filter((goal) => shouldResetGoal(goal))
      .map((goal) => {
        const newStart = getNextPeriodStart(goal.periodEnd);
        return {
          id: goal.id,
          periodStart: newStart,
          periodEnd: getNextPeriodEnd(goal.category as 'daily' | 'weekly' | 'monthly', newStart),
        };
      });

    if (updates.length === 0) {
      return;
    }

    try {
      await resetGoalsPeriodInFirestore(updates);
    } catch (resetError) {
      console.error('Failed to reset goal period', resetError);
    }
  }, [goals]);

  useEffect(() => {
    if (isGoalsLoading || goals.length === 0) {
      return;
    }

    void checkAndResetGoals();

    const interval = setInterval(() => {
      void checkAndResetGoals();
    }, 60000);

    return () => clearInterval(interval);
  }, [goals, isGoalsLoading, checkAndResetGoals]);

  const filteredGoals = useMemo(() => {
    let result = [...goals];

    // Filter by categories (if any selected)
    if (filters.categories.length > 0) {
      result = result.filter((goal) => filters.categories.includes(goal.category));
    }

    // Filter by status
    if (filters.status === 'completed') {
      result = result.filter((goal) => goal.currentValue >= goal.targetValue);
    } else if (filters.status === 'incomplete') {
      result = result.filter((goal) => goal.currentValue < goal.targetValue);
    }

    // Sort by date
    result.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return filters.sortDirection === 'asc' ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [goals, filters]);

  const stats: GoalStats = useMemo(() => {
    const totalGoals = goals.length;
    const completedGoals = goals.filter(
      (goal) => goal.currentValue >= goal.targetValue
    ).length;

    const totalProgress = goals.reduce((acc, goal) => {
      const progress = Math.min((goal.currentValue / goal.targetValue) * 100, 100);
      return acc + progress;
    }, 0);

    const overallProgress = totalGoals > 0 ? Math.round(totalProgress / totalGoals) : 0;

    return {
      totalGoals,
      completedGoals,
      overallProgress,
      streak: 5,
    };
  }, [goals]);

  const addGoal = useCallback(async (formData: GoalFormData) => {
    try {
      await addGoalToFirestore(formData);
    } catch (saveError) {
      console.error('Failed to add goal', saveError);
      setError('Не удалось сохранить цель');
    }
  }, []);

  const updateGoalProgress = useCallback(async (id: string, value: number) => {
    try {
      await updateGoalProgressInFirestore(id, Math.max(0, value));
    } catch (saveError) {
      console.error('Failed to update goal progress', saveError);
      setError('Не удалось обновить прогресс');
    }
  }, []);

  const deleteGoal = useCallback(async (id: string) => {
    try {
      await deleteGoalFromFirestore(id);
    } catch (saveError) {
      console.error('Failed to delete goal', saveError);
      setError('Не удалось удалить цель');
    }
  }, []);

  const updateGoal = useCallback(async (id: string, formData: GoalFormData) => {
    try {
      await updateGoalInFirestore(id, formData);
    } catch (saveError) {
      console.error('Failed to update goal', saveError);
      setError('Не удалось обновить цель');
    }
  }, []);

  const incrementGoal = useCallback(
    async (id: string, amount: number = 1) => {
      const goal = goals.find((item) => item.id === id);

      if (!goal) {
        return;
      }

      try {
        await incrementGoalInFirestore(id, amount, goal.currentValue, goal.targetValue);
      } catch (saveError) {
        console.error('Failed to increment goal', saveError);
        setError('Не удалось обновить прогресс');
      }
    },
    [goals]
  );

  const updateTitle = useCallback(async (nextTitle: string) => {
    const normalizedTitle = nextTitle.trim() || DEFAULT_GOALS_TITLE;
    setTitle(normalizedTitle);

    try {
      await updateGoalsTitleInFirestore(normalizedTitle);
    } catch (saveError) {
      console.error('Failed to update goals title', saveError);
      setError('Не удалось сохранить название');
    }
  }, []);

  return {
    goals: filteredGoals,
    allGoals: goals,
    title,
    filters,
    setFilters,
    stats,
    isLoading: isGoalsLoading || isTitleLoading,
    error,
    addGoal,
    updateGoal,
    updateGoalProgress,
    deleteGoal,
    incrementGoal,
    updateTitle,
  };
}
