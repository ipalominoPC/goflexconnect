import { useState, useEffect } from 'react';
import { Plus, X, Upload, Radio, Gauge, Camera, FileText, Download, Loader2 } from 'lucide-react';
import { SurveyData, SpeedTestEntry } from '../../types';
import { useStore } from '../../store/useStore';
import { supabase } from '../../services/supabaseClient';
import { compressImageToFile } from '../../utils/imageCompression';
import CarrierSelector from '../CarrierSelector';
import { generateUUID } from '../../utils/uuid';

interface SurveyWorkflowProps {
  projectId: string;
  userId: string;
  onGenerateReport?: () => void;
}

export default function SurveyWorkflow({ projectId, userId, onGenerateReport }: SurveyWorkflowProps) {
  const [activeTab, setActiveTab] = useState<'ambient' | 'indoor' | 'outdoor' | 'photos' | 'notes' | 'summary'>('ambient');
  const [surveyData, setSurveyData] = useState<Partial<SurveyData>>({
    ambientReading: undefined,
    indoorSpeedtests: [],
    outdoorSpeedtests: [],
    sitePhotos: [],
    notes: '',
  });
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
        .from('survey_data')
        .select('*')
        .eq('project_id', projectId)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (data) {
        setSurveyData({
          ambientReading: data.ambient_reading || undefined,
          indoorSpeedtests: data.indoor_speedtests || [],
          outdoorSpeedtests: data.outdoor_speedtests || [],
          sitePhotos: data.site_photos || [],
          notes: data.notes || '',
        });
      }

      if (project?.dateCompleted) {
        setDateCompleted(new Date(project.dateCompleted).toISOString().split('T')[0]);
      }
    } catch (err) {
      console.error('Error loading survey data:', err);
      setError('Failed to load survey data');
    } finally {
      setLoading(false);
    }
  };

  const addSpeedTest = (type: 'indoor' | 'outdoor') => {
    const newTest: SpeedTestEntry = {
      carrier: '',
      connectionType: 'cellular',
      download: 0,
      upload: 0,
      ping: 0,
      locationLabel: '',
      timestamp: new Date().toISOString(),
    };

    if (type === 'indoor') {
      setSurveyData({
        ...surveyData,
        indoorSpeedtests: [...(surveyData.indoorSpeedtests || []), newTest],
      });
    } else {
      setSurveyData({
        ...surveyData,
        outdoorSpeedtests: [...(surveyData.outdoorSpeedtests || []), newTest],
      });
    }
  };

  const removeSpeedTest = (type: 'indoor' | 'outdoor', index: number) => {
    if (type === 'indoor') {
      setSurveyData({
        ...surveyData,
        indoorSpeedtests: surveyData.indoorSpeedtests?.filter((_, i) => i !== index),
      });
    } else {
      setSurveyData({
        ...surveyData,
        outdoorSpeedtests: surveyData.outdoorSpeedtests?.filter((_, i) => i !== index),
      });
    }
  };

  const updateSpeedTest = (type: 'indoor' | 'outdoor', index: number, updates: Partial<SpeedTestEntry>) => {
    if (type === 'indoor') {
      const updated = [...(surveyData.indoorSpeedtests || [])];
      updated[index] = { ...updated[index], ...updates };
      setSurveyData({ ...surveyData, indoorSpeedtests: updated });
    } else {
      const updated = [...(surveyData.outdoorSpeedtests || [])];
      updated[index] = { ...updated[index], ...updates };
      setSurveyData({ ...surveyData, outdoorSpeedtests: updated });
    }
  };

  const uploadPhoto = async (file: File, caption?: string) => {
    if (!userId) return;

    try {
      setUploading(true);
      setError('');

      const compressed = await compressImageToFile(file);
      const fileName = `${generateUUID()}.jpg`;
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

      const updatedPhotos = [
        ...(surveyData.sitePhotos || []),
        { url: publicUrl, width: img.width, height: img.height, caption },
      ];

      setSurveyData({ ...surveyData, sitePhotos: updatedPhotos });
    } catch (err) {
      console.error('Error uploading photo:', err);
      setError('Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = (imageUrl: string) => {
    setSurveyData({
      ...surveyData,
      sitePhotos: surveyData.sitePhotos?.filter((img) => img.url !== imageUrl),
    });
  };

  const saveAll = async () => {
    if (!userId || !project) return;

    try {
      setSaving(true);
      setError('');

      const { error: upsertError } = await supabase
        .from('survey_data')
        .upsert({
          project_id: projectId,
          user_id: userId,
          ambient_reading: surveyData.ambientReading || null,
          indoor_speedtests: surveyData.indoorSpeedtests || [],
          outdoor_speedtests: surveyData.outdoorSpeedtests || [],
          site_photos: surveyData.sitePhotos || [],
          notes: surveyData.notes || null,
        }, {
          onConflict: 'project_id',
        });

      if (upsertError) throw upsertError;

      const updates: any = { updatedAt: Date.now() };
      if (dateCompleted) {
        updates.dateCompleted = new Date(dateCompleted).getTime();
      }

      updateProject(projectId, updates);

      const { error: projectError } = await supabase
        .from('projects')
        .update({
          date_completed: dateCompleted ? new Date(dateCompleted).toISOString() : null,
        })
        .eq('id', projectId);

      if (projectError) throw projectError;

      alert('Survey data saved successfully!');
    } catch (err) {
      console.error('Error saving survey data:', err);
      setError('Failed to save survey data');
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
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">RF Site Survey Workflow</h2>
        <p className="text-slate-600 dark:text-slate-400">Capture ambient readings, speedtests, and site documentation</p>
      </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="flex space-x-2 mb-6 border-b border-slate-200 dark:border-slate-700 overflow-x-auto">
            {[
              { id: 'ambient', label: 'Ambient', icon: Radio },
              { id: 'indoor', label: 'Indoor Tests', icon: Gauge },
              { id: 'outdoor', label: 'Outdoor Tests', icon: Gauge },
              { id: 'photos', label: 'Site Photos', icon: Camera },
              { id: 'notes', label: 'Notes', icon: FileText },
              { id: 'summary', label: 'Summary', icon: Download },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-3 font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'text-goflex-blue border-b-2 border-goflex-blue'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <tab.icon className="w-4 h-4 inline mr-2" />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="space-y-6">
            {activeTab === 'ambient' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Ambient RF Reading</h3>

                <CarrierSelector
                  value={surveyData.ambientReading?.carrier || ''}
                  onChange={(carrier) =>
                    setSurveyData({
                      ...surveyData,
                      ambientReading: { ...surveyData.ambientReading!, carrier },
                    })
                  }
                  label="Carrier"
                />

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      RSRP (dBm)
                    </label>
                    <input
                      type="number"
                      value={surveyData.ambientReading?.rsrp || ''}
                      onChange={(e) =>
                        setSurveyData({
                          ...surveyData,
                          ambientReading: {
                            ...surveyData.ambientReading!,
                            rsrp: parseFloat(e.target.value) || 0,
                          },
                        })
                      }
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-goflex-blue"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      RSRQ (dB)
                    </label>
                    <input
                      type="number"
                      value={surveyData.ambientReading?.rsrq || ''}
                      onChange={(e) =>
                        setSurveyData({
                          ...surveyData,
                          ambientReading: {
                            ...surveyData.ambientReading!,
                            rsrq: parseFloat(e.target.value) || 0,
                          },
                        })
                      }
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-goflex-blue"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      SINR (dB)
                    </label>
                    <input
                      type="number"
                      value={surveyData.ambientReading?.sinr || ''}
                      onChange={(e) =>
                        setSurveyData({
                          ...surveyData,
                          ambientReading: {
                            ...surveyData.ambientReading!,
                            sinr: parseFloat(e.target.value) || 0,
                          },
                        })
                      }
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-goflex-blue"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Cell ID / PCI
                    </label>
                    <input
                      type="text"
                      value={surveyData.ambientReading?.cellId || ''}
                      onChange={(e) =>
                        setSurveyData({
                          ...surveyData,
                          ambientReading: {
                            ...surveyData.ambientReading!,
                            cellId: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-goflex-blue"
                    />
                  </div>
                </div>
              </div>
            )}

            {(activeTab === 'indoor' || activeTab === 'outdoor') && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                    {activeTab === 'indoor' ? 'Indoor' : 'Outdoor'} Speedtests
                  </h3>
                  <button
                    onClick={() => addSpeedTest(activeTab)}
                    className="px-4 py-2 bg-goflex-blue text-white rounded-lg hover:bg-goflex-blue-dark transition-colors flex items-center"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Test
                  </button>
                </div>

                {(activeTab === 'indoor' ? surveyData.indoorSpeedtests : surveyData.outdoorSpeedtests)?.map(
                  (test, index) => (
                    <div
                      key={index}
                      className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700"
                    >
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-medium text-slate-900 dark:text-white">
                          Test #{index + 1}
                        </h4>
                        <button
                          onClick={() => removeSpeedTest(activeTab, index)}
                          className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <CarrierSelector
                          value={test.carrier}
                          onChange={(carrier) => updateSpeedTest(activeTab, index, { carrier })}
                          label="Carrier"
                        />

                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Connection Type
                          </label>
                          <select
                            value={test.connectionType}
                            onChange={(e) =>
                              updateSpeedTest(activeTab, index, {
                                connectionType: e.target.value as any,
                              })
                            }
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-goflex-blue"
                          >
                            <option value="cellular">Cellular</option>
                            <option value="wifi">WiFi</option>
                            <option value="unknown">Unknown</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Download (Mbps)
                          </label>
                          <input
                            type="number"
                            value={test.download}
                            onChange={(e) =>
                              updateSpeedTest(activeTab, index, { download: parseFloat(e.target.value) || 0 })
                            }
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-goflex-blue"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Upload (Mbps)
                          </label>
                          <input
                            type="number"
                            value={test.upload}
                            onChange={(e) =>
                              updateSpeedTest(activeTab, index, { upload: parseFloat(e.target.value) || 0 })
                            }
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-goflex-blue"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Ping (ms)
                          </label>
                          <input
                            type="number"
                            value={test.ping}
                            onChange={(e) =>
                              updateSpeedTest(activeTab, index, { ping: parseFloat(e.target.value) || 0 })
                            }
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-goflex-blue"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Location Label
                          </label>
                          <input
                            type="text"
                            value={test.locationLabel || ''}
                            onChange={(e) =>
                              updateSpeedTest(activeTab, index, { locationLabel: e.target.value })
                            }
                            placeholder="e.g., Lobby, 3rd floor"
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-goflex-blue"
                          />
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            )}

            {activeTab === 'photos' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Site Photos</h3>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      files.forEach((file) => uploadPhoto(file));
                      e.target.value = '';
                    }}
                    className="hidden"
                    id="upload-photos"
                  />
                  <label
                    htmlFor="upload-photos"
                    className="px-4 py-2 bg-goflex-blue text-white rounded-lg hover:bg-goflex-blue-dark transition-colors cursor-pointer flex items-center"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Photos
                  </label>
                </div>

                {surveyData.sitePhotos && surveyData.sitePhotos.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {surveyData.sitePhotos.map((photo, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={photo.url}
                          alt={`Site ${index + 1}`}
                          className="w-full h-48 object-cover rounded-lg border border-slate-200 dark:border-slate-700"
                        />
                        <button
                          onClick={() => removePhoto(photo.url)}
                          className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        {photo.caption && (
                          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{photo.caption}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-600 dark:text-slate-400">No photos uploaded yet.</p>
                )}
              </div>
            )}

            {activeTab === 'notes' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Survey Notes
                </label>
                <textarea
                  value={surveyData.notes || ''}
                  onChange={(e) => setSurveyData({ ...surveyData, notes: e.target.value })}
                  rows={12}
                  placeholder="General observations, customer comments, risks, recommendations..."
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-goflex-blue resize-none"
                />
              </div>
            )}

            {activeTab === 'summary' && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Technician
                    </label>
                    <p className="text-slate-900 dark:text-white">{project.technicianName || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Location
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
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-goflex-blue"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    <h4 className="font-medium text-slate-900 dark:text-white mb-2">Indoor Tests</h4>
                    <p className="text-2xl font-bold text-goflex-blue">{surveyData.indoorSpeedtests?.length || 0}</p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    <h4 className="font-medium text-slate-900 dark:text-white mb-2">Outdoor Tests</h4>
                    <p className="text-2xl font-bold text-goflex-blue">{surveyData.outdoorSpeedtests?.length || 0}</p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    <h4 className="font-medium text-slate-900 dark:text-white mb-2">Site Photos</h4>
                    <p className="text-2xl font-bold text-goflex-blue">{surveyData.sitePhotos?.length || 0}</p>
                  </div>
                </div>

                <button
                  onClick={onGenerateReport}
                  disabled={!onGenerateReport}
                  className="w-full bg-gradient-to-r from-goflex-blue to-goflex-blue-dark text-white rounded-xl py-4 text-lg font-semibold hover:shadow-xl hover:shadow-goflex-blue/25 hover:scale-[1.01] transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Generate Survey Report
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
