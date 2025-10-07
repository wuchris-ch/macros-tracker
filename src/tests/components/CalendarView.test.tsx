import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { CalendarView } from '@/components/CalendarView';

// Mock fetch
global.fetch = jest.fn();

const mockDailyTotals = [
  {
    date: '2024-01-01',
    total_calories: 2000,
    total_protein: 150,
    total_carbs: 200,
    total_fat: 50,
    meal_count: 3,
  },
  {
    date: '2024-01-02',
    total_calories: 2200,
    total_protein: 160,
    total_carbs: 220,
    total_fat: 55,
    meal_count: 3,
  },
  {
    date: '2024-01-03',
    total_calories: 1800,
    total_protein: 140,
    total_carbs: 180,
    total_fat: 45,
    meal_count: 2,
  },
];

describe('CalendarView', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
    localStorage.clear();
  });

  it('renders main components', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockDailyTotals,
    });

    render(<CalendarView onDateSelect={jest.fn()} />);

    await waitFor(() => {
      // Core UI elements
      expect(screen.getByText('Monthly Nutrition Overview')).toBeInTheDocument();
      expect(screen.getByText('Quick Stats')).toBeInTheDocument();
      expect(screen.getByText('Nutrition Trends')).toBeInTheDocument();
    });
  });

  it('loads goals from localStorage', async () => {
    const mockGoals = {
      minCalories: 2000,
      maxCalories: 2500,
      proteinGrams: 150,
      carbsGrams: 200,
      fatGrams: 65,
    };
    localStorage.setItem('calorie-tracker-goals', JSON.stringify(mockGoals));

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockDailyTotals,
    });

    render(<CalendarView onDateSelect={jest.fn()} />);

    await waitFor(() => {
      // Check that custom goals are applied to heatmap
      expect(screen.getByText('Below 2000 cal')).toBeInTheDocument();
      expect(screen.getByText('2000-2500 cal')).toBeInTheDocument();
      expect(screen.getByText('Above 2500 cal')).toBeInTheDocument();
    });
  });

  it('uses default goals when localStorage is empty', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockDailyTotals,
    });

    render(<CalendarView onDateSelect={jest.fn()} />);

    await waitFor(() => {
      // Check that default goals are used
      expect(screen.getByText('Below 1800 cal')).toBeInTheDocument();
      expect(screen.getByText('1800-2200 cal')).toBeInTheDocument();
      expect(screen.getByText('Above 2200 cal')).toBeInTheDocument();
    });
  });

  it('fetches data on mount', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockDailyTotals,
    });

    render(<CalendarView onDateSelect={jest.fn()} />);

    await waitFor(() => {
      // Verify API calls are made
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/meals/totals/')
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/meals/stats')
      );
    });
  });

  it('handles loading states', async () => {
    (global.fetch as jest.Mock).mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: async () => mockDailyTotals,
      }), 100))
    );

    render(<CalendarView onDateSelect={jest.fn()} />);

    // Check loading state appears
    expect(screen.getByText('Loading nutrition data...')).toBeInTheDocument();

    // Check loading state disappears
    await waitFor(() => {
      expect(screen.queryByText('Loading nutrition data...')).not.toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    render(<CalendarView onDateSelect={jest.fn()} />);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled();
    });

    consoleSpy.mockRestore();
  });
});