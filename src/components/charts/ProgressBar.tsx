'use client';

import { cn } from '@/lib/utils';

interface ProgressBarProps {
  current: number;
  goal: number;
  minGoal?: number;
  label: string;
  color?: string;
  unit?: string;
}

export function ProgressBar({ current, goal, minGoal, label, color, unit = '' }: ProgressBarProps) {
  // Handle edge cases
  if (goal <= 0) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">{label}</span>
          <span className="text-muted-foreground">No goal set</span>
        </div>
      </div>
    );
  }

  const percentage = Math.min((current / goal) * 100, 100);
  
  // Determine color and status based on range or single goal
  let barColor = color || 'hsl(var(--primary))';
  let statusColor = 'text-primary';
  let statusText = 'On track';
  let showWarning = false;

  if (minGoal !== undefined) {
    // Range-based logic
    if (current < minGoal) {
      barColor = '#a855f7'; // purple-500
      statusColor = 'text-purple-600';
      statusText = 'Below minimum';
      showWarning = true;
    } else if (current <= goal) {
      barColor = '#16a34a'; // green-600
      statusColor = 'text-green-600';
      statusText = 'Within range';
    } else {
      barColor = '#dc2626'; // red-600
      statusColor = 'text-red-600';
      statusText = 'Over maximum';
    }
  } else {
    // Single goal logic (original behavior)
    const isOver = current > goal;
    const isNearGoal = percentage >= 90 && percentage <= 110;
    const isUnder = percentage < 90;

    if (isOver) {
      barColor = '#ea580c'; // orange-600
      statusColor = 'text-orange-600';
      statusText = 'Over goal';
    } else if (isNearGoal) {
      barColor = '#16a34a'; // green-600
      statusColor = 'text-green-600';
      statusText = 'At goal';
    } else if (isUnder) {
      barColor = color || 'hsl(var(--primary))';
      statusColor = 'text-primary';
      statusText = 'In progress';
    }
  }

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <div className="flex items-center gap-2">
          {minGoal !== undefined ? (
            <span className="font-semibold">
              {current.toFixed(0)}{unit} <span className="text-muted-foreground text-xs">({minGoal.toFixed(0)}-{goal.toFixed(0)}{unit})</span>
            </span>
          ) : (
            <span className="font-semibold">
              {current.toFixed(0)}{unit} / {goal.toFixed(0)}{unit}
            </span>
          )}
          <span className={cn('text-xs', statusColor)}>
            ({percentage.toFixed(0)}%)
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative h-3 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${percentage}%`,
            backgroundColor: barColor,
          }}
        />
      </div>

      {/* Status */}
      <div className="flex items-center justify-between text-xs">
        <span className={statusColor}>{statusText}</span>
        {minGoal !== undefined ? (
          <span className="text-muted-foreground">
            {current < minGoal
              ? `${(minGoal - current).toFixed(0)}${unit} below min`
              : current > goal
              ? `${(current - goal).toFixed(0)}${unit} over max`
              : `${(goal - current).toFixed(0)}${unit} to max`
            }
          </span>
        ) : (
          <span className="text-muted-foreground">
            {current < goal
              ? `${(goal - current).toFixed(0)}${unit} remaining`
              : `${(current - goal).toFixed(0)}${unit} over`
            }
          </span>
        )}
      </div>
      
      {/* Warning for below minimum */}
      {showWarning && minGoal !== undefined && (
        <div className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400">
          <span>⚠️ Consider eating more to reach your minimum goal</span>
        </div>
      )}
    </div>
  );
}