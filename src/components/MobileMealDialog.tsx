'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Sparkles } from 'lucide-react';

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

interface MealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: string;
  meal?: Meal | null;
  onSave: (meal: Meal) => void;
}

interface CalorieEstimation {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  confidence: 'high' | 'medium' | 'low';
  reasoning?: string;
}

export function MobileMealDialog({ open, onOpenChange, date, meal, onSave }: MealDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [estimating, setEstimating] = useState(false);
  const [estimation, setEstimation] = useState<CalorieEstimation | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedModel, setSelectedModel] = useState('microsoft/mai-ds-r1:free');
  const [availableModels, setAvailableModels] = useState<any[]>([]);

  // Load available models on mount
  useEffect(() => {
    const loadModels = async () => {
      try {
        const response = await fetch('/api/llm/models');
        if (response.ok) {
          const models = await response.json();
          setAvailableModels(models);
        }
      } catch (error) {
        console.error('Error loading models:', error);
      }
    };
    loadModels();
  }, []);

  // Reset form when dialog opens/closes or meal changes
  useEffect(() => {
    if (open) {
      if (meal) {
        setName(meal.name);
        setDescription(meal.description || '');
        setCalories(meal.calories.toString());
        setProtein(meal.protein?.toString() || '');
        setCarbs(meal.carbs?.toString() || '');
        setFat(meal.fat?.toString() || '');
      } else {
        setName('');
        setDescription('');
        setCalories('');
        setProtein('');
        setCarbs('');
        setFat('');
      }
      setEstimation(null);
    }
  }, [open, meal]);

  const handleEstimateCalories = async () => {
    if (!description.trim()) {
      alert('Please enter a food description');
      return;
    }

    setEstimating(true);
    setEstimation(null);

    try {
      const response = await fetch('/api/llm/estimate-calories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: description.trim(),
          model: selectedModel,
        }),
      });

      if (response.ok) {
        const data: CalorieEstimation = await response.json();
        setEstimation(data);
        setCalories(data.calories.toString());
        setProtein(data.protein.toString());
        setCarbs(data.carbs.toString());
        setFat(data.fat.toString());
      } else {
        const error = await response.json();
        alert(`Error estimating calories: ${error.error}`);
      }
    } catch (error) {
      console.error('Error estimating calories:', error);
      alert('Failed to estimate calories. Please check your connection and try again.');
    } finally {
      setEstimating(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !calories.trim()) {
      alert('Please enter a meal name and calories');
      return;
    }

    const calorieValue = parseInt(calories);
    if (isNaN(calorieValue) || calorieValue < 0) {
      alert('Please enter a valid number of calories');
      return;
    }

    setSaving(true);

    try {
      const proteinValue = protein.trim() ? parseFloat(protein) : undefined;
      const carbsValue = carbs.trim() ? parseFloat(carbs) : undefined;
      const fatValue = fat.trim() ? parseFloat(fat) : undefined;

      const mealData = {
        date,
        name: name.trim(),
        description: description.trim() || undefined,
        calories: calorieValue,
        protein: proteinValue,
        carbs: carbsValue,
        fat: fatValue,
      };

      let response;
      if (meal) {
        response = await fetch(`/api/meals/${meal.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(mealData),
        });
      } else {
        response = await fetch('/api/meals', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(mealData),
        });
      }

      if (response.ok) {
        const savedMeal = await response.json();
        onSave(savedMeal);
      } else {
        const error = await response.json();
        alert(`Error saving meal: ${error.error}`);
      }
    } catch (error) {
      console.error('Error saving meal:', error);
      alert('Failed to save meal. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] overflow-y-auto mx-2">
        <DialogHeader className="pb-3">
          <DialogTitle className="text-lg">
            {meal ? 'Edit Meal' : 'Add Meal'}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="manual" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-9">
            <TabsTrigger value="manual" className="text-sm">Manual</TabsTrigger>
            <TabsTrigger value="ai" className="text-sm">AI</TabsTrigger>
          </TabsList>

          <TabsContent value="manual" className="space-y-3 mt-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm">Meal Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Breakfast, Lunch"
                className="h-9"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm">Description (optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., Grilled chicken salad"
                rows={2}
                className="text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="calories" className="text-sm">Calories</Label>
              <Input
                id="calories"
                type="number"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                placeholder="e.g., 350"
                min="0"
                className="h-9"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Macronutrients (optional)</Label>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="protein" className="text-xs">Protein (g)</Label>
                  <Input
                    id="protein"
                    type="number"
                    value={protein}
                    onChange={(e) => setProtein(e.target.value)}
                    placeholder="25"
                    min="0"
                    step="0.1"
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="carbs" className="text-xs">Carbs (g)</Label>
                  <Input
                    id="carbs"
                    type="number"
                    value={carbs}
                    onChange={(e) => setCarbs(e.target.value)}
                    placeholder="45"
                    min="0"
                    step="0.1"
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="fat" className="text-xs">Fat (g)</Label>
                  <Input
                    id="fat"
                    type="number"
                    value={fat}
                    onChange={(e) => setFat(e.target.value)}
                    placeholder="12"
                    min="0"
                    step="0.1"
                    className="h-8 text-sm"
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="ai" className="space-y-3 mt-4">
            <div className="space-y-2">
              <Label htmlFor="ai-name" className="text-sm">Meal Name</Label>
              <Input
                id="ai-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Breakfast, Lunch"
                className="h-9"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ai-description" className="text-sm">Food Description</Label>
              <Textarea
                id="ai-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what you ate..."
                rows={3}
                className="text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="model-select" className="text-sm">AI Model</Label>
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select AI model" />
                </SelectTrigger>
                <SelectContent>
                  {availableModels.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{model.name}</span>
                        {model.recommended && (
                          <span className="text-xs bg-green-100 text-green-800 px-1 rounded">
                            Recommended
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleEstimateCalories}
              disabled={estimating || !description.trim()}
              className="w-full h-9"
              size="sm"
            >
              {estimating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Estimating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Estimate Calories
                </>
              )}
            </Button>

            {estimation && (
              <Card>
                <CardContent className="pt-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Calories:</span>
                      <span className="text-xl font-bold">{estimation.calories}</span>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      <div className="text-center p-2 bg-muted/50 rounded">
                        <div className="text-sm font-semibold text-blue-600">{estimation.protein}g</div>
                        <div className="text-xs text-muted-foreground">Protein</div>
                      </div>
                      <div className="text-center p-2 bg-muted/50 rounded">
                        <div className="text-sm font-semibold text-green-600">{estimation.carbs}g</div>
                        <div className="text-xs text-muted-foreground">Carbs</div>
                      </div>
                      <div className="text-center p-2 bg-muted/50 rounded">
                        <div className="text-sm font-semibold text-orange-600">{estimation.fat}g</div>
                        <div className="text-xs text-muted-foreground">Fat</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Confidence:</span>
                      <span className={`text-xs font-medium ${getConfidenceColor(estimation.confidence)}`}>
                        {estimation.confidence.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="space-y-2">
              <Label htmlFor="ai-calories" className="text-sm">Calories</Label>
              <Input
                id="ai-calories"
                type="number"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                placeholder="Auto-filled"
                min="0"
                className="h-9"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Macronutrients</Label>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="ai-protein" className="text-xs">Protein (g)</Label>
                  <Input
                    id="ai-protein"
                    type="number"
                    value={protein}
                    onChange={(e) => setProtein(e.target.value)}
                    placeholder="Auto"
                    min="0"
                    step="0.1"
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="ai-carbs" className="text-xs">Carbs (g)</Label>
                  <Input
                    id="ai-carbs"
                    type="number"
                    value={carbs}
                    onChange={(e) => setCarbs(e.target.value)}
                    placeholder="Auto"
                    min="0"
                    step="0.1"
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="ai-fat" className="text-xs">Fat (g)</Label>
                  <Input
                    id="ai-fat"
                    type="number"
                    value={fat}
                    onChange={(e) => setFat(e.target.value)}
                    placeholder="Auto"
                    min="0"
                    step="0.1"
                    className="h-8 text-sm"
                  />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} size="sm" className="h-9">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || !name.trim() || !calories.trim()} size="sm" className="h-9">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              meal ? 'Update' : 'Add'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
