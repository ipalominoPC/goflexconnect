/**
 * Cellular Signal Service
 * Handles reading cellular signal strength from the device
 * 
 * PHASE 1: Mock data for testing
 * PHASE 2: Will integrate with native plugins for real data
 */

export interface SignalStrength {
  rssi: number | null;        // Received Signal Strength Indicator (-120 to -20 dBm)
  rsrp: number | null;        // Reference Signal Received Power (LTE/5G: -140 to -44 dBm)
  rsrq: number | null;        // Reference Signal Received Quality (LTE/5G: -20 to -3 dB)
  sinr: number | null;        // Signal-to-Interference-plus-Noise Ratio (5G)
  networkType: string | null; // "4G", "5G", "LTE", "3G", etc.
  carrier: string | null;     // Carrier/operator name
  bars: number;               // Signal bars (0-5, where 5 is best)
  level: 'excellent' | 'good' | 'fair' | 'poor' | 'no-signal';
  timestamp: number;
}

/**
 * Convert RSSI to signal bars (0-5)
 * Based on industry standards for cellular signals
 */
function rssiToBars(rssi: number | null): number {
  if (rssi === null) return 0;
  
  if (rssi >= -50) return 5;  // Excellent
  if (rssi >= -60) return 4;  // Very good
  if (rssi >= -70) return 3;  // Good
  if (rssi >= -80) return 2;  // Fair
  if (rssi >= -90) return 1;  // Poor
  return 0;                    // Very poor / no signal
}

/**
 * Convert RSSI to quality level
 */
function rssiToLevel(rssi: number | null): 'excellent' | 'good' | 'fair' | 'poor' | 'no-signal' {
  if (rssi === null) return 'no-signal';
  
  if (rssi >= -50) return 'excellent';
  if (rssi >= -70) return 'good';
  if (rssi >= -85) return 'fair';
  if (rssi >= -100) return 'poor';
  return 'no-signal';
}

/**
 * Get current cellular signal strength
 * 
 * CURRENT: Returns realistic mock data for testing
 * TODO: Replace with actual native plugin calls
 */
export async function getCellularSignal(): Promise<SignalStrength> {
  console.log('[Signal] Getting cellular signal...');
  
  // TODO: Replace this with real native code
  // For now, generate realistic mock data that varies
  
  // Simulate realistic signal variation (-85 to -55 dBm is typical indoor range)
  const baseRssi = -70; // Average signal
  const variation = (Math.random() - 0.5) * 30; // ±15 dBm variation
  const rssi = Math.round(baseRssi + variation);
  
  // RSRP is typically 10-15 dBm lower than RSSI
  const rsrp = rssi - 10 - Math.round(Math.random() * 5);
  
  // RSRQ is typically between -3 and -20 dB
  const rsrq = Math.round(-10 + (Math.random() - 0.5) * 10);
  
  // SINR for 5G (typically 0 to 30 dB)
  const sinr = Math.round(10 + Math.random() * 15);
  
  const signal: SignalStrength = {
    rssi: rssi,
    rsrp: rsrp,
    rsrq: rsrq,
    sinr: sinr,
    networkType: Math.random() > 0.5 ? '5G' : 'LTE',
    carrier: 'Unknown', // Will be populated by native code
    bars: rssiToBars(rssi),
    level: rssiToLevel(rssi),
    timestamp: Date.now()
  };
  
  console.log('[Signal] Signal acquired:', signal);
  return signal;
}

/**
 * Watch cellular signal continuously
 * Useful for survey mode where you want real-time updates
 * 
 * @param callback - Called whenever signal is measured
 * @param intervalMs - How often to check signal (default: 2 seconds)
 * @returns Watch ID that can be used to stop watching
 */
export function watchCellularSignal(
  callback: (signal: SignalStrength) => void,
  intervalMs: number = 2000
): number {
  console.log('[Signal] Starting signal watch (interval:', intervalMs, 'ms)');
  
  const intervalId = window.setInterval(async () => {
    try {
      const signal = await getCellularSignal();
      callback(signal);
    } catch (error) {
      console.error('[Signal] Error in signal watch:', error);
    }
  }, intervalMs);
  
  return intervalId;
}

/**
 * Stop watching cellular signal
 */
export function clearSignalWatch(watchId: number): void {
  clearInterval(watchId);
  console.log('[Signal] Signal watch stopped');
}

/**
 * Get a signal quality description
 */
export function getSignalDescription(signal: SignalStrength): string {
  if (!signal.rssi) return 'No signal detected';
  
  const bars = signal.bars;
  const rssi = signal.rssi;
  
  if (bars === 5) return `Excellent (${rssi} dBm) - Strong, stable signal`;
  if (bars === 4) return `Very Good (${rssi} dBm) - Reliable signal`;
  if (bars === 3) return `Good (${rssi} dBm) - Acceptable signal`;
  if (bars === 2) return `Fair (${rssi} dBm) - May experience issues`;
  if (bars === 1) return `Poor (${rssi} dBm) - Weak signal, likely issues`;
  return `No Signal (${rssi} dBm) - Connection unstable`;
}

/**
 * Check if signal is acceptable for DAS installation
 * Returns true if signal is "Good" or better (3+ bars)
 */
export function isSignalAcceptable(signal: SignalStrength): boolean {
  return signal.bars >= 3;
}

/**
 * Get signal color for UI display
 */
export function getSignalColor(signal: SignalStrength): string {
  if (signal.bars >= 4) return '#10b981'; // Green - excellent/very good
  if (signal.bars === 3) return '#f59e0b'; // Amber - good
  if (signal.bars === 2) return '#ef4444'; // Red - fair
  return '#9ca3af'; // Gray - poor/no signal
}

/**
 * Format signal data for display
 */
export function formatSignalForDisplay(signal: SignalStrength) {
  return {
    primary: signal.rssi ? `${signal.rssi} dBm` : 'No Signal',
    secondary: signal.networkType || 'Unknown',
    bars: signal.bars,
    level: signal.level,
    color: getSignalColor(signal),
    details: {
      rssi: signal.rssi,
      rsrp: signal.rsrp,
      rsrq: signal.rsrq,
      sinr: signal.sinr,
      networkType: signal.networkType,
      carrier: signal.carrier
    }
  };
}

// =============================================================================
// NATIVE PLUGIN INTEGRATION (Future Implementation)
// =============================================================================

/**
 * PHASE 2: Real signal data from native plugins
 * 
 * iOS Implementation:
 * - Use CoreTelephony framework
 * - CTTelephonyNetworkInfo for carrier info
 * - Private APIs (if needed) for signal strength
 * 
 * Android Implementation:
 * - Use TelephonyManager
 * - SignalStrength class for signal metrics
 * - CellInfo for detailed cell information
 * 
 * Example native bridge code would go in:
 * - ios/App/App/Plugins/CellularSignalPlugin.swift
 * - android/app/src/main/java/com/goflexconnect/app/CellularSignalPlugin.java
 */

/**
 * Example of future native plugin call:
 * 
 * export async function getCellularSignalNative(): Promise<SignalStrength> {
 *   try {
 *     // Call native plugin
 *     const result = await CellularSignal.getSignalStrength();
 *     
 *     return {
 *       rssi: result.rssi,
 *       rsrp: result.rsrp,
 *       rsrq: result.rsrq,
 *       sinr: result.sinr,
 *       networkType: result.networkType,
 *       carrier: result.carrier,
 *       bars: rssiToBars(result.rssi),
 *       level: rssiToLevel(result.rssi),
 *       timestamp: Date.now()
 *     };
 *   } catch (error) {
 *     console.error('[Signal] Native plugin error:', error);
 *     // Fallback to mock data
 *     return getCellularSignal();
 *   }
 * }
 */
