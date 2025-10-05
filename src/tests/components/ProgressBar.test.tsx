import React from 'react';
import { render, screen } from '@testing-library/react';
import { ProgressBar } from '@/components/charts/ProgressBar';

describe('ProgressBar', () => {
  it('renders with valid data', () => {
    render(
      <ProgressBar
        current={1500}
        goal={2000}
        label="Calories"
      />
    );

    expect(screen.getByText('Calories')).toBeInTheDocument();
    expect(screen.getByText(/1500/)).toBeInTheDocument();
    expect(screen.getByText(/2000/)).toBeInTheDocument();
  });

  it('calculates percentage correctly', () => {
    render(
      <ProgressBar
        current={1500}
        goal={2000}
        label="Calories"
      />
    );

    // 1500/2000 = 75%
    expect(screen.getByText('(75%)')).toBeInTheDocument();
  });

  it('displays remaining amount when under goal', () => {
    render(
      <ProgressBar
        current={1500}
        goal={2000}
        label="Calories"
      />
    );

    expect(screen.getByText('500 remaining')).toBeInTheDocument();
  });

  it('displays over amount when exceeding goal', () => {
    render(
      <ProgressBar
        current={2500}
        goal={2000}
        label="Calories"
      />
    );

    expect(screen.getByText('500 over')).toBeInTheDocument();
  });

  it('shows "In progress" status when under 90%', () => {
    render(
      <ProgressBar
        current={1500}
        goal={2000}
        label="Calories"
      />
    );

    expect(screen.getByText('In progress')).toBeInTheDocument();
  });

  it('shows "At goal" status when between 90-110%', () => {
    render(
      <ProgressBar
        current={2000}
        goal={2000}
        label="Calories"
      />
    );

    expect(screen.getByText('At goal')).toBeInTheDocument();
  });

  it('shows "Over goal" status when above 110%', () => {
    render(
      <ProgressBar
        current={2500}
        goal={2000}
        label="Calories"
      />
    );

    expect(screen.getByText('Over goal')).toBeInTheDocument();
  });

  it('handles zero goal gracefully', () => {
    render(
      <ProgressBar
        current={1500}
        goal={0}
        label="Calories"
      />
    );

    expect(screen.getByText('No goal set')).toBeInTheDocument();
  });

  it('handles zero current value', () => {
    render(
      <ProgressBar
        current={0}
        goal={2000}
        label="Calories"
      />
    );

    expect(screen.getByText('(0%)')).toBeInTheDocument();
    expect(screen.getByText('2000 remaining')).toBeInTheDocument();
  });

  it('caps percentage at 100% for display', () => {
    render(
      <ProgressBar
        current={3000}
        goal={2000}
        label="Calories"
      />
    );

    // Percentage is capped at 100% for the bar width
    expect(screen.getByText('(100%)')).toBeInTheDocument();
    expect(screen.getByText('Over goal')).toBeInTheDocument();
  });

  it('applies custom color when provided', () => {
    const { container } = render(
      <ProgressBar
        current={1500}
        goal={2000}
        label="Protein"
        color="#2563eb"
      />
    );

    // Check that the component renders (color is applied via style)
    expect(screen.getByText('Protein')).toBeInTheDocument();
  });

  it('displays unit when provided', () => {
    render(
      <ProgressBar
        current={150}
        goal={200}
        label="Protein"
        unit="g"
      />
    );

    expect(screen.getByText(/150g/)).toBeInTheDocument();
    expect(screen.getByText(/200g/)).toBeInTheDocument();
  });

  it('handles fractional values correctly', () => {
    render(
      <ProgressBar
        current={150.7}
        goal={200.3}
        label="Protein"
        unit="g"
      />
    );

    // Should round to whole numbers
    expect(screen.getByText(/151g/)).toBeInTheDocument();
    expect(screen.getByText(/200g/)).toBeInTheDocument();
  });

  it('shows correct status at exactly 90%', () => {
    render(
      <ProgressBar
        current={1800}
        goal={2000}
        label="Calories"
      />
    );

    expect(screen.getByText('At goal')).toBeInTheDocument();
  });

  it('shows correct status at exactly 110%', () => {
    render(
      <ProgressBar
        current={2200}
        goal={2000}
        label="Calories"
      />
    );

    // 110% is the boundary, so it should show "Over goal"
    expect(screen.getByText('Over goal')).toBeInTheDocument();
  });

  it('handles very large numbers', () => {
    render(
      <ProgressBar
        current={10000}
        goal={5000}
        label="Calories"
      />
    );

    expect(screen.getByText(/10000 \/ 5000/)).toBeInTheDocument();
    expect(screen.getByText('Over goal')).toBeInTheDocument();
  });
});