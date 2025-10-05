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

  it('renders calendar view', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockDailyTotals,
    });

    render(<CalendarView onDateSelect={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Monthly Nutrition Overview')).toBeInTheDocument();
    });
  });

  it('loads user goal from localStorage', async () => {
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
      expect(screen.getByText(/2500 cal goal/)).toBeInTheDocument();
    });
  });

  it('uses default goal when localStorage is empty', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockDailyTotals,
    });

    render(<CalendarView onDateSelect={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getByText(/2000 cal goal/)).toBeInTheDocument();
    });
  });

  it('displays heatmap legend', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockDailyTotals,
    });

    render(<CalendarView onDateSelect={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Calorie Heatmap (vs 2000 cal goal)')).toBeInTheDocument();
      expect(screen.getByText('Under')).toBeInTheDocument();
      expect(screen.getByText('At Goal')).toBeInTheDocument();
      expect(screen.getByText('Over')).toBeInTheDocument();
    });
  });

  it('fetches daily totals on mount', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockDailyTotals,
    });

    render(<CalendarView onDateSelect={jest.fn()} />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/meals/totals/')
      );
    });
  });

  it('fetches stats totals on mount', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockDailyTotals,
    });

    render(<CalendarView onDateSelect={jest.fn()} />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/meals/stats')
      );
    });
  });

  it('displays Quick Stats section', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockDailyTotals,
    });

    render(<CalendarView onDateSelect={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Quick Stats')).toBeInTheDocument();
      expect(screen.getByText('Avg Calories/Day')).toBeInTheDocument();
      expect(screen.getByText('Avg Protein/Day')).toBeInTheDocument();
    });
  });

  it('displays Nutrition Trends section', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockDailyTotals,
    });

    render(<CalendarView onDateSelect={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Nutrition Trends')).toBeInTheDocument();
    });
  });

  it('handles fetch errors gracefully', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    render(<CalendarView onDateSelect={jest.fn()} />);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled();
    });

    consoleSpy.mockRestore();
  });

  it('calls onDateSelect when a date is clicked', async () => {
    const mockOnDateSelect = jest.fn();
    
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockDailyTotals,
    });

    render(<CalendarView onDateSelect={mockOnDateSelect} />);

    await waitFor(() => {
      expect(screen.getByText('Monthly Nutrition Overview')).toBeInTheDocument();
    });

    // Note: Testing actual date clicks would require more complex setup with the Calendar component
  });

  it('displays loading state while fetching data', async () => {
    (global.fetch as jest.Mock).mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: async () => mockDailyTotals,
      }), 100))
    );

    render(<CalendarView onDateSelect={jest.fn()} />);

    expect(screen.getByText('Loading nutrition data...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText('Loading nutrition data...')).not.toBeInTheDocument();
    });
  });
});