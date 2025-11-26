import { useState } from 'react';
import { ArrowLeft, FileText, Download } from 'lucide-react';
import { useStore } from '../store/useStore';
import { calculateProjectStats } from '../utils/calculations';
import { getSignalQuality } from '../utils/qualityUtils';

interface ReportGeneratorProps {
  projectId: string;
  floorId?: string;
  onBack: () => void;
}

export default function ReportGenerator({ projectId, floorId, onBack }: ReportGeneratorProps) {
  const projects = useStore((state) => state.projects);
  const floors = useStore((state) => state.floors);
  const allMeasurements = useStore((state) => state.measurements);
  const settings = useStore((state) => state.settings);

  const [reportType, setReportType] = useState<'summary' | 'detailed' | 'executive'>('summary');

  const project = projects.find((p) => p.id === projectId);
  const floor = floorId ? floors.find((f) => f.id === floorId) : undefined;
  const measurements = floorId
    ? allMeasurements.filter((m) => m.floorId === floorId)
    : allMeasurements.filter((m) => m.projectId === projectId && !m.floorId);

  const stats = calculateProjectStats(measurements, settings.thresholds);

  const handlePrintReport = () => {
    window.print();
  };

  const handleExportHTML = () => {
    const reportElement = document.getElementById('report-content');
    if (!reportElement) return;

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${project?.name || 'Project'} Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; }
    h1 { color: #1e3a8a; }
    h2 { color: #2563eb; margin-top: 30px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
    th { background-color: #f3f4f6; font-weight: bold; }
    .stat-box { display: inline-block; margin: 10px; padding: 15px; border: 1px solid #ddd; border-radius: 8px; }
    .good { color: #059669; }
    .fair { color: #d97706; }
    .poor { color: #dc2626; }
  </style>
</head>
<body>
  ${reportElement.innerHTML}
</body>
</html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project?.name || 'project'}-report.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Project not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-between mb-8 print:hidden">
          <button
            onClick={onBack}
            className="flex items-center text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </button>
          <div className="flex items-center">
            <FileText className="w-8 h-8 text-goflex-blue mr-3" />
            <h1 className="text-3xl font-bold text-white">Report Generator</h1>
          </div>
          <div className="w-24"></div>
        </div>

        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 mb-6 print:hidden">
          <h2 className="text-xl font-bold text-white mb-4">Report Options</h2>

          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setReportType('summary')}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                reportType === 'summary'
                  ? 'bg-goflex-blue text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              Summary Report
            </button>
            <button
              onClick={() => setReportType('detailed')}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                reportType === 'detailed'
                  ? 'bg-goflex-blue text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              Detailed Report
            </button>
            <button
              onClick={() => setReportType('executive')}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                reportType === 'executive'
                  ? 'bg-goflex-blue text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              Executive Summary
            </button>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handlePrintReport}
              className="flex-1 bg-gradient-to-r from-goflex-blue to-blue-600 text-white rounded-lg py-3 font-semibold hover:shadow-lg hover:shadow-goflex-blue/25 transition-all flex items-center justify-center gap-2"
            >
              <FileText className="w-5 h-5" />
              Print / Save as PDF
            </button>
            <button
              onClick={handleExportHTML}
              className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg py-3 font-semibold hover:shadow-lg hover:shadow-green-600/25 transition-all flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              Export HTML
            </button>
          </div>
        </div>

        <div id="report-content" className="bg-white rounded-2xl p-8 print:shadow-none">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">{project.name}</h1>
            <p className="text-gray-600">RF Site Survey Report</p>
            {floor && <p className="text-gray-600">Floor: {floor.name}</p>}
            <p className="text-sm text-gray-500 mt-2">
              Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
            </p>
          </div>

          {reportType === 'executive' && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Executive Summary</h2>
              <div className="prose max-w-none">
                <p className="text-gray-700 mb-4">
                  This report provides a comprehensive analysis of the RF coverage at {project.name}
                  {floor ? ` on ${floor.name}` : ''}. The survey collected {stats.totalMeasurements} measurements
                  to assess signal quality and network performance.
                </p>
                <p className="text-gray-700 mb-4">
                  <strong>Key Findings:</strong>
                </p>
                <ul className="list-disc pl-6 text-gray-700 mb-4">
                  <li>
                    Signal Quality: {stats.quality.good} good ({((stats.quality.good / stats.totalMeasurements) * 100).toFixed(1)}%),
                    {' '}{stats.quality.fair} fair ({((stats.quality.fair / stats.totalMeasurements) * 100).toFixed(1)}%),
                    {' '}{stats.quality.poor} poor ({((stats.quality.poor / stats.totalMeasurements) * 100).toFixed(1)}%)
                  </li>
                  <li>Average RSRP: {stats.rsrp.avg.toFixed(1)} dBm</li>
                  <li>Average SINR: {stats.sinr.avg.toFixed(1)} dB</li>
                  <li>
                    Overall Assessment: {stats.quality.good > stats.totalMeasurements * 0.7 ? 'Excellent' : stats.quality.good > stats.totalMeasurements * 0.5 ? 'Good' : 'Needs Improvement'}
                  </li>
                </ul>
              </div>
            </div>
          )}

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Coverage Statistics</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Total Measurements</div>
                <div className="text-2xl font-bold text-gray-900">{stats.totalMeasurements}</div>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Good Quality</div>
                <div className="text-2xl font-bold text-green-600">{stats.quality.good}</div>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Fair Quality</div>
                <div className="text-2xl font-bold text-yellow-600">{stats.quality.fair}</div>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Poor Quality</div>
                <div className="text-2xl font-bold text-red-600">{stats.quality.poor}</div>
              </div>
            </div>

            <h3 className="text-xl font-bold text-gray-900 mb-3">Signal Strength Metrics</h3>
            <table className="w-full mb-6">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Metric</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Minimum</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Average</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Maximum</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-200">
                  <td className="px-4 py-3 font-medium text-gray-900">RSRP (dBm)</td>
                  <td className="px-4 py-3 text-gray-700">{stats.rsrp.min.toFixed(1)}</td>
                  <td className="px-4 py-3 text-gray-700">{stats.rsrp.avg.toFixed(1)}</td>
                  <td className="px-4 py-3 text-gray-700">{stats.rsrp.max.toFixed(1)}</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="px-4 py-3 font-medium text-gray-900">RSRQ (dB)</td>
                  <td className="px-4 py-3 text-gray-700">{stats.rsrq.min.toFixed(1)}</td>
                  <td className="px-4 py-3 text-gray-700">{stats.rsrq.avg.toFixed(1)}</td>
                  <td className="px-4 py-3 text-gray-700">{stats.rsrq.max.toFixed(1)}</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="px-4 py-3 font-medium text-gray-900">SINR (dB)</td>
                  <td className="px-4 py-3 text-gray-700">{stats.sinr.min.toFixed(1)}</td>
                  <td className="px-4 py-3 text-gray-700">{stats.sinr.avg.toFixed(1)}</td>
                  <td className="px-4 py-3 text-gray-700">{stats.sinr.max.toFixed(1)}</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="px-4 py-3 font-medium text-gray-900">RSSI (dBm)</td>
                  <td className="px-4 py-3 text-gray-700">{stats.rssi.min.toFixed(1)}</td>
                  <td className="px-4 py-3 text-gray-700">{stats.rssi.avg.toFixed(1)}</td>
                  <td className="px-4 py-3 text-gray-700">{stats.rssi.max.toFixed(1)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {(reportType === 'detailed' || reportType === 'summary') && measurements.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Measurement Data</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Location #</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Timestamp</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">RSRP</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">RSRQ</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">SINR</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">RSSI</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Quality</th>
                    </tr>
                  </thead>
                  <tbody>
                    {measurements.map((m) => {
                      const quality = getSignalQuality(m, settings.thresholds);
                      return (
                        <tr key={m.id} className="border-b border-gray-200">
                          <td className="px-4 py-3 text-gray-900">#{m.locationNumber}</td>
                          <td className="px-4 py-3 text-gray-700">
                            {new Date(m.timestamp).toLocaleString()}
                          </td>
                          <td className={`px-4 py-3 font-mono ${quality.rsrpColor.replace('text-', '')}`}>
                            {m.rsrp.toFixed(1)}
                          </td>
                          <td className="px-4 py-3 font-mono text-gray-700">{m.rsrq.toFixed(1)}</td>
                          <td className={`px-4 py-3 font-mono ${quality.sinrColor.replace('text-', '')}`}>
                            {m.sinr.toFixed(1)}
                          </td>
                          <td className="px-4 py-3 font-mono text-gray-700">{m.rssi.toFixed(1)}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded text-sm font-medium ${
                              quality.overall === 'good' ? 'bg-green-100 text-green-800' :
                              quality.overall === 'fair' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {quality.overall.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Report generated by GoFlexConnect • {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
