import { X } from 'lucide-react';
import type { NetworkActivity } from '../../../server/src/schema';

interface ActivityDetailsProps {
  activity: NetworkActivity;
  onClose: () => void;
}

const getSeverityColor = (severity: string): string => {
  switch (severity) {
    case 'critical': return 'border-red-500 bg-red-500/10 text-red-400';
    case 'error': return 'border-orange-500 bg-orange-500/10 text-orange-400';
    case 'warning': return 'border-yellow-500 bg-yellow-500/10 text-yellow-400';
    case 'info': return 'border-blue-500 bg-blue-500/10 text-blue-400';
    case 'debug': return 'border-purple-500 bg-purple-500/10 text-purple-400';
    default: return 'border-green-500 bg-green-500/10 text-green-400';
  }
};

const getActivityIcon = (type: string): string => {
  switch (type) {
    case 'intrusion': return '🚨';
    case 'firewall': return '🛡️';
    case 'connection': return '🔗';
    case 'scan': return '🔍';
    case 'breach': return '💀';
    case 'traffic': return '📊';
    default: return '⚠️';
  }
};

const getActivityDescription = (type: string): string => {
  switch (type) {
    case 'intrusion': return 'Unauthorized access attempt detected';
    case 'firewall': return 'Firewall rule triggered';
    case 'connection': return 'Network connection established';
    case 'scan': return 'Port scan activity detected';
    case 'breach': return 'Security breach confirmed';
    case 'traffic': return 'Network traffic analysis';
    default: return 'Unknown activity type';
  }
};

export function ActivityDetails({ activity, onClose }: ActivityDetailsProps) {
  const formatTimestamp = (date: Date): string => {
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-black/90 border border-green-500/50 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-green-500/30">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <span className="text-2xl">{getActivityIcon(activity.activity_type)}</span>
                <h2 className="text-xl font-bold text-green-400 font-mono tracking-wide">
                  {activity.title}
                </h2>
              </div>
              <p className="text-green-300/80 text-sm">
                {getActivityDescription(activity.activity_type)}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-green-400 hover:text-green-300 p-2 hover:bg-green-500/10 rounded transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          
          {/* Severity badge */}
          <div className="mt-4">
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold border ${getSeverityColor(activity.severity)}`}>
              {activity.severity.toUpperCase()} THREAT
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh] scrollbar-thin scrollbar-thumb-green-500/30 scrollbar-track-transparent">
          {/* Description */}
          <div className="mb-6">
            <h3 className="text-green-400 font-bold mb-2 text-sm uppercase tracking-wide">
              📋 DESCRIPTION
            </h3>
            <p className="text-green-300 font-mono text-sm bg-black/50 p-3 rounded border border-green-500/20">
              {activity.description}
            </p>
          </div>

          {/* Technical Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Network Info */}
            <div>
              <h3 className="text-green-400 font-bold mb-3 text-sm uppercase tracking-wide">
                🌐 NETWORK INFORMATION
              </h3>
              <div className="space-y-3 text-sm font-mono">
                <div className="bg-black/50 p-3 rounded border border-green-500/20">
                  <span className="text-green-400/60">IP Address:</span>
                  <br />
                  <code className="text-green-300 text-base">{activity.ip_address}</code>
                </div>
                {activity.port && (
                  <div className="bg-black/50 p-3 rounded border border-green-500/20">
                    <span className="text-green-400/60">Port:</span>
                    <br />
                    <code className="text-green-300 text-base">{activity.port}</code>
                  </div>
                )}
                <div className="bg-black/50 p-3 rounded border border-green-500/20">
                  <span className="text-green-400/60">Activity Type:</span>
                  <br />
                  <code className="text-green-300 text-base">{activity.activity_type}</code>
                </div>
              </div>
            </div>

            {/* Location Info */}
            <div>
              <h3 className="text-green-400 font-bold mb-3 text-sm uppercase tracking-wide">
                📍 GEOGRAPHIC LOCATION
              </h3>
              <div className="space-y-3 text-sm font-mono">
                <div className="bg-black/50 p-3 rounded border border-green-500/20">
                  <span className="text-green-400/60">Coordinates:</span>
                  <br />
                  <code className="text-green-300 text-base">
                    {activity.latitude.toFixed(4)}, {activity.longitude.toFixed(4)}
                  </code>
                </div>
                {activity.city && (
                  <div className="bg-black/50 p-3 rounded border border-green-500/20">
                    <span className="text-green-400/60">City:</span>
                    <br />
                    <code className="text-green-300 text-base">{activity.city}</code>
                  </div>
                )}
                {activity.country && (
                  <div className="bg-black/50 p-3 rounded border border-green-500/20">
                    <span className="text-green-400/60">Country:</span>
                    <br />
                    <code className="text-green-300 text-base">{activity.country}</code>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Timestamp */}
          <div className="mb-6">
            <h3 className="text-green-400 font-bold mb-2 text-sm uppercase tracking-wide">
              ⏰ TIMESTAMP
            </h3>
            <div className="bg-black/50 p-3 rounded border border-green-500/20">
              <code className="text-green-300 font-mono text-sm">
                {formatTimestamp(activity.timestamp)}
              </code>
            </div>
          </div>

          {/* Metadata */}
          {activity.metadata && Object.keys(activity.metadata).length > 0 && (
            <div>
              <h3 className="text-green-400 font-bold mb-2 text-sm uppercase tracking-wide">
                🔬 METADATA
              </h3>
              <div className="bg-black/50 p-3 rounded border border-green-500/20 overflow-x-auto">
                <pre className="text-green-300 font-mono text-xs whitespace-pre-wrap">
                  {JSON.stringify(activity.metadata, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-green-500/30 bg-black/30">
          <div className="flex items-center justify-between text-xs text-green-300/60 font-mono">
            <span>Activity ID: {activity.id}</span>
            <span>Created: {formatTimestamp(activity.created_at)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}