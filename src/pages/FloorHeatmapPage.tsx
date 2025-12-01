import { ArrowLeft, Loader2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import IndoorHeatmapView from '../components/IndoorHeatmapView';

interface FloorHeatmapPageProps {
  projectId: string;
  floorId: string;
  onBack: () => void;
}

export default function FloorHeatmapPage({ projectId, floorId, onBack }: FloorHeatmapPageProps) {
  const floors = useStore((state) => state.floors);
  const allMeasurements = useStore((state) => state.measurements);

  const floor = floors.find((f) => f.id === floorId);
  const measurements = allMeasurements.filter((m) => m.floorId === floorId);

  const loading = false;
  const error = !floor ? 'Floor not found' : null;

  const handleBack = () => {
    onBack();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-goflex-bg dark:bg-goflex-bg flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-goflex-blue mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">Loading heatmap...</p>
        </div>
      </div>
    );
  }

  if (error || !floor) {
    return (
      <div className="min-h-screen bg-goflex-bg dark:bg-goflex-bg">
        <div className="container mx-auto px-4 py-6">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Project</span>
          </button>

          <div className="bg-white dark:bg-goflex-card border border-slate-200 dark:border-slate-700 rounded-2xl shadow-lg p-12 text-center">
            <p className="text-red-600 dark:text-red-400 text-lg font-medium">
              {error || 'Floor not found'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-goflex-bg dark:bg-goflex-bg">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-slate-300 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Back to Floor</span>
        </button>

        <IndoorHeatmapView
          measurements={measurements}
          floorName={floor.name}
        />
      </div>
    </div>
  );
}
