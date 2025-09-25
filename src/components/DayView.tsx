'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Plus, Edit, Trash2 } from 'lucide-react';
import { MealDialog } from '@/components/MealDialog';

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

interface DayViewProps {
  date: Date;
  onBack: () => void;
}

export function DayView({ date, onBack }: DayViewProps) {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(false);
  const [showMealDialog, setShowMealDialog] = useState(false);
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);

  const dateString = format(date, 'yyyy-MM-dd');
  const displayDate = format(date, 'EEEE, MMMM d, yyyy');

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

      {/* Daily Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">{totalCalories}</p>
              <p className="text-sm text-muted-foreground">Calories</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">{totalProtein.toFixed(1)}g</p>
              <p className="text-sm text-muted-foreground">Protein</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">{totalCarbs.toFixed(1)}g</p>
              <p className="text-sm text-muted-foreground">Carbs</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-orange-600">{totalFat.toFixed(1)}g</p>
              <p className="text-sm text-muted-foreground">Fat</p>
            </div>
          </div>
        </CardContent>
      </Card>

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
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium">{index + 1}</span>
                        </div>
                        <div>
                          <h3 className="font-medium">{meal.name}</h3>
                          {meal.description && (
                            <p className="text-sm text-muted-foreground">{meal.description}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <p className="font-semibold">{meal.calories} cal</p>
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
                          size="icon"
                          onClick={() => handleEditMeal(meal)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteMeal(meal.id)}
                        >
                          <Trash2 className="h-4 w-4" />
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