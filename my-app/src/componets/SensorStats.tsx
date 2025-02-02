// src/components/SensorStats.tsx
import React from 'react';
import type { SensorStatsProps, StatCardProps } from '@/types/sensor';

const StatCard: React.FC<StatCardProps> = ({ title, value, unit = '' }) => (
  <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">{title}</h3>
    <p className="mt-2 text-3xl font-bold text-gray-900">
      {value.toFixed(2)}
      {unit && <span className="text-xl font-semibold text-gray-500 ml-1">{unit}</span>}
    </p>
  </div>
);

const SensorStats: React.FC<SensorStatsProps> = ({ data, currentWeight, avgWeight }) => {
  const stats = {
    maxWeight: data.length > 0 ? Math.max(...data.map(d => d.weight)) : 0,
    minWeight: data.length > 0 ? Math.min(...data.map(d => d.weight)) : 0,
    duration: data.length > 0 ? parseFloat(data[data.length - 1].timestamp) : 0,
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
      <StatCard title="Current Weight" value={currentWeight || 0} unit="g" />
      <StatCard title="Average Weight" value={avgWeight || 0} unit="g" />
      <StatCard title="Max Weight" value={stats.maxWeight} unit="g" />
      <StatCard title="Min Weight" value={stats.minWeight} unit="g" />
      <StatCard title="Duration" value={stats.duration} unit="s" />
    </div>
  );
};

export default SensorStats;