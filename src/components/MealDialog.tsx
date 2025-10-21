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
import { Loader2, Sparkles, AlertCircle, Info } from 'lucide-react';

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

export function MealDialog({ open, onOpenChange, date, meal, onSave }: MealDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [estimating, setEstimating] = useState(false);
  const [estimation, setEstimation] = useState<CalorieEstimation | null>(null);
  const [estimationFeedback, setEstimationFeedback] = useState<{ tone: 'error' | 'info'; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedModel, setSelectedModel] = useState('microsoft/mai-ds-r1:free');
  const [availableModels, setAvailableModels] = useState<any[]>([]);

  const handleDescriptionChange = (value: string) => {
    setDescription(value);
    if (estimationFeedback) {
      setEstimationFeedback(null);
    }
  };

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
      setEstimationFeedback(null);
    }
  }, [open, meal]);

  const handleEstimateCalories = async () => {
    if (!description.trim()) {
      setEstimationFeedback({
        tone: 'error',
        text: 'Describe what you ate so we can estimate the nutrition.',
      });
      return;
    }

    setEstimating(true);
    setEstimation(null);
    setEstimationFeedback({
      tone: 'info',
      text: 'Analyzing your description. This usually takes just a moment.',
    });

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
         setEstimationFeedback({
          tone: 'info',
          text: 'We filled in the nutrition details based on your description. Tweak anything before saving.',
        });
      } else {
        const error = await response.json();
        setEstimationFeedback({
          tone: 'error',
          text: error?.error
            ? `We couldn't estimate calories: ${error.error}. Try again in a moment or adjust your description.`
            : 'We could not estimate calories right now. Please try again in a moment.',
        });
      }
    } catch (error) {
      console.error('Error estimating calories:', error);
      setEstimationFeedback({
        tone: 'error',
        text: 'We hit a connection issue while estimating. Check your connection and try again.',
      });
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
        // Update existing meal
        response = await fetch(`/api/meals/${meal.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(mealData),
        });
      } else {
        // Create new meal
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {meal ? 'Edit Meal' : 'Add New Meal'}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="manual" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual">Manual Entry</TabsTrigger>
            <TabsTrigger value="ai">AI Estimation</TabsTrigger>
          </TabsList>

          <TabsContent value="manual" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Meal Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Breakfast, Lunch, Snack"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => handleDescriptionChange(e.target.value)}
                placeholder="e.g., Grilled chicken salad with vegetables"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="calories">Calories</Label>
              <Input
                id="calories"
                type="number"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                placeholder="e.g., 350"
                min="0"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="protein">Protein (g)</Label>
                <Input
                  id="protein"
                  type="number"
                  value={protein}
                  onChange={(e) => setProtein(e.target.value)}
                  placeholder="e.g., 25"
                  min="0"
                  step="0.1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="carbs">Carbs (g)</Label>
                <Input
                  id="carbs"
                  type="number"
                  value={carbs}
                  onChange={(e) => setCarbs(e.target.value)}
                  placeholder="e.g., 45"
                  min="0"
                  step="0.1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fat">Fat (g)</Label>
                <Input
                  id="fat"
                  type="number"
                  value={fat}
                  onChange={(e) => setFat(e.target.value)}
                  placeholder="e.g., 12"
                  min="0"
                  step="0.1"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="ai" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ai-name">Meal Name</Label>
              <Input
                id="ai-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Breakfast, Lunch, Snack"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ai-description">Food Description</Label>
              <Textarea
                id="ai-description"
                value={description}
                onChange={(e) => handleDescriptionChange(e.target.value)}
                placeholder="Describe what you ate... e.g., 'Large grilled chicken salad with mixed greens, cherry tomatoes, cucumber, and olive oil dressing'"
                rows={4}
              />
            </div>

            {estimationFeedback && (
              <div
                className={`flex items-start gap-2 rounded-md border px-3 py-2 text-sm ${
                  estimationFeedback.tone === 'error'
                    ? 'border-red-200 bg-red-50 text-red-700'
                    : 'border-blue-200 bg-blue-50 text-blue-700'
                }`}
                aria-live="polite"
              >
                {estimationFeedback.tone === 'error' ? (
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" aria-hidden="true" />
                ) : (
                  <Info className="h-4 w-4 mt-0.5 shrink-0" aria-hidden="true" />
                )}
                <span>{estimationFeedback.text}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="model-select">AI Model</Label>
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger>
                  <SelectValue placeholder="Select AI model" />
                </SelectTrigger>
                <SelectContent>
                  {availableModels.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      <div className="flex items-center gap-2">
                        <span>{model.name}</span>
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
              {availableModels.find(m => m.id === selectedModel) && (
                <p className="text-xs text-muted-foreground">
                  {availableModels.find(m => m.id === selectedModel)?.description}
                </p>
              )}
            </div>

            <Button
              onClick={handleEstimateCalories}
              disabled={estimating || !description.trim()}
              className="w-full"
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
                <CardContent className="pt-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Estimated Calories:</span>
                      <span className="text-2xl font-bold">{estimation.calories}</span>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 mt-3">
                      <div className="text-center">
                        <div className="text-lg font-semibold text-blue-600">{estimation.protein}g</div>
                        <div className="text-xs text-muted-foreground">Protein</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-green-600">{estimation.carbs}g</div>
                        <div className="text-xs text-muted-foreground">Carbs</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-orange-600">{estimation.fat}g</div>
                        <div className="text-xs text-muted-foreground">Fat</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <span className="text-sm text-muted-foreground">Confidence:</span>
                      <span className={`text-sm font-medium ${getConfidenceColor(estimation.confidence)}`}>
                        {estimation.confidence.toUpperCase()}
                      </span>
                    </div>
                    {estimation.reasoning && (
                      <div className="mt-3">
                        <span className="text-sm font-medium">Reasoning:</span>
                        <p className="text-sm text-muted-foreground mt-1">{estimation.reasoning}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="space-y-2">
              <Label htmlFor="ai-calories">Calories (you can adjust if needed)</Label>
              <Input
                id="ai-calories"
                type="number"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                placeholder="Calories will be filled automatically"
                min="0"
              />
            </div>

            <div className="space-y-2">
              <Label>Macronutrients (you can adjust if needed)</Label>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ai-protein">Protein (g)</Label>
                  <Input
                    id="ai-protein"
                    type="number"
                    value={protein}
                    onChange={(e) => setProtein(e.target.value)}
                    placeholder="Auto-filled"
                    min="0"
                    step="0.1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ai-carbs">Carbs (g)</Label>
                  <Input
                    id="ai-carbs"
                    type="number"
                    value={carbs}
                    onChange={(e) => setCarbs(e.target.value)}
                    placeholder="Auto-filled"
                    min="0"
                    step="0.1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ai-fat">Fat (g)</Label>
                  <Input
                    id="ai-fat"
                    type="number"
                    value={fat}
                    onChange={(e) => setFat(e.target.value)}
                    placeholder="Auto-filled"
                    min="0"
                    step="0.1"
                  />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || !name.trim() || !calories.trim()}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              meal ? 'Update Meal' : 'Add Meal'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
