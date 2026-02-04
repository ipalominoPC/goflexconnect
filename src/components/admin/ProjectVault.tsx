import { useState, useMemo, useEffect } from 'react';
import { Search, Database, Trash2, Edit2, Check, X, ExternalLink, User, ChevronDown, ChevronRight, Folder, Building2, Phone, Receipt, LayoutGrid, Clock, Loader2, DollarSign } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { updateProjectHQ, deleteProjectHQ } from '../../services/adminProjectService';
import { supabase } from '../../services/supabaseClient';

export default function ProjectVault({ onSpectate }: { onSpectate: (id: string) => void }) {
  const { projects, setProjects } = useStore();
  const [vaultView, setVaultView] = useState<'assets' | 'quotes'>('assets');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedUsers, setExpandedUsers] = useState<Record<string, boolean>>({});
  
  // Sales Engine State
  const [quotes, setQuotes] = useState<any[]>([]);
  const [loadingQuotes, setLoadingQuotes] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState('');

  useEffect(() => {
    if (vaultView === 'quotes') {
      loadQuotes();
    }
  }, [vaultView]);

  const loadQuotes = async () => {
    setLoadingQuotes(true);
    try {
      const { data, error } = await supabase
        .from('system_quotes')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error) setQuotes(data || []);
    } catch (err) {
      console.error('[SalesEngine] Quote fetch failed', err);
    } finally {
      setLoadingQuotes(false);
    }
  };

  // TASK 4: GLOBAL SEARCH & FILTER (Applied to both Views)
  const groupedProjects = useMemo(() => {
    const query = searchQuery.toLowerCase();
    const filtered = projects.filter(p => {
      return (
        p.name?.toLowerCase().includes(query) ||
        p.user_id?.toLowerCase().includes(query) ||
        (p as any).company_name?.toLowerCase().includes(query) ||
        (p as any).phone_number?.toLowerCase().includes(query) ||
        (p as any).full_name?.toLowerCase().includes(query)
      );
    });

    return filtered.reduce((acc, project) => {
      const userId = project.user_id || 'Unknown_Entity';
      if (!acc[userId]) acc[userId] = [];
      acc[userId].push(project);
      return acc;
    }, {} as Record<string, any[]>);
  }, [projects, searchQuery]);

  const filteredQuotes = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return quotes.filter(q => 
      q.user_email?.toLowerCase().includes(query) ||
      q.subject?.toLowerCase().includes(query) ||
      q.status?.toLowerCase().includes(query)
    );
  }, [quotes, searchQuery]);

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
      {/* VIEW TOGGLE */}
      <div className="flex p-1 bg-black/40 border border-white/5 rounded-2xl">
        <button 
          onClick={() => setVaultView('assets')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
            vaultView === 'assets' ? 'bg-orange-500 text-black shadow-lg' : 'text-slate-500'
          }`}
        >
          <LayoutGrid size={12} /> Asset Tree
        </button>
        <button 
          onClick={() => setVaultView('quotes')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
            vaultView === 'quotes' ? 'bg-green-600 text-white shadow-lg' : 'text-slate-500'
          }`}
        >
          <Receipt size={12} /> Quote Ledger
        </button>
      </div>

      {/* SEARCH BAR */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          placeholder={vaultView === 'assets' ? "Search Assets, Companies, Phone..." : "Search Quotes, Emails, Status..."}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-black/40 border border-white/10 rounded-2xl text-sm text-white placeholder:text-slate-700 focus:border-orange-500/50 outline-none transition-all shadow-inner"
        />
      </div>

      {/* CONDITIONAL CONTENT */}
      {vaultView === 'assets' ? (
        <div className="space-y-4 pb-24">
          {Object.entries(groupedProjects).map(([userId, userProjects]) => {
            const profile = userProjects[0] as any;
            const displayName = profile.full_name || profile.company_name || `Node: ${userId.slice(0, 8)}`;
            const subDetail = profile.company_name && profile.full_name ? profile.company_name : (profile.phone_number || 'Internal Account');

            return (
              <div key={userId} className="space-y-2">
                <button 
                  onClick={() => toggleUser(userId)}
                  className="w-full flex items-center justify-between p-4 bg-white/[0.03] border border-white/5 rounded-2xl hover:bg-white/[0.06] transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${
                      expandedUsers[userId] ? 'bg-orange-500 border-orange-400 text-black' : 'bg-orange-500/10 border-orange-500/30 text-orange-500'
                    }`}>
                       {profile.company_name ? <Building2 size={18} /> : <User size={18} />}
                    </div>
                    <div className="text-left">
                      <p className="text-[11px] font-black text-white uppercase tracking-widest group-hover:text-orange-400 transition-colors">{displayName}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter">{subDetail}</p>
                        <span className="w-1 h-1 rounded-full bg-slate-700" />
                        <p className="text-[8px] font-bold text-orange-500/70 uppercase tracking-tighter">{userProjects.length} Assets</p>
                      </div>
                    </div>
                  </div>
                  {expandedUsers[userId] ? <ChevronDown size={16} className="text-slate-500" /> : <ChevronRight size={16} className="text-orange-500" />}
                </button>

                {expandedUsers[userId] && (
                  <div className="ml-5 pl-5 border-l-2 border-orange-500/20 space-y-2 animate-in slide-in-from-left-2 duration-200">
                    {userProjects.map((project) => (
                      <div key={project.id} className="bg-black/60 border border-white/5 rounded-xl p-4 hover:border-white/10 transition-all">
                        {editingId === project.id ? (
                          <div className="space-y-3">
                            <input 
                              value={editName} 
                              onChange={e => setEditName(e.target.value)}
                              className="w-full bg-black border border-orange-500/40 rounded-lg p-2 text-xs text-white"
                              autoFocus
                            />
                            <div className="flex justify-end gap-2">
                              <button onClick={() => setEditingId(null)} className="p-1 text-slate-500 hover:text-white"><X size={16} /></button>
                              <button onClick={() => handleSave(project.id)} className="p-1 text-green-500 hover:text-green-400"><Check size={16} /></button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs font-bold text-white uppercase tracking-tight">{project.name}</p>
                              <div className="flex items-center gap-2 mt-1">
                                 <p className="text-[7px] font-black text-orange-500 uppercase tracking-[0.2em]">{project.type || 'RF Survey'}</p>
                                 <span className="text-[7px] text-slate-700 font-mono">ID: {project.id.slice(0, 8)}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <button onClick={() => onSpectate(project.id)} className="p-2 text-slate-600 hover:text-[#27AAE1] hover:bg-[#27AAE1]/5 rounded-lg transition-all"><ExternalLink size={16} /></button>
                              <button onClick={() => startEdit(project)} className="p-2 text-slate-600 hover:text-orange-400 hover:bg-orange-400/5 rounded-lg transition-all"><Edit2 size={16} /></button>
                              <button onClick={() => handlePurge(project.id, project.name)} className="p-2 text-slate-600 hover:text-red-500 hover:bg-red-500/5 rounded-lg transition-all"><Trash2 size={16} /></button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* QUOTE LEDGER VIEW (TASK 3) */
        <div className="space-y-3 pb-24">
          {loadingQuotes ? (
            <div className="flex flex-col items-center justify-center py-20 animate-pulse">
               <Loader2 className="text-green-500 animate-spin mb-4" size={24} />
               <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Auditing Sales Pipeline...</p>
            </div>
          ) : filteredQuotes.length > 0 ? (
            filteredQuotes.map((quote) => (
              <div key={quote.id} className="bg-[#0A0F1A] border border-white/5 rounded-2xl p-4 hover:border-green-600/30 transition-all group relative overflow-hidden">
                <div className="flex items-start justify-between relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-green-600/10 border border-green-600/30 flex items-center justify-center text-green-500">
                       <DollarSign size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white uppercase tracking-tight">{quote.subject || 'System Quote'}</h4>
                      <p className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter mt-1 flex items-center gap-2">
                        <Clock size={10} /> {new Date(quote.created_at).toLocaleDateString()}
                        <span className="w-1 h-1 rounded-full bg-slate-700" />
                        {quote.user_email}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-green-500 leading-none">${(quote.quote_amount || 0).toLocaleString()}</p>
                    <span className={`inline-block mt-2 px-2 py-0.5 rounded text-[7px] font-black uppercase tracking-widest border ${
                      quote.status === 'pending_review' ? 'border-orange-500/40 text-orange-500 bg-orange-500/5' : 'border-green-600/40 text-green-500 bg-green-600/5'
                    }`}>
                      {quote.status?.replace('_', ' ') || 'Pending'}
                    </span>
                  </div>
                </div>
                {/* Visual Glow for high-value quotes */}
                {quote.quote_amount > 1000 && (
                  <div className="absolute top-0 right-0 w-16 h-16 bg-green-500/5 blur-2xl rounded-full -translate-y-1/2 translate-x-1/2" />
                )}
              </div>
            ))
          ) : (
            <div className="py-20 text-center opacity-40">
               <Receipt size={40} className="mx-auto text-slate-700 mb-4" />
               <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">No Active Quotes Found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}