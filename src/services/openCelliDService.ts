export interface CellTower {
  cellId: string;
  mcc: number;
  mnc: number;
  lac: number;
  lat: number;
  lon: number;
  range: number;
  samples: number;
  changeable: number;
  radio: string;
  unit: number;
  created: number;
  updated: number;
  averageSignal: number;
}

export interface CellTowerWithDistance extends CellTower {
  distance: number;
  bearing: number;
  operator: string;
  frequency: string;
}

const OPENCELLID_API_KEY = import.meta.env.VITE_OPENCELLID_API_KEY || '';

const radioTechMap: Record<string, string> = {
  'GSM': '2G GSM',
  'UMTS': '3G UMTS',
  'LTE': '4G LTE',
  'NR': '5G NR',
  'CDMA': 'CDMA',
};

const mccOperatorMap: Record<number, Record<number, string>> = {
  310: {
    410: 'AT&T',
    260: 'T-Mobile',
    160: 'T-Mobile',
    200: 'T-Mobile',
    210: 'T-Mobile',
    220: 'T-Mobile',
    230: 'T-Mobile',
    240: 'T-Mobile',
    250: 'T-Mobile',
    260: 'T-Mobile',
    270: 'T-Mobile',
    280: 'T-Mobile',
    290: 'T-Mobile',
    300: 'T-Mobile',
    310: 'T-Mobile',
    800: 'T-Mobile',
    490: 'T-Mobile',
    4: 'Verizon',
    5: 'Verizon',
    6: 'Verizon',
    10: 'Verizon',
    12: 'Verizon',
    13: 'Verizon',
    590: 'Verizon',
    890: 'Verizon',
    910: 'Verizon',
    120: 'Sprint',
  },
  311: {
    480: 'Verizon',
    481: 'Verizon',
    482: 'Verizon',
    483: 'Verizon',
    484: 'Verizon',
    485: 'Verizon',
    486: 'Verizon',
    487: 'Verizon',
    488: 'Verizon',
    489: 'Verizon',
  },
};

const frequencyMap: Record<string, Record<string, string>> = {
  'GSM': {
    'default': '850/900/1800/1900 MHz',
  },
  'UMTS': {
    'default': '850/1900/2100 MHz',
  },
  'LTE': {
    'AT&T': '700/850/1700/1900/2300 MHz',
    'Verizon': '700/850/1900/2500 MHz',
    'T-Mobile': '600/700/1700/1900/2500 MHz',
    'default': '700/850/1700/1900/2500 MHz',
  },
  'NR': {
    'AT&T': '3.7 GHz (C-Band), mmWave',
    'Verizon': '3.7 GHz (C-Band), mmWave',
    'T-Mobile': '2.5/3.7 GHz, 600 MHz',
    'default': '2.5/3.7 GHz (C-Band)',
  },
};

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const y = Math.sin(dLon) * Math.cos(lat2 * Math.PI / 180);
  const x = Math.cos(lat1 * Math.PI / 180) * Math.sin(lat2 * Math.PI / 180) -
    Math.sin(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.cos(dLon);
  let bearing = Math.atan2(y, x) * 180 / Math.PI;
  bearing = (bearing + 360) % 360;
  return bearing;
}

function getOperatorName(mcc: number, mnc: number): string {
  return mccOperatorMap[mcc]?.[mnc] || 'Unknown Carrier';
}

function getFrequencyInfo(radio: string, operator: string): string {
  const radioFreqs = frequencyMap[radio];
  if (!radioFreqs) return 'Unknown';
  return radioFreqs[operator] || radioFreqs['default'] || 'Unknown';
}

export async function getNearbyCellTowers(
  latitude: number,
  longitude: number,
  radiusKm: number = 5
): Promise<CellTowerWithDistance[]> {
  if (!OPENCELLID_API_KEY) {
    console.warn('OpenCelliD API key not configured');
    return generateMockTowers(latitude, longitude);
  }

  try {
    const latDelta = radiusKm / 111;
    const lonDelta = radiusKm / (111 * Math.cos(latitude * Math.PI / 180));

    const bbox = [
      latitude - latDelta,
      longitude - lonDelta,
      latitude + latDelta,
      longitude + lonDelta,
    ].join(',');

    const url = `https://opencellid.org/cell/getInArea?key=${OPENCELLID_API_KEY}&BBOX=${bbox}&format=json`;

    const response = await fetch(url);

    if (!response.ok) {
      console.error('OpenCelliD API error:', response.status);
      return generateMockTowers(latitude, longitude);
    }

    const data = await response.json();

    if (!data.cells || data.cells.length === 0) {
      console.warn('No cell towers found in area');
      return generateMockTowers(latitude, longitude);
    }

    const towers: CellTowerWithDistance[] = data.cells
      .map((cell: CellTower) => {
        const distance = calculateDistance(latitude, longitude, cell.lat, cell.lon);
        const bearing = calculateBearing(latitude, longitude, cell.lat, cell.lon);
        const operator = getOperatorName(cell.mcc, cell.mnc);
        const technology = radioTechMap[cell.radio] || cell.radio;
        const frequency = getFrequencyInfo(cell.radio, operator);

        return {
          ...cell,
          distance,
          bearing,
          operator,
          frequency,
          technology,
        };
      })
      .sort((a: CellTowerWithDistance, b: CellTowerWithDistance) => a.distance - b.distance)
      .slice(0, 10);

    return towers;
  } catch (error) {
    console.error('Error fetching cell towers:', error);
    return generateMockTowers(latitude, longitude);
  }
}

function generateMockTowers(latitude: number, longitude: number): CellTowerWithDistance[] {
  const mockTowers: CellTowerWithDistance[] = [
    {
      cellId: '12345678',
      mcc: 310,
      mnc: 410,
      lac: 1000,
      lat: latitude + 0.007,
      lon: longitude + 0.007,
      range: 1000,
      samples: 50,
      changeable: 1,
      radio: 'NR',
      unit: 1,
      created: Date.now(),
      updated: Date.now(),
      averageSignal: -75,
      distance: 0.8,
      bearing: 45,
      operator: 'AT&T',
      frequency: '3.7 GHz (C-Band), mmWave',
    },
    {
      cellId: '23456789',
      mcc: 310,
      mnc: 4,
      lac: 2000,
      lat: latitude + 0.01,
      lon: longitude - 0.005,
      range: 1500,
      samples: 75,
      changeable: 1,
      radio: 'LTE',
      unit: 1,
      created: Date.now(),
      updated: Date.now(),
      averageSignal: -85,
      distance: 1.2,
      bearing: 135,
      operator: 'Verizon',
      frequency: '700/850/1900/2500 MHz',
    },
    {
      cellId: '34567890',
      mcc: 310,
      mnc: 260,
      lac: 3000,
      lat: latitude - 0.005,
      lon: longitude - 0.009,
      range: 800,
      samples: 100,
      changeable: 1,
      radio: 'NR',
      unit: 1,
      created: Date.now(),
      updated: Date.now(),
      averageSignal: -68,
      distance: 0.5,
      bearing: 270,
      operator: 'T-Mobile',
      frequency: '2.5/3.7 GHz, 600 MHz',
    },
  ];

  return mockTowers;
}
