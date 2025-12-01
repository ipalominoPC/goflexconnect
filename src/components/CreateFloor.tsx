import { useState, useRef } from 'react';
import { ArrowLeft, Building2, Upload, Image as ImageIcon } from 'lucide-react';
import { useStore } from '../store/useStore';
import { Floor } from '../types';
import { generateUUID } from '../utils/uuid';

interface CreateFloorProps {
  projectId: string;
  onBack: () => void;
  onFloorCreated: (floorId: string) => void;
}

export default function CreateFloor({ projectId, onBack, onFloorCreated }: CreateFloorProps) {
  const addFloor = useStore((state) => state.addFloor);
  const user = useStore((state) => state.user);
  const [name, setName] = useState('');
  const [level, setLevel] = useState('');
  const [notes, setNotes] = useState('');
  const [floorPlanImage, setFloorPlanImage] = useState<string | null>(null);
  const [floorPlanFilename, setFloorPlanFilename] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type === 'application/pdf') {
      alert('PDF files are not fully supported. Please upload an image (PNG or JPG) for the best experience with zoom and measurements.');
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, JPEG)');
      return;
    }

    setFloorPlanFilename(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const fileData = event.target?.result as string;
      setFloorPlanImage(fileData);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !level.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    if (!user) {
      alert('You must be logged in to create a floor');
      return;
    }

    const floor: Floor = {
      id: generateUUID(),
      projectId,
      name: name.trim(),
      level: level.trim(),
      floorPlanImage: floorPlanImage || undefined,
      floorPlanFilename: floorPlanFilename || undefined,
      notes: notes.trim() || undefined,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    addFloor(floor);
    onFloorCreated(floor.id);
  };

  return (
    <div className="min-h-screen bg-goflex-bg dark:bg-goflex-bg">
      <div className="max-w-2xl mx-auto px-6 py-8">
        <button
          onClick={onBack}
          className="group flex items-center text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Back</span>
        </button>

        <div className="bg-white dark:bg-goflex-card rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-goflex-blue/10 dark:bg-goflex-blue/20 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-goflex-blue" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Add New Floor</h1>
              <p className="text-slate-600 dark:text-slate-400">Create a new floor or level for this project</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Floor Name <span className="text-red-500 dark:text-red-400">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., First Floor, Lobby, Main Level"
                className="w-full px-4 py-3 bg-white dark:bg-slate-800/50 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:border-goflex-blue focus:ring-2 focus:ring-goflex-blue/20 transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Level/Floor Number <span className="text-red-500 dark:text-red-400">*</span>
              </label>
              <input
                type="text"
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                placeholder="e.g., 1, 2, G, B1"
                className="w-full px-4 py-3 bg-white dark:bg-slate-800/50 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:border-goflex-blue focus:ring-2 focus:ring-goflex-blue/20 transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
                required
              />
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Use numbers (1, 2, 3) or codes (G for Ground, B1 for Basement 1)
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Floor Plan (Optional)
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              {floorPlanImage ? (
                <div className="space-y-3">
                  <div className="border-2 border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-slate-50 dark:bg-slate-800/50">
                    {floorPlanImage.startsWith('data:application/pdf') ? (
                      <embed
                        src={floorPlanImage}
                        type="application/pdf"
                        className="w-full h-48"
                      />
                    ) : (
                      <img
                        src={floorPlanImage}
                        alt="Floor plan preview"
                        className="w-full h-auto max-h-48 object-contain"
                      />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full px-4 py-2 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    Change File
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-8 hover:border-goflex-blue hover:bg-goflex-blue/5 transition-all"
                >
                  <div className="flex flex-col items-center">
                    <Upload className="w-10 h-10 text-slate-400 dark:text-slate-500 mb-3" />
                    <p className="text-slate-700 dark:text-slate-300 font-medium mb-1">Upload Floor Plan</p>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Only supported file types are PNG, JPG</p>
                  </div>
                </button>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about this floor..."
                rows={3}
                className="w-full px-4 py-3 bg-white dark:bg-slate-800/50 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:border-goflex-blue focus:ring-2 focus:ring-goflex-blue/20 transition-all resize-none text-slate-900 dark:text-white placeholder:text-slate-400"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onBack}
                className="flex-1 px-6 py-3 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-gradient-to-r from-goflex-blue to-goflex-blue-dark text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-goflex-blue/25 transition-all"
              >
                Create Floor
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
