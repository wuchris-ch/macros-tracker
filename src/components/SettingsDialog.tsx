'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface UserGoals {
  minCalories: number;
  maxCalories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
}

const DEFAULT_GOALS: UserGoals = {
  minCalories: 1800,
  maxCalories: 2200,
  proteinGrams: 150,
  carbsGrams: 200,
  fatGrams: 65,
};

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { theme, setTheme } = useTheme();
  const [goals, setGoals] = useState<UserGoals>(DEFAULT_GOALS);

  // Load goals from localStorage on mount
  useEffect(() => {
    const savedGoals = localStorage.getItem('calorie-tracker-goals');
    if (savedGoals) {
      try {
        const parsedGoals = JSON.parse(savedGoals);
        
        // Migrate from old percentage-based format to grams
        if (parsedGoals.proteinPercent !== undefined) {
          const maxCal = parsedGoals.maxCalories || 2200;
          setGoals({
            minCalories: parsedGoals.minCalories || 1800,
            maxCalories: maxCal,
            proteinGrams: Math.round((maxCal * (parsedGoals.proteinPercent || 30) / 100) / 4),
            carbsGrams: Math.round((maxCal * (parsedGoals.carbsPercent || 40) / 100) / 4),
            fatGrams: Math.round((maxCal * (parsedGoals.fatPercent || 30) / 100) / 9),
          });
          // Save migrated format
          localStorage.setItem('calorie-tracker-goals', JSON.stringify({
            minCalories: parsedGoals.minCalories || 1800,
            maxCalories: maxCal,
            proteinGrams: Math.round((maxCal * (parsedGoals.proteinPercent || 30) / 100) / 4),
            carbsGrams: Math.round((maxCal * (parsedGoals.carbsPercent || 40) / 100) / 4),
            fatGrams: Math.round((maxCal * (parsedGoals.fatPercent || 30) / 100) / 9),
          }));
        } else {
          setGoals(parsedGoals);
        }
      } catch (error) {
        console.error('Error loading goals:', error);
      }
    }
  }, []);

  // Save goals to localStorage
  const handleSaveGoals = () => {
    localStorage.setItem('calorie-tracker-goals', JSON.stringify(goals));
    alert('Goals saved successfully!');
  };

  const handleGoalChange = (field: keyof UserGoals, value: string) => {
    const numValue = parseFloat(value) || 0;
    setGoals(prev => ({ ...prev, [field]: numValue }));
  };

  const handleSaveGoalsWithValidation = () => {
    // Validate that max > min
    if (goals.maxCalories <= goals.minCalories) {
      alert('Maximum calories must be greater than minimum calories!');
      return;
    }
    handleSaveGoals();
  };

  const handleClearData = () => {
    // First confirmation
    if (!confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      return;
    }
    
    // Second confirmation
    if (!confirm('This will permanently delete ALL your meal data and settings. Are you absolutely certain you want to continue?')) {
      return;
    }
    
    // Third confirmation
    if (!confirm('FINAL WARNING: This is your last chance to cancel. All data will be permanently lost. Do you really want to proceed?')) {
      return;
    }
    
    localStorage.clear();
    alert('All data has been cleared.');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Theme Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Appearance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Choose your preferred theme
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant={theme === 'light' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTheme('light')}
                    className="flex items-center gap-2"
                  >
                    <Sun className="h-4 w-4" />
                    Light
                  </Button>
                  <Button
                    variant={theme === 'dark' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTheme('dark')}
                    className="flex items-center gap-2"
                  >
                    <Moon className="h-4 w-4" />
                    Dark
                  </Button>
                  <Button
                    variant={theme === 'system' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTheme('system')}
                    className="flex items-center gap-2"
                  >
                    <Monitor className="h-4 w-4" />
                    System
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Goals Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Daily Goals</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="minCalories">Minimum Daily Calories</Label>
                  <Input
                    id="minCalories"
                    type="number"
                    value={goals.minCalories}
                    onChange={(e) => handleGoalChange('minCalories', e.target.value)}
                    min="0"
                    step="100"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxCalories">Maximum Daily Calories</Label>
                  <Input
                    id="maxCalories"
                    type="number"
                    value={goals.maxCalories}
                    onChange={(e) => handleGoalChange('maxCalories', e.target.value)}
                    min="0"
                    step="100"
                  />
                  {goals.maxCalories <= goals.minCalories && (
                    <p className="text-xs text-orange-600">
                      Maximum must be greater than minimum
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Macronutrient Targets (grams)</Label>
                  <p className="text-xs text-muted-foreground">
                    Set to 0 to not track that macronutrient
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <Label htmlFor="proteinGrams" className="text-xs text-blue-600">
                        Protein (g)
                      </Label>
                      <Input
                        id="proteinGrams"
                        type="number"
                        value={goals.proteinGrams}
                        onChange={(e) => handleGoalChange('proteinGrams', e.target.value)}
                        min="0"
                        step="1"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="carbsGrams" className="text-xs text-green-600">
                        Carbs (g)
                      </Label>
                      <Input
                        id="carbsGrams"
                        type="number"
                        value={goals.carbsGrams}
                        onChange={(e) => handleGoalChange('carbsGrams', e.target.value)}
                        min="0"
                        step="1"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="fatGrams" className="text-xs text-orange-600">
                        Fat (g)
                      </Label>
                      <Input
                        id="fatGrams"
                        type="number"
                        value={goals.fatGrams}
                        onChange={(e) => handleGoalChange('fatGrams', e.target.value)}
                        min="0"
                        step="1"
                      />
                    </div>
                  </div>
                </div>

                <Button onClick={handleSaveGoalsWithValidation} className="w-full">
                  Save Goals
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* AI Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">AI Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted p-3 rounded-md">
                <p className="text-sm text-muted-foreground">
                  <strong>API Provider:</strong> OpenRouter.ai
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  This app uses OpenRouter&apos;s unified API to access multiple AI models for calorie estimation.
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  <strong>Current Model:</strong> DeepSeek V3.1 (Free)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Data Management */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Data Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  All your meal data is stored locally in your browser and on the local database.
                </p>
                <Button
                  variant="destructive"
                  onClick={handleClearData}
                  className="w-full"
                >
                  Clear All Data
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}