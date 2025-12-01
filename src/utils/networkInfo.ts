// TODO: When GoFlexConnect gets a native wrapper (Capacitor / React Native),
// replace browser limitations with real OS-level APIs:
// - True cellular vs Wi-Fi detection
// - Carrier ID (MCC/MNC)
// - Cell tower + band information
// - Low-level RF metrics
// Browsers cannot expose these. Current implementation is best-effort.

export type DetectedNetworkInfo = {
  connectionType: 'wifi' | 'cellular' | 'unknown';
  effectiveType: string;
  downlink?: number;
  rtt?: number;
  rawConnectionInfo?: string;
  deviceSummary: string;
  isMobile: boolean;
};

export function detectNetworkInfo(): DetectedNetworkInfo {
  const ua = navigator.userAgent || (navigator as any).vendor || (window as any).opera || '';
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  const isDesktop = !isMobile;

  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;

  let connectionType: 'wifi' | 'cellular' | 'unknown' = 'unknown';
  let effectiveType = 'unknown';
  let downlink: number | undefined;
  let rtt: number | undefined;
  let rawConnectionInfo: string | undefined;

  if (connection) {
    effectiveType = connection.effectiveType || 'unknown';
    downlink = connection.downlink;
    rtt = connection.rtt;

    try {
      rawConnectionInfo = JSON.stringify({
        type: connection.type,
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData,
      });
    } catch {
      rawConnectionInfo = 'Unable to serialize connection info';
    }

    if (connection.type === 'cellular') {
      connectionType = 'cellular';
    } else if (connection.type === 'wifi') {
      connectionType = 'wifi';
    } else if (connection.type === 'ethernet') {
      connectionType = 'wifi';
    }
  }

  if (connectionType === 'unknown') {
    if (isMobile) {
      connectionType = 'unknown';
    } else {
      connectionType = 'wifi';
    }
  }

  const deviceSummary = getDeviceSummary();

  return {
    connectionType,
    effectiveType,
    downlink,
    rtt,
    rawConnectionInfo,
    deviceSummary,
    isMobile,
  };
}

function getDeviceSummary(): string {
  const ua = navigator.userAgent;

  if (/iPhone|iPad|iPod/.test(ua)) {
    return 'iOS device';
  } else if (/Android/.test(ua)) {
    return 'Android device';
  } else if (/Windows/.test(ua)) {
    return 'Windows desktop';
  } else if (/Macintosh|Mac OS X/.test(ua)) {
    return 'macOS desktop';
  } else if (/Linux/.test(ua)) {
    return 'Linux desktop';
  } else {
    return 'Unknown device';
  }
}

export function getNetworkTypeLabel(type: string | null | undefined): string {
  if (!type) return 'Unknown';

  const typeMap: Record<string, string> = {
    '5g': '5G',
    '5G': '5G',
    '4g': '4G/LTE',
    '4G': '4G/LTE',
    'lte': '4G/LTE',
    'LTE': '4G/LTE',
    '3g': '3G',
    '3G': '3G',
    'wifi': 'Wi-Fi',
    'Wi-Fi': 'Wi-Fi',
    'WiFi': 'Wi-Fi',
    'other': 'Other',
    'Other': 'Other',
  };

  return typeMap[type] || type;
}
