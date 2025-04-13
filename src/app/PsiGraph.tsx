import React, { useEffect, useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import type { SensorData } from '../types/sensor';

interface PsiGraphProps {
  data: SensorData[];
  isRecording: boolean;
  windowSize?: number;
}

const PsiGraph: React.FC<PsiGraphProps> = ({ 
  data,
  isRecording,
  windowSize = 200  // Increased window size for smoother visualization
}) => {
  const [diagnostics, setDiagnostics] = useState({
    dataPoints: 0,
    minPsi: 0,
    maxPsi: 0,
    avgPsi: 0,
    hasData: false
  });

  // Use useMemo to efficiently compute the graph data
  const { displayData, yDomain, xDomain } = useMemo(() => {
    // For recording, use a sliding window approach
    const rawDisplayData = isRecording 
      ? data.slice(-windowSize)
      : data;
    
    // Normalize timestamps to ensure proper scaling
    const displayData = rawDisplayData.map(point => ({
      ...point,
      timestamp: parseFloat(point.timestamp)
    }));
    
    // Calculate consistent Y domain
    const yDomain: [number, number] = [
      0,  // Always start at 0 for PSI
      Math.ceil(diagnostics.maxPsi * 1.1) || 50 // Use 50 as default if no data
    ];
    
    // Calculate X-axis domain for smooth scrolling during recording
    let xDomain: [number | string, number | string];
    
    if (isRecording && displayData.length > 1) {
      const lastTimestamp = displayData[displayData.length - 1].timestamp;
      
      // Fixed window size approach for consistent scrolling
      xDomain = [
        Math.max(0, lastTimestamp - 10), // Show last 10 seconds
        lastTimestamp + 0.5 // Add 0.5 second buffer on the right
      ];
    } else {
      // Show full range when not recording
      xDomain = ['dataMin', 'dataMax'];
    }
    
    return { displayData, yDomain, xDomain };
  }, [data, isRecording, windowSize, diagnostics.maxPsi]);

  // Analyze the data when it changes
  useEffect(() => {
    if (!data || data.length === 0) {
      setDiagnostics({
        dataPoints: 0,
        minPsi: 0,
        maxPsi: 0,
        avgPsi: 0,
        hasData: false
      });
      return;
    }

    // Filter to only include points with valid PSI
    const validPoints = data.filter(d => typeof d.psi === 'number' && d.psi > 0);
    
    if (validPoints.length === 0) {
      console.log("⚠️ No valid PSI data points found. Raw data sample:", 
        data.slice(0, 5).map(d => ({ time: d.timestamp, psi: d.psi })));
      setDiagnostics({
        dataPoints: data.length,
        minPsi: 0,
        maxPsi: 0,
        avgPsi: 0,
        hasData: false
      });
      return;
    }

    // Calculate metrics
    const psiValues = validPoints.map(d => d.psi);
    const minPsi = Math.min(...psiValues);
    const maxPsi = Math.max(...psiValues);
    const avgPsi = psiValues.reduce((sum, val) => sum + val, 0) / psiValues.length;

    // Only log diagnostics occasionally to reduce console spam
    if (data.length % 50 === 0 || !isRecording) {
      console.log(`📊 PSI Graph data analysis: ${validPoints.length}/${data.length} valid points, 
        range: ${minPsi.toFixed(2)}-${maxPsi.toFixed(2)} PSIG, avg: ${avgPsi.toFixed(2)} PSIG`);
    }

    setDiagnostics({
      dataPoints: data.length,
      minPsi,
      maxPsi,
      avgPsi,
      hasData: validPoints.length > 0
    });
  }, [data, isRecording]);

  // Show empty state when no valid data
  if (!diagnostics.hasData) {
    return (
      <div className="w-full h-96 p-6">
        <h2 className="text-xl font-semibold mb-4">
          {isRecording ? 'Recording PSI Data...' : 'Pressure Readings'}
        </h2>
        <div className="flex flex-col items-center justify-center h-full">
          <p className="text-gray-500 mb-2">
            {isRecording ? 'Waiting for pressure data...' : 'No pressure data available'}
          </p>
          <div className="text-sm text-gray-400 mt-2">
            {data.length > 0 ? 
              `Found ${data.length} data points, but none contain valid PSI values.` : 
              'No data points received yet.'
            }
          </div>
        </div>
      </div>
    );
  }

  // Custom tooltip formatter
  const customTooltipFormatter = (value: number, name: string) => {
    if (name === 'psi') return [`${value.toFixed(2)} PSIG`, 'Pressure'];
    if (name === 'avgPsi') return [`${value.toFixed(2)} PSIG`, 'Avg Pressure'];
    return [value, name];
  };

  return (
    <div className="w-full h-96 p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">
          {isRecording ? 'Live Pressure Data' : 'Pressure Analysis'}
        </h2>
        <div className="text-sm bg-gray-100 rounded-md px-3 py-1">
          {isRecording 
            ? `${Math.min(windowSize, data.length)} points, Range: ${diagnostics.minPsi.toFixed(1)}-${diagnostics.maxPsi.toFixed(1)} PSIG` 
            : `${data.length} points, Range: ${diagnostics.minPsi.toFixed(1)}-${diagnostics.maxPsi.toFixed(1)} PSIG`}
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
                value: 'Pressure (PSIG)', 
                angle: -90, 
                position: 'insideLeft',
                style: { textAnchor: 'middle' }
              }}
            />
            
            <Tooltip 
              formatter={customTooltipFormatter}
              labelFormatter={(label: number) => 
                `Time: ${label.toFixed(3)}s`
              }
            />
            <Legend />
            
            {/* Average line */}
            <ReferenceLine 
              y={diagnostics.avgPsi} 
              stroke="#9333ea" 
              strokeDasharray="3 3"
              label={{ 
                value: `Avg: ${diagnostics.avgPsi.toFixed(1)} PSIG`,
                position: 'insideBottomRight'
              }}
            />
            
            {/* PSI line */}
            <Line
              type="monotone"
              dataKey="psi"
              name="Pressure"
              stroke="#dc2626"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false} // Disable animation completely for smoother updates
              connectNulls={true}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PsiGraph;