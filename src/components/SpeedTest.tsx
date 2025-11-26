import { useState, useEffect } from 'react';
import { ArrowLeft, Gauge, Download, Upload, Activity, Signal, MapPin, Globe, Wifi } from 'lucide-react';
import { runSpeedTest, getCellularNetworkInfo, SpeedTestProgress } from '../utils/networkUtils';
import { SpeedTestResult } from '../types';
import { getCompleteLocation, LocationData } from '../services/locationService';
import VpnWarning from './VpnWarning';
import { generateUUID } from '../utils/uuid';

interface SpeedTestProps {
  onBack: () => void;
  onSaveResult: (result: SpeedTestResult) => void;
}

export default function SpeedTest({ onBack, onSaveResult }: SpeedTestProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState<SpeedTestProgress>({ phase: 'idle', progress: 0 });
  const [result, setResult] = useState<SpeedTestResult | null>(null);
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [showVpnWarning, setShowVpnWarning] = useState(false);
  const [isCheckingLocation, setIsCheckingLocation] = useState(true);

  useEffect(() => {
    checkLocation();
  }, []);

  const checkLocation = async () => {
    setIsCheckingLocation(true);
    const location = await getCompleteLocation();
    setLocationData(location);

    if (location.isVpn && location.vpnConfidence >= 50) {
      setShowVpnWarning(true);
    }

    setIsCheckingLocation(false);
  };

  const startTest = async () => {
    if (!locationData || (locationData.isVpn && locationData.vpnConfidence >= 50)) {
      setShowVpnWarning(true);
      return;
    }

    setIsRunning(true);
    setResult(null);
    setProgress({ phase: 'idle', progress: 0 });

    try {
      const networkInfo = await getCellularNetworkInfo();
      const speedResults = await runSpeedTest(setProgress);

      const testResult: SpeedTestResult = {
        id: generateUUID(),
        timestamp: Date.now(),
        downloadSpeed: speedResults.downloadSpeed,
        uploadSpeed: speedResults.uploadSpeed,
        ping: speedResults.ping,
        jitter: speedResults.jitter,
        rsrp: networkInfo.rsrp,
        rsrq: networkInfo.rsrq,
        sinr: networkInfo.sinr,
        rssi: networkInfo.rssi,
        cellId: networkInfo.cellId,
        provider: networkInfo.provider,
        frequency: networkInfo.frequency,
        band: networkInfo.band,
        connectionType: networkInfo.connectionType,
        latitude: locationData.latitude || undefined,
        longitude: locationData.longitude || undefined,
        ipAddress: networkInfo.ipv4Address || locationData.ipAddress || undefined,
        ipv6Address: networkInfo.ipv6Address || undefined,
        ipCity: locationData.ipLocation?.city || undefined,
        ipRegion: locationData.ipLocation?.region || undefined,
        ipCountry: locationData.ipLocation?.country || undefined,
        ipTimezone: locationData.ipLocation?.timezone || undefined,
        isp: networkInfo.isp || undefined,
        organization: networkInfo.organization || undefined,
        asn: networkInfo.asn || undefined,
        dnsServers: networkInfo.dnsServers || undefined,
        isVpn: locationData.isVpn,
        vpnConfidence: locationData.vpnConfidence,
        gpsAccuracy: locationData.accuracy || undefined,
      };

      setResult(testResult);
      onSaveResult(testResult);
    } catch (error) {
      console.error('Speed test failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const getPhaseText = () => {
    switch (progress.phase) {
      case 'ping': return 'Testing latency...';
      case 'download': return 'Testing download speed...';
      case 'upload': return 'Testing upload speed...';
      case 'complete': return 'Test complete!';
      default: return 'Ready to test';
    }
  };

  if (isCheckingLocation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-goflex-blue mx-auto mb-4"></div>
          <p className="text-slate-600">Checking location and network...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {showVpnWarning && locationData && (
        <VpnWarning
          vpnConfidence={locationData.vpnConfidence}
          onDisconnect={async () => {
            setShowVpnWarning(false);
            await checkLocation();
          }}
          onExit={onBack}
        />
      )}

      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-6">
        <button
          onClick={onBack}
          disabled={isRunning}
          className="flex items-center gap-2 text-slate-700 hover:text-slate-900 mb-6 disabled:opacity-50"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Back</span>
        </button>

        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl mb-4">
              <Gauge className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Speed Test</h1>
            <p className="text-slate-600">
              Test your network speed and view cellular metrics
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
            <div className="text-center mb-8">
              <div className="relative w-48 h-48 mx-auto mb-6">
                <svg className="transform -rotate-90 w-48 h-48">
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    stroke="#e2e8f0"
                    strokeWidth="12"
                    fill="none"
                  />
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    stroke="#10b981"
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 88}`}
                    strokeDashoffset={`${2 * Math.PI * 88 * (1 - progress.progress / 100)}`}
                    strokeLinecap="round"
                    className="transition-all duration-300"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className="text-4xl font-bold text-slate-900">
                    {Math.round(progress.progress)}%
                  </span>
                  <span className="text-sm text-slate-600 mt-1">
                    {getPhaseText()}
                  </span>
                </div>
              </div>

              <button
                onClick={startTest}
                disabled={isRunning}
                className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold rounded-xl hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
              >
                {isRunning ? 'Testing...' : 'Start Test'}
              </button>
            </div>

            {(progress.downloadSpeed || progress.uploadSpeed || progress.ping) && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-slate-200">
                <div className="text-center p-4 bg-slate-50 rounded-xl">
                  <Download className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-slate-900">
                    {progress.downloadSpeed?.toFixed(1) || '0.0'}
                  </div>
                  <div className="text-sm text-slate-600">Mbps Download</div>
                </div>

                <div className="text-center p-4 bg-slate-50 rounded-xl">
                  <Upload className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-slate-900">
                    {progress.uploadSpeed?.toFixed(1) || '0.0'}
                  </div>
                  <div className="text-sm text-slate-600">Mbps Upload</div>
                </div>

                <div className="text-center p-4 bg-slate-50 rounded-xl">
                  <Activity className="w-6 h-6 text-amber-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-slate-900">
                    {progress.ping || '0'}
                  </div>
                  <div className="text-sm text-slate-600">ms Ping</div>
                </div>
              </div>
            )}
          </div>

          {result && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Signal className="w-5 h-5 text-emerald-500" />
                  Network Information
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <div className="text-xs text-slate-600 mb-1">Provider</div>
                    <div className="text-sm font-semibold text-slate-900">{result.provider}</div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <div className="text-xs text-slate-600 mb-1">Connection Type</div>
                    <div className="text-sm font-semibold text-slate-900">{result.connectionType}</div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <div className="text-xs text-slate-600 mb-1">Frequency</div>
                    <div className="text-sm font-semibold text-slate-900">{result.frequency} MHz</div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <div className="text-xs text-slate-600 mb-1">Band</div>
                    <div className="text-sm font-semibold text-slate-900">{result.band}</div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <div className="text-xs text-slate-600 mb-1">Cell ID</div>
                    <div className="text-sm font-semibold text-slate-900">{result.cellId}</div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <div className="text-xs text-slate-600 mb-1">Jitter</div>
                    <div className="text-sm font-semibold text-slate-900">{result.jitter} ms</div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-500" />
                  Cellular Metrics
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <div className="text-xs text-slate-600 mb-1">RSRP</div>
                    <div className="text-sm font-semibold text-slate-900">{result.rsrp.toFixed(1)} dBm</div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <div className="text-xs text-slate-600 mb-1">RSRQ</div>
                    <div className="text-sm font-semibold text-slate-900">{result.rsrq.toFixed(1)} dB</div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <div className="text-xs text-slate-600 mb-1">SINR</div>
                    <div className="text-sm font-semibold text-slate-900">{result.sinr.toFixed(1)} dB</div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <div className="text-xs text-slate-600 mb-1">RSSI</div>
                    <div className="text-sm font-semibold text-slate-900">{result.rssi.toFixed(1)} dBm</div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-blue-500" />
                  IP &amp; Network Details
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {result.ipAddress && (
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <div className="text-xs text-slate-600 mb-1">IPv4 Address</div>
                      <div className="text-sm font-semibold text-slate-900">{result.ipAddress}</div>
                    </div>
                  )}
                  {result.ipv6Address && (
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <div className="text-xs text-slate-600 mb-1">IPv6 Address</div>
                      <div className="text-sm font-semibold text-slate-900 break-all">{result.ipv6Address}</div>
                    </div>
                  )}
                  {result.isp && (
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <div className="text-xs text-slate-600 mb-1">Internet Service Provider</div>
                      <div className="text-sm font-semibold text-slate-900">{result.isp}</div>
                    </div>
                  )}
                  {result.organization && (
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <div className="text-xs text-slate-600 mb-1">Organization</div>
                      <div className="text-sm font-semibold text-slate-900">{result.organization}</div>
                    </div>
                  )}
                  {result.asn && (
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <div className="text-xs text-slate-600 mb-1">ASN</div>
                      <div className="text-sm font-semibold text-slate-900">{result.asn}</div>
                    </div>
                  )}
                  {result.ipCity && (
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <div className="text-xs text-slate-600 mb-1">Location</div>
                      <div className="text-sm font-semibold text-slate-900">
                        {result.ipCity}, {result.ipRegion}, {result.ipCountry}
                      </div>
                    </div>
                  )}
                  {result.connectionType && (
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <div className="text-xs text-slate-600 mb-1">Connection Type</div>
                      <div className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                        <Wifi className="w-4 h-4" />
                        {result.connectionType}
                      </div>
                    </div>
                  )}
                  {result.dnsServers && result.dnsServers.length > 0 && (
                    <div className="p-3 bg-slate-50 rounded-lg col-span-full">
                      <div className="text-xs text-slate-600 mb-1">Connection Metrics</div>
                      <div className="text-sm font-semibold text-slate-900">
                        {result.dnsServers.join(' • ')}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {result.latitude && result.longitude && (
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-red-500" />
                    GPS Location
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <div className="text-xs text-slate-600 mb-1">Latitude</div>
                      <div className="text-sm font-semibold text-slate-900">{result.latitude.toFixed(6)}</div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <div className="text-xs text-slate-600 mb-1">Longitude</div>
                      <div className="text-sm font-semibold text-slate-900">{result.longitude.toFixed(6)}</div>
                    </div>
                    {result.gpsAccuracy && (
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <div className="text-xs text-slate-600 mb-1">Accuracy</div>
                        <div className="text-sm font-semibold text-slate-900">{result.gpsAccuracy.toFixed(0)}m</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
}
