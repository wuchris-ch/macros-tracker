'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Plus, Edit, Trash2 } from 'lucide-react';
import { MealDialog } from '@/components/MealDialog';
import { MacronutrientChart } from '@/components/charts/MacronutrientChart';
import { ProgressBar } from '@/components/charts/ProgressBar';

interface Meal {
  id: number;
  date: string;
  name: string;
  description?: string;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  created_at: string;
  updated_at: string;
}

interface UserGoals {
  minCalories: number;
  maxCalories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
}

interface DayViewProps {
  date: Date;
  onBack: () => void;
}

export function DayView({ date, onBack }: DayViewProps) {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(false);
  const [showMealDialog, setShowMealDialog] = useState(false);
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);
  const [userGoals, setUserGoals] = useState<UserGoals>({
    minCalories: 1800,
    maxCalories: 2200,
    proteinGrams: 150,
    carbsGrams: 200,
    fatGrams: 65,
  });

  const dateString = format(date, 'yyyy-MM-dd');
  const displayDate = format(date, 'EEEE, MMMM d, yyyy');

  // Load user goals from localStorage
  useEffect(() => {
    const savedGoals = localStorage.getItem('calorie-tracker-goals');
    if (savedGoals) {
      try {
        const goals = JSON.parse(savedGoals);
        
        // Migrate from old percentage-based format to grams
        if (goals.proteinPercent !== undefined) {
          const maxCal = goals.maxCalories || 2200;
          setUserGoals({
            minCalories: goals.minCalories || 1800,
            maxCalories: maxCal,
            proteinGrams: Math.round((maxCal * (goals.proteinPercent || 30) / 100) / 4),
            carbsGrams: Math.round((maxCal * (goals.carbsPercent || 40) / 100) / 4),
            fatGrams: Math.round((maxCal * (goals.fatPercent || 30) / 100) / 9),
          });
        } else if (goals.dailyCalories) {
          // Migrate even older format
          const maxCal = goals.dailyCalories;
          setUserGoals({
            minCalories: Math.round(goals.dailyCalories * 0.9),
            maxCalories: maxCal,
            proteinGrams: Math.round((maxCal * (goals.proteinPercent || 30) / 100) / 4),
            carbsGrams: Math.round((maxCal * (goals.carbsPercent || 40) / 100) / 4),
            fatGrams: Math.round((maxCal * (goals.fatPercent || 30) / 100) / 9),
          });
        } else {
          setUserGoals(goals);
        }
      } catch (error) {
        console.error('Error loading goals:', error);
      }
    }
  }, []);

  // Fetch meals for the selected date
  useEffect(() => {
    const fetchMeals = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/meals/${dateString}`);
        if (response.ok) {
          const data = await response.json();
          setMeals(data);
        }
      } catch (error) {
        console.error('Error fetching meals:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMeals();
  }, [dateString]);

  const handleAddMeal = () => {
    setEditingMeal(null);
    setShowMealDialog(true);
  };

  const handleEditMeal = (meal: Meal) => {
    setEditingMeal(meal);
    setShowMealDialog(true);
  };

  const handleDeleteMeal = async (mealId: number) => {
    if (!confirm('Are you sure you want to delete this meal?')) {
      return;
    }

    try {
      const response = await fetch(`/api/meals/${mealId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setMeals(meals.filter(meal => meal.id !== mealId));
      }
    } catch (error) {
      console.error('Error deleting meal:', error);
    }
  };

  const handleMealSaved = (savedMeal: Meal) => {
    if (editingMeal) {
      // Update existing meal
      setMeals(meals.map(meal => meal.id === savedMeal.id ? savedMeal : meal));
    } else {
      // Add new meal
      setMeals([...meals, savedMeal]);
    }
    setShowMealDialog(false);
    setEditingMeal(null);
  };

  const totalCalories = meals.reduce((sum, meal) => sum + meal.calories, 0);
  const totalProtein = meals.reduce((sum, meal) => sum + (meal.protein || 0), 0);
  const totalCarbs = meals.reduce((sum, meal) => sum + (meal.carbs || 0), 0);
  const totalFat = meals.reduce((sum, meal) => sum + (meal.fat || 0), 0);

  // Use gram goals directly from settings
  const totalMacroGrams = totalProtein + totalCarbs + totalFat;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{displayDate}</h1>
            <p className="text-muted-foreground">
              {meals.length} meal{meals.length !== 1 ? 's' : ''} • {totalCalories} calories
            </p>
            <p className="text-sm text-muted-foreground">
              {totalProtein.toFixed(1)}g protein • {totalCarbs.toFixed(1)}g carbs • {totalFat.toFixed(1)}g fat
            </p>
          </div>
        </div>
        <Button onClick={handleAddMeal}>
          <Plus className="h-4 w-4 mr-2" />
          Add Meal
        </Button>
      </div>

      {/* Daily Summary and Progress - Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Main Macronutrients */}
              <div className="grid grid-cols-4 gap-3">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{totalCalories}</p>
                  <p className="text-xs text-muted-foreground">Calories</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{totalProtein.toFixed(1)}g</p>
                  <p className="text-xs text-muted-foreground">Protein</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{totalCarbs.toFixed(1)}g</p>
                  <p className="text-xs text-muted-foreground">Carbs</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-600">{totalFat.toFixed(1)}g</p>
                  <p className="text-xs text-muted-foreground">Fat</p>
                </div>
              </div>

              {/* Additional Metrics */}
              <div className="grid grid-cols-3 gap-3 pt-3 border-t">
                <div className="text-center">
                  <p className="text-lg font-semibold text-primary">{meals.length}</p>
                  <p className="text-xs text-muted-foreground">Meals</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-primary">
                    {totalMacroGrams > 0 ? ((totalProtein / totalMacroGrams) * 100).toFixed(0) : 0}%
                  </p>
                  <p className="text-xs text-muted-foreground">Protein %</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-primary">
                    {totalCalories > 0 ? (totalProtein * 4 + totalCarbs * 4 + totalFat * 9).toFixed(0) : 0}
                  </p>
                  <p className="text-xs text-muted-foreground">Calc. Calories</p>
                </div>
              </div>

              {/* Status Indicators */}
              <div className="space-y-3 pt-3 border-t">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Calorie Status</span>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      totalCalories < userGoals.minCalories ? 'bg-red-500' :
                      totalCalories > userGoals.maxCalories ? 'bg-red-500' : 'bg-green-500'
                    }`}></div>
                    <span className="font-medium">
                      {totalCalories < userGoals.minCalories ? 'Below Goal' :
                       totalCalories > userGoals.maxCalories ? 'Over Goal' : 'Within Range'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Protein Status</span>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      totalProtein < userGoals.proteinGrams * 0.8 ? 'bg-red-500' :
                      totalProtein > userGoals.proteinGrams * 1.2 ? 'bg-red-500' : 'bg-green-500'
                    }`}></div>
                    <span className="font-medium">
                      {totalProtein < userGoals.proteinGrams * 0.8 ? 'Low' :
                       totalProtein > userGoals.proteinGrams * 1.2 ? 'High' : 'Good'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Meal Frequency</span>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      meals.length === 0 ? 'bg-red-500' :
                      meals.length === 1 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}></div>
                    <span className="font-medium">
                      {meals.length === 0 ? 'No Meals' :
                       meals.length === 1 ? 'Single Meal' :
                       meals.length <= 3 ? 'Good' : 'Excellent'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Macro Balance</span>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      (() => {
                        const proteinPercent = totalMacroGrams > 0 ? (totalProtein / totalMacroGrams) * 100 : 0;
                        if (proteinPercent >= 25 && proteinPercent <= 35) return 'bg-green-500';
                        if (proteinPercent >= 20 && proteinPercent <= 40) return 'bg-yellow-500';
                        return 'bg-red-500';
                      })()
                    }`}></div>
                    <span className="font-medium">
                      {(() => {
                        const proteinPercent = totalMacroGrams > 0 ? (totalProtein / totalMacroGrams) * 100 : 0;
                        if (proteinPercent >= 25 && proteinPercent <= 35) return 'Balanced';
                        if (proteinPercent >= 20 && proteinPercent <= 40) return 'Moderate';
                        return 'Unbalanced';
                      })()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Calorie Accuracy</span>
                  <span className="font-medium text-primary">
                    {(() => {
                      const calculatedCalories = totalProtein * 4 + totalCarbs * 4 + totalFat * 9;
                      const difference = Math.abs(totalCalories - calculatedCalories);
                      if (difference <= 50) return 'Excellent';
                      if (difference <= 100) return 'Good';
                      return 'Check Data';
                    })()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Daily Target</span>
                  <span className="font-medium text-primary">
                    {((totalCalories / userGoals.maxCalories) * 100).toFixed(0)}% Complete
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Progress Bars */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ProgressBar
              current={totalCalories}
              goal={userGoals.maxCalories}
              minGoal={userGoals.minCalories}
              label="Calories"
              unit=""
            />
            {userGoals.proteinGrams > 0 && (
              <ProgressBar
                current={totalProtein}
                goal={userGoals.proteinGrams}
                label="Protein"
                color="#2563eb"
                unit="g"
              />
            )}
            {userGoals.carbsGrams > 0 && (
              <ProgressBar
                current={totalCarbs}
                goal={userGoals.carbsGrams}
                label="Carbs"
                color="#16a34a"
                unit="g"
              />
            )}
            {userGoals.fatGrams > 0 && (
              <ProgressBar
                current={totalFat}
                goal={userGoals.fatGrams}
                label="Fat"
                color="#ea580c"
                unit="g"
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Macronutrient Chart */}
      {totalMacroGrams > 0 && (
        <MacronutrientChart
          protein={totalProtein}
          carbs={totalCarbs}
          fat={totalFat}
          goals={userGoals}
        />
      )}

      {/* Meals List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Meals</h2>
        
        {loading ? (
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-muted-foreground">Loading meals...</p>
            </CardContent>
          </Card>
        ) : meals.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center">
                <p className="text-muted-foreground mb-4">No meals recorded for this day</p>
                <Button onClick={handleAddMeal}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Meal
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {meals.map((meal, index) => (
              <Card key={meal.id}>
                <CardContent className="py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium">{index + 1}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-medium break-words">{meal.name}</h3>
                          {meal.description && (
                            <p className="text-xs text-muted-foreground break-words">{meal.description}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="text-right">
                        <p className="font-semibold text-sm">{meal.calories} cal</p>
                        {(meal.protein || meal.carbs || meal.fat) && (
                          <p className="text-xs text-muted-foreground">
                            {meal.protein ? `${meal.protein.toFixed(1)}p ` : ''}
                            {meal.carbs ? `${meal.carbs.toFixed(1)}c ` : ''}
                            {meal.fat ? `${meal.fat.toFixed(1)}f` : ''}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(meal.created_at), 'h:mm a')}
                        </p>
                      </div>
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditMeal(meal)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteMeal(meal.id)}
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Meal Dialog */}
      <MealDialog
        open={showMealDialog}
        onOpenChange={setShowMealDialog}
        date={dateString}
        meal={editingMeal}
        onSave={handleMealSaved}
      />
    </div>
  );
}