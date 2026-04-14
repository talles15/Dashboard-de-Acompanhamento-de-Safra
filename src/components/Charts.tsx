import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, LineChart, Line, ComposedChart
} from 'recharts';
import { formatNumber } from '../lib/utils';

interface TimeSeriesChartProps {
  data: any[];
  title: string;
}

export const TimeSeriesChart: React.FC<TimeSeriesChartProps> = ({ data, title }) => {
  return (
    <div className="bg-sleek-card p-4 rounded-lg border border-sleek-border h-[300px] flex flex-col">
      <h3 className="text-[14px] font-semibold text-sleek-text-main mb-4">{title}</h3>
      <div className="flex-1 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f3f4" />
            <XAxis 
              dataKey="date" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#5f6368', fontSize: 10 }}
              dy={10}
            />
            <YAxis 
              yAxisId="left"
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#5f6368', fontSize: 10 }}
              label={{ value: 'Cargas', angle: -90, position: 'insideLeft', style: { fontSize: '10px', fill: '#5f6368' } }}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#d93025', fontSize: 10 }}
              domain={[0, 20]}
              label={{ value: 'Umidade (%)', angle: 90, position: 'insideRight', style: { fontSize: '10px', fill: '#d93025' } }}
            />
            <Tooltip 
              contentStyle={{ borderRadius: '4px', border: '1px solid #dadce0', boxShadow: 'none', fontSize: '12px' }}
              cursor={{ fill: '#f8fafc' }}
              formatter={(value: any, name: string) => {
                if (name === 'Umidade Média') return [`${value.toFixed(1)}%`, name];
                return [value, name];
              }}
            />
            <Legend verticalAlign="top" align="right" wrapperStyle={{ fontSize: '10px', paddingBottom: '10px' }} />
            <Bar yAxisId="left" dataKey="count" fill="#1a73e8" radius={[2, 2, 0, 0]} name="Cargas" />
            <Line yAxisId="right" type="monotone" dataKey="umidadeMedia" stroke="#d93025" name="Umidade Média" strokeWidth={2} dot={{ r: 2 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

interface QualityDonutChartProps {
  data: any[];
  title: string;
}

const COLORS = ['#1e8e3e', '#d93025']; // Success and Danger from theme

export const QualityDonutChart: React.FC<QualityDonutChartProps> = ({ data, title }) => {
  return (
    <div className="bg-sleek-card p-4 rounded-lg border border-sleek-border h-[300px] flex flex-col">
      <h3 className="text-[14px] font-semibold text-sleek-text-main mb-4">{title}</h3>
      <div className="flex-1 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart margin={{ top: 0, right: 30, left: 30, bottom: 0 }}>
            <Pie
              data={data}
              cx="50%"
              cy="45%"
              innerRadius={55}
              outerRadius={75}
              paddingAngle={5}
              dataKey="value"
              label={({ name, percent }) => `${(percent * 100).toFixed(1)}%`}
              labelLine={true}
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: number) => [`${formatNumber(value)} kg`, 'Volume']}
              contentStyle={{ borderRadius: '4px', border: '1px solid #dadce0', boxShadow: 'none', fontSize: '12px' }}
            />
            <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '11px' }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
