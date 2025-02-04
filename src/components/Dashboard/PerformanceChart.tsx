import React from 'react';
import { ResponsiveLine } from '@nivo/line';
import { MonthlyData } from '@/types/investment';
import { useIsMobile } from '@/hooks/use-mobile';

interface PerformanceChartProps {
  data: MonthlyData[];
  visibleSeries: {
    portfolioValue: boolean;
    investment: boolean;
    profit: boolean;
  };
}

export const PerformanceChart = ({ data, visibleSeries }: PerformanceChartProps) => {
  const isMobile = useIsMobile();

  const formatChartData = (monthlyData: MonthlyData[]) => {
    const series = [
      {
        id: "Portfolio Value",
        color: "#8B5CF6",
        data: monthlyData.map(d => ({
          x: `Month ${d.month}`,
          y: Number(d.portfolioValue.toFixed(2))
        })),
        visible: visibleSeries.portfolioValue
      },
      {
        id: "Monthly Investment",
        color: "#0EA5E9",
        data: monthlyData.map(d => ({
          x: `Month ${d.month}`,
          y: Number(d.investment.toFixed(2))
        })),
        visible: visibleSeries.investment
      },
      {
        id: "Cumulative Profit",
        color: "#F97316",
        data: monthlyData.map(d => ({
          x: `Month ${d.month}`,
          y: Number(d.profit.toFixed(2))
        })),
        visible: visibleSeries.profit
      },
      {
        id: "Return on Investment",
        color: "#2563EB",
        data: monthlyData.map(d => ({
          x: `Month ${d.month}`,
          y: Number(((d.profit / (d.portfolioValue - d.profit)) * 100).toFixed(2))
        })),
        visible: true
      }
    ];

    return series.filter(s => s.visible);
  };

  return (
    <div className="h-[300px] md:h-[400px]">
      <ResponsiveLine
        data={formatChartData(data)}
        margin={{ top: 30, right: 110, bottom: 50, left: 80 }}
        xScale={{
          type: 'point'
        }}
        yScale={{
          type: 'linear',
          min: 'auto',
          max: 'auto',
          stacked: false,
          reverse: false
        }}
        curve="monotoneX"
        axisTop={null}
        axisRight={null}
        axisBottom={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: -45,
          legend: 'Timeline',
          legendOffset: 40,
          legendPosition: 'middle'
        }}
        axisLeft={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          legend: 'Amount (ILS) / ROI (%)',
          legendOffset: -60,
          legendPosition: 'middle',
          format: (value) => {
            if (typeof value === 'number') {
              return new Intl.NumberFormat('he-IL', {
                style: 'currency',
                currency: 'ILS',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
              }).format(value);
            }
            return '';
          }
        }}
        enableGridX={false}
        enableGridY={true}
        pointSize={8}
        pointColor={{ theme: 'background' }}
        pointBorderWidth={2}
        pointBorderColor={{ from: 'serieColor' }}
        pointLabelYOffset={-12}
        enableArea={true}
        areaOpacity={0.15}
        useMesh={true}
        enableSlices="x"
        crosshairType="cross"
        motionConfig="gentle"
        theme={{
          axis: {
            ticks: {
              text: {
                fontSize: isMobile ? 10 : 12,
                fill: 'hsl(var(--muted-foreground))'
              }
            },
            legend: {
              text: {
                fontSize: 12,
                fill: 'hsl(var(--muted-foreground))'
              }
            }
          },
          grid: {
            line: {
              stroke: 'hsl(var(--border))',
              strokeWidth: 1
            }
          },
          crosshair: {
            line: {
              stroke: 'hsl(var(--muted-foreground))',
              strokeWidth: 1,
              strokeOpacity: 0.35
            }
          },
          tooltip: {
            container: {
              background: 'hsl(var(--background))',
              color: 'hsl(var(--foreground))',
              fontSize: 12,
              borderRadius: '6px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              padding: '8px 12px',
              border: '1px solid hsl(var(--border))'
            }
          }
        }}
      />
    </div>
  );
};