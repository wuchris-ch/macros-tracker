'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Plus, Edit, Trash2 } from 'lucide-react';
import { MobileMealDialog } from '@/components/MobileMealDialog';
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

interface MobileDayViewProps {
  date: Date;
  onBack: () => void;
}

export function MobileDayView({ date, onBack }: MobileDayViewProps) {
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
  const displayDate = format(date, 'EEE, MMM d');

  // Load user goals from localStorage
  useEffect(() => {
    const savedGoals = localStorage.getItem('calorie-tracker-goals');
    if (savedGoals) {
      try {
        const goals = JSON.parse(savedGoals);
        
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
    if (!confirm('Delete this meal?')) {
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
      setMeals(meals.map(meal => meal.id === savedMeal.id ? savedMeal : meal));
    } else {
      setMeals([...meals, savedMeal]);
    }
    setShowMealDialog(false);
    setEditingMeal(null);
  };

  const totalCalories = meals.reduce((sum, meal) => sum + meal.calories, 0);
  const totalProtein = meals.reduce((sum, meal) => sum + (meal.protein || 0), 0);
  const totalCarbs = meals.reduce((sum, meal) => sum + (meal.carbs || 0), 0);
  const totalFat = meals.reduce((sum, meal) => sum + (meal.fat || 0), 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm" onClick={onBack} className="h-8 w-8 p-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-lg font-bold">{displayDate}</h1>
            <p className="text-sm text-muted-foreground">
              {meals.length} meal{meals.length !== 1 ? 's' : ''} • {totalCalories} cal
            </p>
          </div>
        </div>
        <Button onClick={handleAddMeal} size="sm" className="h-8">
          <Plus className="h-4 w-4 mr-1" />
          Add
        </Button>
      </div>

      {/* Daily Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Daily Summary</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-4">
            {/* Main Macronutrients */}
            <div className="grid grid-cols-4 gap-2">
              <div className="text-center p-2 bg-muted/50 rounded-lg">
                <p className="text-lg font-bold text-primary">{totalCalories}</p>
                <p className="text-xs text-muted-foreground">Calories</p>
              </div>
              <div className="text-center p-2 bg-muted/50 rounded-lg">
                <p className="text-lg font-bold text-blue-600">{totalProtein.toFixed(1)}g</p>
                <p className="text-xs text-muted-foreground">Protein</p>
              </div>
              <div className="text-center p-2 bg-muted/50 rounded-lg">
                <p className="text-lg font-bold text-green-600">{totalCarbs.toFixed(1)}g</p>
                <p className="text-xs text-muted-foreground">Carbs</p>
              </div>
              <div className="text-center p-2 bg-muted/50 rounded-lg">
                <p className="text-lg font-bold text-orange-600">{totalFat.toFixed(1)}g</p>
                <p className="text-xs text-muted-foreground">Fat</p>
              </div>
            </div>

            {/* Status Indicators */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Calorie Status</span>
                <div className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${
                    totalCalories < userGoals.minCalories ? 'bg-red-500' :
                    totalCalories > userGoals.maxCalories ? 'bg-red-500' : 'bg-green-500'
                  }`}></div>
                  <span className="font-medium text-xs">
                    {totalCalories < userGoals.minCalories ? 'Below Goal' :
                     totalCalories > userGoals.maxCalories ? 'Over Goal' : 'Within Range'}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Daily Target</span>
                <span className="font-medium text-primary text-xs">
                  {((totalCalories / userGoals.maxCalories) * 100).toFixed(0)}% Complete
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress Bars */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Progress</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
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

      {/* Macronutrient Chart */}
      {(totalProtein + totalCarbs + totalFat) > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Macronutrients</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <MacronutrientChart
              protein={totalProtein}
              carbs={totalCarbs}
              fat={totalFat}
              goals={userGoals}
            />
          </CardContent>
        </Card>
      )}

      {/* Meals List */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold">Meals</h2>
        
        {loading ? (
          <Card>
            <CardContent className="py-6">
              <p className="text-center text-muted-foreground text-sm">Loading meals...</p>
            </CardContent>
          </Card>
        ) : meals.length === 0 ? (
          <Card>
            <CardContent className="py-6">
              <div className="text-center">
                <p className="text-muted-foreground mb-3 text-sm">No meals recorded</p>
                <Button onClick={handleAddMeal} size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Meal
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {meals.map((meal, index) => (
              <Card key={meal.id}>
                <CardContent className="py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <div className="w-5 h-5 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-medium">{index + 1}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-medium text-sm truncate">{meal.name}</h3>
                          {meal.description && (
                            <p className="text-xs text-muted-foreground truncate">{meal.description}</p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(meal.created_at), 'h:mm a')}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <div className="text-right">
                        <p className="font-semibold text-sm">{meal.calories} cal</p>
                        {(meal.protein || meal.carbs || meal.fat) && (
                          <p className="text-xs text-muted-foreground">
                            {meal.protein ? `${meal.protein.toFixed(1)}p ` : ''}
                            {meal.carbs ? `${meal.carbs.toFixed(1)}c ` : ''}
                            {meal.fat ? `${meal.fat.toFixed(1)}f` : ''}
                          </p>
                        )}
                      </div>
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditMeal(meal)}
                          className="h-7 w-7 p-0"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteMeal(meal.id)}
                          className="h-7 w-7 p-0"
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
      <MobileMealDialog
        open={showMealDialog}
        onOpenChange={setShowMealDialog}
        date={dateString}
        meal={editingMeal}
        onSave={handleMealSaved}
      />
    </div>
  );
}
