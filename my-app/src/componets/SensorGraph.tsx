import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import type { SensorData, SensorGraphProps } from '@/types/sensor';

const SensorGraph: React.FC<SensorGraphProps> = ({ data }) => {
  // Ensure we have data before rendering
  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-lg h-96 flex items-center justify-center">
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }

  // Calculate Y-axis domain with some padding
  const maxWeight = Math.max(
    ...data.map(d => Math.max(d.weight || 0, d.avgWeight || 0))
  );
  const minWeight = Math.min(
    ...data.map(d => Math.min(d.weight || 0, d.avgWeight || 0))
  );
  const yDomain: [number, number] = [
    Math.floor(minWeight - (maxWeight - minWeight) * 0.1) || 0,
    Math.ceil(maxWeight + (maxWeight - minWeight) * 0.1) || 4
  ];

  return (
    <div className="w-full h-96 p-6">
      <h2 className="text-xl font-semibold mb-4">Sensor Readings</h2>
      <div className="w-full h-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="timestamp"
              type="number"
              domain={[-2, 'auto']}
              tickFormatter={(value: number) => parseFloat(value.toString()).toFixed(1)}
              label={{ value: 'Time (s)', position: 'bottom' }}
            />
            <YAxis
              domain={yDomain}
              label={{ 
                value: 'Weight (g)', 
                angle: -90, 
                position: 'insideLeft',
                style: { textAnchor: 'middle' }
              }}
            />
            <Tooltip
              formatter={(value: number, name: string) => [
                `${value.toFixed(2)} g`,
                name === 'weight' ? 'Current Weight' : 'Average Weight'
              ]}
              labelFormatter={(label: string | number) => 
                `Time: ${parseFloat(label.toString()).toFixed(1)}s`
              }
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="weight"
              name="Current Weight"
              stroke="#2563eb"
              dot={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="avgWeight"
              name="Average Weight"
              stroke="#16a34a"
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SensorGraph;