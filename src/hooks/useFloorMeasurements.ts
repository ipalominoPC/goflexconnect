import { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { Floor, Measurement } from '../types';

export type HeatmapCell = {
  gridX: number;
  gridY: number;
  avgRsrp: number | null;
  avgSinr: number | null;
  sampleCount: number;
};

export type FloorHeatmapData = {
  floor: Floor | null;
  cells: HeatmapCell[];
  gridSize: number;
  loading: boolean;
  error: string | null;
};

export function useFloorMeasurements(floorId: string): FloorHeatmapData {
  const [floor, setFloor] = useState<Floor | null>(null);
  const [cells, setCells] = useState<HeatmapCell[]>([]);
  const [gridSize, setGridSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        const { data: floorData, error: floorError } = await supabase
          .from('floors')
          .select('*')
          .eq('id', floorId)
          .single();

        if (floorError) throw floorError;

        if (!isMounted) return;

        const floorRecord: Floor = {
          id: floorData.id,
          projectId: floorData.project_id,
          name: floorData.name,
          level: floorData.level,
          floorPlanImage: floorData.floor_plan_image,
          floorPlanFilename: floorData.floor_plan_filename,
          notes: floorData.notes,
          gridSize: floorData.grid_size || 10,
          gridEnabled: floorData.grid_enabled || false,
          createdAt: new Date(floorData.created_at).getTime(),
          updatedAt: new Date(floorData.updated_at).getTime(),
        };

        setFloor(floorRecord);
        const currentGridSize = floorRecord.gridSize || 10;
        setGridSize(currentGridSize);

        const { data: measurementsData, error: measurementsError } = await supabase
          .from('measurements')
          .select('id, x, y, grid_x, grid_y, rsrp, sinr, rsrq, rssi, timestamp')
          .eq('floor_id', floorId);

        if (measurementsError) throw measurementsError;

        if (!isMounted) return;

        const measurements: Measurement[] = measurementsData.map((m: any) => ({
          id: m.id,
          projectId: floorRecord.projectId,
          floorId: floorId,
          x: m.x,
          y: m.y,
          locationNumber: 0,
          rsrp: m.rsrp,
          rsrq: m.rsrq,
          sinr: m.sinr,
          rssi: m.rssi,
          cellId: '',
          techType: 'LTE' as const,
          timestamp: new Date(m.timestamp).getTime(),
          gridX: m.grid_x,
          gridY: m.grid_y,
        }));

        const heatmapCells = processHeatmapCells(measurements, currentGridSize);
        setCells(heatmapCells);
      } catch (err) {
        if (isMounted) {
          console.error('Error fetching floor measurements:', err);
          setError(err instanceof Error ? err.message : 'Failed to load data');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    if (floorId) {
      fetchData();
    }

    return () => {
      isMounted = false;
    };
  }, [floorId]);

  return { floor, cells, gridSize, loading, error };
}

function processHeatmapCells(measurements: Measurement[], gridSize: number): HeatmapCell[] {
  if (measurements.length === 0) {
    return [];
  }

  const hasGridCoords = measurements.some(m => m.gridX !== undefined && m.gridY !== undefined);

  let gridMeasurements: Array<{ gridX: number; gridY: number; rsrp: number; sinr: number }> = [];

  if (hasGridCoords) {
    gridMeasurements = measurements
      .filter(m => m.gridX !== undefined && m.gridY !== undefined)
      .map(m => ({
        gridX: m.gridX!,
        gridY: m.gridY!,
        rsrp: m.rsrp,
        sinr: m.sinr,
      }));
  } else {
    const xValues = measurements.map(m => m.x);
    const yValues = measurements.map(m => m.y);
    const minX = Math.min(...xValues);
    const maxX = Math.max(...xValues);
    const minY = Math.min(...yValues);
    const maxY = Math.max(...yValues);

    const xRange = maxX - minX || 1;
    const yRange = maxY - minY || 1;

    gridMeasurements = measurements.map(m => {
      const normalizedX = (m.x - minX) / xRange;
      const normalizedY = (m.y - minY) / yRange;
      const gridX = Math.floor(normalizedX * (gridSize - 1));
      const gridY = Math.floor(normalizedY * (gridSize - 1));

      return {
        gridX: Math.max(0, Math.min(gridSize - 1, gridX)),
        gridY: Math.max(0, Math.min(gridSize - 1, gridY)),
        rsrp: m.rsrp,
        sinr: m.sinr,
      };
    });
  }

  const cellMap = new Map<string, { rsrpSum: number; sinrSum: number; count: number }>();

  gridMeasurements.forEach(({ gridX, gridY, rsrp, sinr }) => {
    const key = `${gridX},${gridY}`;
    const existing = cellMap.get(key) || { rsrpSum: 0, sinrSum: 0, count: 0 };
    existing.rsrpSum += rsrp;
    existing.sinrSum += sinr;
    existing.count += 1;
    cellMap.set(key, existing);
  });

  const cells: HeatmapCell[] = [];
  cellMap.forEach((value, key) => {
    const [gridX, gridY] = key.split(',').map(Number);
    cells.push({
      gridX,
      gridY,
      avgRsrp: value.rsrpSum / value.count,
      avgSinr: value.sinrSum / value.count,
      sampleCount: value.count,
    });
  });

  return cells;
}
