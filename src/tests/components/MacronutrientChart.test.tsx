import React from 'react';
import { render, screen } from '@testing-library/react';
import { MacronutrientChart } from '@/components/charts/MacronutrientChart';

describe('MacronutrientChart', () => {
  it('renders with valid data', () => {
    render(
      <MacronutrientChart
        protein={100}
        carbs={200}
        fat={50}
      />
    );

    expect(screen.getByText('Macronutrient Breakdown')).toBeInTheDocument();
    expect(screen.getByText('Protein')).toBeInTheDocument();
    expect(screen.getByText('Carbs')).toBeInTheDocument();
    expect(screen.getByText('Fat')).toBeInTheDocument();
  });

  it('calculates percentages correctly', () => {
    render(
      <MacronutrientChart
        protein={100}
        carbs={200}
        fat={50}
      />
    );

    // Total = 350g
    // Protein: 100/350 = 28.6%
    // Carbs: 200/350 = 57.1%
    // Fat: 50/350 = 14.3%
    expect(screen.getByText(/28\.6%/)).toBeInTheDocument();
    expect(screen.getByText(/57\.1%/)).toBeInTheDocument();
    expect(screen.getByText(/14\.3%/)).toBeInTheDocument();
  });

  it('displays actual gram values', () => {
    render(
      <MacronutrientChart
        protein={100}
        carbs={200}
        fat={50}
      />
    );

    expect(screen.getByText('100.0g')).toBeInTheDocument();
    expect(screen.getByText('200.0g')).toBeInTheDocument();
    expect(screen.getByText('50.0g')).toBeInTheDocument();
  });

  it('shows goal comparison when goals are provided', () => {
    render(
      <MacronutrientChart
        protein={100}
        carbs={200}
        fat={50}
        goals={{
          proteinPercent: 30,
          carbsPercent: 50,
          fatPercent: 20,
        }}
      />
    );

    expect(screen.getByText('Target: 30%')).toBeInTheDocument();
    expect(screen.getByText('Target: 50%')).toBeInTheDocument();
    expect(screen.getByText('Target: 20%')).toBeInTheDocument();
  });

  it('indicates when macros meet targets', () => {
    render(
      <MacronutrientChart
        protein={100}
        carbs={200}
        fat={50}
        goals={{
          proteinPercent: 30, // Actual: 28.6% - within 5% tolerance
          carbsPercent: 57,   // Actual: 57.1% - within 5% tolerance
          fatPercent: 15,     // Actual: 14.3% - within 5% tolerance
        }}
      />
    );

    const onTargetElements = screen.getAllByText(/✓ On target/);
    expect(onTargetElements.length).toBeGreaterThan(0);
  });

  it('indicates when macros are off target', () => {
    render(
      <MacronutrientChart
        protein={100}
        carbs={200}
        fat={50}
        goals={{
          proteinPercent: 50, // Actual: 28.6% - more than 5% off
          carbsPercent: 30,   // Actual: 57.1% - more than 5% off
          fatPercent: 20,     // Actual: 14.3% - more than 5% off
        }}
      />
    );

    const offTargetElements = screen.getAllByText(/⚠ Off target/);
    expect(offTargetElements.length).toBeGreaterThan(0);
  });

  it('handles zero values gracefully', () => {
    render(
      <MacronutrientChart
        protein={0}
        carbs={0}
        fat={0}
      />
    );

    expect(screen.getByText('No macronutrient data available')).toBeInTheDocument();
  });

  it('handles missing data (only some macros)', () => {
    render(
      <MacronutrientChart
        protein={100}
        carbs={0}
        fat={0}
      />
    );

    // Should still render with 100% protein
    expect(screen.getByText('100.0g')).toBeInTheDocument();
    expect(screen.getByText(/100\.0%/)).toBeInTheDocument();
  });

  it('renders without goals', () => {
    render(
      <MacronutrientChart
        protein={100}
        carbs={200}
        fat={50}
      />
    );

    // Should not show target information
    expect(screen.queryByText(/Target:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/On target/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Off target/)).not.toBeInTheDocument();
  });
});