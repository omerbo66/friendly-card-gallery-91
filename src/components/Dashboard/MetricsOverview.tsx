import React from 'react';
import { ArrowUpRight, HelpCircle } from 'lucide-react';
import { AggregateMetrics } from '@/types/investment';
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

interface MetricsOverviewProps {
  metrics: AggregateMetrics;
}

export const MetricsOverview = ({ metrics }: MetricsOverviewProps) => {
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercentage = (value: number): string => {
    return new Intl.NumberFormat('en', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(value / 100);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <div className="bg-card text-card-foreground rounded-xl p-6 shadow-sm border border-border">
        <div className="flex items-center justify-between">
          <h3 className="text-sm text-muted-foreground">Total Portfolio Value</h3>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <HelpCircle className="w-4 h-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p>The total value of all client portfolios combined</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="text-xl md:text-2xl font-bold">{formatCurrency(metrics.totalValue)}</div>
        <div className="flex items-center text-emerald-500 dark:text-emerald-400">
          <ArrowUpRight className="w-4 h-4" />
          <span>{formatPercentage(8.5)}</span>
        </div>
      </div>
      <div className="bg-card text-card-foreground rounded-xl p-6 shadow-sm border border-border">
        <h3 className="text-sm text-muted-foreground">Total Investment</h3>
        <div className="text-xl md:text-2xl font-bold">{formatCurrency(metrics.totalInvestment)}</div>
        <div className="flex items-center text-emerald-500 dark:text-emerald-400">
          <ArrowUpRight className="w-4 h-4" />
          <span>{formatPercentage(12.3)}</span>
        </div>
      </div>
      <div className="bg-card text-card-foreground rounded-xl p-6 shadow-sm border border-border">
        <h3 className="text-sm text-muted-foreground">Total Profit</h3>
        <div className="text-xl md:text-2xl font-bold">{formatCurrency(metrics.totalProfit)}</div>
        <div className="flex items-center text-emerald-500 dark:text-emerald-400">
          <ArrowUpRight className="w-4 h-4" />
          <span>{formatPercentage(15.7)}</span>
        </div>
      </div>
      <div className="bg-card text-card-foreground rounded-xl p-6 shadow-sm border border-border">
        <h3 className="text-sm text-muted-foreground">Total Clients</h3>
        <div className="text-xl md:text-2xl font-bold">{metrics.totalClients}</div>
        <div className="flex items-center text-emerald-500 dark:text-emerald-400">
          <ArrowUpRight className="w-4 h-4" />
          <span>{formatPercentage(5.2)}</span>
        </div>
      </div>
    </div>
  );
};