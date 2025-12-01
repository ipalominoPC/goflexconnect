import { useState, useEffect } from 'react';
import { Plus, X, Upload, Antenna, FileText, Download, Loader2 } from 'lucide-react';
import { DonorAlignment } from '../../types';
import { useStore } from '../../store/useStore';
import { supabase } from '../../services/supabaseClient';
import { compressImageToFile } from '../../utils/imageCompression';
import CarrierSelector from '../CarrierSelector';
import { generateUUID } from '../../utils/uuid';

interface InstallWorkflowProps {
  projectId: string;
  userId: string;
  onGenerateReport?: () => void;
}

export default function InstallWorkflow({ projectId, userId, onGenerateReport }: InstallWorkflowProps) {
  const [activeTab, setActiveTab] = useState<'alignments' | 'photos' | 'notes' | 'summary'>('alignments');
  const [alignments, setAlignments] = useState<DonorAlignment[]>([]);
  const [installNotes, setInstallNotes] = useState('');
  const [dateCompleted, setDateCompleted] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const projects = useStore((state) => state.projects);
  const updateProject = useStore((state) => state.updateProject);
  const project = projects.find((p) => p.id === projectId);

  useEffect(() => {
    loadData();
  }, [projectId]);

  const loadData = async () => {
    try {
      setLoading(true);

      const { data, error: fetchError } = await supabase
        .from('donor_alignments')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;

      if (data) {
        const mapped: DonorAlignment[] = data.map((row) => ({
          id: row.id,
          projectId: row.project_id,
          carrier: row.carrier,
          azimuth: row.azimuth || 0,
          notes: row.notes || undefined,
          rfDeviceImages: row.rf_device_images || [],
          createdAt: new Date(row.created_at).getTime(),
        }));
        setAlignments(mapped);
      }

      if (project) {
        setInstallNotes(project.notes || '');
        if (project.dateCompleted) {
          setDateCompleted(new Date(project.dateCompleted).toISOString().split('T')[0]);
        }
      }
    } catch (err) {
      console.error('Error loading install data:', err);
      setError('Failed to load install data');
    } finally {
      setLoading(false);
    }
  };

  const addAlignment = () => {
    const newAlignment: DonorAlignment = {
      id: generateUUID(),
      projectId: projectId,
      carrier: '',
      azimuth: 0,
      rfDeviceImages: [],
      createdAt: Date.now(),
    };
    setAlignments([...alignments, newAlignment]);
  };

  const removeAlignment = async (id: string) => {
    try {
      await supabase.from('donor_alignments').delete().eq('id', id);
      setAlignments(alignments.filter((a) => a.id !== id));
    } catch (err) {
      console.error('Error removing alignment:', err);
      setError('Failed to remove alignment');
    }
  };

  const updateAlignment = (id: string, updates: Partial<DonorAlignment>) => {
    setAlignments(
      alignments.map((a) => (a.id === id ? { ...a, ...updates } : a))
    );
  };

  const uploadImage = async (alignmentId: string, file: File) => {
    if (!userId) return;

    try {
      setUploading(true);
      setError('');

      const compressed = await compressImageToFile(file);
      const fileExt = 'jpg';
      const fileName = `${generateUUID()}.${fileExt}`;
      const filePath = `${userId}/${projectId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('project-images')
        .upload(filePath, compressed);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('project-images')
        .getPublicUrl(filePath);

      const img = new Image();
      img.src = URL.createObjectURL(compressed);
      await new Promise((resolve) => { img.onload = resolve; });

      const alignment = alignments.find((a) => a.id === alignmentId);
      if (!alignment) return;

      const updatedImages = [
        ...(alignment.rfDeviceImages || []),
        { url: publicUrl, width: img.width, height: img.height },
      ];

      updateAlignment(alignmentId, { rfDeviceImages: updatedImages });
    } catch (err) {
      console.error('Error uploading image:', err);
      setError('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (alignmentId: string, imageUrl: string) => {
    const alignment = alignments.find((a) => a.id === alignmentId);
    if (!alignment) return;

    const updatedImages = (alignment.rfDeviceImages || []).filter((img) => img.url !== imageUrl);
    updateAlignment(alignmentId, { rfDeviceImages: updatedImages });
  };

  const saveAlignment = async (alignment: DonorAlignment) => {
    if (!userId) return;

    try {
      setSaving(true);

      const { error: upsertError } = await supabase
        .from('donor_alignments')
        .upsert({
          id: alignment.id,
          project_id: alignment.projectId,
          user_id: userId,
          carrier: alignment.carrier,
          azimuth: alignment.azimuth,
          notes: alignment.notes || null,
          rf_device_images: alignment.rfDeviceImages || [],
        });

      if (upsertError) throw upsertError;
    } catch (err) {
      console.error('Error saving alignment:', err);
      setError('Failed to save alignment');
    } finally {
      setSaving(false);
    }
  };

  const saveAll = async () => {
    if (!userId || !project) return;

    try {
      setSaving(true);
      setError('');

      for (const alignment of alignments) {
        if (alignment.carrier && alignment.azimuth !== undefined) {
          await saveAlignment(alignment);
        }
      }

      const updates: any = {
        notes: installNotes,
        updatedAt: Date.now(),
      };

      if (dateCompleted) {
        updates.dateCompleted = new Date(dateCompleted).getTime();
      }

      updateProject(projectId, updates);

      const { error: projectError } = await supabase
        .from('projects')
        .update({
          notes: installNotes,
          date_completed: dateCompleted ? new Date(dateCompleted).toISOString() : null,
        })
        .eq('id', projectId);

      if (projectError) throw projectError;

      alert('Install data saved successfully!');
    } catch (err) {
      console.error('Error saving install data:', err);
      setError('Failed to save install data');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-goflex-blue animate-spin" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12 text-slate-600 dark:text-slate-400">
        Project not found
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          {project.projectType === 'INSTALL' ? 'Installation' : 'Upgrade'} Workflow
        </h2>
        <p className="text-slate-600 dark:text-slate-400">
          Configure donor alignments, RF device screenshots, and installation details
        </p>
      </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="flex space-x-2 mb-6 border-b border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setActiveTab('alignments')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'alignments'
                  ? 'text-goflex-blue border-b-2 border-goflex-blue'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Antenna className="w-4 h-4 inline mr-2" />
              Donor Alignments
            </button>
            <button
              onClick={() => setActiveTab('notes')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'notes'
                  ? 'text-goflex-blue border-b-2 border-goflex-blue'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4 inline mr-2" />
              Notes
            </button>
            <button
              onClick={() => setActiveTab('summary')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'summary'
                  ? 'text-goflex-blue border-b-2 border-goflex-blue'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Download className="w-4 h-4 inline mr-2" />
              Summary
            </button>
          </div>

          <div className="space-y-6">
            {activeTab === 'alignments' && (
              <div className="space-y-6">
                {alignments.map((alignment, index) => (
                  <div
                    key={alignment.id}
                    className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700"
                  >
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                        Donor #{index + 1}
                      </h3>
                      <button
                        onClick={() => removeAlignment(alignment.id)}
                        className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <CarrierSelector
                        value={alignment.carrier}
                        onChange={(carrier) => updateAlignment(alignment.id, { carrier })}
                        label="Carrier"
                        required
                      />

                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                          Azimuth (0-360°)
                          <span className="text-red-500 ml-1">*</span>
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="360"
                          value={alignment.azimuth}
                          onChange={(e) =>
                            updateAlignment(alignment.id, { azimuth: parseInt(e.target.value) || 0 })
                          }
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-goflex-blue focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Notes
                      </label>
                      <textarea
                        value={alignment.notes || ''}
                        onChange={(e) => updateAlignment(alignment.id, { notes: e.target.value })}
                        rows={2}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-goflex-blue focus:border-transparent resize-none"
                      />
                    </div>

                    <div className="mt-4">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        RF Survey Device Screenshots
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          files.forEach((file) => uploadImage(alignment.id, file));
                          e.target.value = '';
                        }}
                        className="hidden"
                        id={`upload-${alignment.id}`}
                      />
                      <label
                        htmlFor={`upload-${alignment.id}`}
                        className="inline-flex items-center px-4 py-2 bg-goflex-blue text-white rounded-lg hover:bg-goflex-blue-dark transition-colors cursor-pointer"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Screenshots
                      </label>

                      {alignment.rfDeviceImages && alignment.rfDeviceImages.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                          {alignment.rfDeviceImages.map((img, imgIdx) => (
                            <div key={imgIdx} className="relative group">
                              <img
                                src={img.url}
                                alt={`RF Device ${imgIdx + 1}`}
                                className="w-full h-32 object-cover rounded-lg border border-slate-200 dark:border-slate-700"
                              />
                              <button
                                onClick={() => removeImage(alignment.id, img.url)}
                                className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                <button
                  onClick={addAlignment}
                  className="w-full py-4 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl text-slate-600 dark:text-slate-400 hover:text-goflex-blue hover:border-goflex-blue dark:hover:text-goflex-blue transition-colors flex items-center justify-center"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Add Donor Alignment
                </button>
              </div>
            )}

            {activeTab === 'notes' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Installation Notes
                </label>
                <textarea
                  value={installNotes}
                  onChange={(e) => setInstallNotes(e.target.value)}
                  rows={12}
                  placeholder="Mounting details, cable routes, risks, constraints..."
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-goflex-blue focus:border-transparent resize-none"
                />
              </div>
            )}

            {activeTab === 'summary' && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Technician Name
                    </label>
                    <p className="text-slate-900 dark:text-white">{project.technicianName || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Project Location
                    </label>
                    <p className="text-slate-900 dark:text-white">{project.projectLocation || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Date Completed
                    </label>
                    <input
                      type="date"
                      value={dateCompleted}
                      onChange={(e) => setDateCompleted(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-goflex-blue focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Donor Alignments</h3>
                  {alignments.length === 0 ? (
                    <p className="text-slate-600 dark:text-slate-400">No donor alignments added yet.</p>
                  ) : (
                    <div className="space-y-4">
                      {alignments.map((alignment, index) => (
                        <div
                          key={alignment.id}
                          className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700"
                        >
                          <div className="grid md:grid-cols-3 gap-4">
                            <div>
                              <span className="text-sm text-slate-600 dark:text-slate-400">Donor #{index + 1}</span>
                              <p className="font-medium text-slate-900 dark:text-white">{alignment.carrier}</p>
                            </div>
                            <div>
                              <span className="text-sm text-slate-600 dark:text-slate-400">Azimuth</span>
                              <p className="font-medium text-slate-900 dark:text-white">{alignment.azimuth}°</p>
                            </div>
                            <div>
                              <span className="text-sm text-slate-600 dark:text-slate-400">Screenshots</span>
                              <p className="font-medium text-slate-900 dark:text-white">
                                {alignment.rfDeviceImages?.length || 0} images
                              </p>
                            </div>
                          </div>
                          {alignment.notes && (
                            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{alignment.notes}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={onGenerateReport}
                  disabled={!onGenerateReport}
                  className="w-full bg-gradient-to-r from-goflex-blue to-goflex-blue-dark text-white rounded-xl py-4 text-lg font-semibold hover:shadow-xl hover:shadow-goflex-blue/25 hover:scale-[1.01] transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Generate Installation Report
                </button>
              </div>
            )}
          </div>

      <div className="mt-8 flex justify-end">
        <button
          onClick={saveAll}
          disabled={saving || uploading}
          className="px-8 py-3 bg-goflex-blue text-white rounded-lg hover:bg-goflex-blue-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            'Save All Changes'
          )}
        </button>
      </div>
    </div>
  );
}
