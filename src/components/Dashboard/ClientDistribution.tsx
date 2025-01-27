import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { Client } from '@/types/investment';
import { PROFESSIONS } from '@/lib/constants';
import { useIsMobile } from '@/hooks/use-mobile';

const COLORS = ['#8B5CF6', '#0EA5E9', '#F97316', '#D946EF', '#10B981'];

interface ClientDistributionProps {
  clients: Client[];
}

export const ClientDistribution = ({ clients }: ClientDistributionProps) => {
  const isMobile = useIsMobile();

  const data = PROFESSIONS.map(profession => ({
    name: profession,
    value: clients.filter(client => client.profession === profession).length
  }));

  return (
    <div className="h-[300px] md:h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={isMobile ? 60 : 80}
            outerRadius={isMobile ? 90 : 120}
            fill="#8884d8"
            paddingAngle={2}
            dataKey="value"
            label={({name, percent}) => `${name} (${(percent * 100).toFixed(0)}%)`}
            labelLine={{ stroke: '#374151', strokeWidth: 1 }}
          >
            {data.map((_, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={COLORS[index % COLORS.length]}
                stroke="#fff"
                strokeWidth={2}
              />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};