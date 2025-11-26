import { ArrowLeft, Bug, AlertCircle } from 'lucide-react';
import { useStore } from '../store/useStore';

interface DiagnosticsProps {
  onBack: () => void;
}

export default function Diagnostics({ onBack }: DiagnosticsProps) {
  const projects = useStore((state) => state.projects);
  const measurements = useStore((state) => state.measurements);

  const recentMeasurements = [...measurements]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 10);

  const errors: string[] = [];
  if (projects.length === 0) {
    errors.push('No projects created yet');
  }
  if (measurements.length === 0) {
    errors.push('No measurements collected yet');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <button
          onClick={onBack}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back
        </button>

        <div className="bg-white rounded-xl shadow-sm p-6 mb-4">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center">
              <Bug className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Diagnostics</h1>
              <p className="text-gray-600">Debug information and warnings</p>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">System Status</h3>
            <div className="space-y-2">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Total Projects</span>
                <span className="font-semibold text-gray-900">{projects.length}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Total Measurements</span>
                <span className="font-semibold text-gray-900">{measurements.length}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-600">Storage Used</span>
                <span className="font-semibold text-gray-900">
                  {(JSON.stringify({ projects, measurements }).length / 1024).toFixed(2)} KB
                </span>
              </div>
            </div>
          </div>

          {errors.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Warnings</h3>
              <div className="space-y-2">
                {errors.map((error, idx) => (
                  <div key={idx} className="flex items-start gap-2 p-3 bg-yellow-50 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-yellow-800">{error}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {recentMeasurements.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Recent Measurements</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {recentMeasurements.map((m) => (
                  <div key={m.id} className="p-3 bg-gray-50 rounded-lg text-xs font-mono">
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-500">
                        {new Date(m.timestamp).toLocaleString()}
                      </span>
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                        {m.techType}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-gray-700">
                      <div>RSRP: {m.rsrp.toFixed(1)} dBm</div>
                      <div>RSRQ: {m.rsrq.toFixed(1)} dB</div>
                      <div>SINR: {m.sinr.toFixed(1)} dB</div>
                      <div>Cell: {m.cellId}</div>
                    </div>
                    <div className="mt-1 text-gray-500">
                      Position: ({(m.x * 100).toFixed(1)}%, {(m.y * 100).toFixed(1)}%)
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm text-blue-900 font-medium mb-2">Note on Signal Data</p>
          <p className="text-sm text-blue-700">
            This app currently uses mock signal data for demonstration. In production, this would
            integrate with native platform APIs or SDKs to capture real cellular signal metrics from
            the device's radio.
          </p>
        </div>
      </div>
    </div>
  );
}
