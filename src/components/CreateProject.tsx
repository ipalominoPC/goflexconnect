import { useState } from 'react';
import { ArrowLeft, Building2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { Project } from '../types';
import { generateUUID } from '../utils/uuid';
import { checkUsageLimit, trackUsageEvent } from '../services/usageTracking';
import { normalizePlanId } from '../config/planLimits';
import UsageLimitModal from './UsageLimitModal';
import UpgradeProModal from './UpgradeProModal';

interface CreateProjectProps {
  onBack: () => void;
  onProjectCreated: (projectId: string) => void;
}

export default function CreateProject({ onBack, onProjectCreated }: CreateProjectProps) {
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [buildingLevel, setBuildingLevel] = useState('');
  const [projectType, setProjectType] = useState<'SURVEY' | 'INSTALL' | 'UPGRADE'>('SURVEY');
  const [technicianName, setTechnicianName] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [limitMessage, setLimitMessage] = useState('');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const addProject = useStore((state) => state.addProject);
  const user = useStore((state) => state.user);
  const settings = useStore((state) => state.settings);

  // Prefill technician name from user profile
  useState(() => {
    if (user?.user_metadata?.full_name) {
      setTechnicianName(user.user_metadata.full_name);
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Project name is required');
      return;
    }

    // Check usage limit for FREE users
    if (user) {
      const planId = normalizePlanId(settings.plan);
      const limitCheck = await checkUsageLimit({
        userId: user.id,
        planId,
        limitType: 'projects',
      });

      if (!limitCheck.allowed) {
        setLimitMessage(limitCheck.message || 'Project limit reached');
        setShowLimitModal(true);
        return;
      }
    }

    const newProject: Project = {
      id: generateUUID(),
      name: name.trim(),
      location: location.trim() || undefined,
      buildingLevel: buildingLevel.trim() || undefined,
      projectType,
      technicianName: technicianName.trim() || undefined,
      projectLocation: location.trim() || undefined,
      notes: notes.trim() || undefined,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    addProject(newProject);

    // Track usage event
    if (user) {
      await trackUsageEvent({
        userId: user.id,
        eventType: 'project_created',
        projectId: newProject.id,
      });
    }

    onProjectCreated(newProject.id);
  };

  return (
    <div className="min-h-screen bg-goflex-bg dark:bg-goflex-bg">
      <div className="max-w-3xl mx-auto px-6 py-8">
        <button
          onClick={onBack}
          className="group flex items-center text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Back</span>
        </button>

        <div className="bg-white dark:bg-goflex-card rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-goflex-blue to-goflex-blue-dark rounded-2xl flex items-center justify-center shadow-lg shadow-goflex-blue/20">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">New Project</h1>
              <p className="text-slate-600 dark:text-slate-400 text-base mt-1">Create a signal survey project</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                Project Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Office Building - Floor 3"
                className="w-full px-5 py-3.5 bg-white dark:bg-slate-800/50 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-goflex-blue/20 focus:border-goflex-blue transition-all text-base text-slate-900 dark:text-white placeholder:text-slate-400"
              />
              {error && <p className="text-red-600 dark:text-red-400 text-sm mt-2 font-medium">{error}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                Project Type *
              </label>
              <select
                value={projectType}
                onChange={(e) => setProjectType(e.target.value as 'SURVEY' | 'INSTALL' | 'UPGRADE')}
                className="w-full px-5 py-3.5 bg-white dark:bg-slate-800/50 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-goflex-blue/20 focus:border-goflex-blue transition-all text-base text-slate-900 dark:text-white"
              >
                <option value="SURVEY">Survey Project</option>
                <option value="INSTALL">Install Project</option>
                <option value="UPGRADE">Upgrade Project</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                Project Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Downtown Office Complex"
                className="w-full px-5 py-3.5 bg-white dark:bg-slate-800/50 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-goflex-blue/20 focus:border-goflex-blue transition-all text-base text-slate-900 dark:text-white placeholder:text-slate-400"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                Technician Name
              </label>
              <input
                type="text"
                value={technicianName}
                onChange={(e) => setTechnicianName(e.target.value)}
                placeholder="e.g., John Smith"
                className="w-full px-5 py-3.5 bg-white dark:bg-slate-800/50 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-goflex-blue/20 focus:border-goflex-blue transition-all text-base text-slate-900 dark:text-white placeholder:text-slate-400"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                Building Level / Area
              </label>
              <input
                type="text"
                value={buildingLevel}
                onChange={(e) => setBuildingLevel(e.target.value)}
                placeholder="e.g., Floor 3, Basement, Main Hall"
                className="w-full px-5 py-3.5 bg-white dark:bg-slate-800/50 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-goflex-blue/20 focus:border-goflex-blue transition-all text-base text-slate-900 dark:text-white placeholder:text-slate-400"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional information about this project..."
                rows={4}
                className="w-full px-5 py-3.5 bg-white dark:bg-slate-800/50 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-goflex-blue/20 focus:border-goflex-blue transition-all resize-none text-base text-slate-900 dark:text-white placeholder:text-slate-400"
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

      {/* Usage Limit Modal */}
      <UsageLimitModal
        isOpen={showLimitModal}
        onClose={() => setShowLimitModal(false)}
        onUpgrade={() => {
          setShowLimitModal(false);
          setShowUpgradeModal(true);
        }}
        title="Project limit reached on Free plan"
        message={limitMessage}
      />

      {/* Upgrade Pro Modal */}
      {showUpgradeModal && (
        <UpgradeProModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
        />
      )}
    </div>
  );
}
