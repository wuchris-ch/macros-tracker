'use client';

import { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format, startOfMonth, endOfMonth } from 'date-fns';

interface DailyTotal {
  date: string;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  meal_count: number;
}

interface CalendarViewProps {
  onDateSelect: (date: Date) => void;
}

export function CalendarView({ onDateSelect }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [dailyTotals, setDailyTotals] = useState<DailyTotal[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch daily totals for the current month
  useEffect(() => {
    const fetchDailyTotals = async () => {
      setLoading(true);
      try {
        const startDate = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
        const endDate = format(endOfMonth(currentMonth), 'yyyy-MM-dd');
        
        const response = await fetch(
          `/api/meals/totals/${startDate}/${endDate}`
        );
        
        if (response.ok) {
          const data = await response.json();
          setDailyTotals(data);
        }
      } catch (error) {
        console.error('Error fetching daily totals:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDailyTotals();
  }, [currentMonth]);

  // Get calories for a specific date
  const getCaloriesForDate = (date: Date): number => {
    const dateString = format(date, 'yyyy-MM-dd');
    const dayData = dailyTotals.find(d => d.date === dateString);
    return dayData?.total_calories || 0;
  };

  // Custom day content to show calorie totals
  const renderDay = (date: Date) => {
    const calories = getCaloriesForDate(date);
    const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
    
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-1">
        <span className={`text-sm ${isToday ? 'font-bold' : ''}`}>
          {format(date, 'd')}
        </span>
        {calories > 0 && (
          <span className="text-xs text-muted-foreground mt-1">
            {calories}cal
          </span>
        )}
      </div>
    );
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      onDateSelect(date);
    }
  };

  const handleMonthChange = (date: Date) => {
    setCurrentMonth(date);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Monthly Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center">
            <div className="space-y-4">
              <Calendar
                mode="single"
                selected={undefined}
                onSelect={handleDateSelect}
                onMonthChange={handleMonthChange}
                className="rounded-md border"
              />
              <div className="text-center text-sm text-muted-foreground">
                Click on a date to view and manage meals for that day
              </div>
            </div>
          </div>
          {loading && (
            <p className="text-center text-muted-foreground mt-4">
              Loading calorie data...
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quick Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">
                {dailyTotals.reduce((sum, day) => sum + day.total_calories, 0)}
              </p>
              <p className="text-sm text-muted-foreground">Total Calories</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {dailyTotals.reduce((sum, day) => sum + (day.total_protein || 0), 0).toFixed(1)}g
              </p>
              <p className="text-sm text-muted-foreground">Total Protein</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {dailyTotals.reduce((sum, day) => sum + (day.total_carbs || 0), 0).toFixed(1)}g
              </p>
              <p className="text-sm text-muted-foreground">Total Carbs</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">
                {dailyTotals.reduce((sum, day) => sum + (day.total_fat || 0), 0).toFixed(1)}g
              </p>
              <p className="text-sm text-muted-foreground">Total Fat</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="text-center">
              <p className="text-xl font-bold">
                {dailyTotals.reduce((sum, day) => sum + day.meal_count, 0)}
              </p>
              <p className="text-sm text-muted-foreground">Total Meals</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold">
                {dailyTotals.length}
              </p>
              <p className="text-sm text-muted-foreground">Days Tracked</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}