"use client"
import React, { useState, useEffect, useRef } from 'react';

interface CurrentSensorData {
  busVoltage: number;
  shuntVoltage: number;
  loadVoltage: number;
  current: number;
  power: number;
  psi: number;
  avgPsi: number;
}

interface CurrentSensorProps {
  onDataUpdate: (data: CurrentSensorData) => void;
  isConnected: boolean;
  isRecording: boolean;
  serialLine?: string; // Line of serial data to process
}

const CurrentSensorModule: React.FC<CurrentSensorProps> = ({ 
  onDataUpdate, 
  isConnected,
  isRecording,
  serialLine
}) => {
  // Sensor readings state
  const [busVoltage, setBusVoltage] = useState(0);
  const [shuntVoltage, setShuntVoltage] = useState(0);
  const [loadVoltage, setLoadVoltage] = useState(0);
  const [current, setCurrent] = useState(0);
  const [power, setPower] = useState(0);
  const [psi, setPsi] = useState(0);
  const [avgPsi, setAvgPsi] = useState(0);
  
  // For calculating moving average of PSI
  const psiReadingsRef = useRef<number[]>([]);
  const PSI_WINDOW_SIZE = 10; // Number of readings to average
  
  // Track previous values to prevent unnecessary updates
  const prevValuesRef = useRef<CurrentSensorData>({
    busVoltage: 0,
    shuntVoltage: 0,
    loadVoltage: 0,
    current: 0,
    power: 0,
    psi: 0,
    avgPsi: 0
  });
  
  // Debug display state
  const [showDebug, setShowDebug] = useState(false);

  // Calculate the average PSI from recent readings
  const calculateAvgPsi = (newPsi: number) => {
    // Add new reading to array
    psiReadingsRef.current.push(newPsi);
    
    // Keep only the most recent readings
    if (psiReadingsRef.current.length > PSI_WINDOW_SIZE) {
      psiReadingsRef.current.shift();
    }
    
    // Calculate average
    const sum = psiReadingsRef.current.reduce((acc, val) => acc + val, 0);
    const avg = sum / psiReadingsRef.current.length;
    
    setAvgPsi(avg);
    return avg;
  };

  // Process a single line of serial data
  const processSerialLine = (line: string) => {
    // Process Arduino output format
    if (line.includes('Bus Voltage:')) {
      const match = line.match(/Bus Voltage:\s*([\d.]+)/i);
      if (match) {
        const voltage = parseFloat(match[1]);
        if (!isNaN(voltage)) {
          setBusVoltage(voltage);
        }
      }
    }
    else if (line.includes('Shunt Voltage:')) {
      const match = line.match(/Shunt Voltage:\s*([\d.]+)/i);
      if (match) {
        const voltage = parseFloat(match[1]);
        if (!isNaN(voltage)) {
          setShuntVoltage(voltage);
        }
      }
    }
    else if (line.includes('Load Voltage:')) {
      const match = line.match(/Load Voltage:\s*([\d.]+)/i);
      if (match) {
        const voltage = parseFloat(match[1]);
        if (!isNaN(voltage)) {
          setLoadVoltage(voltage);
        }
      }
    }
    else if (line.includes('Current:')) {
      const match = line.match(/Current:\s*([\d.]+)/i);
      if (match) {
        const currentVal = parseFloat(match[1]);
        if (!isNaN(currentVal)) {
          setCurrent(currentVal);
        }
      }
    }
    else if (line.includes('Power:')) {
      const match = line.match(/Power:\s*([\d.]+)/i);
      if (match) {
        const powerVal = parseFloat(match[1]);
        if (!isNaN(powerVal)) {
          setPower(powerVal);
        }
      }
    }
    else if (line.includes('Psi:')) {
      const match = line.match(/Psi:\s*([\d.]+)/i);
      if (match) {
        const psiVal = parseFloat(match[1]);
        if (!isNaN(psiVal)) {
          setPsi(psiVal);
          calculateAvgPsi(psiVal);
        }
      }
    }
  };

  // Process incoming serial line
  useEffect(() => {
    if (serialLine) {
      processSerialLine(serialLine);
    }
  }, [serialLine]); // Only re-run when serialLine changes

  // Update parent component only when values actually change
  useEffect(() => {
    const currentValues = {
      busVoltage,
      shuntVoltage,
      loadVoltage,
      current,
      power,
      psi,
      avgPsi
    };
    
    // Check if any values have changed
    const hasChanged = 
      prevValuesRef.current.busVoltage !== busVoltage ||
      prevValuesRef.current.shuntVoltage !== shuntVoltage ||
      prevValuesRef.current.loadVoltage !== loadVoltage ||
      prevValuesRef.current.current !== current ||
      prevValuesRef.current.power !== power ||
      prevValuesRef.current.psi !== psi ||
      prevValuesRef.current.avgPsi !== avgPsi;
    
    // Only call onDataUpdate if something has changed
    if (hasChanged) {
      // Update the ref with current values
      prevValuesRef.current = { ...currentValues };
      // Notify parent component
      onDataUpdate(currentValues);
    }
  }, [
    busVoltage, 
    shuntVoltage, 
    loadVoltage, 
    current, 
    power, 
    psi, 
    avgPsi, 
    onDataUpdate
  ]);

  return (
    <div className="w-full">
      {/* Debug info section (collapsible) */}
      <details 
        className="bg-white p-4 rounded-xl shadow-lg"
        open={showDebug}
      >
        <summary 
          className="font-semibold text-gray-700 cursor-pointer"
          onClick={(e) => {
            e.preventDefault();
            setShowDebug(!showDebug);
          }}
        >
          Current Sensor Debug Information
        </summary>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="font-medium">Bus Voltage:</span> {busVoltage.toFixed(3)} V
          </div>
          <div>
            <span className="font-medium">Shunt Voltage:</span> {shuntVoltage.toFixed(3)} mV
          </div>
          <div>
            <span className="font-medium">Load Voltage:</span> {loadVoltage.toFixed(3)} V
          </div>
          <div>
            <span className="font-medium">Current:</span> {current.toFixed(6)} mA
          </div>
          <div>
            <span className="font-medium">Power:</span> {power.toFixed(3)} mW
          </div>
          <div>
            <span className="font-medium">PSI Readings Buffer:</span> {psiReadingsRef.current.length}
          </div>
        </div>
      </details>
    </div>
  );
};

export { CurrentSensorModule, type CurrentSensorData };