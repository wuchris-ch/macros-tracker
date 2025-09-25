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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff } from 'lucide-react';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface LLMModel {
  id: string;
  name: string;
  description: string;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const [apiKey, setApiKey] = useState('');
  const [selectedModel, setSelectedModel] = useState('x-ai/grok-4-fast:free');
  const [showApiKey, setShowApiKey] = useState(false);

  const models: LLMModel[] = [
    { id: 'x-ai/grok-4-fast:free', name: 'Grok 4 Fast (Free)', description: 'xAI\'s latest multimodal model - Free tier' },
    { id: 'openai/gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: 'Fast and efficient OpenAI model' },
    { id: 'openai/gpt-4o', name: 'GPT-4o', description: 'Latest GPT-4 model' },
    { id: 'anthropic/claude-3-haiku', name: 'Claude 3 Haiku', description: 'Fast Anthropic model' },
    { id: 'anthropic/claude-3-sonnet', name: 'Claude 3 Sonnet', description: 'Balanced Anthropic model' }
  ];

  // Load settings from localStorage
  useEffect(() => {
    if (open) {
      const savedApiKey = localStorage.getItem('calorie-tracker-api-key') || '';
      const savedModel = localStorage.getItem('calorie-tracker-model') || 'x-ai/grok-4-fast:free';
      
      setApiKey(savedApiKey);
      setSelectedModel(savedModel);
    }
  }, [open]);

  const handleSave = () => {
    // Save settings to localStorage
    localStorage.setItem('calorie-tracker-api-key', apiKey);
    localStorage.setItem('calorie-tracker-model', selectedModel);
    
    onOpenChange(false);
  };

  const handleClearData = () => {
    if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      localStorage.clear();
      setApiKey('');
      setSelectedModel('x-ai/grok-4-fast:free');
      alert('All data has been cleared.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* API Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">API Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="api-key">OpenRouter API Key</Label>
                <div className="relative">
                  <Input
                    id="api-key"
                    type={showApiKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-or-v1-..."
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Configure once here for seamless AI calorie estimation. Your key is stored locally and never sent to our servers.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="model">Default Model</Label>
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

              <div className="bg-muted p-3 rounded-md">
                <p className="text-sm text-muted-foreground">
                  <strong>API Provider:</strong> OpenRouter.ai
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  This app uses OpenRouter&apos;s unified API to access multiple AI models for calorie estimation.
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  <strong>Free Model:</strong> Grok 4 Fast is available at no cost!
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  💡 <strong>Tip:</strong> Once configured here, you won&apos;t need to enter your API key again for AI estimations.
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

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Settings
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}