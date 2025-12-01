import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Check, X, Edit2, Trash2, FileText, ClipboardCheck } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { useStore } from '../store/useStore';

interface CommissioningChecklistProps {
  projectId: string;
  floorId?: string;
  onBack: () => void;
}

interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  notes: string;
}

interface Checklist {
  id: string;
  name: string;
  category: string;
  items: ChecklistItem[];
  status: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

const DEFAULT_TEMPLATES = {
  'Pre-Installation': [
    'Verify site access and permissions',
    'Review floor plans and site survey data',
    'Confirm equipment delivery and inventory',
    'Check power and grounding requirements',
    'Identify cable pathways and mounting locations',
    'Coordinate with building management',
  ],
  'Installation': [
    'Install mounting hardware and brackets',
    'Run and terminate cables properly',
    'Mount access points and antennas',
    'Connect to power and network infrastructure',
    'Label all equipment and cables',
    'Document installation locations and photos',
  ],
  'Testing': [
    'Power on and verify equipment status',
    'Test network connectivity',
    'Perform RF signal strength tests',
    'Verify coverage in all areas',
    'Test handoff between access points',
    'Run speed and throughput tests',
  ],
  'Post-Installation': [
    'Complete as-built documentation',
    'Update network diagrams',
    'Configure monitoring and alerts',
    'Provide training to site staff',
    'Obtain customer sign-off',
    'Schedule follow-up review',
  ],
};

export default function CommissioningChecklist({ projectId, floorId, onBack }: CommissioningChecklistProps) {
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [selectedChecklist, setSelectedChecklist] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newChecklistName, setNewChecklistName] = useState('');
  const [newChecklistCategory, setNewChecklistCategory] = useState('Pre-Installation');
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const user = useStore((state) => state.user);

  useEffect(() => {
    loadChecklists();
  }, [projectId, floorId]);

  const loadChecklists = async () => {
    if (!user) return;

    const query = supabase
      .from('commissioning_checklists')
      .select('*')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (floorId) {
      query.eq('floor_id', floorId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to load checklists:', error);
    } else if (data) {
      setChecklists(data as Checklist[]);
    }
  };

  const createChecklist = async () => {
    if (!user || !newChecklistName.trim()) return;

    const templateItems = DEFAULT_TEMPLATES[newChecklistCategory as keyof typeof DEFAULT_TEMPLATES] || [];
    const items: ChecklistItem[] = templateItems.map(text => ({
      id: crypto.randomUUID(),
      text,
      completed: false,
      notes: '',
    }));

    const { data, error } = await supabase
      .from('commissioning_checklists')
      .insert({
        project_id: projectId,
        floor_id: floorId,
        user_id: user.id,
        name: newChecklistName,
        category: newChecklistCategory,
        items,
        status: 'in_progress',
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create checklist:', error);
    } else {
      setChecklists([data as Checklist, ...checklists]);
      setSelectedChecklist(data.id);
      setIsCreating(false);
      setNewChecklistName('');
    }
  };

  const toggleItem = async (checklistId: string, itemId: string) => {
    const checklist = checklists.find(c => c.id === checklistId);
    if (!checklist) return;

    const updatedItems = checklist.items.map(item =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );

    const allCompleted = updatedItems.every(item => item.completed);
    const updates: any = {
      items: updatedItems,
      updated_at: new Date().toISOString(),
    };

    if (allCompleted && !checklist.completed_at) {
      updates.completed_at = new Date().toISOString();
      updates.status = 'completed';
    } else if (!allCompleted && checklist.completed_at) {
      updates.completed_at = null;
      updates.status = 'in_progress';
    }

    const { error } = await supabase
      .from('commissioning_checklists')
      .update(updates)
      .eq('id', checklistId);

    if (error) {
      console.error('Failed to update checklist:', error);
    } else {
      setChecklists(checklists.map(c =>
        c.id === checklistId ? { ...c, ...updates } : c
      ));
    }
  };

  const addItem = async (checklistId: string) => {
    const checklist = checklists.find(c => c.id === checklistId);
    if (!checklist) return;

    const newItem: ChecklistItem = {
      id: crypto.randomUUID(),
      text: 'New checklist item',
      completed: false,
      notes: '',
    };

    const updatedItems = [...checklist.items, newItem];

    const { error } = await supabase
      .from('commissioning_checklists')
      .update({
        items: updatedItems,
        updated_at: new Date().toISOString(),
      })
      .eq('id', checklistId);

    if (error) {
      console.error('Failed to add item:', error);
    } else {
      setChecklists(checklists.map(c =>
        c.id === checklistId ? { ...c, items: updatedItems } : c
      ));
      setEditingItem(newItem.id);
      setEditText(newItem.text);
    }
  };

  const updateItem = async (checklistId: string, itemId: string) => {
    const checklist = checklists.find(c => c.id === checklistId);
    if (!checklist) return;

    const updatedItems = checklist.items.map(item =>
      item.id === itemId ? { ...item, text: editText } : item
    );

    const { error } = await supabase
      .from('commissioning_checklists')
      .update({
        items: updatedItems,
        updated_at: new Date().toISOString(),
      })
      .eq('id', checklistId);

    if (error) {
      console.error('Failed to update item:', error);
    } else {
      setChecklists(checklists.map(c =>
        c.id === checklistId ? { ...c, items: updatedItems } : c
      ));
      setEditingItem(null);
    }
  };

  const deleteItem = async (checklistId: string, itemId: string) => {
    const checklist = checklists.find(c => c.id === checklistId);
    if (!checklist) return;

    const updatedItems = checklist.items.filter(item => item.id !== itemId);

    const { error } = await supabase
      .from('commissioning_checklists')
      .update({
        items: updatedItems,
        updated_at: new Date().toISOString(),
      })
      .eq('id', checklistId);

    if (error) {
      console.error('Failed to delete item:', error);
    } else {
      setChecklists(checklists.map(c =>
        c.id === checklistId ? { ...c, items: updatedItems } : c
      ));
    }
  };

  const deleteChecklist = async (checklistId: string) => {
    if (!confirm('Are you sure you want to delete this checklist?')) return;

    const { error } = await supabase
      .from('commissioning_checklists')
      .delete()
      .eq('id', checklistId);

    if (error) {
      console.error('Failed to delete checklist:', error);
    } else {
      setChecklists(checklists.filter(c => c.id !== checklistId));
      if (selectedChecklist === checklistId) {
        setSelectedChecklist(null);
      }
    }
  };

  const selected = checklists.find(c => c.id === selectedChecklist);
  const completedCount = selected?.items.filter(i => i.completed).length || 0;
  const totalCount = selected?.items.length || 0;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="min-h-screen bg-goflex-bg">
      <div className="container mx-auto px-4 py-8">
        <button
          onClick={onBack}
          className="mb-6 flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back
        </button>

        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Commissioning Checklist</h1>
                <p className="text-gray-600">Track installation and commissioning tasks</p>
              </div>
              <button
                onClick={() => setIsCreating(true)}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-lg hover:from-indigo-600 hover:to-indigo-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                New Checklist
              </button>
            </div>

            {isCreating && (
              <div className="mb-6 p-6 bg-gray-50 rounded-xl border-2 border-indigo-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Create New Checklist</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Checklist Name
                    </label>
                    <input
                      type="text"
                      value={newChecklistName}
                      onChange={(e) => setNewChecklistName(e.target.value)}
                      placeholder="e.g., Building A Installation"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category/Template
                    </label>
                    <select
                      value={newChecklistCategory}
                      onChange={(e) => setNewChecklistCategory(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      {Object.keys(DEFAULT_TEMPLATES).map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={createChecklist}
                      className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      Create
                    </button>
                    <button
                      onClick={() => setIsCreating(false)}
                      className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-3 gap-6">
              <div className="md:col-span-1">
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Your Checklists</h3>
                {checklists.length === 0 ? (
                  <div className="text-center py-8">
                    <ClipboardCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">No checklists yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {checklists.map(checklist => {
                      const completed = checklist.items.filter(i => i.completed).length;
                      const total = checklist.items.length;
                      return (
                        <div
                          key={checklist.id}
                          onClick={() => setSelectedChecklist(checklist.id)}
                          className={`p-4 rounded-lg cursor-pointer transition-all ${
                            selectedChecklist === checklist.id
                              ? 'bg-indigo-50 border-2 border-indigo-500'
                              : 'bg-white border-2 border-gray-200 hover:border-indigo-300'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-gray-900">{checklist.name}</h4>
                            {checklist.status === 'completed' && (
                              <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mb-2">{checklist.category}</p>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-indigo-600 transition-all"
                                style={{ width: `${(completed / total) * 100}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-600">{completed}/{total}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="md:col-span-2">
                {selected ? (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{selected.name}</h3>
                        <p className="text-sm text-gray-500">{selected.category}</p>
                      </div>
                      <button
                        onClick={() => deleteChecklist(selected.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="mb-6 p-4 bg-gradient-to-r from-indigo-50 to-indigo-100 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-indigo-900">Progress</span>
                        <span className="text-sm font-bold text-indigo-900">{Math.round(progress)}%</span>
                      </div>
                      <div className="h-3 bg-white rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      {selected.items.map(item => (
                        <div
                          key={item.id}
                          className="flex items-start gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:border-indigo-300 transition-colors"
                        >
                          <button
                            onClick={() => toggleItem(selected.id, item.id)}
                            className={`flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                              item.completed
                                ? 'bg-green-500 border-green-500'
                                : 'border-gray-300 hover:border-indigo-500'
                            }`}
                          >
                            {item.completed && <Check className="w-4 h-4 text-white" />}
                          </button>

                          {editingItem === item.id ? (
                            <div className="flex-1 flex gap-2">
                              <input
                                type="text"
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                className="flex-1 px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                autoFocus
                              />
                              <button
                                onClick={() => updateItem(selected.id, item.id)}
                                className="p-1 text-green-600 hover:bg-green-50 rounded"
                              >
                                <Check className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => setEditingItem(null)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded"
                              >
                                <X className="w-5 h-5" />
                              </button>
                            </div>
                          ) : (
                            <>
                              <span className={`flex-1 ${item.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                                {item.text}
                              </span>
                              <button
                                onClick={() => {
                                  setEditingItem(item.id);
                                  setEditText(item.text);
                                }}
                                className="p-1 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => deleteItem(selected.id, item.id)}
                                className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => addItem(selected.id)}
                      className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-indigo-500 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2"
                    >
                      <Plus className="w-5 h-5" />
                      Add Item
                    </button>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Select a checklist to view details</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
