export interface LocationData {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  ipAddress: string | null;
  ipLocation: {
    city: string | null;
    region: string | null;
    country: string | null;
    timezone: string | null;
  } | null;
  isVpn: boolean;
  vpnConfidence: number;
}

export interface IpApiResponse {
  query: string;
  status: string;
  country: string;
  countryCode: string;
  region: string;
  regionName: string;
  city: string;
  zip: string;
  lat: number;
  lon: number;
  timezone: string;
  isp: string;
  org: string;
  as: string;
  proxy: boolean;
  hosting: boolean;
}

const VPN_INDICATORS = [
  'vpn',
  'proxy',
  'datacentre',
  'datacenter',
  'hosting',
  'cloud',
  'virtual',
  'tunnel',
  'anonymizer',
];

function analyzeVpnProbability(ipData: IpApiResponse): { isVpn: boolean; confidence: number } {
  let vpnScore = 0;
  const checks = [];

  if (ipData.proxy) {
    vpnScore += 40;
    checks.push('proxy detected');
  }

  if (ipData.hosting) {
    vpnScore += 30;
    checks.push('hosting provider');
  }

  const ispLower = ipData.isp.toLowerCase();
  const orgLower = ipData.org.toLowerCase();
  const asLower = ipData.as.toLowerCase();

  for (const indicator of VPN_INDICATORS) {
    if (ispLower.includes(indicator) || orgLower.includes(indicator) || asLower.includes(indicator)) {
      vpnScore += 20;
      checks.push(`indicator: ${indicator}`);
      break;
    }
  }

  const confidence = Math.min(vpnScore, 100);
  const isVpn = confidence >= 50;

  console.log('VPN Analysis:', { checks, confidence, isVpn });

  return { isVpn, confidence };
}

export async function getIpLocation(): Promise<LocationData['ipLocation'] & { ip: string; isVpn: boolean; vpnConfidence: number }> {
  try {
    const response = await fetch('http://ip-api.com/json/?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,proxy,hosting,query');

    if (!response.ok) {
      throw new Error('Failed to fetch IP location');
    }

    const data: IpApiResponse = await response.json();

    if (data.status === 'fail') {
      throw new Error('IP location lookup failed');
    }

    const { isVpn, confidence } = analyzeVpnProbability(data);

    return {
      ip: data.query,
      city: data.city,
      region: data.regionName,
      country: data.country,
      timezone: data.timezone,
      isVpn,
      vpnConfidence: confidence,
    };
  } catch (error) {
    console.error('Error fetching IP location:', error);
    return {
      ip: '',
      city: '',
      region: '',
      country: '',
      timezone: '',
      isVpn: false,
      vpnConfidence: 0,
    };
  }
}

export async function getGpsLocation(): Promise<{ latitude: number; longitude: number; accuracy: number } | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      console.error('Geolocation is not supported by this browser');
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        console.error('Error getting GPS location:', error);
        resolve(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
}

export async function getCompleteLocation(): Promise<LocationData> {
  const [ipData, gpsData] = await Promise.all([
    getIpLocation(),
    getGpsLocation(),
  ]);

  return {
    latitude: gpsData?.latitude || null,
    longitude: gpsData?.longitude || null,
    accuracy: gpsData?.accuracy || null,
    ipAddress: ipData.ip,
    ipLocation: ipData.ip ? {
      city: ipData.city,
      region: ipData.region,
      country: ipData.country,
      timezone: ipData.timezone,
    } : null,
    isVpn: ipData.isVpn,
    vpnConfidence: ipData.vpnConfidence,
  };
}
