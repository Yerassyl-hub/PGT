'use client';

import { useState } from 'react';
import { MoreHorizontal, Trash2, Edit2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Goal, GoalFormData } from '../types';
import { COLOR_OPTIONS } from '../constants';
import { GoalIcon } from './goal-icon';
import { PeriodCalendarPicker } from './period-calendar-picker';
import { IconPicker } from './icon-picker';

interface GoalCardProps {
  goal: Goal;
  onIncrement: (id: string, amount: number) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, data: GoalFormData) => void;
}

export function GoalCard({ goal, onIncrement, onDelete, onEdit }: GoalCardProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<GoalFormData>({
    title: goal.title,
    subtitle: goal.subtitle,
    icon: goal.icon,
    targetValue: goal.targetValue,
    unit: goal.unit,
    category: goal.category,
    color: goal.color,
    incrementAmount: goal.incrementAmount,
    periodStart: goal.periodStart,
    periodEnd: goal.periodEnd,
  });

  const progress = Math.min((goal.currentValue / goal.targetValue) * 100, 100);
  const isCompleted = goal.currentValue >= goal.targetValue;

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.title.trim() || !editForm.unit.trim()) return;
    onEdit(goal.id, editForm);
    setEditOpen(false);
  };

  const updateEditForm = <K extends keyof GoalFormData>(
    key: K,
    value: GoalFormData[K]
  ) => {
    setEditForm((prev) => ({ ...prev, [key]: value }));
  };

  const openEditDialog = () => {
    setEditForm({
      title: goal.title,
      subtitle: goal.subtitle,
      icon: goal.icon,
      targetValue: goal.targetValue,
      unit: goal.unit,
      category: goal.category,
      color: goal.color,
      incrementAmount: goal.incrementAmount,
      periodStart: goal.periodStart,
      periodEnd: goal.periodEnd,
    });
    setEditOpen(true);
  };

  const formatValue = (value: number): string => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}k`;
    }
    return value.toString();
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isCompleted) {
      onIncrement(goal.id, goal.incrementAmount);
    }
  };

  return (
    <>
      <div className="bg-white dark:bg-zinc-800 rounded-2xl p-4 shadow-sm border border-zinc-100 dark:border-zinc-700">
        <div className="flex items-start gap-3">
          <GoalIcon icon={goal.icon} color={goal.color} />

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-zinc-900 dark:text-white text-base">
                  {goal.title}
                </h3>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 -mr-2"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
                >
                  <DropdownMenuItem
                    className="text-zinc-700 dark:text-zinc-200 focus:text-zinc-900 dark:focus:text-white focus:bg-zinc-100 dark:focus:bg-zinc-700"
                    onClick={openEditDialog}
                  >
                    <Edit2 className="mr-2 h-4 w-4" />
                    Редактировать
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-red-500 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950"
                    onClick={() => onDelete(goal.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Удалить
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="mt-3">
              <div className="flex items-baseline justify-between mb-2">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-zinc-900 dark:text-white">
                    {formatValue(goal.currentValue)}
                  </span>
                  <span className="text-sm text-zinc-400">
                    / {formatValue(goal.targetValue)} {goal.unit}
                  </span>
                </div>
                <span className="text-sm font-semibold text-emerald-500">
                  {Math.round(progress)}%
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1 relative h-1.5 rounded-full bg-red-400 dark:bg-red-900 overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out bg-emerald-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <button
                  onClick={handleIncrement}
                  disabled={isCompleted}
                  className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center transition-all ${
                    isCompleted
                      ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-400 cursor-not-allowed'
                      : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-md hover:shadow-lg active:scale-95'
                  }`}
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white">
          <DialogHeader>
            <DialogTitle className="text-xl">Редактировать цель</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleEditSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title" className="text-zinc-700 dark:text-zinc-300">
                Название
              </Label>
              <Input
                id="edit-title"
                value={editForm.title}
                onChange={(e) => updateEditForm('title', e.target.value)}
                className="bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-subtitle" className="text-zinc-700 dark:text-zinc-300">
                Описание
              </Label>
              <Input
                id="edit-subtitle"
                value={editForm.subtitle}
                onChange={(e) => updateEditForm('subtitle', e.target.value)}
                className="bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-target" className="text-zinc-700 dark:text-zinc-300">
                  Цель
                </Label>
                <Input
                  id="edit-target"
                  type="number"
                  min={1}
                  value={editForm.targetValue}
                  onChange={(e) => updateEditForm('targetValue', Number(e.target.value))}
                  className="bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-unit" className="text-zinc-700 dark:text-zinc-300">
                  Единица
                </Label>
                <Input
                  id="edit-unit"
                  value={editForm.unit}
                  onChange={(e) => updateEditForm('unit', e.target.value)}
                  className="bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-increment" className="text-zinc-700 dark:text-zinc-300">
                Шаг прогресса (за одно нажатие +)
              </Label>
              <Input
                id="edit-increment"
                type="number"
                min={1}
                value={editForm.incrementAmount}
                onChange={(e) => updateEditForm('incrementAmount', Number(e.target.value))}
                className="bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-700 dark:text-zinc-300">Период</Label>
              <PeriodCalendarPicker
                category={editForm.category}
                periodStart={editForm.periodStart}
                periodEnd={editForm.periodEnd}
                onCategoryChange={(v) => updateEditForm('category', v)}
                onPeriodChange={(start, end) => {
                  setEditForm((prev) => ({ ...prev, periodStart: start, periodEnd: end }));
                }}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-700 dark:text-zinc-300">Иконка</Label>
              <IconPicker
                value={editForm.icon}
                onChange={(v) => updateEditForm('icon', v)}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-700 dark:text-zinc-300">Цвет</Label>
              <div className="flex gap-2">
                {COLOR_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => updateEditForm('color', option.value)}
                    className={`h-8 w-8 rounded-full transition-all ${option.class} ${
                      editForm.color === option.value
                        ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-zinc-900 ring-zinc-400 scale-110'
                        : 'opacity-60 hover:opacity-100'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditOpen(false)}
                className="flex-1 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                Отмена
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
                disabled={!editForm.title.trim() || !editForm.unit.trim()}
              >
                Сохранить
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
