// src/types/sensor.ts
export interface SensorData {
  timestamp: string;
  weight: number;
  avgWeight: number;
  originalTimestamp?: string;
  currentTime?: string;
}

export interface SensorStatsProps {
  data: SensorData[];
  currentWeight: number;
  avgWeight: number;
}

export interface StatCardProps {
  title: string;
  value: number;
  unit?: string;
}

export interface SensorControlsProps {
  isConnected: boolean;
  isRecording: boolean;
  onConnect: () => void;
  onTare: () => void;
  onCalibrate: () => void;
  onToggleRecording: () => void;
  onExport: () => void;
  hasData: boolean;
}

export interface SensorGraphProps {
  data: SensorData[];
}