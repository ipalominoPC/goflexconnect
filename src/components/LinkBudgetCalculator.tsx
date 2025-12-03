import { useState } from 'react';
import { Calculator, ArrowLeft, Info } from 'lucide-react';

interface LinkBudgetCalculatorProps {
  onBack: () => void;
}

interface LinkBudgetParams {
  frequency: number;
  txPower: number;
  txGain: number;
  rxGain: number;
  cableLossTx: number;
  cableLossRx: number;
  distance: number;
  heightTx: number;
  heightRx: number;
  environment: 'free-space' | 'urban' | 'suburban' | 'indoor';
}

interface LinkBudgetResults {
  freeSpaceLoss: number;
  pathLoss: number;
  receivedPower: number;
  linkMargin: number;
  fresnel: number;
  sensitivity: number;
}

export default function LinkBudgetCalculator({ onBack }: LinkBudgetCalculatorProps) {
  const [params, setParams] = useState<LinkBudgetParams>({
    frequency: 2600,
    txPower: 43,
    txGain: 18,
    rxGain: 0,
    cableLossTx: 2,
    cableLossRx: 0,
    distance: 1,
    heightTx: 30,
    heightRx: 1.5,
    environment: 'urban',
  });

  const [showInfo, setShowInfo] = useState<string | null>(null);

  const calculateLinkBudget = (): LinkBudgetResults => {
    const { frequency, txPower, txGain, rxGain, cableLossTx, cableLossRx, distance, heightTx, heightRx, environment } = params;

    const freeSpaceLoss = 32.45 + 20 * Math.log10(frequency) + 20 * Math.log10(distance);

    let pathLoss = freeSpaceLoss;
    if (environment === 'urban') {
      const hb = heightTx;
      const hm = heightRx;
      const fc = frequency;
      const d = distance;
      const a_hm = (1.1 * Math.log10(fc) - 0.7) * hm - (1.56 * Math.log10(fc) - 0.8);
      pathLoss = 69.55 + 26.16 * Math.log10(fc) - 13.82 * Math.log10(hb) - a_hm + (44.9 - 6.55 * Math.log10(hb)) * Math.log10(d);
    } else if (environment === 'suburban') {
      const fc = frequency;
      const d = distance;
      pathLoss = 69.55 + 26.16 * Math.log10(fc) - 13.82 * Math.log10(heightTx) + (44.9 - 6.55 * Math.log10(heightTx)) * Math.log10(d) - 2 * (Math.log10(fc / 28)) ** 2 - 5.4;
    } else if (environment === 'indoor') {
      pathLoss = freeSpaceLoss + 20;
    }

    const eirp = txPower + txGain - cableLossTx;
    const receivedPower = eirp - pathLoss + rxGain - cableLossRx;

    const sensitivity = -100;
    const linkMargin = receivedPower - sensitivity;

    const fresnel = 17.3 * Math.sqrt(distance / (4 * frequency / 1000));

    return {
      freeSpaceLoss,
      pathLoss,
      receivedPower,
      linkMargin,
      fresnel,
      sensitivity,
    };
  };

  const results = calculateLinkBudget();

  const updateParam = (key: keyof LinkBudgetParams, value: number | string) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  const InfoTooltip = ({ text, id }: { text: string; id: string }) => (
    <div className="relative">
      <button
        type="button"
        onMouseEnter={() => setShowInfo(id)}
        onMouseLeave={() => setShowInfo(null)}
        className="ml-2 text-gray-400 hover:text-goflex-blue transition-colors"
      >
        <Info className="w-4 h-4" />
      </button>
      {showInfo === id && (
        <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-gray-800 text-white text-xs rounded-lg p-3 shadow-xl w-64 z-50 border border-gray-700">
          {text}
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={onBack}
            className="flex items-center text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </button>
          <div className="flex items-center">
            <Calculator className="w-8 h-8 text-goflex-blue mr-3" />
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Link Budget Calculator</h1>
          </div>
          <div className="w-24"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-lg transition-colors duration-300 ease-in-out">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Input Parameters</h2>

            <div className="space-y-5">
              <div>
                <label className="flex items-center text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Frequency (MHz)
                  <InfoTooltip id="frequency" text="Operating frequency in MHz. Typical LTE: 700-2600, 5G: 600-3700" />
                </label>
                <input
                  type="number"
                  value={params.frequency}
                  onChange={(e) => updateParam('frequency', parseFloat(e.target.value))}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-goflex-blue focus:border-transparent"
                />
              </div>

              <div>
                <label className="flex items-center text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Transmit Power (dBm)
                  <InfoTooltip id="txPower" text="Base station transmit power. Typical range: 40-46 dBm" />
                </label>
                <input
                  type="number"
                  value={params.txPower}
                  onChange={(e) => updateParam('txPower', parseFloat(e.target.value))}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-goflex-blue focus:border-transparent"
                />
              </div>

              <div>
                <label className="flex items-center text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  TX Antenna Gain (dBi)
                  <InfoTooltip id="txGain" text="Base station antenna gain. Typical: 15-21 dBi" />
                </label>
                <input
                  type="number"
                  value={params.txGain}
                  onChange={(e) => updateParam('txGain', parseFloat(e.target.value))}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-goflex-blue focus:border-transparent"
                />
              </div>

              <div>
                <label className="flex items-center text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  RX Antenna Gain (dBi)
                  <InfoTooltip id="rxGain" text="User equipment antenna gain. Mobile: 0 dBi, CPE: 5-15 dBi" />
                </label>
                <input
                  type="number"
                  value={params.rxGain}
                  onChange={(e) => updateParam('rxGain', parseFloat(e.target.value))}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-goflex-blue focus:border-transparent"
                />
              </div>

              <div>
                <label className="flex items-center text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  TX Cable Loss (dB)
                  <InfoTooltip id="cableLossTx" text="Feeder cable loss at base station. Typical: 2-3 dB" />
                </label>
                <input
                  type="number"
                  value={params.cableLossTx}
                  onChange={(e) => updateParam('cableLossTx', parseFloat(e.target.value))}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-goflex-blue focus:border-transparent"
                />
              </div>

              <div>
                <label className="flex items-center text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  RX Cable Loss (dB)
                  <InfoTooltip id="cableLossRx" text="Cable loss at receiver. Mobile: 0 dB, CPE: 1-2 dB" />
                </label>
                <input
                  type="number"
                  value={params.cableLossRx}
                  onChange={(e) => updateParam('cableLossRx', parseFloat(e.target.value))}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-goflex-blue focus:border-transparent"
                />
              </div>

              <div>
                <label className="flex items-center text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Distance (km)
                  <InfoTooltip id="distance" text="Distance between transmitter and receiver in kilometers" />
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={params.distance}
                  onChange={(e) => updateParam('distance', parseFloat(e.target.value))}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-goflex-blue focus:border-transparent"
                />
              </div>

              <div>
                <label className="flex items-center text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  TX Height (m)
                  <InfoTooltip id="heightTx" text="Base station antenna height above ground. Typical: 20-50m" />
                </label>
                <input
                  type="number"
                  value={params.heightTx}
                  onChange={(e) => updateParam('heightTx', parseFloat(e.target.value))}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-goflex-blue focus:border-transparent"
                />
              </div>

              <div>
                <label className="flex items-center text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  RX Height (m)
                  <InfoTooltip id="heightRx" text="Receiver antenna height above ground. Mobile: 1.5m, Fixed: 5-10m" />
                </label>
                <input
                  type="number"
                  value={params.heightRx}
                  onChange={(e) => updateParam('heightRx', parseFloat(e.target.value))}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-goflex-blue focus:border-transparent"
                />
              </div>

              <div>
                <label className="flex items-center text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Environment
                  <InfoTooltip id="environment" text="Propagation environment affects path loss model" />
                </label>
                <select
                  value={params.environment}
                  onChange={(e) => updateParam('environment', e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-goflex-blue focus:border-transparent"
                >
                  <option value="free-space">Free Space</option>
                  <option value="urban">Urban (Okumura-Hata)</option>
                  <option value="suburban">Suburban</option>
                  <option value="indoor">Indoor</option>
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-gradient-to-br from-goflex-blue/10 to-blue-600/10 backdrop-blur-sm border border-goflex-blue/30 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Results</h2>

              <div className="space-y-4">
                <div className="bg-gray-900/50 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300 font-medium">EIRP</span>
                    <span className="text-xl font-bold text-white">
                      {(params.txPower + params.txGain - params.cableLossTx).toFixed(2)} dBm
                    </span>
                  </div>
                </div>

                <div className="bg-gray-900/50 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300 font-medium">Free Space Loss</span>
                    <span className="text-xl font-bold text-white">{results.freeSpaceLoss.toFixed(2)} dB</span>
                  </div>
                </div>

                <div className="bg-gray-900/50 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300 font-medium">Path Loss</span>
                    <span className="text-xl font-bold text-white">{results.pathLoss.toFixed(2)} dB</span>
                  </div>
                </div>

                <div className="bg-gray-900/50 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300 font-medium">Received Power</span>
                    <span
                      className={`text-xl font-bold ${
                        results.receivedPower > -80
                          ? 'text-green-400'
                          : results.receivedPower > -100
                          ? 'text-yellow-400'
                          : 'text-red-400'
                      }`}
                    >
                      {results.receivedPower.toFixed(2)} dBm
                    </span>
                  </div>
                </div>

                <div className="bg-gray-900/50 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300 font-medium">Sensitivity</span>
                    <span className="text-xl font-bold text-white">{results.sensitivity.toFixed(2)} dBm</span>
                  </div>
                </div>

                <div className="bg-gray-900/50 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300 font-medium">Link Margin</span>
                    <span
                      className={`text-xl font-bold ${
                        results.linkMargin > 15
                          ? 'text-green-400'
                          : results.linkMargin > 5
                          ? 'text-yellow-400'
                          : 'text-red-400'
                      }`}
                    >
                      {results.linkMargin.toFixed(2)} dB
                    </span>
                  </div>
                </div>

                <div className="bg-gray-900/50 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300 font-medium">Fresnel Zone Radius</span>
                    <span className="text-xl font-bold text-white">{results.fresnel.toFixed(2)} m</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-lg transition-colors duration-300 ease-in-out">
              <h3 className="text-lg font-bold text-white mb-4">Link Status</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Link Quality:</span>
                  <span
                    className={`px-4 py-2 rounded-lg font-bold ${
                      results.linkMargin > 15
                        ? 'bg-green-500/20 text-green-400'
                        : results.linkMargin > 5
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {results.linkMargin > 15 ? 'Excellent' : results.linkMargin > 5 ? 'Good' : 'Poor'}
                  </span>
                </div>
                <p className="text-sm text-gray-400 mt-3">
                  {results.linkMargin > 15
                    ? 'Strong link with excellent margin for fading and interference.'
                    : results.linkMargin > 5
                    ? 'Adequate link budget for normal operation. May experience issues in poor conditions.'
                    : 'Weak link. Consider increasing TX power, improving antenna gain, or reducing distance.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}
