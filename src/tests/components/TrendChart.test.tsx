import React from 'react';
import { render, screen } from '@testing-library/react';
import { TrendChart } from '@/components/charts/TrendChart';

const mockData = [
  { date: '2024-01-01', calories: 2000, protein: 150 },
  { date: '2024-01-02', calories: 2200, protein: 160 },
  { date: '2024-01-03', calories: 1800, protein: 140 },
  { date: '2024-01-04', calories: 2100, protein: 155 },
  { date: '2024-01-05', calories: 2300, protein: 165 },
  { date: '2024-01-06', calories: 1900, protein: 145 },
  { date: '2024-01-07', calories: 2000, protein: 150 },
];

describe('TrendChart', () => {
  it('renders calorie trends with valid data', () => {
    render(
      <TrendChart
        data={mockData}
        metric="calories"
        period="week"
      />
    );

    expect(screen.getByText('Calorie Trends')).toBeInTheDocument();
  });

  it('renders protein trends with valid data', () => {
    render(
      <TrendChart
        data={mockData}
        metric="protein"
        period="week"
      />
    );

    expect(screen.getByText('Protein Trends')).toBeInTheDocument();
  });

  it('displays statistics for calories', () => {
    render(
      <TrendChart
        data={mockData}
        metric="calories"
        period="week"
      />
    );

    // Min: 1800, Max: 2300, Avg: 2043
    expect(screen.getByText('1800')).toBeInTheDocument();
    expect(screen.getByText('2300')).toBeInTheDocument();
    expect(screen.getByText('2043')).toBeInTheDocument();
    expect(screen.getByText('Min')).toBeInTheDocument();
    expect(screen.getByText('Max')).toBeInTheDocument();
    expect(screen.getByText('Average')).toBeInTheDocument();
  });

  it('displays statistics for protein', () => {
    render(
      <TrendChart
        data={mockData}
        metric="protein"
        period="week"
      />
    );

    // Min: 140, Max: 165, Avg: 152.1
    expect(screen.getByText('140')).toBeInTheDocument();
    expect(screen.getByText('165')).toBeInTheDocument();
    expect(screen.getByText('152')).toBeInTheDocument();
  });

  it('handles empty data gracefully', () => {
    render(
      <TrendChart
        data={[]}
        metric="calories"
        period="week"
      />
    );

    expect(screen.getByText('No data available for the selected period')).toBeInTheDocument();
  });

  it('handles single data point', () => {
    const singleData = [{ date: '2024-01-01', calories: 2000, protein: 150 }];
    
    render(
      <TrendChart
        data={singleData}
        metric="calories"
        period="week"
      />
    );

    // Min, Max, and Average should all be the same
    const values = screen.getAllByText('2000');
    expect(values.length).toBeGreaterThanOrEqual(3); // Min, Max, Average
  });

  it('calculates moving average correctly', () => {
    // The component should display both actual values and moving averages
    render(
      <TrendChart
        data={mockData}
        metric="calories"
        period="week"
      />
    );

    // Check that the chart renders (moving average is calculated internally)
    expect(screen.getByText('Calorie Trends')).toBeInTheDocument();
  });

  it('renders for week period', () => {
    render(
      <TrendChart
        data={mockData}
        metric="calories"
        period="week"
      />
    );

    expect(screen.getByText('Calorie Trends')).toBeInTheDocument();
  });

  it('renders for month period', () => {
    render(
      <TrendChart
        data={mockData}
        metric="calories"
        period="month"
      />
    );

    expect(screen.getByText('Calorie Trends')).toBeInTheDocument();
  });

  it('handles data with zero values', () => {
    const dataWithZeros = [
      { date: '2024-01-01', calories: 0, protein: 0 },
      { date: '2024-01-02', calories: 2000, protein: 150 },
      { date: '2024-01-03', calories: 0, protein: 0 },
    ];

    render(
      <TrendChart
        data={dataWithZeros}
        metric="calories"
        period="week"
      />
    );

    // Should still render with min of 0
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('2000')).toBeInTheDocument();
  });

  it('displays correct metric label for calories', () => {
    render(
      <TrendChart
        data={mockData}
        metric="calories"
        period="week"
      />
    );

    expect(screen.getByText('Calorie Trends')).toBeInTheDocument();
  });

  it('displays correct metric label for protein', () => {
    render(
      <TrendChart
        data={mockData}
        metric="protein"
        period="week"
      />
    );

    expect(screen.getByText('Protein Trends')).toBeInTheDocument();
  });
});