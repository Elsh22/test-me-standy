"use client"
import React, { useState, useEffect, useRef } from 'react';
import type { SensorData } from '../types/sensor';
import SensorControls from './SensorControls';
import SensorStats from './SensorStats';
import SensorGraph from './SensorGraph';
import PsiGraph from './PsiGraph';

const LiveSensorDashboard = () => {
  // Original state
  const [serialData, setSerialData] = useState<SensorData[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState('');
  const [port, setPort] = useState<SerialPort | null>(null);
  
  // Weight and time state
  const [currentWeight, setCurrentWeight] = useState(0);
  const [avgWeight, setAvgWeight] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  
  // PSI state
  const [currentPsi, setCurrentPsi] = useState(0);
  const [avgPsi, setAvgPsi] = useState(0);
  
  // Refs
  const startTimeRef = useRef<number | null>(null);
  const currentWeightRef = useRef<number>(0);
  const avgWeightRef = useRef<number>(0);
  const currentPsiRef = useRef<number>(0);
  const avgPsiRef = useRef<number>(0);
  const recordedDataRef = useRef<SensorData[]>([]);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // For PSI averaging
  const psiReadingsRef = useRef<number[]>([]);
  const PSI_WINDOW_SIZE = 10;
  
  // Tab selection state
  const [activeTab, setActiveTab] = useState<'force' | 'pressure' | 'both'>('both');

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
    avgPsiRef.current = avg;
    return avg;
  };

  useEffect(() => {
    let timeInterval: NodeJS.Timeout;
    
    if (isConnected && isRecording && startTimeRef.current) {
      // Log initial values when recording starts
      console.log(`🔴 Recording started with initial values:`, {
        weight: currentWeightRef.current,
        avgWeight: avgWeightRef.current,
        psi: currentPsiRef.current,
        avgPsi: avgPsiRef.current
      });
      
      // Update elapsed time and record data every 20ms (50 points per second)
      timeInterval = setInterval(() => {
        const currentTime = (Date.now() - startTimeRef.current!) / 1000;
        setElapsedTime(currentTime);
        
        // Create and store data point with more precise timestamp
        const timeFromStart = currentTime.toFixed(3); // 3 decimal places instead of 1
        
        // Create data point and log it
        const dataPoint: SensorData = {
          timestamp: timeFromStart,
          weight: currentWeightRef.current,
          avgWeight: avgWeightRef.current,
          psi: currentPsiRef.current,
          avgPsi: avgPsiRef.current,
          currentTime: timeFromStart
        };
        
        // Only log every 1 second to avoid console spam
        if (Math.round(currentTime) !== Math.round(currentTime - 0.02)) {
          console.log(`📝 Data at ${timeFromStart}s:`, {
            weight: dataPoint.weight.toFixed(6),
            psi: dataPoint.psi.toFixed(2)
          });
        }
        
        recordedDataRef.current.push(dataPoint);
        setSerialData([...recordedDataRef.current]);
      }, 20); // Reduced from 100ms to 20ms for more data points
    }

    return () => {
      if (timeInterval) clearInterval(timeInterval);
    };
  }, [isConnected, isRecording]);

  const handlePortConnection = async () => {
    try {
      const selectedPort = await navigator.serial.requestPort();
      await selectedPort.open({ 
        baudRate: 115200,  // Match Arduino's baud rate of 115200
      });
      setPort(selectedPort);
      setIsConnected(true);
      setError('');
      startReading(selectedPort);
    } catch (err) {
      setError('Failed to connect: ' + (err as Error).message);
      setIsConnected(false);
    }
  };

  const processSerialLine = (line: string) => {
    console.log("Raw serial data:", line);
    
    let psiExtracted = false;
    let currentExtracted = false;
    
    // Try to parse PSI data directly from the line
    if (line.includes('Psi:')) {
      const match = line.match(/Psi:\s*([\d.]+)/i);
      if (match) {
        const psi = parseFloat(match[1]);
        if (!isNaN(psi)) {
          console.log(`✅ Found PSI value: ${psi} PSIG`);
          setCurrentPsi(psi);
          currentPsiRef.current = psi;
          calculateAvgPsi(psi);
          psiExtracted = true;
        } else {
          console.log(`❌ Failed to parse PSI number from: "${match[1]}"`);
        }
      } else {
        console.log(`❌ Failed to extract PSI value from line: "${line}"`);
      }
    }
    
    // Extract current data
    if (line.includes('Current:')) {
      const match = line.match(/Current:\s*([\d.-]+)/i);
      if (match) {
        const current = parseFloat(match[1]);
        if (!isNaN(current)) {
          console.log(`✅ Found current value: ${current} mA`);
          // Use current for weight display
          setCurrentWeight(current);
          currentWeightRef.current = current;
          currentExtracted = true;
          
          // Calculate PSI from current if we didn't already extract a PSI value
          if (!psiExtracted) {
            let calculatedPsi = ((62.50 * current) + (-250.0)) - 5;
            calculatedPsi = Math.max(0, calculatedPsi);
            console.log(`📊 Calculated PSI from current: ${calculatedPsi.toFixed(2)} PSIG`);
            setCurrentPsi(calculatedPsi);
            currentPsiRef.current = calculatedPsi;
            calculateAvgPsi(calculatedPsi);
          }
        } else {
          console.log(`❌ Failed to parse current number from: "${match[1]}"`);
        }
      } else {
        console.log(`❌ Failed to extract current from line: "${line}"`);
      }
    }
    
    // Process weight data for compatibility
    if (line.includes('Weight:')) {
      const match = line.match(/Weight:\s*([\d.]+)/i);
      if (match) {
        const weight = parseFloat(match[1]);
        if (!isNaN(weight)) {
          setCurrentWeight(weight);
          currentWeightRef.current = weight;
          console.log(`✅ Found weight value: ${weight} g`);
        }
      }
    }
    
    // Log what we're storing for debugging
    console.log(`Current state values: Weight=${currentWeightRef.current}g, PSI=${currentPsiRef.current} PSIG`);
  };

  const startReading = async (selectedPort: SerialPort) => {
    if (!selectedPort.readable) {
      setError('Port is not readable');
      setIsConnected(false);
      return;
    }

    const reader = selectedPort.readable.getReader();
    let buffer = '';
    let retryCount = 0;
    const MAX_RETRIES = 3;

    try {
      while (true) {
        try {
          const { value, done } = await reader.read();
          if (done) {
            console.log('Reader done');
            break;
          }

          // Reset retry count on successful read
          retryCount = 0;

          const chunk = new TextDecoder().decode(value);
          buffer += chunk;

          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.trim()) {
              processSerialLine(line.trim());
            }
          }
        } catch (readError) {
          console.error('Read operation error:', readError);
          
          // Attempt to recover from transient errors
          if (readError.name === 'FramingError' && retryCount < MAX_RETRIES) {
            console.log(`Retrying after framing error (${retryCount + 1}/${MAX_RETRIES})...`);
            retryCount++;
            
            // Small delay before retry
            await new Promise(resolve => setTimeout(resolve, 500));
            continue;
          }
          
          // If we can't recover, rethrow to be caught by outer try/catch
          throw readError;
        }
      }
    } catch (err) {
      console.error('Serial read error:', err);
      setError(`Read error: ${err.name}: ${err.message}`);
      
      // Handle disconnection
      setIsConnected(false);
      if (isRecording) {
        handleToggleRecording(); // Stop recording if active
      }
      
      // Clean up
      try {
        reader.releaseLock();
      } catch (e) {
        console.error('Error releasing lock:', e);
      }
      
      // Attempt reconnection
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      reconnectTimeoutRef.current = setTimeout(() => {
        if (port) {
          console.log('Attempting to reconnect...');
          // In Web Serial API, we need to get a new port rather than reuse the old one
          setPort(null);
          handlePortConnection();
        }
      }, 3000);
      
      return;
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

  const handleTare = async () => await sendCommand('t');
  const handleCalibrate = async () => await sendCommand('c');

  const handleToggleRecording = () => {
    if (!isRecording) {
      // Start recording
      console.log('=== Starting recording session ===');
      startTimeRef.current = Date.now();
      recordedDataRef.current = [];
      setSerialData([]);
      currentWeightRef.current = currentWeight;
      avgWeightRef.current = avgWeight;
      currentPsiRef.current = currentPsi;
      avgPsiRef.current = avgPsi;
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
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      
      // Get data count for status message
      const dataCount = recordedDataRef.current.length;
      
      // Now using 3 decimal places for timestamp (millisecond precision)
      // 1. Export force/weight data
      const forceRows = [
        'Time (s),Weight (g),Average Weight (g)',
        ...recordedDataRef.current.map(row => 
          `${parseFloat(row.timestamp).toFixed(3)},${row.weight.toFixed(6)},${row.avgWeight.toFixed(6)}`
        )
      ];

      const forceBlob = new Blob([forceRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const forceUrl = URL.createObjectURL(forceBlob);
      const forceLink = document.createElement('a');
      forceLink.setAttribute('href', forceUrl);
      forceLink.setAttribute('download', `force_data_${timestamp}.csv`);
      forceLink.style.display = 'none';
      document.body.appendChild(forceLink);
      
      // 2. Export PSI data with improved precision
      const psiRows = [
        'Time (s),Pressure (PSIG),Average Pressure (PSIG)',
        ...recordedDataRef.current.map(row => 
          `${parseFloat(row.timestamp).toFixed(3)},${row.psi.toFixed(3)},${row.avgPsi.toFixed(3)}`
        )
      ];

      const psiBlob = new Blob([psiRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const psiUrl = URL.createObjectURL(psiBlob);
      const psiLink = document.createElement('a');
      psiLink.setAttribute('href', psiUrl);
      psiLink.setAttribute('download', `pressure_data_${timestamp}.csv`);
      psiLink.style.display = 'none';
      document.body.appendChild(psiLink);
      
      // First click the force download link
      forceLink.click();
      
      // Set a small timeout to ensure downloads start in proper sequence
      setTimeout(() => {
        psiLink.click();
        
        // Clean up
        document.body.removeChild(forceLink);
        document.body.removeChild(psiLink);
        URL.revokeObjectURL(forceUrl);
        URL.revokeObjectURL(psiUrl);
      }, 100);

      console.log(`CSV export successful - ${dataCount} data points exported with millisecond precision`);
      
      // Update success message
      setError(''); // Clear any previous errors
      
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

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      // Properly close the port streams if they exist
      if (port) {
        try {
          // Close readable stream if it exists
          if (port.readable) {
            port.readable.cancel().catch(e => 
              console.error('Error closing readable stream:', e)
            );
          }
          
          // Close writable stream if it exists  
          if (port.writable) {
            port.writable.abort().catch(e => 
              console.error('Error closing writable stream:', e)
            );
          }
        } catch (e) {
          console.error('Error during port cleanup:', e);
        }
      }
    };
  }, [port]);

  // Tab button style
  const tabButtonStyle = (isActive: boolean) => `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
    isActive 
      ? 'bg-blue-600 text-white' 
      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
  }`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-lg">
          <h1 className="text-3xl font-bold text-gray-900">Sensor Dashboard</h1>
          <div className="text-xl font-semibold text-gray-600">
            Time: {formatTime(elapsedTime)}
          </div>
        </div>

        {/* Stats section */}
        <SensorStats 
          data={serialData}
          currentWeight={currentWeight}
          avgWeight={avgWeight}
          currentPsi={currentPsi}
          avgPsi={avgPsi}
          isRecording={isRecording}
        />

        {/* Controls section */}
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

        {/* Graph tab controls */}
        <div className="bg-white p-4 rounded-xl shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Data Visualization</h2>
            <div className="flex space-x-2">
              <button 
                className={tabButtonStyle(activeTab === 'force')}
                onClick={() => setActiveTab('force')}
              >
                Force Only
              </button>
              <button 
                className={tabButtonStyle(activeTab === 'pressure')}
                onClick={() => setActiveTab('pressure')}
              >
                Pressure Only
              </button>
              <button 
                className={tabButtonStyle(activeTab === 'both')}
                onClick={() => setActiveTab('both')}
              >
                Both
              </button>
            </div>
          </div>
          
          {/* Display the appropriate graph(s) based on the active tab */}
          <div className="space-y-6">
            {/* Force Graph */}
            {(activeTab === 'force' || activeTab === 'both') && (
              <div className="w-full bg-white rounded-xl shadow-lg overflow-hidden">
                <SensorGraph 
                  data={serialData}
                  isRecording={isRecording}
                  showPsi={false}
                />
              </div>
            )}
            
            {/* PSI Graph */}
            {(activeTab === 'pressure' || activeTab === 'both') && (
              <div className="w-full bg-white rounded-xl shadow-lg overflow-hidden">
                <PsiGraph 
                  data={serialData}
                  isRecording={isRecording}
                />
              </div>
            )}
          </div>
        </div>

        {/* Debug Info */}
        <details className="bg-white p-4 rounded-xl shadow-lg" open>
          <summary className="font-semibold text-gray-700 cursor-pointer">
            PSI Debug Information
          </summary>
          <div className="mt-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mb-4">
              <div>
                <span className="font-medium">Current PSI:</span> {currentPsi.toFixed(3)} PSIG
              </div>
              <div>
                <span className="font-medium">Average PSI:</span> {avgPsi.toFixed(3)} PSIG
              </div>
              <div>
                <span className="font-medium">PSI Buffer Size:</span> {psiReadingsRef.current.length}
              </div>
              <div>
                <span className="font-medium">Current (mA):</span> {currentWeight.toFixed(6)} mA
              </div>
              <div>
                <span className="font-medium">Calculated PSI:</span> {((62.50 * currentWeight) + (-250.0) - 5).toFixed(3)} PSIG
              </div>
              <div>
                <span className="font-medium">Data Points:</span> {serialData.length}
              </div>
            </div>
            
            <div className="mb-4">
              <div className="font-medium mb-1">Last 5 data points:</div>
              <div className="text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                <pre>
                  {JSON.stringify(
                    serialData.slice(-5).map(d => ({
                      time: d.timestamp,
                      current: d.weight.toFixed(6),
                      psi: d.psi.toFixed(2),
                      avgPsi: d.avgPsi.toFixed(2)
                    })), 
                    null, 2
                  )}
                </pre>
              </div>
            </div>
            
            <div>
              <div className="font-medium mb-1">Arduino PSI Formula:</div>
              <div className="text-xs bg-gray-50 p-2 rounded font-mono">
                PSI = ((62.50 * current_mA) + (-250.0)) - 5
              </div>
            </div>
          </div>
        </details>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Export info notification */}
        {!isRecording && recordedDataRef.current.length > 0 && (
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-lg">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  <span className="font-medium">Export Info:</span> Clicking the Export button will download two separate CSV files - one for force data and one for pressure data.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveSensorDashboard;