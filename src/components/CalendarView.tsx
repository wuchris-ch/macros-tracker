'use client';

import { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';

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

  // Get nutrition data for a specific date
  const getNutritionForDate = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    const dayData = dailyTotals.find(d => d.date === dateString);
    return {
      calories: dayData?.total_calories || 0,
      protein: dayData?.total_protein || 0,
      hasData: (dayData?.total_calories || 0) > 0
    };
  };

  // Custom day content to show nutrition totals
  const renderDay = (date: Date) => {
    const { calories, protein, hasData } = getNutritionForDate(date);
    const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
    
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-2 min-h-[80px]">
        <span className={`text-base font-medium mb-1 ${isToday ? 'font-bold text-primary' : ''}`}>
          {format(date, 'd')}
        </span>
        {hasData ? (
          <div className="flex flex-col items-center space-y-1">
            <div className="flex items-center justify-center">
              <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                {calories}cal
              </span>
            </div>
            <div className="flex items-center justify-center">
              <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                {protein.toFixed(0)}g
              </span>
            </div>
          </div>
        ) : (
          <div className="text-xs text-muted-foreground/50">
            No data
          </div>
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
          <CardTitle className="text-xl font-semibold">Monthly Nutrition Overview</CardTitle>
          <p className="text-sm text-muted-foreground">
            Track your daily calories and protein intake at a glance
          </p>
        </CardHeader>
        <CardContent className="flex flex-col items-center">
          <div className="w-full max-w-5xl mx-auto space-y-6">
            {/* Custom Month Navigation */}
            <div className="flex items-center justify-center gap-4 mb-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="h-10 w-10"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-xl font-semibold min-w-[200px] text-center">
                {format(currentMonth, 'MMMM yyyy')}
              </h2>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="h-10 w-10"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex justify-center">
              <Calendar
                mode="single"
                selected={undefined}
                onSelect={handleDateSelect}
                month={currentMonth}
                className="rounded-lg border shadow-sm [--cell-size:theme(spacing.20)] mx-auto"
                classNames={{
                  root: "w-fit mx-auto",
                  months: "flex justify-center",
                  month: "w-full",
                  nav: "hidden", // Hide default navigation
                  table: "w-full border-collapse mx-auto",
                  week: "flex w-full",
                  day: "relative w-full h-full p-0 text-center group/day aspect-square select-none border border-border/20",
                  today: "bg-primary/5 border-primary/30",
                  outside: "text-muted-foreground/30",
                }}
                components={{
                  DayButton: ({ day, modifiers, ...props }) => (
                    <button
                      {...props}
                      className="w-full h-full hover:bg-accent/50 transition-colors duration-200 rounded-none border-0 p-0"
                    >
                      {renderDay(day.date)}
                    </button>
                  ),
                }}
              />
            </div>
            <div className="text-center space-y-3">
              <p className="text-sm font-medium text-foreground">
                Click on any date to view and manage meals for that day
              </p>
              <div className="flex items-center justify-center space-x-8 text-xs text-muted-foreground">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-orange-50 border border-orange-200 rounded-full"></div>
                  <span>Calories</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-50 border border-blue-200 rounded-full"></div>
                  <span>Protein (g)</span>
                </div>
              </div>
            </div>
          </div>
          {loading && (
            <div className="text-center py-8">
              <div className="inline-flex items-center space-x-2 text-muted-foreground">
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                <span>Loading nutrition data...</span>
              </div>
            </div>
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