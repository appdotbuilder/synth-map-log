import { useState, useEffect, useRef } from 'react';
import type { NetworkActivity } from '../../../server/src/schema';

interface WorldMapProps {
  activities: NetworkActivity[];
  onActivitySelect: (activity: NetworkActivity) => void;
}

interface MapPoint {
  x: number;
  y: number;
  activity: NetworkActivity;
}

// Convert lat/lng to SVG coordinates (simplified projection)
const latLngToPoint = (lat: number, lng: number, width: number, height: number): { x: number; y: number } => {
  const x = ((lng + 180) / 360) * width;
  const y = ((90 - lat) / 180) * height;
  return { x, y };
};

const getSeverityColor = (severity: string): string => {
  switch (severity) {
    case 'critical': return '#ef4444'; // red
    case 'error': return '#f97316'; // orange
    case 'warning': return '#eab308'; // yellow
    case 'info': return '#3b82f6'; // blue
    case 'debug': return '#8b5cf6'; // purple
    default: return '#10b981'; // green
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

export function WorldMap({ activities, onActivitySelect }: WorldMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 400 });
  const [mapPoints, setMapPoints] = useState<MapPoint[]>([]);
  const [hoveredPoint, setHoveredPoint] = useState<MapPoint | null>(null);

  // Update dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (svgRef.current) {
        const rect = svgRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Convert activities to map points
  useEffect(() => {
    const points = activities.map(activity => {
      const { x, y } = latLngToPoint(
        activity.latitude, 
        activity.longitude, 
        dimensions.width, 
        dimensions.height
      );
      return { x, y, activity };
    });
    setMapPoints(points);
  }, [activities, dimensions]);

  return (
    <div className="relative w-full h-full bg-gray-900 overflow-hidden">
      {/* World map background */}
      <svg
        ref={svgRef}
        className="w-full h-full"
        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
        preserveAspectRatio="xMidYMid slice"
      >
        {/* Grid background */}
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgb(34 197 94)" strokeWidth="0.5" opacity="0.2"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        
        {/* Simplified world map outline */}
        <g stroke="rgb(34 197 94)" strokeWidth="1" fill="none" opacity="0.3">
          {/* Simplified continent outlines - these are rough approximations */}
          <path d={`M${dimensions.width * 0.15},${dimensions.height * 0.3} Q${dimensions.width * 0.25},${dimensions.height * 0.25} ${dimensions.width * 0.35},${dimensions.height * 0.35} L${dimensions.width * 0.4},${dimensions.height * 0.5} Q${dimensions.width * 0.35},${dimensions.height * 0.6} ${dimensions.width * 0.2},${dimensions.height * 0.65} Z`} />
          <path d={`M${dimensions.width * 0.45},${dimensions.height * 0.2} Q${dimensions.width * 0.6},${dimensions.height * 0.15} ${dimensions.width * 0.75},${dimensions.height * 0.25} L${dimensions.width * 0.8},${dimensions.height * 0.4} Q${dimensions.width * 0.75},${dimensions.height * 0.5} ${dimensions.width * 0.6},${dimensions.height * 0.55} L${dimensions.width * 0.45},${dimensions.height * 0.5} Z`} />
          <path d={`M${dimensions.width * 0.75},${dimensions.height * 0.6} Q${dimensions.width * 0.85},${dimensions.height * 0.65} ${dimensions.width * 0.9},${dimensions.height * 0.75} L${dimensions.width * 0.85},${dimensions.height * 0.85} Q${dimensions.width * 0.8},${dimensions.height * 0.8} ${dimensions.width * 0.75},${dimensions.height * 0.75} Z`} />
        </g>

        {/* Activity points */}
        {mapPoints.map((point, index) => (
          <g key={point.activity.id}>
            {/* Pulsing circle background */}
            <circle
              cx={point.x}
              cy={point.y}
              r="8"
              fill={getSeverityColor(point.activity.severity)}
              opacity="0.3"
              className="animate-ping"
            />
            {/* Main activity point */}
            <circle
              cx={point.x}
              cy={point.y}
              r="4"
              fill={getSeverityColor(point.activity.severity)}
              stroke="white"
              strokeWidth="1"
              className="cursor-pointer hover:r-6 transition-all duration-200"
              onClick={() => onActivitySelect(point.activity)}
              onMouseEnter={() => setHoveredPoint(point)}
              onMouseLeave={() => setHoveredPoint(null)}
            />
            {/* Activity icon */}
            <text
              x={point.x}
              y={point.y + 1}
              textAnchor="middle"
              className="text-xs pointer-events-none select-none"
              fill="white"
            >
              {getActivityIcon(point.activity.activity_type)}
            </text>
          </g>
        ))}

        {/* Connection lines between nearby points */}
        {mapPoints.map((point1, i) => 
          mapPoints.slice(i + 1).map((point2, j) => {
            const distance = Math.sqrt(
              Math.pow(point1.x - point2.x, 2) + Math.pow(point1.y - point2.y, 2)
            );
            if (distance < 150) { // Only connect nearby points
              return (
                <line
                  key={`${point1.activity.id}-${point2.activity.id}`}
                  x1={point1.x}
                  y1={point1.y}
                  x2={point2.x}
                  y2={point2.y}
                  stroke="rgb(34 197 94)"
                  strokeWidth="0.5"
                  opacity="0.2"
                  className="animate-pulse"
                />
              );
            }
            return null;
          })
        )}

        {/* Scanning wave animation */}
        <circle
          cx={dimensions.width / 2}
          cy={dimensions.height / 2}
          r="50"
          fill="none"
          stroke="rgb(34 197 94)"
          strokeWidth="2"
          opacity="0.6"
          className="animate-ping"
          style={{ animationDuration: '3s' }}
        />
      </svg>

      {/* Hover tooltip */}
      {hoveredPoint && (
        <div 
          className="absolute bg-black/90 border border-green-500 rounded-lg p-3 text-sm z-10 pointer-events-none backdrop-blur-sm"
          style={{
            left: hoveredPoint.x + 10,
            top: hoveredPoint.y - 10,
            transform: 'translate(0, -100%)'
          }}
        >
          <div className="text-green-400 font-bold mb-1">
            {getActivityIcon(hoveredPoint.activity.activity_type)} {hoveredPoint.activity.title}
          </div>
          <div className="text-green-300/80 text-xs space-y-1">
            <div>Type: {hoveredPoint.activity.activity_type}</div>
            <div>Severity: <span className={`font-bold ${
              hoveredPoint.activity.severity === 'critical' ? 'text-red-400' :
              hoveredPoint.activity.severity === 'error' ? 'text-orange-400' :
              hoveredPoint.activity.severity === 'warning' ? 'text-yellow-400' :
              'text-green-400'
            }`}>{hoveredPoint.activity.severity.toUpperCase()}</span></div>
            <div>IP: {hoveredPoint.activity.ip_address}</div>
            {hoveredPoint.activity.city && (
              <div>Location: {hoveredPoint.activity.city}, {hoveredPoint.activity.country}</div>
            )}
            <div className="text-green-200/60">
              {new Date(hoveredPoint.activity.timestamp).toLocaleTimeString()}
            </div>
          </div>
        </div>
      )}

      {/* Map legend */}
      <div className="absolute bottom-4 left-4 bg-black/80 border border-green-500/30 rounded-lg p-3 text-xs backdrop-blur-sm">
        <div className="text-green-400 font-bold mb-2">THREAT LEVELS</div>
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-red-400">CRITICAL</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
            <span className="text-orange-400">ERROR</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span className="text-yellow-400">WARNING</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-blue-400">INFO</span>
          </div>
        </div>
      </div>

      {/* Activity count display */}
      <div className="absolute top-4 right-4 bg-black/80 border border-green-500/30 rounded-lg p-3 text-center backdrop-blur-sm">
        <div className="text-2xl font-bold text-green-400">{activities.length}</div>
        <div className="text-xs text-green-300/60">ACTIVE THREATS</div>
      </div>
    </div>
  );
}