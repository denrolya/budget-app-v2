import { useState } from 'react';

type ChartType = 'line' | 'bar';

interface ChartUIStateOptions<Toggles extends string = never> {
  defaultChartType?: ChartType;
  defaultToggles?: Partial<Record<Toggles, boolean>>;
}

export const useChart = <Toggles extends string = never>(
  options: ChartUIStateOptions<Toggles> = {},
) => {
  const {
    defaultChartType = 'bar',
    defaultToggles = {},
  } = options;

  const [chartType, setChartType] = useState<ChartType>(defaultChartType);
  const [toggles, setToggles] = useState<Partial<Record<Toggles, boolean>>>(
    defaultToggles,
  );

  const setToggle = (key: Toggles, value: boolean) => {
    setToggles((prev) => ({ ...prev, [key]: value }));
  };

  return {
    chartType,
    setChartType,
    toggles,
    setToggle,
  };
};
