import { GridPoint, Measurement } from '../types';

export function generateGridPoints(
  gridSize: number,
  measurements: Measurement[]
): GridPoint[] {
  const points: GridPoint[] = [];
  const measurementMap = new Map<string, boolean>();

  measurements.forEach((m) => {
    if (m.gridX !== undefined && m.gridY !== undefined) {
      measurementMap.set(`${m.gridX}-${m.gridY}`, true);
    }
  });

  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const x = (col + 0.5) / gridSize;
      const y = (row + 0.5) / gridSize;
      const hasMeasurement = measurementMap.has(`${col}-${row}`);

      points.push({
        x,
        y,
        gridX: col,
        gridY: row,
        hasMeasurement,
      });
    }
  }

  return points;
}

export function getGridCellFromPosition(
  x: number,
  y: number,
  gridSize: number
): { gridX: number; gridY: number } {
  const gridX = Math.floor(x * gridSize);
  const gridY = Math.floor(y * gridSize);
  return { gridX, gridY };
}

export function snapToGridCenter(
  x: number,
  y: number,
  gridSize: number
): { x: number; y: number } {
  const { gridX, gridY } = getGridCellFromPosition(x, y, gridSize);
  return {
    x: (gridX + 0.5) / gridSize,
    y: (gridY + 0.5) / gridSize,
  };
}

export function getGridCellSize(gridSize: number, feetPerSide: number = 100): number {
  return feetPerSide / gridSize;
}

export function getGridLabel(gridX: number, gridY: number): string {
  const letter = String.fromCharCode(65 + gridX);
  const number = gridY + 1;
  return `${letter}${number}`;
}
