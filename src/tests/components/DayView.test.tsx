import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { DayView } from '@/components/DayView';

// Mock fetch
global.fetch = jest.fn();

// Mock MealDialog component
const mockSavedMeal = {
  id: 99,
  date: '2024-01-14',
  name: 'Mock Meal',
  description: 'Test description',
  calories: 400,
  protein: 30,
  carbs: 40,
  fat: 12,
  created_at: '2024-01-14T12:00:00Z',
  updated_at: '2024-01-14T12:00:00Z',
};

jest.mock('@/components/MealDialog', () => ({
  MealDialog: ({ open, onSave }: any) =>
    open ? (
      <div data-testid="meal-dialog">
        <button onClick={() => onSave(mockSavedMeal)}>Save Meal</button>
      </div>
    ) : null,
}));

// Mock chart components
jest.mock('@/components/charts/MacronutrientChart', () => ({
  MacronutrientChart: () => <div data-testid="macronutrient-chart">Chart</div>
}));

jest.mock('@/components/charts/ProgressBar', () => ({
  ProgressBar: ({ label }: any) => <div data-testid="progress-bar">{label}</div>
}));

describe('DayView', () => {
  const mockOnBack = jest.fn();
  const testDate = new Date('2024-01-14');

  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
    localStorage.clear();
    mockOnBack.mockClear();
  });

  it('renders basic component structure', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => [],
    } as Response);

    render(<DayView date={testDate} onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText('Daily Summary')).toBeInTheDocument();
      expect(screen.getByText('Daily Progress')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Meals' })).toBeInTheDocument();
    });
  });

  it('displays meals when data is available', async () => {
    const mockMeals = [
      {
        id: 1,
        date: '2024-01-14',
        name: 'Breakfast',
        description: 'Test meal',
        calories: 350,
        protein: 20,
        carbs: 30,
        fat: 15,
        created_at: '2024-01-14T08:00:00Z',
        updated_at: '2024-01-14T08:00:00Z'
      }
    ];

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockMeals,
    } as Response);

    render(<DayView date={testDate} onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText('Breakfast')).toBeInTheDocument();
      expect(screen.getByText('Test meal')).toBeInTheDocument();
    });
  });

  it('shows empty state when no meals', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => [],
    } as Response);

    render(<DayView date={testDate} onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText('No meals recorded for this day')).toBeInTheDocument();
    });
  });

  it('shows a dismissible success message after saving a meal', async () => {
    jest.useFakeTimers();

    try {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => [],
      } as Response);

      render(<DayView date={testDate} onBack={mockOnBack} />);

      await waitFor(() => {
        expect(screen.getByText('Daily Summary')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /add meal/i }));
      fireEvent.click(screen.getByRole('button', { name: 'Save Meal' }));

      await waitFor(() => {
        expect(screen.getByText('Meal added successfully')).toBeInTheDocument();
      });

      act(() => {
        jest.advanceTimersByTime(4000);
      });

      await waitFor(() => {
        expect(screen.queryByText('Meal added successfully')).not.toBeInTheDocument();
      });
    } finally {
      jest.useRealTimers();
    }
  });
});
