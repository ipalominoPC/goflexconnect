import { Measurement } from '../types';

export function getMockSignalSample(): Omit<Measurement, 'id' | 'projectId' | 'floorId' | 'x' | 'y' | 'timestamp'> {
  const techTypes: Array<'LTE' | '5G' | '4G'> = ['LTE', '5G', '4G'];
  const techType = techTypes[Math.floor(Math.random() * techTypes.length)];

  const rsrp = -120 + Math.random() * 50;
  const rsrq = -20 + Math.random() * 17;
  const sinr = -10 + Math.random() * 30;
  const rssi = -110 + Math.random() * 50;
  const cellId = `PCI-${Math.floor(Math.random() * 500)}`;

  return {
    locationNumber: 0,
    rsrp: Math.round(rsrp * 10) / 10,
    rsrq: Math.round(rsrq * 10) / 10,
    sinr: Math.round(sinr * 10) / 10,
    rssi: Math.round(rssi * 10) / 10,
    cellId,
    techType,
  };
}

export function createSampleProjects() {
  return [
    {
      id: 'demo-1',
      name: 'Office Building - Floor 3',
      location: 'Downtown Office Complex',
      buildingLevel: 'Floor 3',
      notes: 'Survey completed during business hours',
      createdAt: Date.now() - 86400000 * 5,
      updatedAt: Date.now() - 86400000 * 2,
    },
    {
      id: 'demo-2',
      name: 'Shopping Mall - Ground Level',
      location: 'Westfield Mall',
      buildingLevel: 'Ground',
      notes: 'High foot traffic areas',
      createdAt: Date.now() - 86400000 * 10,
      updatedAt: Date.now() - 86400000 * 7,
    },
  ];
}

export function createSampleMeasurements(projectId: string, count: number = 15): Measurement[] {
  const measurements: Measurement[] = [];

  for (let i = 0; i < count; i++) {
    const mockData = getMockSignalSample();
    measurements.push({
      id: `${projectId}-meas-${i}`,
      projectId,
      floorId: '',
      x: Math.random(),
      y: Math.random(),
      locationNumber: i + 1,
      rsrp: mockData.rsrp,
      rsrq: mockData.rsrq,
      sinr: mockData.sinr,
      rssi: mockData.rssi,
      cellId: mockData.cellId,
      techType: mockData.techType,
      timestamp: Date.now() - Math.random() * 3600000,
    });
  }

  return measurements;
}
