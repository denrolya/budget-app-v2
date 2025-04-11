import React, { useState, useEffect } from 'react';
import { ResponsivePie } from '@nivo/pie';

import { useTheme } from '@/contexts/theme';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

// Helper function to determine the season based on month
const getSeason = (month: number): string => {
  if (month === 12 || month === 1 || month === 2) return 'Winter';
  if (month >= 3 && month <= 5) return 'Spring';
  if (month >= 6 && month <= 8) return 'Summer';
  return 'Fall';
};

// Helper function to calculate seasonal spending
const calculateSeasonalSpending = (monthlySpending: Record<string, number>) => {
  const seasonalSpending: Record<string, number> = {
    Winter: 0,
    Spring: 0,
    Summer: 0,
    Fall: 0,
  };

  Object.entries(monthlySpending).forEach(([month, amount]) => {
    const monthNumber = parseInt(month);
    const season = getSeason(monthNumber);
    seasonalSpending[season] += amount;

    // Special case for December (previous year's winter)
    if (monthNumber === 12) {
      seasonalSpending['Winter'] -= amount;
      seasonalSpending['Fall'] += amount;
    }
  });

  return Object.entries(seasonalSpending).map(([season, value]) => ({
    id: season,
    label: season,
    value,
  }));
};

export const SeasonalSpending: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [seasonalData, setSeasonalData] = useState<Array<{ id: string; label: string; value: number }>>([]);

  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const customColors = {
    Winter: isDark ? '#e0e0e0' : '#ffffff',
    Spring: isDark ? '#81c784' : '#c8e6c9',
    Summer: isDark ? '#e57373' : '#ffcdd2',
    Fall: isDark ? '#ffb74d' : '#ffe0b2',
  };

  useEffect(() => {
    // Simulate API call or data processing
    const fetchData = async () => {
      // Sample monthly spending data (you would replace this with real data fetching)
      const monthlySpending = {
        '1': 1500, // January
        '2': 1400, // February
        '3': 1300, // March
        '4': 1200, // April
        '5': 1100, // May
        '6': 1000, // June
        '7': 1100, // July
        '8': 1200, // August
        '9': 1300, // September
        '10': 1400, // October
        '11': 1500, // November
        '12': 1600, // December (previous year)
      };

      await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulate network delay
      const data = calculateSeasonalSpending(monthlySpending);
      setSeasonalData(data);
      setIsLoading(false);
    };

    fetchData();
  }, []);

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Seasonal Spending</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] relative">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Skeleton className="h-[300px] w-[300px] rounded-full" />
            </div>
          ) : (
            <ResponsivePie
              data={seasonalData}
              margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
              innerRadius={0.4}
              padAngle={0.7}
              cornerRadius={3}
              activeOuterRadiusOffset={8}
              borderWidth={1}
              borderColor={{
                from: 'color',
                modifiers: [['darker', 0.2]],
              }}
              startAngle={-90}
              colors={({ id }) => customColors[id as keyof typeof customColors]}
              enableArcLinkLabels={false}
              enableArcLabels={false}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SeasonalSpending;
