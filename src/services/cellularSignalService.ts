import { registerPlugin, Capacitor } from '@capacitor/core';

// We define the interface exactly how the Java expects it
interface RFEnginePlugin {
  getSignal(): Promise<{
    rsrp: number;
    rsrq: number;
    rssi: number;
    sinr: number;
    carrierName: string;
    networkType: string;
    cellId: string;
    band: string;
    latitude: number;
    longitude: number;
    accuracy: number;
    altitude: number;
    timestamp: number;
  }>;
}

// Use Capacitor.Plugins direct access (Capacitor 6 style)
const GFCModem = Capacitor.Plugins.GFCModem as any;

export async function getCellularSignal() {
  console.log('[GFCModem] getCellularSignal() called');
  
  try {
    // 1. Check if we are on Android
    if (!Capacitor.isNativePlatform()) {
      console.log('[GFCModem] Not on native platform');
      throw new Error('NOT_ON_S24');
    }

    console.log('[GFCModem] Platform is native, checking plugin...');
    console.log('[GFCModem] GFCModem exists?', !!GFCModem);
    console.log('[GFCModem] GFCModem.getSignal exists?', !!GFCModem?.getSignal);

    // 2. Call the plugin directly
    console.log('[GFCModem] Calling GFCModem.getSignal()...');
    const result = await GFCModem.getSignal();
    console.log('[GFCModem] SUCCESS! Result:', result);

    return {
      rsrp: result.rsrp || -105,
      rsrq: result.rsrq || -12,
      rssi: result.rssi || -80,
      sinr: result.sinr || 0,
      networkType: result.networkType || '5G',
      carrier: result.carrierName || 'T-Mobile',
      cellId: result.cellId || '---',
      band: result.band || 'N/A',
      latitude: result.latitude || 0,
      longitude: result.longitude || 0,
      accuracy: result.accuracy || 0,
      altitude: result.altitude || 0,
      timestamp: result.timestamp || Date.now(),
      bars: 3,
      level: 'good'
    };
  } catch (e: any) {
    console.error('[GFCModem] ERROR:', e);
    console.error('[GFCModem] Error message:', e.message);
    console.error('[GFCModem] Error code:', e.code);
    
    // 3. If it fails, list ALL available plugins so we can see what the S24 DID find
    const availablePlugins = Object.keys((Capacitor as any).Plugins).join(', ');
    console.log('[GFCModem] Available plugins:', availablePlugins);
    
    return {
      networkType: 'ERR',
      carrier: 'LIST: ' + (availablePlugins || 'NONE'),
      rsrp: 0, 
      rsrq: 0,
      rssi: 0,
      sinr: 0,
      cellId: 'ERROR: ' + e.message, 
      band: 'N/A',
      latitude: 0,
      longitude: 0,
      accuracy: 0,
      altitude: 0,
      timestamp: Date.now()
    };
  }
}

export function watchCellularSignal(callback: any, interval: number = 1000) {
  console.log('[GFCModem] Starting watch with interval:', interval);
  return window.setInterval(async () => {
    const signal = await getCellularSignal();
    callback(signal);
  }, interval);
}

export function clearSignalWatch(id: number) {
  console.log('[GFCModem] Clearing watch:', id);
  clearInterval(id);
}