// src/types/sensor.ts
export interface SensorData {
  timestamp: string;
  weight: number;
  avgWeight: number;
  psi: number;           // Added PSI property
  avgPsi: number;        // Added average PSI property
  currentTime?: string;
}

export interface SensorStatsProps {
  data: SensorData[];
  currentWeight: number;
  avgWeight: number;
  currentPsi: number;    // Added current PSI property
  avgPsi: number;        // Added average PSI property
  isRecording: boolean;
}

export interface StatCardProps {
  title: string;
  value: number;
  unit?: string;
}

export interface SensorGraphProps {
  data: SensorData[];
  isRecording: boolean;
  windowSize?: number;
  showPsi?: boolean;     // Added show PSI toggle property
}

export interface SensorControlsProps {
  isConnected: boolean;
  isRecording: boolean;
  onConnect: () => Promise<void>;
  onTare: () => Promise<void>;
  onCalibrate: () => Promise<void>;
  onToggleRecording: () => void;
  onExport: () => void;
  hasData: boolean;
}