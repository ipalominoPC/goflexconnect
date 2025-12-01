import { useState, useEffect } from 'react';
import { ArrowLeft, Gauge, Download, Upload, Activity, Signal, MapPin, Globe, Wifi, AlertTriangle, Smartphone, Info, CheckCircle } from 'lucide-react';
import { runSpeedTest, getCellularNetworkInfo, SpeedTestProgress, getNetworkContext, getConnectionLabel, NetworkContext } from '../utils/networkUtils';
import { SpeedTestResult } from '../types';
import { getCompleteLocation, LocationData } from '../services/locationService';
import VpnWarning from './VpnWarning';
import { generateUUID } from '../utils/uuid';
import { supabase } from '../services/supabaseClient';
import { offlineStorage } from '../services/offlineStorage';
import { detectNetworkInfo, DetectedNetworkInfo, getNetworkTypeLabel } from '../utils/networkInfo';
import AdSlot from './AdSlot';
import { assertCanRunSpeedTest, trackAndEnforceSpeedTest } from '../services/planService';
import { useStore } from '../store/useStore';

interface SpeedTestProps {
  onBack: () => void;
  onSaveResult: (result: SpeedTestResult) => void;
}

export default function SpeedTest({ onBack, onSaveResult }: SpeedTestProps) {
  const user = useStore((state) => state.user);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState<SpeedTestProgress>({ phase: 'idle', progress: 0 });
  const [result, setResult] = useState<SpeedTestResult | null>(null);
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [showVpnWarning, setShowVpnWarning] = useState(false);
  const [isCheckingLocation, setIsCheckingLocation] = useState(true);
  const [networkContext, setNetworkContext] = useState<NetworkContext>({ connectionType: 'unknown' });
  const [showWifiModal, setShowWifiModal] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string>('');
  const [detectedNetwork, setDetectedNetwork] = useState<DetectedNetworkInfo | null>(null);
  const [manualNetworkType, setManualNetworkType] = useState<string>('auto');
  const [carrierName, setCarrierName] = useState<string>('');
  const [limitError, setLimitError] = useState<string | null>(null);

  useEffect(() => {
    checkLocation();
    const ctx = getNetworkContext();
    setNetworkContext(ctx);
    const networkInfo = detectNetworkInfo();
    setDetectedNetwork(networkInfo);
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

  const handleStartTest = async () => {
    setLimitError(null);

    // Check speed test limit before starting
    if (user) {
      const limitCheck = await assertCanRunSpeedTest(user.id);

      if (!limitCheck.allowed) {
        setLimitError(limitCheck.message || 'Speed test limit reached');
        return;
      }
    }

    if (!locationData || (locationData.isVpn && locationData.vpnConfidence >= 50)) {
      setShowVpnWarning(true);
      return;
    }

    const ctx = getNetworkContext();
    setNetworkContext(ctx);

    if (ctx.connectionType === 'wifi') {
      setShowWifiModal(true);
      return;
    }

    actuallyStartTest();
  };

  const actuallyStartTest = async () => {
    setIsRunning(true);
    setResult(null);
    setProgress({ phase: 'idle', progress: 0 });
    setSaveMessage('');

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
      await saveSpeedTestResult(testResult);

      // Track speed test usage
      if (user) {
        await trackAndEnforceSpeedTest(user.id);
      }
      onSaveResult(testResult);
    } catch (error) {
      console.error('Speed test failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const saveSpeedTestResult = async (testResult: SpeedTestResult) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const payload = {
        id: testResult.id,
        user_id: user.id,
        download_speed: testResult.downloadSpeed,
        upload_speed: testResult.uploadSpeed,
        ping: testResult.ping,
        jitter: testResult.jitter,
        rsrp: testResult.rsrp,
        rsrq: testResult.rsrq,
        sinr: testResult.sinr,
        rssi: testResult.rssi,
        cell_id: testResult.cellId,
        provider: testResult.provider,
        frequency: testResult.frequency,
        band: testResult.band,
        connection_type: networkContext.connectionType,
        effective_type: networkContext.effectiveType || null,
        latitude: testResult.latitude || null,
        longitude: testResult.longitude || null,
        ip_address: testResult.ipAddress || null,
        ipv6_address: testResult.ipv6Address || null,
        ip_city: testResult.ipCity || null,
        ip_region: testResult.ipRegion || null,
        ip_country: testResult.ipCountry || null,
        ip_timezone: testResult.ipTimezone || null,
        isp: testResult.isp || null,
        organization: testResult.organization || null,
        asn: testResult.asn || null,
        is_vpn: testResult.isVpn || false,
        vpn_confidence: testResult.vpnConfidence || 0,
        gps_accuracy: testResult.gpsAccuracy || null,
        network_connection_type: detectedNetwork?.connectionType || null,
        network_effective_type: detectedNetwork?.effectiveType || null,
        network_downlink: detectedNetwork?.downlink || null,
        network_rtt: detectedNetwork?.rtt || null,
        device_summary: detectedNetwork?.deviceSummary || null,
        manual_network_type: manualNetworkType === 'auto' ? null : manualNetworkType,
        carrier_name: carrierName.trim() || null,
      };

      const { error } = await supabase.from('speed_tests').insert(payload);

      if (error) {
        console.error('Failed to save to Supabase, queueing for offline sync:', error);
        await offlineStorage.addSpeedTest(testResult);
        setSaveMessage('Network is weak. Result saved locally and will sync when connection improves.');
      } else {
        setSaveMessage('');
      }
    } catch (error) {
      console.error('Error saving speed test:', error);
      await offlineStorage.addSpeedTest(testResult);
      setSaveMessage('Network is weak. Result saved locally and will sync when connection improves.');
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
      <div className="min-h-screen bg-goflex-bg flex items-center justify-center">
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

      <div className="min-h-screen bg-goflex-bg">
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
            <h1 className="text-3xl font-bold text-white dark:text-white mb-2">Speed Test</h1>

            {detectedNetwork && (
              <>
                {detectedNetwork.connectionType === 'wifi' && (
                  <p className="text-slate-300 dark:text-slate-300 mb-4">
                    For best RF coverage data, run this test on your cellular network (4G/LTE/5G). We'll still collect results on Wi-Fi, but cellular is preferred for RF mapping.
                  </p>
                )}
                {detectedNetwork.connectionType === 'cellular' && (
                  <p className="text-emerald-300 dark:text-emerald-300 mb-4">
                    Great — you're on a cellular network. These results will be more representative of real RF coverage.
                  </p>
                )}
                {detectedNetwork.connectionType === 'unknown' && (
                  <p className="text-slate-300 dark:text-slate-300 mb-4">
                    For best RF coverage data, use a cellular network (4G/LTE/5G) when possible.
                  </p>
                )}

                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${
                  detectedNetwork.connectionType === 'cellular'
                    ? 'bg-emerald-500/20 border border-emerald-500/40'
                    : detectedNetwork.connectionType === 'wifi'
                    ? 'bg-slate-800/50 border border-slate-700'
                    : 'bg-amber-500/20 border border-amber-500/40'
                }`}>
                  {detectedNetwork.connectionType === 'cellular' ? (
                    <Smartphone className="w-4 h-4 text-emerald-400" />
                  ) : detectedNetwork.connectionType === 'wifi' ? (
                    <Wifi className="w-4 h-4 text-slate-300" />
                  ) : (
                    <Activity className="w-4 h-4 text-amber-400" />
                  )}
                  <span className={`text-sm font-medium ${
                    detectedNetwork.connectionType === 'cellular'
                      ? 'text-emerald-200'
                      : detectedNetwork.connectionType === 'wifi'
                      ? 'text-slate-200'
                      : 'text-amber-200'
                  }`}>
                    Connection: {
                      detectedNetwork.connectionType === 'cellular' ? 'Cellular (4G/LTE/5G)' :
                      detectedNetwork.connectionType === 'wifi' ? 'Wi-Fi' :
                      'Unknown'
                    }
                  </span>
                </div>
              </>
            )}
          </div>

          {detectedNetwork && (
            <div className="bg-goflex-card border border-slate-700 rounded-2xl shadow-lg p-6 mb-6">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Info className="w-5 h-5 text-goflex-blue" />
                Network Context
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="p-3 bg-slate-800/50 rounded-lg">
                  <div className="text-xs text-slate-400 mb-1">Detected Connection</div>
                  <div className="text-sm font-semibold text-white flex items-center gap-2">
                    {detectedNetwork.connectionType === 'cellular' ? (
                      <Smartphone className="w-4 h-4 text-emerald-400" />
                    ) : detectedNetwork.connectionType === 'wifi' ? (
                      <Wifi className="w-4 h-4 text-amber-400" />
                    ) : (
                      <Activity className="w-4 h-4 text-slate-400" />
                    )}
                    {detectedNetwork.connectionType === 'wifi' ? 'Wi-Fi' :
                     detectedNetwork.connectionType === 'cellular' ? 'Cellular' : 'Unknown'}
                  </div>
                </div>
                <div className="p-3 bg-slate-800/50 rounded-lg">
                  <div className="text-xs text-slate-400 mb-1">Effective Type</div>
                  <div className="text-sm font-semibold text-white">
                    {detectedNetwork.effectiveType ? detectedNetwork.effectiveType.toUpperCase() : 'Unknown'}
                  </div>
                </div>
                <div className="p-3 bg-slate-800/50 rounded-lg">
                  <div className="text-xs text-slate-400 mb-1">Device</div>
                  <div className="text-sm font-semibold text-white">{detectedNetwork.deviceSummary}</div>
                </div>
                <div className="p-3 bg-slate-800/50 rounded-lg">
                  <div className="text-xs text-slate-400 mb-1">Downlink / RTT</div>
                  <div className="text-sm font-semibold text-white">
                    {detectedNetwork.downlink ? `${detectedNetwork.downlink.toFixed(1)} Mbps` : 'N/A'} / {detectedNetwork.rtt ? `${detectedNetwork.rtt}ms` : 'N/A'}
                  </div>
                </div>
              </div>

              {detectedNetwork.connectionType === 'cellular' && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg mb-4">
                  <p className="text-sm text-emerald-300 flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>Perfect! You're on cellular. These measurements will provide accurate RF coverage data.</span>
                  </p>
                </div>
              )}

              {detectedNetwork.connectionType === 'wifi' && (
                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg mb-4">
                  <p className="text-sm text-amber-300 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>For best RF mapping results, switch to cellular when possible. Wi-Fi tests are still recorded.</span>
                  </p>
                </div>
              )}

              {detectedNetwork.connectionType === 'unknown' && (
                <div className="p-4 bg-slate-700/50 border border-slate-600 rounded-lg mb-4">
                  <p className="text-sm text-slate-300 flex items-start gap-2">
                    <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>Cannot detect network type. For best RF coverage data, use cellular (4G/LTE/5G). Optional inputs below help improve accuracy.</span>
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Network Type (Optional)
                  </label>
                  <select
                    value={manualNetworkType}
                    onChange={(e) => setManualNetworkType(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:border-goflex-blue focus:ring-1 focus:ring-goflex-blue transition-colors"
                  >
                    <option value="auto">Auto-detected</option>
                    <option value="5G">5G</option>
                    <option value="4G">4G/LTE</option>
                    <option value="3G">3G</option>
                    <option value="Wi-Fi">Wi-Fi</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Carrier/Operator (Optional)
                  </label>
                  <input
                    type="text"
                    value={carrierName}
                    onChange={(e) => setCarrierName(e.target.value)}
                    placeholder="e.g., Verizon, T-Mobile"
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-goflex-blue focus:ring-1 focus:ring-goflex-blue transition-colors"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="bg-white dark:bg-goflex-card rounded-2xl shadow-lg p-8 mb-6">
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
                onClick={handleStartTest}
                disabled={isRunning}
                className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold rounded-xl hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
              >
                {isRunning ? 'Testing...' : 'Start Test'}
              </button>

              {limitError && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    {limitError}
                  </p>
                </div>
              )}

              {saveMessage && (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    {saveMessage}
                  </p>
                </div>
              )}
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

        <AdSlot placement="speedtest-banner" />
      </div>

      {showWifiModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-goflex-card border border-slate-700 rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-500/20 rounded-full mb-4">
                <Wifi className="w-8 h-8 text-amber-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Best results on cellular</h2>
              <p className="text-slate-300 leading-relaxed">
                For the most accurate RF coverage data, we recommend running this test while connected to your cellular network (4G/LTE/5G) instead of Wi-Fi. You can switch to cellular now, or continue on Wi-Fi and we'll still record the results.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  setShowWifiModal(false);
                }}
                className="w-full px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-xl transition-colors"
              >
                Switch to Cellular
              </button>
              <button
                onClick={() => {
                  setShowWifiModal(false);
                  actuallyStartTest();
                }}
                className="w-full px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold rounded-xl transition-all"
              >
                Continue on Wi-Fi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
