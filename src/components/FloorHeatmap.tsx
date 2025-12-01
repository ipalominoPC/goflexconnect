import { useState } from 'react';
import { Info } from 'lucide-react';
import { HeatmapCell } from '../hooks/useFloorMeasurements';
import { getRsrpColor, getRsrpBorderColor, getRsrpLabel, HEATMAP_LEGEND } from '../utils/heatmapColors';

interface FloorHeatmapProps {
  cells: HeatmapCell[];
  gridSize: number;
  floorPlanImage?: string | null;
  floorName: string;
  isDark?: boolean;
}

export default function FloorHeatmap({
  cells,
  gridSize,
  floorPlanImage,
  floorName,
  isDark = true,
}: FloorHeatmapProps) {
  const [hoveredCell, setHoveredCell] = useState<HeatmapCell | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const cellMap = new Map<string, HeatmapCell>();
  cells.forEach(cell => {
    cellMap.set(`${cell.gridX},${cell.gridY}`, cell);
  });

  const handleMouseEnter = (cell: HeatmapCell | null, event: React.MouseEvent) => {
    setHoveredCell(cell);
    setMousePosition({ x: event.clientX, y: event.clientY });
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (hoveredCell) {
      setMousePosition({ x: event.clientX, y: event.clientY });
    }
  };

  const handleMouseLeave = () => {
    setHoveredCell(null);
  };

  const renderGrid = () => {
    const gridCells = [];

    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const cell = cellMap.get(`${x},${y}`);
        const color = getRsrpColor(cell?.avgRsrp ?? null, isDark);
        const borderColor = getRsrpBorderColor(cell?.avgRsrp ?? null, isDark);

        gridCells.push(
          <div
            key={`${x}-${y}`}
            className="relative"
            style={{
              backgroundColor: color,
              borderWidth: '1px',
              borderColor: borderColor,
              cursor: cell ? 'pointer' : 'default',
            }}
            onMouseEnter={(e) => handleMouseEnter(cell ?? null, e)}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          />
        );
      }
    }

    return gridCells;
  };

  const hasFloorPlan = floorPlanImage && floorPlanImage.trim() !== '';

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1">
          <div className={`rounded-2xl shadow-lg overflow-hidden ${isDark ? 'bg-goflex-card border border-slate-700' : 'bg-white border border-slate-200'}`}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Indoor Heatmap — {floorName}
                  </h2>
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'} mt-1`}>
                    {hasFloorPlan ? 'Floor plan with RF overlay' : 'Grid view (no floor plan uploaded)'}
                  </p>
                </div>
              </div>

              <div className="relative w-full aspect-square max-w-3xl mx-auto">
                {hasFloorPlan ? (
                  <div className="relative w-full h-full">
                    <img
                      src={floorPlanImage}
                      alt={`Floor plan for ${floorName}`}
                      className="absolute inset-0 w-full h-full object-contain"
                    />
                    <div
                      className="absolute inset-0 grid"
                      style={{
                        gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
                        gridTemplateRows: `repeat(${gridSize}, minmax(0, 1fr))`,
                      }}
                    >
                      {renderGrid()}
                    </div>
                  </div>
                ) : (
                  <div
                    className="w-full h-full grid"
                    style={{
                      gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
                      gridTemplateRows: `repeat(${gridSize}, minmax(0, 1fr))`,
                    }}
                  >
                    {renderGrid()}
                  </div>
                )}
              </div>

              {cells.length === 0 && (
                <div className={`text-center py-12 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  <Info className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">No measurements yet on this floor</p>
                  <p className="text-sm">Run a survey to see the indoor heatmap.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:w-80">
          <div className={`rounded-2xl shadow-lg p-6 ${isDark ? 'bg-goflex-card border border-slate-700' : 'bg-white border border-slate-200'}`}>
            <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <Info className="w-5 h-5 text-goflex-blue" />
              Signal Strength Legend
            </h3>
            <div className="space-y-3">
              {HEATMAP_LEGEND.map((item) => (
                <div key={item.quality} className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded border"
                    style={{
                      backgroundColor: getRsrpColor(
                        item.quality === 'strong' ? -85 :
                        item.quality === 'medium' ? -100 :
                        item.quality === 'poor' ? -115 :
                        null,
                        isDark
                      ),
                      borderColor: getRsrpBorderColor(
                        item.quality === 'strong' ? -85 :
                        item.quality === 'medium' ? -100 :
                        item.quality === 'poor' ? -115 :
                        null,
                        isDark
                      ),
                    }}
                  />
                  <div className="flex-1">
                    <div className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {item.label}
                    </div>
                    <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      {item.range}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {cells.length > 0 && (
              <div className={`mt-6 pt-6 border-t ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  <div className="flex justify-between mb-2">
                    <span>Total measurements:</span>
                    <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {cells.reduce((sum, cell) => sum + cell.sampleCount, 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Grid cells with data:</span>
                    <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {cells.length}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {hoveredCell && (
        <div
          className={`fixed z-50 px-3 py-2 rounded-lg shadow-lg pointer-events-none ${
            isDark ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200'
          }`}
          style={{
            left: mousePosition.x + 15,
            top: mousePosition.y + 15,
          }}
        >
          <div className={`text-xs ${isDark ? 'text-white' : 'text-slate-900'}`}>
            <div className="font-semibold mb-1">{getRsrpLabel(hoveredCell.avgRsrp)}</div>
            {hoveredCell.avgSinr !== null && (
              <div className={isDark ? 'text-slate-400' : 'text-slate-600'}>
                SINR: {hoveredCell.avgSinr.toFixed(1)} dB
              </div>
            )}
            <div className={isDark ? 'text-slate-400' : 'text-slate-600'}>
              Samples: {hoveredCell.sampleCount}
            </div>
            <div className={isDark ? 'text-slate-500' : 'text-slate-500'}>
              Grid: ({hoveredCell.gridX}, {hoveredCell.gridY})
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
