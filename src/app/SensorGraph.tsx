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
import type { SensorData, SensorGraphProps } from '../types/sensor';

const SensorGraph: React.FC<SensorGraphProps> = ({ 
  data,
  isRecording
}) => {
  // Show empty state when no data
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-96 p-6">
        <h2 className="text-xl font-semibold mb-4">
          {isRecording ? 'Recording in Progress...' : 'Sensor Readings'}
        </h2>
        <div className="w-full h-full flex items-center justify-center">
          <p className="text-gray-500">
            {isRecording ? 'Waiting for sensor data...' : 'No data available'}
          </p>
        </div>
      </div>
    );
  }

  // Calculate domains based on available data
  const maxWeight = Math.max(...data.map(d => Math.max(d.weight || 0, d.avgWeight || 0)));
  const minWeight = Math.min(...data.map(d => Math.min(d.weight || 0, d.avgWeight || 0)));
  const padding = (maxWeight - minWeight) * 0.1;
  
  const yDomain: [number, number] = [
    Math.max(0, Math.floor(minWeight - padding)),
    Math.ceil(maxWeight + padding)
  ];

  // For recording, show only last 20 seconds of data
  const displayData = isRecording 
    ? data.slice(-100) // Keep last 100 points during recording
    : data;

  // Calculate X domain
  const xDomain = isRecording
    ? ['dataMin', 'dataMax'] // Auto-scale during recording
    : ['dataMin', 'dataMax']; // Show full range when stopped

  return (
    <div className="w-full h-96 p-6">
      <h2 className="text-xl font-semibold mb-4">
        {isRecording ? 'Live Sensor Data' : 'Recorded Data Analysis'}
      </h2>
      <div className="w-full h-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={displayData}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="timestamp"
              type="number"
              domain={xDomain}
              tickFormatter={(value: number) => value.toFixed(1)}
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
              isAnimationActive={!isRecording} // Disable animation during recording
            />
            <Line
              type="monotone"
              dataKey="avgWeight"
              name="Average Weight"
              stroke="#16a34a"
              dot={false}
              isAnimationActive={!isRecording} // Disable animation during recording
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SensorGraph;