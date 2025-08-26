import { useState, useEffect } from 'react';

export function SystemStats() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [systemLoad, setSystemLoad] = useState(0);
  const [networkTraffic, setNetworkTraffic] = useState(0);
  const [threatsBlocked, setThreatsBlocked] = useState(0);

  // Update current time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Simulate system stats updates
  useEffect(() => {
    const interval = setInterval(() => {
      setSystemLoad(Math.floor(Math.random() * 100));
      setNetworkTraffic(Math.floor(Math.random() * 1000));
      setThreatsBlocked(prev => prev + Math.floor(Math.random() * 3));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const getLoadColor = (load: number): string => {
    if (load < 30) return 'text-green-400';
    if (load < 70) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="flex items-center space-x-6 text-sm font-mono">
      {/* Current Time */}
      <div className="text-center">
        <div className="text-green-400 font-bold text-lg">
          {formatTime(currentTime)}
        </div>
        <div className="text-green-300/60 text-xs">
          {formatDate(currentTime)}
        </div>
      </div>

      {/* System Load */}
      <div className="text-center border-l border-green-500/30 pl-4">
        <div className={`font-bold ${getLoadColor(systemLoad)}`}>
          {systemLoad}%
        </div>
        <div className="text-green-300/60 text-xs">
          CPU LOAD
        </div>
        <div className="w-12 bg-gray-700 rounded-full h-1 mt-1">
          <div 
            className={`h-1 rounded-full transition-all duration-500 ${
              systemLoad < 30 ? 'bg-green-400' :
              systemLoad < 70 ? 'bg-yellow-400' :
              'bg-red-400'
            }`}
            style={{ width: `${systemLoad}%` }}
          ></div>
        </div>
      </div>

      {/* Network Traffic */}
      <div className="text-center border-l border-green-500/30 pl-4">
        <div className="text-blue-400 font-bold">
          {networkTraffic}
        </div>
        <div className="text-green-300/60 text-xs">
          KB/s
        </div>
      </div>

      {/* Threats Blocked */}
      <div className="text-center border-l border-green-500/30 pl-4">
        <div className="text-red-400 font-bold">
          {threatsBlocked}
        </div>
        <div className="text-green-300/60 text-xs">
          BLOCKED
        </div>
      </div>

      {/* System Status */}
      <div className="flex items-center space-x-2 border-l border-green-500/30 pl-4">
        <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
        <div>
          <div className="text-green-400 font-bold text-xs">ONLINE</div>
          <div className="text-green-300/60 text-xs">STATUS</div>
        </div>
      </div>
    </div>
  );
}