'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format, parseISO } from 'date-fns';

interface DailyData {
  date: string;
  calories: number | null;
  protein: number | null;
}

interface TrendChartProps {
  data: DailyData[];
  metric: 'calories' | 'protein';
  period: 'week' | 'month';
}

interface TooltipPayload {
  value: number;
  dataKey: string;
  payload: DailyData & { movingAverage?: number };
}

export function TrendChart({ data, metric, period }: TrendChartProps) {
  // Debug logging
  console.log('TrendChart - metric:', metric);
  console.log('TrendChart - data:', data);
  console.log('TrendChart - data length:', data.length);

  // Handle empty data
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            {metric === 'calories' ? 'Calorie' : 'Protein'} Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            No data available for the selected period
          </p>
        </CardContent>
      </Card>
    );
  }

  // Calculate moving average (7-day window) - only from non-null values
  const calculateMovingAverage = (data: DailyData[], metric: 'calories' | 'protein') => {
    const windowSize = 7;
    return data.map((item, index) => {
      const start = Math.max(0, index - windowSize + 1);
      const window = data.slice(start, index + 1);
      const validValues = window.map(d => d[metric]).filter((v): v is number => v !== null);
      
      if (validValues.length === 0) {
        return {
          ...item,
          movingAverage: null,
        };
      }
      
      const sum = validValues.reduce((acc, v) => acc + v, 0);
      const avg = sum / validValues.length;
      return {
        ...item,
        movingAverage: avg,
      };
    });
  };

  const chartData = calculateMovingAverage(data, metric);

  // Calculate statistics (excluding null values)
  const validValues = data.map(d => d[metric]).filter((v): v is number => v !== null);
  const min = validValues.length > 0 ? Math.min(...validValues) : 0;
  const max = validValues.length > 0 ? Math.max(...validValues) : 0;
  const avg = validValues.length > 0
    ? validValues.reduce((a, b) => a + b, 0) / validValues.length
    : 0;

  const metricLabel = metric === 'calories' ? 'Calories' : 'Protein (g)';
  const color = metric === 'calories' ? '#f97316' : '#2563eb'; // orange-500 for calories, blue-600 for protein

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const value = data[metric];
      
      // Don't show tooltip for null values
      if (value === null) {
        return null;
      }
      
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-semibold">{format(parseISO(data.date), 'MMM d, yyyy')}</p>
          <p className="text-sm">
            {metricLabel}: <span className="font-semibold">{value.toFixed(1)}</span>
          </p>
          {data.movingAverage !== null && data.movingAverage !== undefined && (
            <p className="text-xs text-muted-foreground">
              7-day avg: {data.movingAverage.toFixed(1)}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {metric === 'calories' ? 'Calorie' : 'Protein'} Trends
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Statistics */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold" style={{ color }}>{min.toFixed(0)}</p>
              <p className="text-xs text-muted-foreground">Min</p>
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color }}>{avg.toFixed(0)}</p>
              <p className="text-xs text-muted-foreground">Average</p>
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color }}>{max.toFixed(0)}</p>
              <p className="text-xs text-muted-foreground">Max</p>
            </div>
          </div>

          {/* Chart */}
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                tickFormatter={(date) => format(parseISO(date), 'MMM d')}
                className="text-xs"
              />
              <YAxis className="text-xs" />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line
                type="monotone"
                dataKey={metric}
                stroke={color}
                strokeWidth={2}
                dot={{ r: 3 }}
                name={metricLabel}
                connectNulls={true}
              />
              <Line
                type="monotone"
                dataKey="movingAverage"
                stroke={color}
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                name="7-day Average"
                opacity={0.6}
                connectNulls={true}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}