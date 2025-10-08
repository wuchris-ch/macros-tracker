'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfMonth, endOfMonth, addMonths, subMonths, startOfWeek, endOfWeek, subDays } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendChart } from '@/components/charts/TrendChart';

interface DailyTotal {
  date: string;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  meal_count: number;
}

interface MobileCalendarViewProps {
  onDateSelect: (date: Date) => void;
}

export function MobileCalendarView({ onDateSelect }: MobileCalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [dailyTotals, setDailyTotals] = useState<DailyTotal[]>([]);
  const [statsTotals, setStatsTotals] = useState<DailyTotal[]>([]);
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsDateRange, setStatsDateRange] = useState<'all-time' | 'current-month' | 'custom'>('all-time');
  const [trendPeriod, setTrendPeriod] = useState<'week' | 'month'>('week');
  const [trendData, setTrendData] = useState<Array<{ date: string; calories: number; protein: number }>>([]);
  const [minCalories, setMinCalories] = useState<number>(1800);
  const [maxCalories, setMaxCalories] = useState<number>(2200);

  // Load user goals from localStorage
  useEffect(() => {
    const savedGoals = localStorage.getItem('calorie-tracker-goals');
    if (savedGoals) {
      try {
        const goals = JSON.parse(savedGoals);
        if (goals.minCalories && goals.maxCalories) {
          setMinCalories(goals.minCalories);
          setMaxCalories(goals.maxCalories);
        } else if (goals.dailyCalories) {
          const oldGoal = goals.dailyCalories;
          setMinCalories(Math.round(oldGoal * 0.9));
          setMaxCalories(oldGoal);
        }
      } catch (error) {
        console.error('Error loading goals:', error);
      }
    }
  }, []);

  // Fetch daily totals for the current month
  useEffect(() => {
    const fetchDailyTotals = async () => {
      setLoading(true);
      try {
        const monthStart = startOfMonth(currentMonth);
        const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
        const monthEnd = endOfMonth(currentMonth);
        const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
        
        const startDate = format(calendarStart, 'yyyy-MM-dd');
        const endDate = format(calendarEnd, 'yyyy-MM-dd');
        
        const response = await fetch(`/api/meals/totals/${startDate}/${endDate}`);
        
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

  // Fetch stats totals
  useEffect(() => {
    const fetchStatsTotals = async () => {
      setStatsLoading(true);
      try {
        let url = '/api/meals/stats';
        const params = new URLSearchParams();
        
        if (statsDateRange === 'current-month') {
          const startDate = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
          const endDate = format(endOfMonth(currentMonth), 'yyyy-MM-dd');
          params.append('startDate', startDate);
          params.append('endDate', endDate);
        }
        
        if (params.toString()) {
          url += `?${params.toString()}`;
        }
        
        const response = await fetch(url);
        
        if (response.ok) {
          const data = await response.json();
          setStatsTotals(data);
        }
      } catch (error) {
        console.error('Error fetching stats totals:', error);
      } finally {
        setStatsLoading(false);
      }
    };

    fetchStatsTotals();
  }, [statsDateRange, currentMonth]);

  // Fetch trend data
  useEffect(() => {
    const fetchTrendData = async () => {
      try {
        const days = trendPeriod === 'week' ? 7 : 30;
        const endDate = format(new Date(), 'yyyy-MM-dd');
        const startDate = format(subDays(new Date(), days - 1), 'yyyy-MM-dd');
        
        const response = await fetch(`/api/meals/totals/${startDate}/${endDate}`);
        
        if (response.ok) {
          const data = await response.json();
          const transformedData = data.map((day: DailyTotal) => ({
            date: day.date,
            calories: day.total_calories || null,
            protein: day.total_protein || null,
          }));
          setTrendData(transformedData);
        }
      } catch (error) {
        console.error('Error fetching trend data:', error);
      }
    };

    fetchTrendData();
  }, [trendPeriod]);

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

  // Get heatmap color based on calorie intake vs range
  const getHeatmapColor = (calories: number) => {
    if (calories === 0) return 'bg-background';
    
    if (calories < minCalories) {
      const ratio = calories / minCalories;
      if (ratio < 0.7) return 'bg-purple-300 dark:bg-purple-900';
      return 'bg-purple-200 dark:bg-purple-800';
    } else if (calories <= maxCalories) {
      return 'bg-green-200 dark:bg-green-900';
    } else {
      const ratio = calories / maxCalories;
      if (ratio > 1.3) return 'bg-red-300 dark:bg-red-900';
      return 'bg-red-200 dark:bg-red-800';
    }
  };

  // Generate calendar days for mobile view
  const generateCalendarDays = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    
    const days = [];
    const current = new Date(calendarStart);
    
    while (current <= calendarEnd) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  };

  const calendarDays = generateCalendarDays();
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-4">
      {/* Mobile Calendar */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Calendar</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium min-w-[120px] text-center">
                {format(currentMonth, 'MMM yyyy')}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {/* Week day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map((day) => (
              <div key={day} className="text-center text-xs font-medium text-muted-foreground py-1">
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((date, index) => {
              const { calories, protein, hasData } = getNutritionForDate(date);
              const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
              const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
              const heatmapColor = getHeatmapColor(calories);
              
              return (
                <button
                  key={index}
                  onClick={() => onDateSelect(date)}
                  className={`
                    aspect-square flex flex-col items-center justify-center p-1 text-xs rounded-md
                    transition-colors duration-200 ${heatmapColor}
                    ${!isCurrentMonth ? 'opacity-30' : ''}
                    ${isToday ? 'ring-2 ring-primary ring-offset-1' : ''}
                    hover:bg-accent/50
                  `}
                >
                  <span className={`font-medium ${isToday ? 'text-primary font-bold' : ''}`}>
                    {format(date, 'd')}
                  </span>
                  {hasData && (
                    <div className="flex flex-col items-center space-y-0.5 mt-1">
                      <span className="text-[10px] font-medium bg-background/80 px-1 py-0.5 rounded text-foreground">
                        {calories}cal
                      </span>
                      <span className="text-[10px] font-medium bg-background/80 px-1 py-0.5 rounded text-foreground">
                        {protein.toFixed(0)}g
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          
          {/* Heatmap Legend */}
          <div className="mt-4 space-y-2">
            <p className="text-xs font-medium text-muted-foreground text-center">Calorie Heatmap</p>
            <div className="flex items-center justify-center gap-3 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-purple-200 dark:bg-purple-800 border rounded"></div>
                <span>Below {minCalories}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-200 dark:bg-green-900 border rounded"></div>
                <span>{minCalories}-{maxCalories}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-red-200 dark:bg-red-800 border rounded"></div>
                <span>Above {maxCalories}</span>
              </div>
            </div>
          </div>
          
          {loading && (
            <div className="text-center py-4">
              <div className="inline-flex items-center space-x-2 text-muted-foreground text-sm">
                <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                <span>Loading...</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Quick Stats</CardTitle>
            <Select value={statsDateRange} onValueChange={(value: 'all-time' | 'current-month' | 'custom') => setStatsDateRange(value)}>
              <SelectTrigger className="w-[120px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-time">All Time</SelectItem>
                <SelectItem value="current-month">This Month</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {statsLoading ? (
            <div className="text-center py-4">
              <div className="inline-flex items-center space-x-2 text-muted-foreground text-sm">
                <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                <span>Loading...</span>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Main Metrics */}
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-xl font-bold text-primary">
                    {statsTotals.length > 0
                      ? Math.round(statsTotals.reduce((sum, day) => sum + day.total_calories, 0) / statsTotals.length)
                      : 0
                    }
                  </p>
                  <p className="text-xs text-muted-foreground">Avg Calories</p>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-xl font-bold text-blue-600">
                    {statsTotals.length > 0
                      ? (statsTotals.reduce((sum, day) => sum + (day.total_protein || 0), 0) / statsTotals.length).toFixed(1)
                      : '0.0'
                    }g
                  </p>
                  <p className="text-xs text-muted-foreground">Avg Protein</p>
                </div>
              </div>

              {/* Additional Metrics */}
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center">
                  <p className="text-lg font-semibold text-primary">
                    {statsTotals.reduce((sum, day) => sum + day.meal_count, 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">Meals</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-primary">
                    {statsTotals.length}
                  </p>
                  <p className="text-xs text-muted-foreground">Days</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-primary">
                    {statsTotals.length > 0
                      ? (statsTotals.reduce((sum, day) => sum + day.meal_count, 0) / statsTotals.length).toFixed(1)
                      : '0.0'
                    }
                  </p>
                  <p className="text-xs text-muted-foreground">Avg/Day</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Trends */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Trends</CardTitle>
            <Select value={trendPeriod} onValueChange={(value: 'week' | 'month') => setTrendPeriod(value)}>
              <SelectTrigger className="w-[100px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">7 Days</SelectItem>
                <SelectItem value="month">30 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <Tabs defaultValue="calories" className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-8">
              <TabsTrigger value="calories" className="text-xs">Calories</TabsTrigger>
              <TabsTrigger value="protein" className="text-xs">Protein</TabsTrigger>
            </TabsList>
            <TabsContent value="calories" className="mt-3">
              <TrendChart
                data={trendData}
                metric="calories"
                period={trendPeriod}
              />
            </TabsContent>
            <TabsContent value="protein" className="mt-3">
              <TrendChart
                data={trendData}
                metric="protein"
                period={trendPeriod}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
