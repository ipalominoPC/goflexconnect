import { useState, useMemo } from 'react';
import { Search, Database, Trash2, Edit2, Check, X, ExternalLink, User, ChevronDown, ChevronRight, Folder } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { updateProjectHQ, deleteProjectHQ } from '../../services/adminProjectService';

export default function ProjectVault({ onSpectate }: { onSpectate: (id: string) => void }) {
  const { projects, setProjects } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedUsers, setExpandedUsers] = useState<Record<string, boolean>>({});
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState('');

  // TESLA-STYLE GROUPING LOGIC
  const groupedProjects = useMemo(() => {
    const filtered = projects.filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.user_id?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return filtered.reduce((acc, project) => {
      const userId = project.user_id || 'Unknown_Entity';
      if (!acc[userId]) acc[userId] = [];
      acc[userId].push(project);
      return acc;
    }, {} as Record<string, any[]>);
  }, [projects, searchQuery]);

  const toggleUser = (userId: string) => {
    setExpandedUsers(prev => ({ ...prev, [userId]: !prev[userId] }));
  };

  const startEdit = (project: any) => {
    setEditingId(project.id);
    setEditName(project.name);
    setEditType(project.type || 'survey');
  };

  const handleSave = async (id: string) => {
    const { success } = await updateProjectHQ(id, { name: editName, type: editType });
    if (success) {
      setProjects(projects.map(p => p.id === id ? { ...p, name: editName, type: editType } : p));
      setEditingId(null);
    }
  };

  const handlePurge = async (id: string, name: string) => {
    if (!window.confirm(`MASTER PURGE: Permanently erase ${name}?`)) return;
    const { success } = await deleteProjectHQ(id);
    if (success) {
      setProjects(projects.filter(p => p.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      {/* SEARCH BAR - STATIC AT TOP */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          placeholder="Pinpoint Tech or Project..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-black/40 border border-orange-500/20 rounded-2xl text-sm text-white placeholder:text-slate-700 focus:border-orange-500/50 outline-none transition-all"
        />
      </div>

      {/* PROJECT TREE - REMOVED INTERNAL OVERFLOW TO FIX S24 SCROLLING */}
      <div className="space-y-4 pb-24">
        {Object.entries(groupedProjects).map(([userId, userProjects]) => (
          <div key={userId} className="space-y-2">
            
            {/* USER ENTITY HEADER */}
            <button 
              onClick={() => toggleUser(userId)}
              className="w-full flex items-center justify-between p-4 bg-white/[0.03] border border-white/5 rounded-2xl hover:bg-white/[0.06] transition-all"
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all ${
                  expandedUsers[userId] ? 'bg-orange-500 border-orange-400 text-black' : 'bg-orange-500/10 border-orange-500/30 text-orange-500'
                }`}>
                   <User size={16} />
                </div>
                <div className="text-left">
                  <p className="text-[11px] font-black text-white uppercase tracking-widest">
                    {userId.slice(0, 8)}... (Assets)
                  </p>
                  <p className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter">{userProjects.length} Managed Missions</p>
                </div>
              </div>
              {expandedUsers[userId] ? <ChevronDown size={16} className="text-slate-500" /> : <ChevronRight size={16} className="text-orange-500" />}
            </button>

            {/* NESTED PROJECTS */}
            {expandedUsers[userId] && (
              <div className="ml-4 pl-4 border-l border-white/10 space-y-2 animate-in slide-in-from-left-2 duration-200">
                {userProjects.map((project) => (
                  <div key={project.id} className="bg-black/40 border border-white/5 rounded-xl p-4 transition-all">
                    {editingId === project.id ? (
                      <div className="space-y-3">
                        <input 
                          value={editName} 
                          onChange={e => setEditName(e.target.value)}
                          className="w-full bg-black border border-orange-500/40 rounded-lg p-2 text-xs text-white"
                        />
                        <div className="flex justify-end gap-2">
                          <button onClick={() => setEditingId(null)} className="p-1 text-slate-500"><X size={16} /></button>
                          <button onClick={() => handleSave(project.id)} className="p-1 text-green-500"><Check size={16} /></button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-white uppercase">{project.name}</p>
                          <p className="text-[7px] font-black text-orange-500 uppercase mt-1 tracking-widest">{project.type || 'RF Survey'}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => onSpectate(project.id)} className="p-2 text-slate-600 hover:text-[#27AAE1]"><ExternalLink size={16} /></button>
                          <button onClick={() => startEdit(project)} className="p-2 text-slate-600 hover:text-orange-400"><Edit2 size={16} /></button>
                          <button onClick={() => handlePurge(project.id, project.name)} className="p-2 text-slate-600 hover:text-red-500"><Trash2 size={16} /></button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {Object.keys(groupedProjects).length === 0 && (
          <div className="py-20 text-center opacity-40">
             <Database size={40} className="mx-auto text-slate-700 mb-4" />
             <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">No Mission Data Nodes Found</p>
          </div>
        )}
      </div>
    </div>
  );
}