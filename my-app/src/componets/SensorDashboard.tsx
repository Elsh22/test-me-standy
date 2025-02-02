"use client"
import React, { useState, useEffect } from 'react';
import type { SensorData } from '@/types/sensor';
import SensorControls from './SensorControls';
import SensorStats from './SensorStats';
import SensorGraph from './SensorGraph';

const LiveSensorDashboard = () => {
  const [ports, setPorts] = useState<SerialPort[]>([]);
  const [serialData, setSerialData] = useState<SensorData[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState('');
  const [port, setPort] = useState<SerialPort | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [currentWeight, setCurrentWeight] = useState(0);
  const [avgWeight, setAvgWeight] = useState(0);
  const [liveData, setLiveData] = useState<SensorData[]>([]);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [recordingStartTime, setRecordingStartTime] = useState<number | null>(null);

  // Initialize continuous time tracking
  useEffect(() => {
    let timeInterval: NodeJS.Timeout;
    
    if (isConnected) {
      const startTimeRef = Date.now();
      setRecordingStartTime(startTimeRef);
      
      // Initialize with empty data points
      const initialData: SensorData[] = Array.from({ length: 20 }, (_, i) => ({
        timestamp: (-2 + (i * 0.1)).toFixed(1),
        weight: 0,
        avgWeight: 0,
        originalTimestamp: (-2 + (i * 0.1)).toFixed(1),
        currentTime: '0.0'
      }));
      setLiveData(initialData);
      
      timeInterval = setInterval(() => {
        const newElapsedTime = (Date.now() - startTimeRef) / 1000;
        setElapsedTime(newElapsedTime);
        
        // Update live data timestamps while keeping original start time
        setLiveData(prev => {
          if (prev.length === 0) return prev;
          return prev.map(point => ({
            ...point,
            currentTime: newElapsedTime.toFixed(1)
          }));
        });
      }, 100);
    }

    return () => {
      if (timeInterval) clearInterval(timeInterval);
    };
  }, [isConnected]);

  const handlePortConnection = async () => {
    try {
      const selectedPort = await navigator.serial.requestPort();
      await selectedPort.open({ baudRate: 115200 });
      setPort(selectedPort);
      setIsConnected(true);
      startReading(selectedPort);
    } catch (err) {
      setError('Failed to connect: ' + (err as Error).message);
    }
  };

  const startReading = async (selectedPort: SerialPort) => {
    while (selectedPort.readable) {
      const reader = selectedPort.readable.getReader();
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          
          const decoded = new TextDecoder().decode(value);
          
          const weightMatch = decoded.match(/Current Weight: ([\d.]+)/);
          const avgMatch = decoded.match(/AvgWeight: ([\d.]+)/);
          
          if (weightMatch && avgMatch) {
            const weight = parseFloat(weightMatch[1]);
            const avg = parseFloat(avgMatch[1]);
            
            setCurrentWeight(weight);
            setAvgWeight(avg);
            
            const timeFromStart = ((Date.now() - (recordingStartTime || 0)) / 1000).toFixed(1);
            const newDataPoint: SensorData = {
              timestamp: timeFromStart,
              originalTimestamp: timeFromStart,
              currentTime: elapsedTime.toFixed(1),
              weight: weight,
              avgWeight: avg
            };
            
            setLiveData(prev => [...prev.slice(-99), newDataPoint]);
            
            if (isRecording) {
              setSerialData(prev => [...prev, newDataPoint]);
            }
          }
        }
      } catch (err) {
        setError('Read error: ' + (err as Error).message);
      } finally {
        reader.releaseLock();
      }
    }
  };

  const handleTare = () => sendCommand('t');
  const handleCalibrate = () => sendCommand('c');

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

  const handleToggleRecording = () => {
    if (!isRecording) {
      const currentTime = Date.now();
      setStartTime(currentTime);
      const timeFromStart = ((currentTime - (recordingStartTime || 0)) / 1000).toFixed(1);
      const initialDataPoint: SensorData = {
        timestamp: timeFromStart,
        originalTimestamp: timeFromStart,
        currentTime: elapsedTime.toFixed(1),
        weight: currentWeight,
        avgWeight: avgWeight
      };
      setSerialData([initialDataPoint]);
    }
    setIsRecording(!isRecording);
  };

  const handleExport = () => {
    const csvData = serialData.length > 0 ? serialData : liveData;
    const csvContent = 'data:text/csv;charset=utf-8,' + 
      'Time,Current Time,Weight,Average\n' +
      csvData.map(row => `${row.timestamp},${row.currentTime},${row.weight},${row.avgWeight}`).join('\n');
    
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `sensor_data_${new Date().toISOString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
        />

        <SensorControls
          isConnected={isConnected}
          isRecording={isRecording}
          onConnect={handlePortConnection}
          onTare={handleTare}
          onCalibrate={handleCalibrate}
          onToggleRecording={handleToggleRecording}
          onExport={handleExport}
          hasData={true}
        />

        <div className="w-full bg-white rounded-xl shadow-lg overflow-hidden">
          <SensorGraph data={liveData} />
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