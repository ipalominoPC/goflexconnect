import { Geolocation } from '@capacitor/geolocation';
import { Network } from '@capacitor/network';
import { Device } from '@capacitor/device';

/**
 * Device Service - Access native device features
 * Handles GPS, network info, and device information
 */

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude: number | null;
  timestamp: number;
}

export interface NetworkInfo {
  connected: boolean;
  connectionType: 'wifi' | 'cellular' | 'none' | 'unknown';
  downlink: number | null;
  effectiveType: string | null;
}

export interface DeviceInfo {
  platform: 'ios' | 'android' | 'web';
  model: string;
  manufacturer: string;
  osVersion: string;
  appVersion: string;
}

/**
 * Get current GPS coordinates
 */
export async function getCurrentLocation(): Promise<LocationData> {
  try {
    console.log('[Device] Getting current location...');
    
    const position = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    });
    
    const location: LocationData = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      altitude: position.coords.altitude || null,
      timestamp: position.timestamp
    };
    
    console.log('[Device] Location acquired:', location);
    return location;
    
  } catch (error: any) {
    console.error('[Device] Location error:', error);
    
    // User-friendly error messages
    if (error.message?.includes('denied')) {
      throw new Error('Location permission denied. Please enable GPS in Settings.');
    }
    if (error.message?.includes('timeout')) {
      throw new Error('GPS timeout. Please ensure you have a clear view of the sky.');
    }
    
    throw new Error('Unable to get location. Please check GPS settings.');
  }
}

/**
 * Watch location continuously (for survey mode)
 * Returns a watch ID that can be used to stop watching
 */
export function watchLocation(
  callback: (location: LocationData) => void,
  errorCallback?: (error: Error) => void
): string {
  console.log('[Device] Starting location watch...');
  
  const watchId = Geolocation.watchPosition(
    {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 1000 // Accept cached position up to 1 second old
    },
    (position, error) => {
      if (error) {
        console.error('[Device] Location watch error:', error);
        if (errorCallback) {
          errorCallback(new Error(error.message || 'Location watch failed'));
        }
        return;
      }
      
      if (position) {
        const location: LocationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude || null,
          timestamp: position.timestamp
        };
        
        callback(location);
      }
    }
  );
  
  return watchId;
}

/**
 * Stop watching location
 */
export async function clearLocationWatch(watchId: string): Promise<void> {
  try {
    await Geolocation.clearWatch({ id: watchId });
    console.log('[Device] Location watch stopped');
  } catch (error) {
    console.error('[Device] Error stopping location watch:', error);
  }
}

/**
 * Request location permissions
 */
export async function requestLocationPermissions(): Promise<boolean> {
  try {
    console.log('[Device] Requesting location permissions...');
    
    const permission = await Geolocation.requestPermissions();
    const granted = permission.location === 'granted';
    
    console.log('[Device] Location permission:', granted ? 'GRANTED' : 'DENIED');
    return granted;
    
  } catch (error) {
    console.error('[Device] Permission request error:', error);
    return false;
  }
}

/**
 * Check location permission status
 */
export async function checkLocationPermissions(): Promise<boolean> {
  try {
    const permission = await Geolocation.checkPermissions();
    return permission.location === 'granted';
  } catch (error) {
    console.error('[Device] Permission check error:', error);
    return false;
  }
}

/**
 * Get network information
 */
export async function getNetworkInfo(): Promise<NetworkInfo> {
  try {
    const status = await Network.getStatus();
    
    return {
      connected: status.connected,
      connectionType: status.connectionType,
      downlink: null, // Not available in basic plugin
      effectiveType: null // Not available in basic plugin
    };
  } catch (error) {
    console.error('[Device] Network error:', error);
    
    // Return default values if network check fails
    return {
      connected: false,
      connectionType: 'unknown',
      downlink: null,
      effectiveType: null
    };
  }
}

/**
 * Listen for network changes
 */
export function addNetworkListener(callback: (status: NetworkInfo) => void) {
  const listener = Network.addListener('networkStatusChange', (status) => {
    callback({
      connected: status.connected,
      connectionType: status.connectionType,
      downlink: null,
      effectiveType: null
    });
  });
  
  return listener;
}

/**
 * Get device information
 */
export async function getDeviceInfo(): Promise<DeviceInfo> {
  try {
    const info = await Device.getInfo();
    
    return {
      platform: info.platform as 'ios' | 'android' | 'web',
      model: info.model,
      manufacturer: info.manufacturer,
      osVersion: info.osVersion,
      appVersion: '1.0.0' // TODO: Get from package.json
    };
  } catch (error) {
    console.error('[Device] Device info error:', error);
    
    // Return web defaults if device check fails
    return {
      platform: 'web',
      model: 'Unknown',
      manufacturer: 'Unknown',
      osVersion: 'Unknown',
      appVersion: '1.0.0'
    };
  }
}

/**
 * Check if running in native app (not browser)
 */
export function isNativeApp(): boolean {
  // @ts-ignore - Capacitor global may not be in types
  return window.Capacitor?.isNativePlatform() || false;
}

/**
 * Get platform name
 */
export async function getPlatform(): Promise<'ios' | 'android' | 'web'> {
  const info = await getDeviceInfo();
  return info.platform;
}

/**
 * Check if GPS is available and enabled
 */
export async function isLocationAvailable(): Promise<boolean> {
  try {
    // Try to get a position with short timeout
    await Geolocation.getCurrentPosition({
      enableHighAccuracy: false,
      timeout: 3000,
      maximumAge: 60000 // Accept 1 minute old position for this check
    });
    return true;
  } catch (error) {
    console.warn('[Device] Location not available:', error);
    return false;
  }
}
