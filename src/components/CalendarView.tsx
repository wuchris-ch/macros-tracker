'use client';

import { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { format, startOfMonth, endOfMonth, addMonths, subMonths, startOfWeek, endOfWeek, subDays, isSameMonth } from 'date-fns';
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

interface CalendarViewProps {
  onDateSelect: (date: Date) => void;
}

type TrendDataPoint = {
  date: string;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
};

export function CalendarView({ onDateSelect }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [dailyTotals, setDailyTotals] = useState<DailyTotal[]>([]);
  const [statsTotals, setStatsTotals] = useState<DailyTotal[]>([]);
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsDateRange, setStatsDateRange] = useState<'all-time' | 'current-month' | 'custom'>('all-time');
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>(undefined);
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>(undefined);
  const [minCalories, setMinCalories] = useState<number>(1800);
  const [maxCalories, setMaxCalories] = useState<number>(2200);
  const [trendPeriod, setTrendPeriod] = useState<'week' | 'month'>('month');
  const [trendData, setTrendData] = useState<Array<{ date: string; calories: number; protein: number }>>([]);

  // Load user goals from localStorage
  useEffect(() => {
    const savedGoals = localStorage.getItem('calorie-tracker-goals');
    if (savedGoals) {
      try {
        const goals = JSON.parse(savedGoals);
        // Support both old and new format
        if (goals.minCalories && goals.maxCalories) {
          setMinCalories(goals.minCalories);
          setMaxCalories(goals.maxCalories);
        } else if (goals.dailyCalories) {
          // Migrate old format: use dailyCalories as max, set min to 90% of it
          const oldGoal = goals.dailyCalories;
          setMinCalories(Math.round(oldGoal * 0.9));
          setMaxCalories(oldGoal);
        }
      } catch (error) {
        console.error('Error loading goals:', error);
      }
    }
  }, []);

  // Fetch daily totals for the current month including visible dates from adjacent months
  useEffect(() => {
    const fetchDailyTotals = async () => {
      setLoading(true);
      try {
        // Get the first day of the month and find the start of the week containing it
        const monthStart = startOfMonth(currentMonth);
        const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 }); // 0 = Sunday
        
        // Get the last day of the month and find the end of the week containing it
        const monthEnd = endOfMonth(currentMonth);
        const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
        
        const startDate = format(calendarStart, 'yyyy-MM-dd');
        const endDate = format(calendarEnd, 'yyyy-MM-dd');
        
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

  // Fetch stats totals based on selected date range
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
        } else if (statsDateRange === 'custom' && customStartDate && customEndDate) {
          params.append('startDate', format(customStartDate, 'yyyy-MM-dd'));
          params.append('endDate', format(customEndDate, 'yyyy-MM-dd'));
        }
        // For 'all-time', no params needed
        
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
  }, [statsDateRange, currentMonth, customStartDate, customEndDate]);

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
          // Transform data for TrendChart
          // Include ALL dates from the API response
          // Use null for days with 0 values so the chart can skip them with connectNulls
          const transformedData: TrendDataPoint[] = data.map((day: DailyTotal) => ({
            date: day.date,
            calories: day.total_calories || null,
            protein: day.total_protein || null,
            carbs: day.total_carbs || null,
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
      carbs: dayData?.total_carbs || 0,
      hasData: (dayData?.total_calories || 0) > 0
    };
  };

  // Get heatmap color based on calorie intake vs range
  const getHeatmapColor = (calories: number) => {
    if (calories === 0) return 'bg-background';
    
    if (calories < minCalories) {
      // Too low - purple shades
      const ratio = calories / minCalories;
      if (ratio < 0.7) return 'bg-purple-300 dark:bg-purple-900';
      return 'bg-purple-200 dark:bg-purple-800';
    } else if (calories <= maxCalories) {
      // Within range - green shades
      return 'bg-green-200 dark:bg-green-900';
    } else {
      // Over max - red shades
      const ratio = calories / maxCalories;
      if (ratio > 1.3) return 'bg-red-300 dark:bg-red-900';
      return 'bg-red-200 dark:bg-red-800';
    }
  };

  // Custom day content to show nutrition totals with heatmap
  const renderDay = (date: Date) => {
    const { calories, protein, carbs, hasData } = getNutritionForDate(date);
    const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
    const heatmapColor = getHeatmapColor(calories);
    
    return (
      <div className={`w-[96px] h-[100px] flex flex-col items-center justify-center p-2 ${heatmapColor} transition-colors`}>
        <span className={`text-base font-medium mb-1 ${isToday ? 'font-bold text-primary' : ''}`}>
          {format(date, 'd')}
        </span>
        {hasData ? (
          <div className="flex flex-col items-center space-y-1">
            <div className="flex items-center justify-center">
              <span className="text-xs font-medium text-foreground bg-background/80 px-2 py-0.5 rounded-full">
                {calories}cal
              </span>
            </div>
            <div className="flex items-center justify-center gap-1">
              <span className="text-xs font-medium text-foreground bg-background/80 px-2 py-0.5 rounded-full">
                {protein.toFixed(0)}g P
              </span>
              <span className="text-xs font-medium text-foreground bg-background/80 px-2 py-0.5 rounded-full">
                {carbs.toFixed(0)}g C
              </span>
            </div>
          </div>
        ) : (
          <div className="text-xs text-muted-foreground/50 h-[32px] flex items-center">
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
            Track your daily calories, protein, and carbs intake at a glance
          </p>
        </CardHeader>
        <CardContent className="flex flex-col items-center">
          <div className="w-full max-w-5xl mx-auto space-y-6">
            {/* Custom Month Navigation */}
            <div className="flex flex-wrap items-center justify-center gap-3 mb-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="h-10 w-10"
                aria-label="Previous month"
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
                aria-label="Next month"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="secondary"
                className="h-10 px-4"
                onClick={() => {
                  if (!isCurrentMonth) {
                    setCurrentMonth(new Date());
                  }
                }}
                disabled={isCurrentMonth}
                aria-label="Go to current month"
              >
                Today
              </Button>
            </div>
            
            <div className="flex justify-center">
              <Calendar
                mode="single"
                selected={undefined}
                onSelect={handleDateSelect}
                month={currentMonth}
                className="rounded-lg border shadow-sm [--cell-size:theme(spacing.24)] mx-auto"
                classNames={{
                  root: "w-fit mx-auto",
                  months: "flex justify-center",
                  month: "w-full",
                  nav: "hidden", // Hide default navigation
                  table: "w-full border-collapse mx-auto",
                  week: "flex w-full",
                  day: "relative w-[96px] h-[100px] p-0 text-center group/day select-none border border-border/20",
                  today: "bg-primary/5 border-primary/30",
                  outside: "text-muted-foreground/30",
                }}
                components={{
                  DayButton: ({ day, modifiers, ...props }) => (
                    <button
                      {...props}
                      className="w-[96px] h-[100px] hover:bg-accent/50 transition-colors duration-200 rounded-none border-0 p-0"
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
              
              {/* Heatmap Legend */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Calorie Heatmap</p>
                <div className="flex items-center justify-center gap-2 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-4 bg-purple-200 dark:bg-purple-800 border rounded"></div>
                    <span>Below {minCalories} cal</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-4 bg-green-200 dark:bg-green-900 border rounded"></div>
                    <span>{minCalories}-{maxCalories} cal</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-4 bg-red-200 dark:bg-red-800 border rounded"></div>
                    <span>Above {maxCalories} cal</span>
                  </div>
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

      {/* Quick Stats and Trends - Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Stats Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Quick Stats</CardTitle>
              <div className="flex items-center gap-2">
                <Select value={statsDateRange} onValueChange={(value: 'all-time' | 'current-month' | 'custom') => setStatsDateRange(value)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-time">All Time</SelectItem>
                    <SelectItem value="current-month">Current Month</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {statsDateRange === 'custom' && (
              <div className="flex items-center gap-2 mt-3">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  <Calendar
                    mode="single"
                    selected={customStartDate}
                    onSelect={setCustomStartDate}
                    className="rounded-md border"
                  />
                </div>
                <span className="text-sm text-muted-foreground">to</span>
                <div className="flex items-center gap-2">
                  <Calendar
                    mode="single"
                    selected={customEndDate}
                    onSelect={setCustomEndDate}
                    className="rounded-md border"
                    disabled={(date) => customStartDate ? date < customStartDate : false}
                  />
                </div>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="text-center py-8">
                <div className="inline-flex items-center space-x-2 text-muted-foreground">
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                  <span>Loading stats...</span>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Main Metrics Row */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">
                      {statsTotals.length > 0
                        ? Math.round(statsTotals.reduce((sum, day) => sum + day.total_calories, 0) / statsTotals.length)
                        : 0
                      }
                    </p>
                    <p className="text-xs text-muted-foreground">Avg Calories</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">
                      {statsTotals.length > 0
                        ? (statsTotals.reduce((sum, day) => sum + (day.total_protein || 0), 0) / statsTotals.length).toFixed(1)
                        : '0.0'
                      }g
                    </p>
                    <p className="text-xs text-muted-foreground">Avg Protein</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {statsTotals.length > 0
                        ? (statsTotals.reduce((sum, day) => sum + (day.total_carbs || 0), 0) / statsTotals.length).toFixed(1)
                        : '0.0'
                      }g
                    </p>
                    <p className="text-xs text-muted-foreground">Avg Carbs</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-orange-600">
                      {statsTotals.length > 0
                        ? (statsTotals.reduce((sum, day) => sum + (day.total_fat || 0), 0) / statsTotals.length).toFixed(1)
                        : '0.0'
                      }g
                    </p>
                    <p className="text-xs text-muted-foreground">Avg Fat</p>
                  </div>
                </div>

                {/* Additional Metrics */}
                <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                  <div className="text-center">
                    <p className="text-lg font-semibold text-primary">
                      {statsTotals.reduce((sum, day) => sum + day.meal_count, 0)}
                    </p>
                    <p className="text-xs text-muted-foreground">Total Meals</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold text-primary">
                      {statsTotals.length}
                    </p>
                    <p className="text-xs text-muted-foreground">Days Tracked</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold text-primary">
                      {statsTotals.length > 0
                        ? (statsTotals.reduce((sum, day) => sum + day.meal_count, 0) / statsTotals.length).toFixed(1)
                        : '0.0'
                      }
                    </p>
                    <p className="text-xs text-muted-foreground">Avg Meals/Day</p>
                  </div>
                </div>

                {/* Progress Indicators */}
                {statsTotals.length > 0 && (
                  <div className="space-y-3 pt-4 border-t">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Consistency</span>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          statsTotals.length >= 7 ? 'bg-green-500' : 
                          statsTotals.length >= 3 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}></div>
                        <span className="font-medium">
                          {statsTotals.length >= 7 ? 'Excellent' : 
                           statsTotals.length >= 3 ? 'Good' : 'Getting Started'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Calorie Range</span>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          (() => {
                            const avgCalories = statsTotals.reduce((sum, day) => sum + day.total_calories, 0) / statsTotals.length;
                            if (avgCalories >= 1500 && avgCalories <= 2500) return 'bg-green-500';
                            if (avgCalories >= 1200 && avgCalories <= 3000) return 'bg-yellow-500';
                            return 'bg-red-500';
                          })()
                        }`}></div>
                        <span className="font-medium">
                          {(() => {
                            const avgCalories = statsTotals.reduce((sum, day) => sum + day.total_calories, 0) / statsTotals.length;
                            if (avgCalories >= 1500 && avgCalories <= 2500) return 'Healthy';
                            if (avgCalories >= 1200 && avgCalories <= 3000) return 'Moderate';
                            return 'Review Needed';
                          })()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Protein Quality</span>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          (() => {
                            const avgProtein = statsTotals.reduce((sum, day) => sum + (day.total_protein || 0), 0) / statsTotals.length;
                            if (avgProtein >= 100) return 'bg-green-500';
                            if (avgProtein >= 70) return 'bg-yellow-500';
                            return 'bg-red-500';
                          })()
                        }`}></div>
                        <span className="font-medium">
                          {(() => {
                            const avgProtein = statsTotals.reduce((sum, day) => sum + (day.total_protein || 0), 0) / statsTotals.length;
                            if (avgProtein >= 100) return 'High';
                            if (avgProtein >= 70) return 'Moderate';
                            return 'Low';
                          })()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Tracking Streak</span>
                      <span className="font-medium text-primary">
                        {statsTotals.length} day{statsTotals.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Trends Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Nutrition Trends</CardTitle>
              <Select value={trendPeriod} onValueChange={(value: 'week' | 'month') => setTrendPeriod(value)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Last 7 Days</SelectItem>
                  <SelectItem value="month">Last 30 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="calories" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="calories">Calories</TabsTrigger>
                <TabsTrigger value="protein">Protein</TabsTrigger>
                <TabsTrigger value="carbs">Carbs</TabsTrigger>
              </TabsList>
              <TabsContent value="calories" className="mt-4">
                <TrendChart
                  data={trendData}
                  metric="calories"
                  period={trendPeriod}
                />
              </TabsContent>
              <TabsContent value="protein" className="mt-4">
                <TrendChart
                  data={trendData}
                  metric="protein"
                  period={trendPeriod}
                />
              </TabsContent>
              <TabsContent value="carbs" className="mt-4">
                <TrendChart
                  data={trendData}
                  metric="carbs"
                  period={trendPeriod}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
