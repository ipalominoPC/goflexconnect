import { ArrowLeft, Plus, Building2, Trash2 } from 'lucide-react';
import { useStore } from '../store/useStore';

interface FloorListProps {
  projectId: string;
  onBack: () => void;
  onAddFloor: () => void;
  onSelectFloor: (floorId: string) => void;
}

export default function FloorList({
  projectId,
  onBack,
  onAddFloor,
  onSelectFloor,
}: FloorListProps) {
  const projects = useStore((state) => state.projects);
  const allFloors = useStore((state) => state.floors);
  const allMeasurements = useStore((state) => state.measurements);
  const deleteFloor = useStore((state) => state.deleteFloor);

  const project = projects.find((p) => p.id === projectId);
  const floors = allFloors.filter((f) => f.projectId === projectId);

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Project not found</p>
      </div>
    );
  }

  const handleDeleteFloor = (floorId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const floor = floors.find((f) => f.id === floorId);
    if (floor && confirm(`Delete floor "${floor.name}"? This will also delete all measurements for this floor.`)) {
      deleteFloor(floorId);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-50 to-blue-50/30">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <button
          onClick={onBack}
          className="group flex items-center text-gray-600 hover:text-gray-900 mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Back to Project</span>
        </button>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
              <p className="text-gray-600 mt-2">Manage floors and levels</p>
            </div>
            <button
              onClick={onAddFloor}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-goflex-blue to-goflex-blue-dark text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-goflex-blue/25 transition-all"
            >
              <Plus className="w-5 h-5" />
              Add Floor
            </button>
          </div>
        </div>

        {floors.length === 0 ? (
          <div className="bg-white rounded-2xl border-2 border-dashed border-gray-300 p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Floors Yet</h3>
            <p className="text-gray-600 mb-6">
              Add floors to organize measurements by level in your building
            </p>
            <button
              onClick={onAddFloor}
              className="inline-flex items-center gap-2 px-6 py-3 bg-goflex-blue text-white rounded-xl font-semibold hover:bg-goflex-blue-dark transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add First Floor
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {floors.map((floor) => {
              const measurementCount = allMeasurements.filter((m) => m.floorId === floor.id).length;
              return (
                <div
                  key={floor.id}
                  onClick={() => onSelectFloor(floor.id)}
                  className="bg-white rounded-xl border border-gray-200 p-6 hover:border-goflex-blue hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-16 h-16 bg-gradient-to-br from-goflex-blue/10 to-goflex-blue/5 rounded-xl flex items-center justify-center group-hover:from-goflex-blue/20 group-hover:to-goflex-blue/10 transition-all">
                        <Building2 className="w-8 h-8 text-goflex-blue" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-1">{floor.name}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>Level: {floor.level}</span>
                          <span>•</span>
                          <span>{measurementCount} measurements</span>
                          {floor.floorPlanFilename && (
                            <>
                              <span>•</span>
                              <span className="truncate max-w-xs">{floor.floorPlanFilename}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleDeleteFloor(floor.id, e)}
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      aria-label="Delete floor"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
