import { AlertTriangle, Shield, X } from 'lucide-react';

interface VpnWarningProps {
  vpnConfidence: number;
  onDisconnect: () => void;
  onExit: () => void;
  onContinueAnyway?: () => void;
}

export default function VpnWarning({ vpnConfidence, onDisconnect, onExit, onContinueAnyway }: VpnWarningProps) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative">
        <div className="flex items-center justify-center mb-6">
          <div className="bg-amber-100 rounded-full p-4">
            <Shield className="w-12 h-12 text-amber-600" />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-slate-900 text-center mb-3">
          VPN/Proxy Detected
        </h2>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-amber-900 font-semibold mb-1">
                VPN Connection Detected ({vpnConfidence}% confidence)
              </p>
              <p className="text-sm text-amber-800">
                For accurate location-based network measurements, please disconnect from your VPN or proxy service before using this app.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          <div className="bg-slate-50 rounded-lg p-4">
            <h3 className="font-semibold text-slate-900 mb-2 text-sm">Why is this important?</h3>
            <ul className="space-y-1.5 text-sm text-slate-700">
              <li className="flex items-start gap-2">
                <span className="text-goflex-blue mt-1">•</span>
                <span>VPNs mask your true location, making GPS coordinates inaccurate</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-goflex-blue mt-1">•</span>
                <span>Network measurements will reflect the VPN server, not your actual cellular connection</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-goflex-blue mt-1">•</span>
                <span>Survey results will be unreliable and not useful for network analysis</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={onDisconnect}
            className="w-full bg-gradient-to-r from-goflex-blue to-goflex-blue-dark text-white py-3.5 px-4 rounded-xl font-semibold hover:shadow-lg hover:shadow-goflex-blue/25 hover:scale-[1.02] transition-all duration-200 flex items-center justify-center gap-2"
          >
            <Shield className="w-5 h-5" />
            Disconnect VPN & Retry
          </button>

          <button
            onClick={onExit}
            className="w-full bg-slate-100 text-slate-700 py-3.5 px-4 rounded-xl font-semibold hover:bg-slate-200 transition-all duration-200 flex items-center justify-center gap-2"
          >
            <X className="w-5 h-5" />
            Exit App
          </button>

          {onContinueAnyway && (
            <button
              onClick={onContinueAnyway}
              className="w-full text-slate-500 text-sm py-2 hover:text-slate-700 transition-colors"
            >
              Continue anyway (not recommended)
            </button>
          )}
        </div>

        <div className="mt-6 pt-6 border-t border-slate-200">
          <p className="text-xs text-slate-500 text-center">
            This app requires accurate location data for cellular network surveys. Your privacy and data security remain protected.
          </p>
        </div>
      </div>
    </div>
  );
}
