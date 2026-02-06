'use client';

import { ScrollArea } from '@/components/ui/scroll-area';
import { Spinner } from '@/components/ui/spinner';
import {
  GoalsHeader,
  GoalsFilter,
  GoalsList,
  useGoals,
} from '@/features/goals';

export default function HomePage() {
  const {
    goals,
    filters,
    setFilters,
    stats,
    title,
    isLoading,
    addGoal,
    updateGoal,
    incrementGoal,
    deleteGoal,
    updateTitle,
  } = useGoals();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      {/* Subtle gradient background */}
      <div className="fixed inset-0 bg-gradient-to-br from-emerald-50/50 via-zinc-50 to-zinc-50 dark:from-emerald-950/30 dark:via-zinc-900 dark:to-zinc-900 pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col max-w-2xl mx-auto">
        <GoalsHeader onAdd={addGoal} onTitleSave={updateTitle} title={title} stats={stats} />

        <main className="flex-1 px-4 sm:px-6 pb-6 space-y-4 sm:space-y-6">
          <GoalsFilter filters={filters} onChange={setFilters} />

          <ScrollArea className="flex-1">
            {isLoading ? (
              <div className="flex min-h-[340px] items-center justify-center">
                <Spinner className="size-8 text-emerald-500" />
              </div>
            ) : (
              <GoalsList
                goals={goals}
                onIncrement={incrementGoal}
                onDelete={deleteGoal}
                onEdit={updateGoal}
              />
            )}
          </ScrollArea>
        </main>
      </div>
    </div>
  );
}
