"use client"
import React, { useMemo } from 'react';
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
  isRecording,
  showPsi = false,
  windowSize = 200 // Increased window size
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
  
  // Use useMemo to avoid recalculating on every render
  const { displayData, yDomain, xDomain, dataStats } = useMemo(() => {
    // For recording, use a sliding window that shows the most recent data points
    const displayData = isRecording 
      ? data.slice(-windowSize) // Keep last windowSize points
      : data;
    
    // Convert timestamps to numbers to ensure proper sorting and scaling
    const normalizedData = displayData.map(point => ({
      ...point,
      timestamp: parseFloat(point.timestamp)
    }));
    
    // Calculate domains based on available data
    const weights = normalizedData.map(d => d.weight || 0);
    const avgWeights = normalizedData.map(d => d.avgWeight || 0);
    
    const maxWeight = Math.max(...weights, ...avgWeights);
    const minWeight = Math.min(...weights, ...avgWeights);
    const padding = Math.max((maxWeight - minWeight) * 0.1, 0.1); // Ensure minimum padding
    
    const yDomain: [number, number] = [
      Math.max(0, Math.floor((minWeight - padding) * 10) / 10), // Round to 1 decimal place
      Math.ceil((maxWeight + padding) * 10) / 10
    ];
    
    // Calculate X-axis domain for smooth scrolling during recording
    let xDomain: [number | string, number | string];
    
    if (isRecording && normalizedData.length > 1) {
      const firstTimestamp = normalizedData[0].timestamp;
      const lastTimestamp = normalizedData[normalizedData.length - 1].timestamp;
      const timeSpan = lastTimestamp - firstTimestamp;
      
      // Fixed window size approach for consistent scrolling
      xDomain = [
        Math.max(0, lastTimestamp - 10), // Show last 10 seconds
        lastTimestamp + 0.5 // Add 0.5 second buffer on the right
      ];
    } else {
      // Show full range when not recording
      xDomain = ['dataMin', 'dataMax'];
    }
    
    // Calculate some stats for display
    const dataStats = {
      points: normalizedData.length,
      timeRange: normalizedData.length > 1 
        ? `${normalizedData[0].timestamp.toFixed(1)}s - ${normalizedData[normalizedData.length-1].timestamp.toFixed(1)}s`
        : 'N/A',
      maxWeight: maxWeight.toFixed(2),
      minWeight: minWeight.toFixed(2)
    };
    
    return { displayData: normalizedData, yDomain, xDomain, dataStats };
  }, [data, isRecording, windowSize]);

  return (
    <div className="w-full h-96 p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">
          {isRecording ? 'Live Sensor Data' : 'Recorded Data Analysis'}
        </h2>
        <div className="text-sm bg-gray-100 px-3 py-1 rounded-md">
          {isRecording 
            ? `Showing last ${Math.min(windowSize, data.length)} points` 
            : `Total: ${data.length} points`}
        </div>
      </div>
      
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
              allowDataOverflow={isRecording}
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
              labelFormatter={(label: number) => 
                `Time: ${label.toFixed(3)}s`
              }
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="weight"
              name="Current Weight"
              stroke="#2563eb"
              dot={false}
              isAnimationActive={false} // Disable animation completely for smoother updates
              connectNulls={true}
            />
            <Line
              type="monotone"
              dataKey="avgWeight"
              name="Average Weight"
              stroke="#16a34a"
              dot={false}
              isAnimationActive={false} // Disable animation completely
              connectNulls={true}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SensorGraph;