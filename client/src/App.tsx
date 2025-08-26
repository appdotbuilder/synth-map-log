import { useState, useEffect, useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import { WorldMap } from '@/components/WorldMap';
import { LogStream } from '@/components/LogStream';
import { ActivityDetails } from '@/components/ActivityDetails';
import { SystemStats } from '@/components/SystemStats';
import { generateStubLogEntries, generateStubNetworkActivities, generateStubLogEntry } from '@/components/StubDataGenerator';
import './App.css';
import type { NetworkActivity, LogEntry } from '../../server/src/schema';

function App() {
  const [activities, setActivities] = useState<NetworkActivity[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<NetworkActivity | null>(null);
  const [isGeneratingData, setIsGeneratingData] = useState(false);

  // Load initial data
  const loadData = useCallback(async () => {
    try {
      const [activitiesData, logsData] = await Promise.all([
        trpc.getNetworkActivities.query({ limit: 50 }),
        trpc.getLogEntries.query({ limit: 100 })
      ]);
      
      // STUB: Use generated data if backend returns empty arrays (backend handlers are placeholders)
      const finalActivities = activitiesData.length > 0 ? activitiesData : generateStubNetworkActivities(30);
      const finalLogs = logsData.length > 0 ? logsData : generateStubLogEntries(50);
      
      setActivities(finalActivities);
      setLogs(finalLogs);
    } catch (error) {
      console.error('Failed to load data, using stub data:', error);
      // Fallback to stub data on API error
      setActivities(generateStubNetworkActivities(30));
      setLogs(generateStubLogEntries(50));
    }
  }, []);

  // Generate initial dummy data if none exists
  const generateInitialData = useCallback(async () => {
    if (isGeneratingData) return;
    
    setIsGeneratingData(true);
    try {
      // Try backend generation first
      await Promise.all([
        trpc.generateDummyNetworkActivities.mutate({ count: 30 }),
        trpc.generateDummyLogEntries.mutate({ count: 50 })
      ]);
      await loadData();
    } catch (error) {
      console.error('Backend generation failed, using stub data:', error);
      // STUB: Fallback to frontend generation
      setActivities(generateStubNetworkActivities(30));
      setLogs(generateStubLogEntries(50));
    } finally {
      setIsGeneratingData(false);
    }
  }, [loadData, isGeneratingData]);

  // Stream new log entries periodically
  const streamNewLogs = useCallback(async () => {
    try {
      const newLog = await trpc.streamRandomLogEntry.mutate();
      setLogs(prev => [newLog, ...prev.slice(0, 99)]); // Keep last 100 logs
    } catch (error) {
      console.error('Backend streaming failed, using stub data:', error);
      // STUB: Generate client-side log entry
      const stubLog = generateStubLogEntry();
      setLogs(prev => [stubLog, ...prev.slice(0, 99)]);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-generate data if empty
  useEffect(() => {
    if (activities.length === 0 && logs.length === 0 && !isGeneratingData) {
      generateInitialData();
    }
  }, [activities.length, logs.length, generateInitialData, isGeneratingData]);

  // Stream logs every 2-5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      streamNewLogs();
    }, Math.random() * 3000 + 2000); // Random interval between 2-5 seconds

    return () => clearInterval(interval);
  }, [streamNewLogs]);

  return (
    <div className="min-h-screen bg-gray-900 text-green-400 font-mono overflow-hidden">
      {/* Animated background grid */}
      <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-800">
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-transparent via-green-500/5 to-transparent animate-pulse"></div>
        {/* Scanning line effect */}
        <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-green-400 to-transparent opacity-60 animate-pulse" 
             style={{ animation: 'scan-line 4s linear infinite' }}></div>
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-green-500/30 bg-black/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-green-500 rounded-full animate-pulse flex items-center justify-center">
                <div className="w-4 h-4 bg-black rounded-full"></div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-green-400 tracking-wider">
                  NEXUS SECURITY MONITOR
                </h1>
                <p className="text-xs text-green-300/60 tracking-wide">
                  [SIMULATION MODE] • Procedurally Generated Data
                </p>
              </div>
            </div>
            <SystemStats />
          </div>
        </div>
      </header>

      {/* Main content grid */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 h-[calc(100vh-80px)]">
        {/* World Map - Takes 2 columns on large screens */}
        <div className="lg:col-span-2 p-4">
          <div className="h-full bg-black/30 border border-green-500/30 rounded-lg backdrop-blur-sm overflow-hidden">
            <div className="p-4 border-b border-green-500/30">
              <h2 className="text-lg font-bold text-green-400 tracking-wide">
                🌐 GLOBAL THREAT MAP
              </h2>
              <p className="text-sm text-green-300/60 mt-1">
                Real-time network activity visualization • {activities.length} active threats
              </p>
            </div>
            <div className="h-[calc(100%-60px)]">
              <WorldMap 
                activities={activities}
                onActivitySelect={setSelectedActivity}
              />
            </div>
          </div>
        </div>

        {/* Log Stream - Takes 1 column */}
        <div className="p-4 flex flex-col">
          <div className="flex-1 bg-black/30 border border-green-500/30 rounded-lg backdrop-blur-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b border-green-500/30 flex-shrink-0">
              <h2 className="text-lg font-bold text-green-400 tracking-wide">
                📡 SYSTEM LOGS
              </h2>
              <p className="text-sm text-green-300/60 mt-1">
                Live stream • {logs.length} entries
              </p>
            </div>
            <div className="flex-1 overflow-hidden">
              <LogStream logs={logs} />
            </div>
          </div>
        </div>
      </div>

      {/* Activity Details Modal */}
      {selectedActivity && (
        <ActivityDetails 
          activity={selectedActivity}
          onClose={() => setSelectedActivity(null)}
        />
      )}

      {/* Loading overlay */}
      {isGeneratingData && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="text-center">
            <div className="animate-spin w-12 h-12 border-2 border-green-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-green-400 text-lg">Initializing Security Matrix...</p>
            <p className="text-green-300/60 text-sm mt-2">Generating network topology</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;