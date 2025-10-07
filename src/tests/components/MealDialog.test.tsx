import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MealDialog } from '@/components/MealDialog';

// Mock fetch
global.fetch = jest.fn();

// Mock alert
global.alert = jest.fn();

describe('MealDialog', () => {
  const mockOnSave = jest.fn();
  const mockOnCancel = jest.fn();
  const testDate = '2024-01-14';

  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
    mockOnSave.mockClear();
    mockOnCancel.mockClear();
    (global.alert as jest.Mock).mockClear();
  });

  it('renders dialog when open', () => {
    render(
      <MealDialog
        open={true}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
        date={testDate}
      />
    );

    expect(screen.getByText('Add New Meal')).toBeInTheDocument();
    expect(screen.getByText('Manual Entry')).toBeInTheDocument();
    expect(screen.getByText('AI Estimation')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <MealDialog
        open={false}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
        date={testDate}
      />
    );

    expect(screen.queryByText('Add New Meal')).not.toBeInTheDocument();
  });

  it('has required form fields', () => {
    render(
      <MealDialog
        open={true}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
        date={testDate}
      />
    );

    expect(screen.getByLabelText(/meal name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/calories/i)).toBeInTheDocument();
  });

  it('can switch between manual and AI tabs', async () => {
    const user = userEvent.setup();
    
    render(
      <MealDialog
        open={true}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
        date={testDate}
      />
    );

    // Switch to AI tab
    await user.click(screen.getByText('AI Estimation'));
    
    expect(screen.getByText('Food Description')).toBeInTheDocument();
  });
});