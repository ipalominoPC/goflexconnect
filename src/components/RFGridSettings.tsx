import { useState } from 'react';
import { Grid3x3, X, Check } from 'lucide-react';
import { Floor, Project } from '../types';

interface RFGridSettingsProps {
  project?: Project;
  floor?: Floor;
  onSave: (gridSize: number, enabled: boolean) => void;
  onClose: () => void;
}

export default function RFGridSettings({
  project,
  floor,
  onSave,
  onClose,
}: RFGridSettingsProps) {
  const currentGridSize = floor?.gridSize || 5;
  const currentEnabled = floor?.gridEnabled || false;

  const [gridSize, setGridSize] = useState(currentGridSize);
  const [enabled, setEnabled] = useState(currentEnabled);

  const handleSave = () => {
    onSave(gridSize, enabled);
    onClose();
  };

  const presetSizes = [
    { label: '5x5 (20ft grid)', value: 5, feet: 20 },
    { label: '10x10 (10ft grid)', value: 10, feet: 10 },
    { label: '15x15 (6.7ft grid)', value: 15, feet: 6.7 },
    { label: '20x20 (5ft grid)', value: 20, feet: 5 },
  ];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-b from-gray-900 to-gray-950 rounded-2xl shadow-2xl max-w-md w-full border border-gray-800">
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-goflex-blue/20 flex items-center justify-center">
              <Grid3x3 className="w-5 h-5 text-goflex-blue" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">RF Grid Settings</h2>
              <p className="text-sm text-gray-400">
                {floor ? floor.name : project?.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl">
            <div>
              <div className="text-white font-semibold">Enable RF Grid</div>
              <div className="text-sm text-gray-400">
                Show grid overlay during survey
              </div>
            </div>
            <button
              onClick={() => setEnabled(!enabled)}
              className={`w-12 h-6 rounded-full transition-colors ${
                enabled ? 'bg-goflex-blue' : 'bg-gray-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  enabled ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div>
            <label className="block text-white font-semibold mb-3">
              Grid Size
            </label>
            <div className="space-y-2">
              {presetSizes.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => setGridSize(preset.value)}
                  className={`w-full p-4 rounded-xl border-2 transition-all ${
                    gridSize === preset.value
                      ? 'border-goflex-blue bg-goflex-blue/10'
                      : 'border-gray-700 bg-gray-800/30 hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="text-left">
                      <div className="text-white font-semibold">
                        {preset.label}
                      </div>
                      <div className="text-sm text-gray-400">
                        {preset.value * preset.value} measurement points
                      </div>
                    </div>
                    {gridSize === preset.value && (
                      <Check className="w-5 h-5 text-goflex-blue" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
            <div className="text-sm text-blue-300">
              <strong>Tip:</strong> NFPA 1221 and IFC typically require 20x20
              foot grid spacing. Use 5x5 for standard compliance testing.
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-800 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl font-semibold bg-gray-800 text-white hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-3 rounded-xl font-semibold bg-gradient-to-r from-goflex-blue to-goflex-blue-dark text-white hover:shadow-lg hover:shadow-goflex-blue/25 transition-all"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
