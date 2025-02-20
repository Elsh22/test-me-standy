import React, { useEffect, useState, useRef } from 'react';
import type { SensorStatsProps, StatCardProps } from '../types/sensor';

const StatCard: React.FC<StatCardProps> = ({ title, value, unit = '' }) => (
  <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">{title}</h3>
    <p className="mt-2 text-3xl font-bold text-gray-900">
      {typeof value === 'number' ? value.toFixed(2) : '0.00'}
      {unit && <span className="text-xl font-semibold text-gray-500 ml-1">{unit}</span>}
    </p>
  </div>
);

const SensorStats: React.FC<SensorStatsProps> = ({ 
  data, 
  currentWeight, 
  avgWeight,
  isRecording
}) => {
  const [stats, setStats] = useState({
    maxWeight: 0,
    minWeight: 0,
    duration: 0
  });

  // Reset stats when recording starts
  useEffect(() => {
    if (isRecording) {
      setStats({
        maxWeight: currentWeight,
        minWeight: currentWeight,
        duration: 0
      });
    }
  }, [isRecording]);

  // Update stats during recording
  useEffect(() => {
    if (isRecording && typeof currentWeight === 'number' && !isNaN(currentWeight)) {
      setStats(prev => ({
        maxWeight: Math.max(prev.maxWeight, currentWeight),
        minWeight: Math.min(prev.minWeight, currentWeight),
        duration: data.length > 0 ? parseFloat(data[data.length - 1].timestamp) : 0
      }));
    }
  }, [currentWeight, data, isRecording]);

  const safeCurrentWeight = typeof currentWeight === 'number' && !isNaN(currentWeight) 
    ? currentWeight 
    : 0;

  const safeAvgWeight = typeof avgWeight === 'number' && !isNaN(avgWeight) 
    ? avgWeight 
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
      <StatCard 
        title="Current Weight" 
        value={safeCurrentWeight} 
        unit="g" 
      />
      <StatCard 
        title="Average Weight" 
        value={safeAvgWeight} 
        unit="g" 
      />
      <StatCard 
        title="Max Weight" 
        value={stats.maxWeight} 
        unit="g" 
      />
      <StatCard 
        title="Min Weight" 
        value={stats.minWeight} 
        unit="g" 
      />
      <StatCard 
        title="Duration" 
        value={stats.duration} 
        unit="s" 
      />
    </div>
  );
};

export default SensorStats;