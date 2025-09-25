'use client';

import { useState } from 'react';
import { CalendarView } from '@/components/CalendarView';
import { DayView } from '@/components/DayView';
import { SettingsDialog } from '@/components/SettingsDialog';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';

export default function Home() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Calorie Tracker</h1>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowSettings(true)}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {selectedDate ? (
          <DayView
            date={selectedDate}
            onBack={() => setSelectedDate(null)}
          />
        ) : (
          <CalendarView
            onDateSelect={setSelectedDate}
          />
        )}
      </main>

      <SettingsDialog
        open={showSettings}
        onOpenChange={setShowSettings}
      />
    </div>
  );
}
