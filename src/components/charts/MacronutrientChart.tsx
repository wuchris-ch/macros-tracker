'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface TooltipPayload {
  name: string;
  value: number;
  percent: number;
}

interface MacronutrientChartProps {
  protein: number;
  carbs: number;
  fat: number;
  goals?: {
    proteinPercent: number;
    carbsPercent: number;
    fatPercent: number;
  };
}

const COLORS = {
  protein: '#2563eb', // blue-600
  carbs: '#16a34a',   // green-600
  fat: '#ea580c',     // orange-600
};

export function MacronutrientChart({ protein, carbs, fat, goals }: MacronutrientChartProps) {
  const totalMacros = protein + carbs + fat;
  
  // Handle edge case of no macros
  if (totalMacros === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Macronutrient Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            No macronutrient data available
          </p>
        </CardContent>
      </Card>
    );
  }

  // Calculate percentages
  const proteinPercent = (protein / totalMacros) * 100;
  const carbsPercent = (carbs / totalMacros) * 100;
  const fatPercent = (fat / totalMacros) * 100;

  const data = [
    { name: 'Protein', value: protein, percent: proteinPercent },
    { name: 'Carbs', value: carbs, percent: carbsPercent },
    { name: 'Fat', value: fat, percent: fatPercent },
  ];

  // Check if ratios meet targets
  const meetsTargets = goals ? {
    protein: Math.abs(proteinPercent - goals.proteinPercent) <= 5,
    carbs: Math.abs(carbsPercent - goals.carbsPercent) <= 5,
    fat: Math.abs(fatPercent - goals.fatPercent) <= 5,
  } : null;

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: TooltipPayload }> }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-semibold">{data.name}</p>
          <p className="text-sm">{data.value.toFixed(1)}g ({data.percent.toFixed(1)}%)</p>
          {goals && (
            <p className="text-xs text-muted-foreground">
              Target: {goals[`${data.name.toLowerCase()}Percent` as keyof typeof goals]}%
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
        <CardTitle>Macronutrient Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row items-center gap-6">
          {/* Chart */}
          <div className="w-full md:w-1/2">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[entry.name.toLowerCase() as keyof typeof COLORS]} 
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Stats */}
          <div className="w-full md:w-1/2 space-y-4">
            {data.map((macro) => {
              const macroKey = macro.name.toLowerCase() as 'protein' | 'carbs' | 'fat';
              const color = COLORS[macroKey];
              const meetsTarget = meetsTargets?.[macroKey];
              
              return (
                <div key={macro.name} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: color }}
                      />
                      <span className="font-medium">{macro.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold">{macro.value.toFixed(1)}g</span>
                      <span className="text-sm text-muted-foreground ml-2">
                        ({macro.percent.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                  {goals && (
                    <div className="flex items-center justify-between text-xs text-muted-foreground pl-5">
                      <span>Target: {goals[`${macroKey}Percent` as keyof typeof goals]}%</span>
                      {meetsTarget !== undefined && (
                        <span className={meetsTarget ? 'text-green-600' : 'text-orange-600'}>
                          {meetsTarget ? '✓ On target' : '⚠ Off target'}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}