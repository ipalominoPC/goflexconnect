import React from 'react';

interface LiveSparklineProps {
  data: number[];
  color?: string;
  limit?: number;
}

export default function LiveSparkline({ data, color = "#27AAE1", limit = 20 }: LiveSparklineProps) {
  // Normalize data for the SVG viewbox (height 40, width 100)
  // Assuming RSRP range roughly -120 to -60
  const points = data.slice(-limit).map((val, i) => {
    const x = (i / (limit - 1)) * 100;
    const normalizedVal = Math.min(Math.max(val, -120), -60);
    const y = 40 - ((normalizedVal + 120) / 60) * 40;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="relative w-24 h-10 overflow-hidden">
      <svg viewBox="0 0 100 40" className="w-full h-full overflow-visible">
        <defs>
          <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.5" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Glowing Area Fill */}
        <path
          d={`M 0,40 L ${points} L 100,40 Z`}
          fill="url(#lineGradient)"
          className="transition-all duration-500 ease-in-out"
        />
        {/* The Signal Line */}
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
          className="transition-all duration-500 ease-in-out"
          style={{ filter: `drop-shadow(0 0 4px ${color})` }}
        />
      </svg>
    </div>
  );
}
