"use client"
import React, { useState, useEffect, useRef } from 'react';
import type { SensorData } from '../types/sensor';
import SensorControls from './SensorControls';
import SensorStats from './SensorStats';
import SensorGraph from './SensorGraph';

const LiveSensorDashboard = () => {
  const [serialData, setSerialData] = useState<SensorData[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState('');
  const [port, setPort] = useState<SerialPort | null>(null);
  const [currentWeight, setCurrentWeight] = useState(0);
  const [avgWeight, setAvgWeight] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  
  const startTimeRef = useRef<number | null>(null);
  const currentWeightRef = useRef<number>(0);
  const avgWeightRef = useRef<number>(0);
  const recordedDataRef = useRef<SensorData[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let timeInterval: NodeJS.Timeout;
    
    if (isConnected && isRecording && startTimeRef.current) {
      // Update elapsed time and record data every 100ms
      timeInterval = setInterval(() => {
        const currentTime = (Date.now() - startTimeRef.current!) / 1000;
        setElapsedTime(currentTime);
        
        // Create and store data point
        const timeFromStart = currentTime.toFixed(1);
        const dataPoint: SensorData = {
          timestamp: timeFromStart,
          weight: currentWeightRef.current,
          avgWeight: avgWeightRef.current,
          currentTime: timeFromStart
        };
        
        recordedDataRef.current.push(dataPoint);
        setSerialData([...recordedDataRef.current]);
      }, 100);
    }

    return () => {
      if (timeInterval) clearInterval(timeInterval);
    };
  }, [isConnected, isRecording]);

  const handlePortConnection = async () => {
    try {
      const selectedPort = await navigator.serial.requestPort();
      await selectedPort.open({ baudRate: 9600 });
      setPort(selectedPort);
      setIsConnected(true);
      startReading(selectedPort);
    } catch (err) {
      setError('Failed to connect: ' + (err as Error).message);
    }
  };

  const processSerialLine = (line: string) => {
    if (line.includes('Current Weight:')) {
      const match = line.match(/Current Weight:\s*([\d.]+)/i);
      if (match) {
        const weight = parseFloat(match[1]);
        if (!isNaN(weight)) {
          setCurrentWeight(weight);
          currentWeightRef.current = weight;
        }
      }
    }
    else if (line.includes('AvgWeight:')) {
      const match = line.match(/AvgWeight:\s*([\d.]+)/i);
      if (match) {
        const avg = parseFloat(match[1]);
        if (!isNaN(avg)) {
          setAvgWeight(avg);
          avgWeightRef.current = avg;
        }
      }
    }
  };

  const startReading = async (selectedPort: SerialPort) => {
    if (!selectedPort.readable) return;

    const reader = selectedPort.readable.getReader();
    let buffer = '';

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        buffer += chunk;

        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim()) {
            processSerialLine(line.trim());
          }
        }
      }
    } catch (err) {
      console.error('Serial read error:', err);
      setError('Read error: ' + (err as Error).message);
    } finally {
      reader.releaseLock();
    }
  };

  const sendCommand = async (command: string) => {
    if (!port?.writable) return;
    
    const writer = port.writable.getWriter();
    try {
      await writer.write(new TextEncoder().encode(command));
    } catch (err) {
      setError('Command failed: ' + (err as Error).message);
    } finally {
      writer.releaseLock();
    }
  };

  const handleTare = () => sendCommand('t');
  const handleCalibrate = () => sendCommand('c');

  const handleToggleRecording = () => {
    if (!isRecording) {
      // Start recording
      console.log('=== Starting recording session ===');
      startTimeRef.current = Date.now();
      recordedDataRef.current = [];
      setSerialData([]);
      currentWeightRef.current = currentWeight;
      avgWeightRef.current = avgWeight;
      setElapsedTime(0);
    } else {
      // Stop recording
      console.log('=== Recording session ended ===');
      if (recordedDataRef.current.length > 0) {
        console.log(`Collected ${recordedDataRef.current.length} data points`);
        const finalData = [...recordedDataRef.current];
        setSerialData(finalData);
      }
      startTimeRef.current = null;
      setElapsedTime(0);
    }
    setIsRecording(!isRecording);
  };

  const handleExport = () => {
    if (recordedDataRef.current.length === 0) {
      setError('No data available to export');
      return;
    }

    try {
      // Create CSV content with headers
      const csvRows = [
        'Time (s),Current Weight (g),Average Weight (g)',
        ...recordedDataRef.current.map(row => 
          `${row.timestamp},${row.weight.toFixed(2)},${row.avgWeight.toFixed(2)}`
        )
      ];

      // Create and download file
      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      link.setAttribute('download', `sensor_data_${timestamp}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log('CSV export successful');
    } catch (err) {
      console.error('Export error:', err);
      setError('Failed to export data: ' + (err as Error).message);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(1);
    return `${mins.toString().padStart(2, '0')}:${secs.padStart(4, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-lg">
          <h1 className="text-3xl font-bold text-gray-900">Sensor Dashboard</h1>
          <div className="text-xl font-semibold text-gray-600">
            Time: {formatTime(elapsedTime)}
          </div>
        </div>

        <SensorStats 
          data={serialData}
          currentWeight={currentWeight}
          avgWeight={avgWeight}
          isRecording={isRecording}
        />

        <SensorControls
          isConnected={isConnected}
          isRecording={isRecording}
          onConnect={handlePortConnection}
          onTare={handleTare}
          onCalibrate={handleCalibrate}
          onToggleRecording={handleToggleRecording}
          onExport={handleExport}
          hasData={!isRecording && recordedDataRef.current.length > 0}
        />

        <div className="w-full bg-white rounded-xl shadow-lg overflow-hidden">
          <SensorGraph 
            data={serialData}
            isRecording={isRecording}
          />
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveSensorDashboard;