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

interface LLMModel {
  id: string;
  name: string;
  description: string;
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
  const [apiKey, setApiKey] = useState('');
  const [selectedModel, setSelectedModel] = useState('x-ai/grok-4-fast:free');
  const [estimating, setEstimating] = useState(false);
  const [estimation, setEstimation] = useState<CalorieEstimation | null>(null);
  const [saving, setSaving] = useState(false);

  const models: LLMModel[] = [
    { id: 'x-ai/grok-4-fast:free', name: 'Grok 4 Fast (Free)', description: 'xAI\'s latest multimodal model - Free tier' },
    { id: 'openai/gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: 'Fast and efficient OpenAI model' },
    { id: 'openai/gpt-4o', name: 'GPT-4o', description: 'Latest GPT-4 model' },
    { id: 'anthropic/claude-3-haiku', name: 'Claude 3 Haiku', description: 'Fast Anthropic model' },
    { id: 'anthropic/claude-3-sonnet', name: 'Claude 3 Sonnet', description: 'Balanced Anthropic model' }
  ];

  // Load saved API key and model from localStorage
  useEffect(() => {
    const savedApiKey = localStorage.getItem('calorie-tracker-api-key');
    const savedModel = localStorage.getItem('calorie-tracker-model');
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
    if (savedModel) {
      setSelectedModel(savedModel);
    }
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

    if (!apiKey.trim()) {
      alert('Please configure your API key in Settings first');
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
          apiKey: apiKey.trim(),
        }),
      });

      if (response.ok) {
        const data: CalorieEstimation = await response.json();
        setEstimation(data);
        setCalories(data.calories.toString());
        setProtein(data.protein.toString());
        setCarbs(data.carbs.toString());
        setFat(data.fat.toString());
        
        // Save API key and model to localStorage for future use
        localStorage.setItem('calorie-tracker-api-key', apiKey.trim());
        localStorage.setItem('calorie-tracker-model', selectedModel);
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
                onChange={(e) => setDescription(e.target.value)}
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
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what you ate... e.g., 'Large grilled chicken salad with mixed greens, cherry tomatoes, cucumber, and olive oil dressing'"
                rows={4}
              />
            </div>

            {!apiKey && (
              <div className="space-y-2">
                <Label htmlFor="api-key">API Key</Label>
                <Input
                  id="api-key"
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your OpenRouter API key"
                />
                <p className="text-xs text-muted-foreground">
                  💡 Tip: Configure your API key in Settings to avoid entering it each time
                </p>
              </div>
            )}

            {apiKey && (
              <div className="bg-green-50 border border-green-200 rounded-md p-3">
                <p className="text-sm text-green-800">
                  ✅ API key configured! You can now estimate calories seamlessly.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {models.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      <div>
                        <div className="font-medium">{model.name}</div>
                        <div className="text-sm text-muted-foreground">{model.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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