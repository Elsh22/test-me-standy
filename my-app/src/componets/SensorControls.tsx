// src/components/SensorControls.tsx
import React, { JSX } from 'react';
import type { SensorControlsProps } from '@/types/sensor';

const SensorControls = ({
  isConnected,
  isRecording,
  onConnect,
  onTare,
  onCalibrate,
  onToggleRecording,
  onExport,
  hasData
}: SensorControlsProps): JSX.Element => {
  return (
    <div className="bg-white rounded-xl p-6 shadow-lg">
      <div className="flex flex-wrap gap-4">
        <button 
          onClick={onConnect}
          disabled={isConnected}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
            disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
        >
          {isConnected ? 'Connected' : 'Connect Port'}
        </button>

        <button 
          onClick={onTare}
          disabled={!isConnected}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 
            disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
        >
          Tare
        </button>
        
        <button 
          onClick={onCalibrate}
          disabled={!isConnected}
          className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 
            disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
        >
          Calibrate
        </button>
        
        <button 
          onClick={onToggleRecording}
          disabled={!isConnected}
          className={`px-6 py-2 rounded-lg transition-all shadow-md hover:shadow-lg ${
            isRecording 
              ? 'bg-red-600 hover:bg-red-700' 
              : 'bg-blue-600 hover:bg-blue-700'
          } text-white disabled:bg-gray-300 disabled:cursor-not-allowed`}
        >
          {isRecording ? 'Stop Recording' : 'Start Recording'}
        </button>
        
        <button 
          onClick={onExport}
          disabled={!hasData}
          className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 
            disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
        >
          Export CSV
        </button>
      </div>
    </div>
  );
};

export default SensorControls;