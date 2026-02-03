import { registerPlugin, Capacitor } from '@capacitor/core';
import { useStore } from '../store/useStore';

const GFCModem = registerPlugin<any>('GFCModem');

export const startSignalMonitoring = () => {
  const updateStore = (data: any) => {
    if (!data) return;
    
    // SURGICAL UPDATE: Ensure data types are strictly numeric for sparklines
    useStore.setState({
      currentSignal: {
        rsrp: typeof data.rsrp === 'number' ? data.rsrp : (Number(data.rsrp) || -140),
        rsrq: typeof data.rsrq === 'number' ? data.rsrq : (Number(data.rsrq) || -20),
        sinr: typeof data.sinr === 'number' ? data.sinr : (Number(data.sinr) || -10),
        carrier: data.carrierName || data.carrier || 'Scanning...',
        technology: data.networkType || data.technology || 'LTE'
      }
    });
  };

  if (!Capacitor.isNativePlatform()) {
    const mockInterval = setInterval(() => {
      updateStore({ 
        rsrp: -90 - Math.floor(Math.random() * 20), 
        rsrq: -12, 
        sinr: 10 + Math.floor(Math.random() * 10), 
        carrierName: 'Web-Mock' 
      });
    }, 1500); // Faster mock for testing
    return () => clearInterval(mockInterval);
  }

  try {
    // 1. PUSH LISTENER (Reactive)
    const signalListener = GFCModem.addListener('onSignalUpdate', (data: any) => {
      updateStore(data);
    });

    // 2. IMMEDIATE TRIGGER
    GFCModem.getSignal().then(updateStore);

    return () => signalListener.remove();
  } catch (e) {
    console.error('[Flux] Bridge Error:', e);
    return () => {};
  }
};

export async function getCellularSignal() {
  if (!Capacitor.isNativePlatform()) return { rsrp: -105, rsrq: -12, sinr: 5, carrier: 'Web' };
  try {
    const result = await GFCModem.getSignal();
    return {
      rsrp: Number(result.rsrp) || -140,
      rsrq: Number(result.rsrq) || -20,
      sinr: Number(result.sinr) || -10,
      carrier: result.carrierName || 'Unknown'
    };
  } catch (e) {
    return { rsrp: -140, rsrq: -20, sinr: -10, carrier: 'ERROR' };
  }
}