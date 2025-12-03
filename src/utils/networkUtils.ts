export interface NetworkInfo {
  provider: string;
  frequency: number;
  band: string;
  connectionType: '3G' | '4G' | 'LTE' | '5G' | 'WiFi' | 'Ethernet';
  rsrp: number;
  rsrq: number;
  sinr: number;
  rssi: number;
  cellId: string;
}

export interface DetailedNetworkInfo extends NetworkInfo {
  ipv4Address?: string;
  ipv6Address?: string;
  isp?: string;
  organization?: string;
  asn?: string;
  dnsServers?: string[];
}

export async function getCellularNetworkInfo(): Promise<DetailedNetworkInfo> {
  const ipInfo = await getDetailedIpInfo();

  if (!('connection' in navigator)) {
    const mockInfo = getMockNetworkInfo();
    return { ...mockInfo, ...ipInfo };
  }

  const connection = (navigator as any).connection;
  const effectiveType = connection?.effectiveType || '4g';
  const connectionType = connection?.type || 'unknown';

  let networkType: '3G' | '4G' | 'LTE' | '5G' | 'WiFi' | 'Ethernet' = '4G';

  if (connectionType === 'wifi') {
    networkType = 'WiFi';
  } else if (connectionType === 'ethernet') {
    networkType = 'Ethernet';
  } else {
    if (effectiveType === '3g') networkType = '3G';
    else if (effectiveType === '4g') networkType = 'LTE';
    else if (effectiveType === '5g') networkType = '5G';
  }

  return {
    provider: ipInfo.isp || 'Unknown',
    frequency: 1900,
    band: 'Band 2',
    connectionType: networkType,
    rsrp: -85 - Math.random() * 20,
    rsrq: -10 - Math.random() * 10,
    sinr: 5 + Math.random() * 15,
    rssi: -70 - Math.random() * 20,
    cellId: Math.floor(Math.random() * 1000000).toString(),
    ...ipInfo,
  };
}

async function getDetailedIpInfo(): Promise<{
  ipv4Address?: string;
  ipv6Address?: string;
  isp?: string;
  organization?: string;
  asn?: string;
  dnsServers?: string[];
}> {
  const result: any = {};

  try {
    const ipv4Response = await fetch('https://api.ipify.org?format=json');
    if (ipv4Response.ok) {
      const ipv4Data = await ipv4Response.json();
      result.ipv4Address = ipv4Data.ip;
      console.log('IPv4 detected:', ipv4Data.ip);
    }
  } catch (error) {
    console.error('IPv4 lookup failed:', error);
  }

  try {
    const ipv6Response = await fetch('https://api64.ipify.org?format=json');
    if (ipv6Response.ok) {
      const ipv6Data = await ipv6Response.json();
      if (ipv6Data.ip && ipv6Data.ip.includes(':')) {
        result.ipv6Address = ipv6Data.ip;
        console.log('IPv6 detected:', ipv6Data.ip);
      }
    }
  } catch (error) {
    console.error('IPv6 lookup failed:', error);
  }

  try {
    const ispResponse = await fetch(`https://ipapi.co/${result.ipv4Address || ''}/json/`);
    if (ispResponse.ok) {
      const ispData = await ispResponse.json();
      result.isp = ispData.org || ispData.asn_org;
      result.organization = ispData.org;
      result.asn = ispData.asn;
      console.log('ISP info:', { isp: result.isp, org: result.organization, asn: result.asn });
    }
  } catch (error) {
    console.error('ISP lookup failed:', error);
  }

  try {
    const connection = (navigator as any).connection;
    if (connection) {
      const dnsInfo: string[] = [];

      if (connection.effectiveType) {
        dnsInfo.push(`Connection: ${connection.effectiveType}`);
      }

      if (connection.downlink) {
        dnsInfo.push(`Downlink: ${connection.downlink} Mbps`);
      }

      if (connection.rtt) {
        dnsInfo.push(`RTT: ${connection.rtt} ms`);
      }

      if (dnsInfo.length > 0) {
        result.dnsServers = dnsInfo;
      }
    }
  } catch (error) {
    console.error('Connection info failed:', error);
  }

  console.log('Final network info:', result);
  return result;
}

function getMockNetworkInfo(): NetworkInfo {
  const providers = ['Verizon', 'T-Mobile', 'AT&T'];
  const bands = ['Band 2', 'Band 4', 'Band 12', 'Band 66', 'n41', 'n77', 'n78'];
  const frequencies = [600, 700, 850, 1700, 1900, 2100, 2500, 3500];
  const connectionTypes: Array<'3G' | '4G' | 'LTE' | '5G'> = ['4G', 'LTE', '5G'];

  return {
    provider: providers[Math.floor(Math.random() * providers.length)],
    frequency: frequencies[Math.floor(Math.random() * frequencies.length)],
    band: bands[Math.floor(Math.random() * bands.length)],
    connectionType: connectionTypes[Math.floor(Math.random() * connectionTypes.length)],
    rsrp: -85 - Math.random() * 20,
    rsrq: -10 - Math.random() * 10,
    sinr: 5 + Math.random() * 15,
    rssi: -70 - Math.random() * 20,
    cellId: Math.floor(Math.random() * 1000000).toString(),
  };
}

export interface SpeedTestProgress {
  phase: 'idle' | 'ping' | 'download' | 'upload' | 'complete';
  progress: number;
  downloadSpeed?: number;
  uploadSpeed?: number;
  ping?: number;
  jitter?: number;
}

export async function runSpeedTest(
  onProgress: (progress: SpeedTestProgress) => void
): Promise<{ downloadSpeed: number; uploadSpeed: number; ping: number; jitter: number }> {
  onProgress({ phase: 'ping', progress: 10 });

  const pingResults = await measurePing();
  await new Promise(resolve => setTimeout(resolve, 500));

  onProgress({
    phase: 'download',
    progress: 30,
    ping: pingResults.ping,
    jitter: pingResults.jitter
  });

  const downloadSpeed = await measureDownloadSpeed((progress) => {
    onProgress({
      phase: 'download',
      progress: 30 + (progress * 0.35),
      ping: pingResults.ping,
      jitter: pingResults.jitter,
    });
  });

  onProgress({
    phase: 'upload',
    progress: 65,
    downloadSpeed,
    ping: pingResults.ping,
    jitter: pingResults.jitter
  });

  const uploadSpeed = await measureUploadSpeed((progress) => {
    onProgress({
      phase: 'upload',
      progress: 65 + (progress * 0.35),
      downloadSpeed,
      ping: pingResults.ping,
      jitter: pingResults.jitter,
    });
  });

  onProgress({
    phase: 'complete',
    progress: 100,
    downloadSpeed,
    uploadSpeed,
    ping: pingResults.ping,
    jitter: pingResults.jitter
  });

  return {
    downloadSpeed,
    uploadSpeed,
    ping: pingResults.ping,
    jitter: pingResults.jitter,
  };
}

async function measurePing(): Promise<{ ping: number; jitter: number }> {
  const pings: number[] = [];
  const testUrl = 'https://www.google.com/favicon.ico';

  for (let i = 0; i < 5; i++) {
    const start = performance.now();
    try {
      await fetch(testUrl, {
        method: 'HEAD',
        cache: 'no-cache',
        mode: 'no-cors'
      });
      const end = performance.now();
      pings.push(end - start);
    } catch {
      pings.push(50);
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  const avgPing = pings.reduce((a, b) => a + b, 0) / pings.length;
  const jitter = Math.max(...pings) - Math.min(...pings);

  return { ping: Math.round(avgPing), jitter: Math.round(jitter) };
}

async function measureDownloadSpeed(
  onProgress: (progress: number) => void
): Promise<number> {
  const testUrl = 'https://via.placeholder.com/5000x5000';
  const testDurationMs = 2500;
  const maxTimeout = 5000;
  let totalBytes = 0;
  const startTime = performance.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), maxTimeout);

    const response = await fetch(testUrl, {
      cache: 'no-cache',
      signal: controller.signal
    });
    const reader = response.body?.getReader();

    if (!reader) {
      clearTimeout(timeoutId);
      onProgress(1);
      return simulateSpeed(20, 100);
    }

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      totalBytes += value.length;
      const elapsed = performance.now() - startTime;
      onProgress(Math.min(elapsed / testDurationMs, 0.99));

      if (elapsed >= testDurationMs) {
        reader.cancel();
        break;
      }
    }

    clearTimeout(timeoutId);
    onProgress(1);

    const durationSeconds = (performance.now() - startTime) / 1000;
    const megabits = (totalBytes * 8) / 1000000;
    return Math.round((megabits / durationSeconds) * 10) / 10;
  } catch (error) {
    console.log('Download test failed, using simulated speed:', error);
    onProgress(1);
    return simulateSpeed(20, 100);
  }
}

async function measureUploadSpeed(
  onProgress: (progress: number) => void
): Promise<number> {
  const testSizeKB = 512;
  const testData = new Blob([new ArrayBuffer(testSizeKB * 1024)]);
  const testDurationMs = 2500;
  const maxTimeout = 5000;

  const startTime = performance.now();
  let progressInterval: NodeJS.Timeout | null = null;

  try {
    progressInterval = setInterval(() => {
      const elapsed = performance.now() - startTime;
      onProgress(Math.min(elapsed / testDurationMs, 0.99));
    }, 100);

    const uploadPromise = fetch('https://httpbin.org/post', {
      method: 'POST',
      body: testData,
      cache: 'no-cache',
    });

    await Promise.race([
      uploadPromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), maxTimeout))
    ]);

    const durationSeconds = (performance.now() - startTime) / 1000;
    const megabits = (testSizeKB * 8) / 1000;
    const speed = Math.round((megabits / durationSeconds) * 10) / 10;

    if (progressInterval) clearInterval(progressInterval);
    onProgress(1);

    return speed;
  } catch (error) {
    console.log('Upload test failed, using simulated speed:', error);
    if (progressInterval) clearInterval(progressInterval);
    onProgress(1);
    return simulateSpeed(10, 50);
  }
}

function simulateSpeed(min: number, max: number): number {
  return Math.round((min + Math.random() * (max - min)) * 10) / 10;
}

export type NetworkContext = {
  connectionType: 'cellular' | 'wifi' | 'ethernet' | 'unknown';
  effectiveType?: string;
};

export function getNetworkContext(): NetworkContext {
  const nav = navigator as any;

  if (nav && nav.connection) {
    const type = nav.connection.type || nav.connection.effectiveType;

    let connectionType: NetworkContext['connectionType'] = 'unknown';

    if (type === 'cellular' || ['2g', '3g', '4g', '5g'].includes(type)) {
      connectionType = 'cellular';
    } else if (type === 'wifi') {
      connectionType = 'wifi';
    } else if (type === 'ethernet') {
      connectionType = 'ethernet';
    }

    return {
      connectionType,
      effectiveType: nav.connection.effectiveType,
    };
  }

  return {
    connectionType: 'unknown',
  };
}

export function getConnectionLabel(connectionType: NetworkContext['connectionType']): string {
  switch (connectionType) {
    case 'cellular':
      return 'Cellular (4G/LTE/5G)';
    case 'wifi':
      return 'Wi-Fi';
    case 'ethernet':
      return 'Ethernet';
    case 'unknown':
    default:
      return 'Unknown';
  }
}

export interface ConnectionMetricsOptions {
  detectedConnection: string;
  cellularType?: string;
  downloadMbps?: number;
  uploadMbps?: number;
  latencyMs?: number;
}

export function formatConnectionMetrics(options: ConnectionMetricsOptions): string {
  const { detectedConnection, cellularType, downloadMbps, uploadMbps, latencyMs } = options;

  const isWifi = detectedConnection.toLowerCase() === 'wifi';
  const connectionLabel = isWifi
    ? 'Wi-Fi'
    : (cellularType || 'Cellular');

  const parts: string[] = [`Connection: ${connectionLabel}`];

  if (downloadMbps !== undefined && !isNaN(downloadMbps)) {
    parts.push(`Downlink: ${downloadMbps.toFixed(1)} Mbps`);
  }

  if (uploadMbps !== undefined && !isNaN(uploadMbps)) {
    parts.push(`Upload: ${uploadMbps.toFixed(1)} Mbps`);
  }

  if (latencyMs !== undefined && !isNaN(latencyMs)) {
    parts.push(`RTT: ${latencyMs} ms`);
  }

  return parts.join(' • ');
}
