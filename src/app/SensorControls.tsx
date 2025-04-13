"use client"
import React from 'react';
import type { SensorControlsProps } from '../types/sensor';

const SensorControls: React.FC<SensorControlsProps> = ({
  isConnected,
  isRecording,
  onConnect,
  onTare,
  onCalibrate,
  onToggleRecording,
  onExport,
  hasData
}) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Sensor Controls</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Connection */}
        <button
          className={`px-4 py-3 rounded-lg font-medium transition-colors ${
            isConnected 
              ? 'bg-green-100 text-green-800 hover:bg-green-200'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
          onClick={onConnect}
          disabled={isConnected && isRecording}
        >
          {isConnected ? 'Connected ✓' : 'Connect Sensor'}
        </button>
        
        {/* Tare */}
        <button
          className="px-4 py-3 bg-gray-100 text-gray-800 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={onTare}
          disabled={!isConnected || isRecording}
        >
          Tare Sensor
        </button>
        
        {/* Calibrate */}
        <button
          className="px-4 py-3 bg-gray-100 text-gray-800 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={onCalibrate}
          disabled={!isConnected || isRecording}
        >
          Calibrate
        </button>
        
        {/* Record */}
        <button
          className={`px-4 py-3 rounded-lg font-medium transition-colors ${
            isRecording 
              ? 'bg-red-600 text-white hover:bg-red-700'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          onClick={onToggleRecording}
          disabled={!isConnected}
        >
          {isRecording ? 'Stop Recording' : 'Start Recording'}
        </button>
        
        {/* Export */}
        <button
          className="px-4 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={onExport}
          disabled={!hasData}
        >
          Export Data
        </button>
      </div>
    </div>
  );
};

export default SensorControls;