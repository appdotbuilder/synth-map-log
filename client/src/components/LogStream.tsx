import { useEffect, useRef, useState } from 'react';
import type { LogEntry } from '../../../server/src/schema';

interface LogStreamProps {
  logs: LogEntry[];
}

const getSeverityColor = (severity: string): string => {
  switch (severity) {
    case 'critical': return 'text-red-400 bg-red-500/10';
    case 'error': return 'text-orange-400 bg-orange-500/10';
    case 'warning': return 'text-yellow-400 bg-yellow-500/10';
    case 'info': return 'text-blue-400 bg-blue-500/10';
    case 'debug': return 'text-purple-400 bg-purple-500/10';
    default: return 'text-green-400 bg-green-500/10';
  }
};

const getSeverityIcon = (severity: string): string => {
  switch (severity) {
    case 'critical': return '🔴';
    case 'error': return '🟠';
    case 'warning': return '🟡';
    case 'info': return '🔵';
    case 'debug': return '🟣';
    default: return '🟢';
  }
};

const formatTimestamp = (date: Date): string => {
  return date.toLocaleTimeString('en-US', { 
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3
  });
};

export function LogStream({ logs }: LogStreamProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (autoScroll && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  // Detect manual scroll to disable auto-scroll
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 5;
    setAutoScroll(isAtBottom);
  };

  const filteredLogs = logs.filter(log => 
    filter === 'all' || log.severity === filter
  );

  return (
    <div className="h-full flex flex-col">
      {/* Filter controls */}
      <div className="p-3 border-b border-green-500/30 bg-black/20 flex-shrink-0">
        <div className="flex items-center space-x-2 mb-2">
          <label className="text-xs text-green-300/80 font-bold">FILTER:</label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-black/50 border border-green-500/30 rounded px-2 py-1 text-xs text-green-400 font-mono"
          >
            <option value="all">ALL LEVELS</option>
            <option value="critical">CRITICAL</option>
            <option value="error">ERROR</option>
            <option value="warning">WARNING</option>
            <option value="info">INFO</option>
            <option value="debug">DEBUG</option>
          </select>
        </div>
        
        {/* Auto-scroll indicator */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-green-300/60">
            {filteredLogs.length} / {logs.length} entries
          </span>
          <div className={`flex items-center space-x-1 ${autoScroll ? 'text-green-400' : 'text-gray-400'}`}>
            <div className={`w-2 h-2 rounded-full ${autoScroll ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`}></div>
            <span>AUTO</span>
          </div>
        </div>
      </div>

      {/* Log entries */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-green-500/30 scrollbar-track-transparent"
        onScroll={handleScroll}
      >
        <div className="p-2 space-y-1">
          {filteredLogs.map((log, index) => (
            <div
              key={`${log.id}-${index}`}
              className={`p-2 rounded border-l-2 transition-all duration-300 hover:bg-green-500/5 ${
                getSeverityColor(log.severity)
              } border-l-current`}
            >
              <div className="flex items-start space-x-2 text-xs font-mono">
                {/* Timestamp */}
                <span className="text-green-300/60 whitespace-nowrap">
                  {formatTimestamp(log.timestamp)}
                </span>
                
                {/* Severity badge */}
                <span className={`px-2 py-0.5 rounded text-xs font-bold whitespace-nowrap ${
                  getSeverityColor(log.severity)
                }`}>
                  {getSeverityIcon(log.severity)} {log.severity.toUpperCase()}
                </span>
                
                {/* Source */}
                <span className="text-green-400/80 font-bold whitespace-nowrap">
                  [{log.source}]
                </span>
              </div>
              
              {/* Message */}
              <div className="text-green-300 text-xs font-mono mt-1 break-all">
                {log.message}
              </div>
              
              {/* Additional info */}
              {(log.ip_address || log.user_agent) && (
                <div className="mt-2 text-xs text-green-300/60 space-y-1">
                  {log.ip_address && (
                    <div className="flex items-center space-x-2">
                      <span className="text-green-400/60">IP:</span>
                      <code className="bg-black/50 px-1 rounded">{log.ip_address}</code>
                    </div>
                  )}
                  {log.user_agent && (
                    <div className="flex items-start space-x-2">
                      <span className="text-green-400/60 whitespace-nowrap">UA:</span>
                      <code className="bg-black/50 px-1 rounded text-xs break-all">
                        {log.user_agent}
                      </code>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
        
        {/* Bottom padding for better UX */}
        <div className="h-4"></div>
      </div>

      {/* Scroll to bottom button */}
      {!autoScroll && (
        <button
          onClick={() => {
            setAutoScroll(true);
            if (scrollContainerRef.current) {
              scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
            }
          }}
          className="absolute bottom-4 right-4 bg-green-500 hover:bg-green-400 text-black px-3 py-1 rounded-full text-xs font-bold transition-colors duration-200 flex items-center space-x-1"
        >
          <span>⬇</span>
          <span>TAIL</span>
        </button>
      )}
      
      {/* Activity indicator */}
      <div className="absolute bottom-2 left-2 flex items-center space-x-2">
        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
        <span className="text-xs text-green-300/60">STREAMING</span>
      </div>
    </div>
  );
}