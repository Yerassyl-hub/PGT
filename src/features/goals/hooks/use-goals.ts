'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { Goal, GoalFormData, GoalStats, GoalFilters } from '../types';
import { INITIAL_GOALS } from '../constants';

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
  const [goals, setGoals] = useState<Goal[]>(INITIAL_GOALS);
  const [filters, setFilters] = useState<GoalFilters>(DEFAULT_FILTERS);

  // Check and reset goals when period ends
  useEffect(() => {
    const checkAndResetGoals = () => {
      setGoals((prevGoals) => {
        let hasChanges = false;
        const updatedGoals = prevGoals.map((goal) => {
          if (shouldResetGoal(goal)) {
            hasChanges = true;
            const newStart = getNextPeriodStart(goal.periodEnd);
            // Safe to cast since shouldResetGoal returns false for 'custom'
            const newEnd = getNextPeriodEnd(goal.category as 'daily' | 'weekly' | 'monthly', newStart);
            return {
              ...goal,
              currentValue: 0,
              periodStart: newStart,
              periodEnd: newEnd,
              lastResetAt: new Date(),
              updatedAt: new Date(),
            };
          }
          return goal;
        });
        return hasChanges ? updatedGoals : prevGoals;
      });
    };

    // Check immediately
    checkAndResetGoals();

    // Check every minute
    const interval = setInterval(checkAndResetGoals, 60000);
    return () => clearInterval(interval);
  }, []);

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

  const addGoal = useCallback((formData: GoalFormData) => {
    const now = new Date();
    const newGoal: Goal = {
      ...formData,
      id: Date.now().toString(),
      currentValue: 0,
      lastResetAt: now,
      createdAt: now,
      updatedAt: now,
    };
    setGoals((prev) => [...prev, newGoal]);
  }, []);

  const updateGoalProgress = useCallback((id: string, value: number) => {
    setGoals((prev) =>
      prev.map((goal) =>
        goal.id === id
          ? { ...goal, currentValue: value, updatedAt: new Date() }
          : goal
      )
    );
  }, []);

  const deleteGoal = useCallback((id: string) => {
    setGoals((prev) => prev.filter((goal) => goal.id !== id));
  }, []);

  const updateGoal = useCallback((id: string, formData: GoalFormData) => {
    setGoals((prev) =>
      prev.map((goal) =>
        goal.id === id
          ? { ...goal, ...formData, updatedAt: new Date() }
          : goal
      )
    );
  }, []);

  const incrementGoal = useCallback((id: string, amount: number = 1) => {
    setGoals((prev) =>
      prev.map((goal) =>
        goal.id === id
          ? {
              ...goal,
              currentValue: Math.min(goal.currentValue + amount, goal.targetValue),
              updatedAt: new Date(),
            }
          : goal
      )
    );
  }, []);

  return {
    goals: filteredGoals,
    allGoals: goals,
    filters,
    setFilters,
    stats,
    addGoal,
    updateGoal,
    updateGoalProgress,
    deleteGoal,
    incrementGoal,
  };
}
