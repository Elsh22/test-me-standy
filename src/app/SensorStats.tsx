"use client"
import React, { useEffect, useState } from 'react';
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
  data = [], // Provide default empty array
  currentWeight, 
  avgWeight,
  currentPsi,
  avgPsi,
  isRecording
}) => {
  const [stats, setStats] = useState({
    maxWeight: 0,
    maxPsi: 0,
    duration: 0
  });

  // Reset stats when recording starts
  useEffect(() => {
    if (isRecording) {
      setStats({
        maxWeight: currentWeight,
        maxPsi: currentPsi,
        duration: 0
      });
    }
  }, [isRecording, currentWeight, currentPsi]);

  // Update stats during recording
  useEffect(() => {
    if (isRecording) {
      // Only update if we have valid current values
      if (typeof currentWeight === 'number' && !isNaN(currentWeight)) {
        setStats(prev => ({
          maxWeight: Math.max(prev.maxWeight, currentWeight),
          maxPsi: Math.max(prev.maxPsi, currentPsi || 0),
          duration: data && data.length > 0 ? parseFloat(data[data.length - 1].timestamp) : 0
        }));
      }
    }
  }, [currentWeight, currentPsi, data, isRecording]);

  // Ensure safe values for display
  const safeCurrentWeight = typeof currentWeight === 'number' && !isNaN(currentWeight) 
    ? currentWeight 
    : 0;
    
  const safeCurrentPsi = typeof currentPsi === 'number' && !isNaN(currentPsi) 
    ? currentPsi 
    : 0;

  const safeAvgPsi = typeof avgPsi === 'number' && !isNaN(avgPsi) 
    ? avgPsi 
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
      <StatCard 
        title="Current (mA)" 
        value={safeCurrentWeight} 
        unit="mA" 
      />
      <StatCard 
        title="Max Current" 
        value={stats.maxWeight} 
        unit="mA" 
      />
      <StatCard 
        title="Current PSI" 
        value={safeCurrentPsi} 
        unit="PSIG" 
      />
      <StatCard 
        title="Max PSI" 
        value={stats.maxPsi} 
        unit="PSIG" 
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