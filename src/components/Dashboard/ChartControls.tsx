import React from 'react';
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";

interface ChartControlsProps {
  investmentPercentage: number;
  visibleSeries: {
    portfolioValue: boolean;
    investment: boolean;
    profit: boolean;
  };
  onInvestmentPercentageChange: (value: number[]) => void;
  onVisibleSeriesChange: (key: 'portfolioValue' | 'investment' | 'profit', checked: boolean) => void;
}

export const ChartControls = ({
  investmentPercentage,
  visibleSeries,
  onInvestmentPercentageChange,
  onVisibleSeriesChange
}: ChartControlsProps) => {
  return (
    <div className="bg-card text-card-foreground rounded-xl p-4 mb-8 border border-border">
      <h3 className="text-sm font-medium mb-4">Chart Controls</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label>Investment Percentage ({investmentPercentage}%)</Label>
          <Slider
            value={[investmentPercentage]}
            onValueChange={onInvestmentPercentageChange}
            min={3}
            max={20}
            step={0.5}
            className="mt-2"
          />
        </div>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              checked={visibleSeries.portfolioValue}
              onCheckedChange={(checked) => onVisibleSeriesChange('portfolioValue', checked)}
            />
            <Label>Show Portfolio Value</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              checked={visibleSeries.investment}
              onCheckedChange={(checked) => onVisibleSeriesChange('investment', checked)}
            />
            <Label>Show Monthly Investment</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              checked={visibleSeries.profit}
              onCheckedChange={(checked) => onVisibleSeriesChange('profit', checked)}
            />
            <Label>Show Cumulative Profit</Label>
          </div>
        </div>
      </div>
    </div>
  );
};