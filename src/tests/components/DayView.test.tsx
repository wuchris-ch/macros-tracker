import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { DayView } from '@/components/DayView';

// Mock fetch
global.fetch = jest.fn();

// Mock MealDialog component
jest.mock('@/components/MealDialog', () => ({
  MealDialog: ({ open }: any) => (
    open ? <div data-testid="meal-dialog">Meal Dialog</div> : null
  )
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
      expect(screen.getByText('Meals')).toBeInTheDocument();
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
});