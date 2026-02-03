// src/services/openCelliDService.ts

export interface CellTower {
  cellId: string;
  mcc: number;
  mnc: number;
  lac: number;
  lat: number;
  lon: number;
  range: number;
  samples: number;
  radio: string;
  updated: number;
  averageSignal: number;
}

export interface CellTowerWithDistance extends CellTower {
  distance: number;
  bearing: number;
  operator: string;
  frequency: string;
}

interface DebugInfo {
  requestUrl: string;
  bbox: string;
  statusCode: number;
  rawCellCount: number;
  timestamp: string;
  errorMessage?: string;
}

const OPENCELLID_API_KEY = 'pk.ec2ef5caa5a9e20fec647cd9220cfc93';
const DEBUG_MODE = true;

const radioTechMap: Record<string, string> = {
  'GSM': '2G GSM',
  'UMTS': '3G UMTS',
  'LTE': '4G LTE',
  'NR': '5G NR',
  'CDMA': 'CDMA',
};

const mccOperatorMap: Record<string, Record<string, string>> = {
  "310": {
    "260": "T-Mobile",
    "160": "T-Mobile",
    "240": "T-Mobile",
    "120": "Sprint",
    "410": "AT&T",
    "030": "AT&T",
    "150": "AT&T",
    "170": "AT&T",
    "280": "AT&T",
    "004": "Verizon",
    "005": "Verizon",
    "010": "Verizon",
    "012": "Verizon",
    "013": "Verizon",
    "480": "Verizon"
  },
  "311": {
    "480": "Verizon",
    "481": "Verizon",
    "482": "Verizon",
    "483": "Verizon",
    "484": "Verizon",
    "485": "Verizon"
  },
};

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const y = Math.sin(dLon) * Math.cos(lat2 * Math.PI / 180);
  const x =
    Math.cos(lat1 * Math.PI / 180) * Math.sin(lat2 * Math.PI / 180) -
    Math.sin(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.cos(dLon);
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}

export async function getNearbyCellTowers(
  latitude: number,
  longitude: number,
  radiusKm: number = 5
): Promise<CellTowerWithDistance[]> {
  if (!OPENCELLID_API_KEY) {
    console.warn('⚠️ No OpenCellID API key - using mock data');
    return generateMockTowers(latitude, longitude);
  }

  try {
    const latDelta = (radiusKm / 111.32) * 1.2;
    const lonDelta = (radiusKm / (111.32 * Math.cos(latitude * Math.PI / 180))) * 1.2;

    const minLon = (longitude - lonDelta).toFixed(6);
    const minLat = (latitude - latDelta).toFixed(6);
    const maxLon = (longitude + lonDelta).toFixed(6);
    const maxLat = (latitude + latDelta).toFixed(6);

    const bbox = `${minLon},${minLat},${maxLon},${maxLat}`;
    const url = `https://opencellid.org/ajax/searchCell.php?key=${OPENCELLID_API_KEY}&BBOX=${bbox}&format=json&limit=50`;

    if (DEBUG_MODE) {
      console.group('🛰️ OpenCellID API Request');
      console.log('📍 Center:', { latitude, longitude });
      console.log('📏 Radius:', `${radiusKm}km`);
      console.log('📦 BBOX (W,S,E,N):', bbox);
      console.log('🔗 URL:', url);
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'GoFlexConnect/1.0 (Android; Samsung S24)',
      },
    });

    const debugInfo: DebugInfo = {
      requestUrl: url,
      bbox,
      statusCode: response.status,
      rawCellCount: 0,
      timestamp: new Date().toISOString(),
    };

    if (!response.ok) {
      debugInfo.errorMessage = `HTTP ${response.status}`;
      if (DEBUG_MODE) {
        console.error('❌ API Error:', debugInfo);
        console.groupEnd();
      }
      return generateMockTowers(latitude, longitude);
    }

    const data = await response.json();
    
    if (DEBUG_MODE) {
      console.log('📊 Response Status:', response.status);
      console.log('📄 Raw Data:', data);
    }

    const cells = data.cells || data.data || data;
    
    if (!Array.isArray(cells) || cells.length === 0) {
      debugInfo.rawCellCount = 0;
      if (DEBUG_MODE) {
        console.warn('⚠️ No cells found in response');
        console.log('🔍 Debug Info:', debugInfo);
        console.groupEnd();
      }
      return generateMockTowers(latitude, longitude);
    }

    debugInfo.rawCellCount = cells.length;

    if (DEBUG_MODE) {
      console.log('✅ Cells Found:', cells.length);
      console.log('🎯 First Cell Sample:', cells[0]);
      console.groupEnd();
    }

    const processedTowers = cells
      .map((cell: any) => {
        const cellLat = Number(cell.lat);
        const cellLon = Number(cell.lon);
        
        if (isNaN(cellLat) || isNaN(cellLon)) return null;

        const mcc = String(cell.mcc || '310');
        const mnc = String(cell.net || cell.mnc || '000');
        const radio = String(cell.radio || 'LTE').toUpperCase();
        
        const operator =
          mccOperatorMap[mcc]?.[mnc] ||
          mccOperatorMap[mcc]?.[mnc.padStart(3, '0')] ||
          `Node ${mcc}-${mnc}`;

        return {
          cellId: String(cell.cell || cell.cellid || Math.random().toString(36).substr(2, 9)),
          mcc: Number(cell.mcc) || 310,
          mnc: Number(cell.net || cell.mnc) || 0,
          lac: Number(cell.area || cell.lac) || 0,
          lat: cellLat,
          lon: cellLon,
          range: Number(cell.range) || 1000,
          samples: Number(cell.samples) || 1,
          radio: radioTechMap[radio] || radio,
          updated: Number(cell.updated) || Date.now(),
          averageSignal: Number(cell.averageSignal) || -85,
          distance: calculateDistance(latitude, longitude, cellLat, cellLon),
          bearing: calculateBearing(latitude, longitude, cellLat, cellLon),
          operator,
          frequency: radio === 'LTE' ? 'LTE-A' : radio === 'NR' ? 'n41' : 'Sub-6',
        };
      })
      .filter((tower): tower is CellTowerWithDistance => tower !== null)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 30);

    if (DEBUG_MODE) {
      console.log('📡 Final Tower Count:', processedTowers.length);
      if (processedTowers.length > 0) {
        console.log('🎯 Nearest Tower:', {
          operator: processedTowers[0].operator,
          distance: `${processedTowers[0].distance.toFixed(2)}km`,
          bearing: `${processedTowers[0].bearing.toFixed(0)}°`,
        });
      }
    }

    return processedTowers.length > 0 ? processedTowers : generateMockTowers(latitude, longitude);
  } catch (error) {
    if (DEBUG_MODE) {
      console.error('❌ OpenCellID Fetch Error:', error);
    }
    return generateMockTowers(latitude, longitude);
  }
}

function generateMockTowers(lat: number, lon: number): CellTowerWithDistance[] {
  if (DEBUG_MODE) {
    console.warn('🔄 Falling back to MOCK DATA');
  }
  
  return [
    {
      cellId: 'MOCK-VZW-001',
      mcc: 311,
      mnc: 480,
      lac: 1,
      lat: lat + 0.003,
      lon: lon + 0.003,
      range: 1000,
      samples: 1,
      radio: '4G LTE',
      updated: Date.now(),
      averageSignal: -75,
      distance: 0.4,
      bearing: 30,
      operator: 'Verizon (Simulated)',
      frequency: 'B13',
    },
    {
      cellId: 'MOCK-TMO-001',
      mcc: 310,
      mnc: 260,
      lac: 1,
      lat: lat - 0.004,
      lon: lon - 0.002,
      range: 1000,
      samples: 1,
      radio: '5G NR',
      updated: Date.now(),
      averageSignal: -82,
      distance: 0.6,
      bearing: 200,
      operator: 'T-Mobile (Simulated)',
      frequency: 'n41',
    },
    {
      cellId: 'MOCK-ATT-001',
      mcc: 310,
      mnc: 410,
      lac: 1,
      lat: lat + 0.005,
      lon: lon - 0.004,
      range: 1000,
      samples: 1,
      radio: '4G LTE',
      updated: Date.now(),
      averageSignal: -88,
      distance: 0.8,
      bearing: 310,
      operator: 'AT&T (Simulated)',
      frequency: 'B2',
    },
  ];
}