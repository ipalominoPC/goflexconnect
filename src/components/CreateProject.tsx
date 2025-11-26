import { useState } from 'react';
import { ArrowLeft, Building2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { Project } from '../types';
import { generateUUID } from '../utils/uuid';

interface CreateProjectProps {
  onBack: () => void;
  onProjectCreated: (projectId: string) => void;
}

export default function CreateProject({ onBack, onProjectCreated }: CreateProjectProps) {
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [buildingLevel, setBuildingLevel] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const addProject = useStore((state) => state.addProject);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Project name is required');
      return;
    }

    const newProject: Project = {
      id: generateUUID(),
      name: name.trim(),
      location: location.trim() || undefined,
      buildingLevel: buildingLevel.trim() || undefined,
      notes: notes.trim() || undefined,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    addProject(newProject);
    onProjectCreated(newProject.id);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-50 to-blue-50/30">
      <div className="max-w-3xl mx-auto px-6 py-8">
        <button
          onClick={onBack}
          className="group flex items-center text-gray-600 hover:text-gray-900 mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Back</span>
        </button>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-goflex-blue to-goflex-blue-dark rounded-2xl flex items-center justify-center shadow-lg shadow-goflex-blue/20">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">New Project</h1>
              <p className="text-gray-600 text-base mt-1">Create a signal survey project</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Project Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Office Building - Floor 3"
                className="w-full px-5 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-goflex-blue/20 focus:border-goflex-blue transition-all text-base"
              />
              {error && <p className="text-red-600 text-sm mt-2 font-medium">{error}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Downtown Office Complex"
                className="w-full px-5 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-goflex-blue/20 focus:border-goflex-blue transition-all text-base"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Building Level / Area
              </label>
              <input
                type="text"
                value={buildingLevel}
                onChange={(e) => setBuildingLevel(e.target.value)}
                placeholder="e.g., Floor 3, Basement, Main Hall"
                className="w-full px-5 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-goflex-blue/20 focus:border-goflex-blue transition-all text-base"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional information about this project..."
                rows={4}
                className="w-full px-5 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-goflex-blue/20 focus:border-goflex-blue transition-all resize-none text-base"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-goflex-blue to-goflex-blue-dark text-white rounded-2xl py-5 text-lg font-semibold hover:shadow-xl hover:shadow-goflex-blue/25 hover:scale-[1.01] transition-all duration-200"
            >
              Create Project
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
