import { Plus, MapPin, Calendar, Radio, ArrowLeft } from 'lucide-react';
import { useStore } from '../store/useStore';
import { createSampleProjects, createSampleMeasurements } from '../services/mockData';

interface ProjectListProps {
  onCreateProject: () => void;
  onSelectProject: (projectId: string) => void;
  onBack: () => void;
}

export default function ProjectList({ onCreateProject, onSelectProject, onBack }: ProjectListProps) {
  const projects = useStore((state) => state.projects);
  const measurements = useStore((state) => state.measurements);
  const addProject = useStore((state) => state.addProject);
  const addMeasurement = useStore((state) => state.addMeasurement);

  const loadSampleData = () => {
    const sampleProjects = createSampleProjects();
    sampleProjects.forEach((project) => {
      addProject(project);
      const sampleMeasurements = createSampleMeasurements(project.id);
      sampleMeasurements.forEach(addMeasurement);
    });
  };

  const getProjectMeasurementCount = (projectId: string) => {
    return measurements.filter((m) => m.projectId === projectId).length;
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-50 to-blue-50/30">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <button
          onClick={onBack}
          className="mb-6 flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Menu
        </button>
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-4">
            <img
              src="/GoFlexConnectTikTok.png"
              alt="GoFlexConnect"
              className="h-14 w-auto"
            />
            <div>
              <h1 className="text-4xl font-bold text-gray-900 tracking-tight">GoFlexConnect</h1>
              <p className="text-gray-500 mt-1.5 text-base">Signal survey platform</p>
            </div>
          </div>
        </div>

        {projects.length === 0 && (
          <div className="bg-white rounded-2xl p-12 text-center mb-6 border border-gray-100 shadow-sm">
            <div className="w-20 h-20 bg-gradient-to-br from-goflex-blue to-goflex-blue-dark rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-goflex-blue/20">
              <MapPin className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">No Projects Yet</h2>
            <p className="text-gray-600 mb-8 text-lg">Create your first project to start surveying signal coverage</p>
            <button
              onClick={loadSampleData}
              className="text-goflex-blue hover:text-goflex-blue-dark text-sm font-semibold transition-colors"
            >
              Load sample data for testing
            </button>
          </div>
        )}

        <div className="grid gap-5 mb-8">
          {projects.map((project) => (
            <button
              key={project.id}
              onClick={() => onSelectProject(project.id)}
              className="group bg-white rounded-2xl p-6 border border-gray-100 hover:border-goflex-blue/30 hover:shadow-lg hover:shadow-goflex-blue/5 transition-all duration-200 text-left"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-goflex-blue transition-colors">{project.name}</h3>
                  {project.location && (
                    <div className="flex items-center text-base text-gray-600">
                      <MapPin className="w-4 h-4 mr-2" />
                      {project.location}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center text-gray-600 bg-gray-50 px-4 py-2 rounded-lg">
                  <Radio className="w-4 h-4 mr-2 text-goflex-blue" />
                  <span className="font-semibold">{getProjectMeasurementCount(project.id)}</span>
                  <span className="ml-1.5">measurements</span>
                </div>
                <div className="flex items-center text-gray-500">
                  <Calendar className="w-4 h-4 mr-2" />
                  {formatDate(project.updatedAt)}
                </div>
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={onCreateProject}
          className="w-full bg-gradient-to-r from-goflex-blue to-goflex-blue-dark text-white rounded-2xl py-5 text-lg font-semibold hover:shadow-xl hover:shadow-goflex-blue/25 hover:scale-[1.01] transition-all duration-200 flex items-center justify-center gap-3"
        >
          <Plus className="w-6 h-6" />
          New Project
        </button>
      </div>
    </div>
  );
}
