import { createClient } from '@supabase/supabase-js';
import { SpeedTestResult } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'goflexconnect-auth',
  },
});

export async function saveSpeedTest(result: SpeedTestResult): Promise<void> {
  const { error } = await supabase.from('speed_tests').insert({
    id: result.id,
    timestamp: new Date(result.timestamp).toISOString(),
    download_speed: result.downloadSpeed,
    upload_speed: result.uploadSpeed,
    ping: result.ping,
    jitter: result.jitter || 0,
    rsrp: result.rsrp,
    rsrq: result.rsrq,
    sinr: result.sinr,
    rssi: result.rssi,
    cell_id: result.cellId,
    provider: result.provider,
    frequency: result.frequency,
    band: result.band,
    connection_type: result.connectionType,
    latitude: result.latitude,
    longitude: result.longitude,
    ip_address: result.ipAddress,
    ip_city: result.ipCity,
    ip_region: result.ipRegion,
    ip_country: result.ipCountry,
    ip_timezone: result.ipTimezone,
    is_vpn: result.isVpn || false,
    vpn_confidence: result.vpnConfidence || 0,
    gps_accuracy: result.gpsAccuracy,
  });

  if (error) {
    console.error('Error saving speed test:', error);
    throw error;
  }
}

export async function getSpeedTestHistory(limit = 50): Promise<SpeedTestResult[]> {
  const { data, error } = await supabase
    .from('speed_tests')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching speed test history:', error);
    throw error;
  }

  return (data || []).map((row) => ({
    id: row.id,
    timestamp: new Date(row.timestamp).getTime(),
    downloadSpeed: Number(row.download_speed),
    uploadSpeed: Number(row.upload_speed),
    ping: row.ping,
    jitter: row.jitter,
    rsrp: Number(row.rsrp),
    rsrq: Number(row.rsrq),
    sinr: Number(row.sinr),
    rssi: Number(row.rssi),
    cellId: row.cell_id,
    provider: row.provider,
    frequency: row.frequency,
    band: row.band,
    connectionType: row.connection_type,
    latitude: row.latitude ? Number(row.latitude) : undefined,
    longitude: row.longitude ? Number(row.longitude) : undefined,
    ipAddress: row.ip_address,
    ipCity: row.ip_city,
    ipRegion: row.ip_region,
    ipCountry: row.ip_country,
    ipTimezone: row.ip_timezone,
    isVpn: row.is_vpn,
    vpnConfidence: row.vpn_confidence,
    gpsAccuracy: row.gps_accuracy ? Number(row.gps_accuracy) : undefined,
  }));
}

export async function exportAllData(): Promise<string> {
  const speedTests = await getSpeedTestHistory(1000);

  const exportData = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    speedTests,
  };

  return JSON.stringify(exportData, null, 2);
}

export async function importData(jsonData: string): Promise<void> {
  const data = JSON.parse(jsonData);

  if (data.speedTests && Array.isArray(data.speedTests)) {
    for (const test of data.speedTests) {
      try {
        await saveSpeedTest(test);
      } catch (error) {
        console.error('Error importing speed test:', error);
      }
    }
  }
}
