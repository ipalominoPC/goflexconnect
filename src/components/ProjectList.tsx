import { useState, useEffect } from 'react';
import { Plus, Folder, ChevronRight, ArrowLeft, RefreshCw, Layout, X, Loader2, Signal, Hammer, ClipboardCheck, Zap, ShieldCheck, Activity } from 'lucide-react';
import { useStore } from '../store/useStore';
import { supabase } from '../services/supabaseClient';

export default function ProjectList({ onSelectProject, onBack }: any) {
  const { projects, setProjects, user, addProject, userRole, measurements } = useStore();
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [newSiteName, setNewSiteName] = useState('');
  const [projectType, setProjectType] = useState<'survey' | 'install' | 'service'>('survey');
  const [isCreating, setIsCreating] = useState(false);

  const isExecutive = userRole === 'Property Manager';

  // HQ NOTIFICATION STATE
  const [projectsWithInstructions, setProjectsWithInstructions] = useState<string[]>([]);

  useEffect(() => {
    async function checkInstructions() {
      if (!user) return;
      const { data } = await supabase
        .from('support_tickets')
        .select('project_id')
        .not('admin_reply', 'is', null)
        .eq('status', 'in-review');
      
      if (data) {
        setProjectsWithInstructions(data.map(d => d.project_id).filter(Boolean) as string[]);
      }
    }

    checkInstructions();

    // REAL-TIME LISTENER: Watch for new HQ Instructions
    const channel = supabase.channel('hq-alerts-tech')
      .on('postgres_changes', { event: '*', table: 'support_tickets' }, () => {
        checkInstructions();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  // PHASE 5.0: BUILDING HEALTH ENGINE
  const calculateHealthScore = (projectId: string) => {
    const siteMs = measurements.filter(m => m.projectId === projectId);
    if (siteMs.length === 0) return null;
    const compliant = siteMs.filter(m => m.rsrp > -105).length;
    return Math.round((compliant / siteMs.length) * 100);
  };

  const handleCreate = async () => {
    if (!newSiteName.trim() || !user) return;
    setIsCreating(true);
    const newP = { id: crypto.randomUUID(), name: newSiteName, type: projectType, user_id: user.id, created_at: new Date().toISOString() };
    try {
      await supabase.from('projects').insert(newP);
      addProject(newP);
      setShowModal(false);
      setNewSiteName('');
      setProjectType('survey');
    } catch (e) { alert("Deployment failed"); }
    finally { setIsCreating(false); }
  };

  const getStatusColor = (type: string) => {
    switch(type) {
      case 'install': return 'text-green-500';
      case 'service': return 'text-orange-500';
      default: return 'text-[#27AAE1]';
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-inter pb-40">
      <div className="fixed top-0 left-0 right-0 h-48 bg-black/90 backdrop-blur-3xl border-b border-white/5 z-[100] px-6 pt-20">
        <div className="flex items-start justify-between mb-6">
           <button onClick={onBack} className="p-2.5 bg-white/5 rounded-2xl text-[#27AAE1] border border-white/10 active:scale-90 transition-all"><ArrowLeft size={24} /></button>
           <button onClick={() => window.location.reload()} className="flex items-center gap-2 bg-black border border-[#27AAE1]/40 text-[#27AAE1] px-4 py-2 rounded-xl font-bold text-[10px] tracking-widest shadow-2xl">
            <RefreshCw size={14} /> RESTORE DATA
           </button>
        </div>
        <div className="flex items-center gap-5">
          <img src="/icons/logo-128.png" className="w-14 h-14 rounded-xl border border-[#27AAE1]/30 shadow-[0_0_25px_rgba(39,170,225,0.3)]" />
          <div>
            <h1 className="text-2xl font-black italic">GoFlexConnect</h1>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.5em]">
              {isExecutive ? 'Portfolio Overview' : 'Command Center'}
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 mt-52">
        {/* EXECUTIVE HUD: Hide creation tools for Property Managers */}
        {!isExecutive && (
          <button onClick={() => setShowModal(true)} className="w-full bg-slate-900/40 border border-white/10 rounded-[1.8rem] p-7 flex items-center justify-between shadow-2xl active:border-[#27AAE1]/50 transition-all mb-10">
            <div className="flex items-center gap-5">
              <div className="p-4 bg-[#27AAE1]/5 rounded-2xl border border-[#27AAE1]/20 shadow-[0_0_15px_rgba(39,170,225,0.1)]">
                <Plus size={28} className="text-[#27AAE1]" strokeWidth={3} />
              </div>
              <div className="text-left">
                <p className="text-xl font-bold text-white tracking-tight">Deploy New Site</p>
                <p className="text-[10px] font-bold text-[#27AAE1] uppercase tracking-widest opacity-40">Initialize Mission</p>
              </div>
            </div>
            <Layout size={20} className="text-slate-800" />
          </button>
        )}

        <div className="space-y-5">
          {projects.map((project) => {
            const hasHqInstruction = projectsWithInstructions.includes(project.id);
            const healthScore = calculateHealthScore(project.id);
            
            return (
              <button 
                key={project.id} 
                onClick={() => onSelectProject(project.id)} 
                className={`w-full bg-slate-900/20 border rounded-[1.8rem] p-7 flex items-center justify-between active:bg-white/5 transition-all shadow-lg ${
                  hasHqInstruction ? 'border-[#27AAE1] shadow-[0_0_25px_rgba(39,170,225,0.1)]' : 'border-white/5'
                }`}
              >
                <div className="flex items-center gap-6">
                  {/* PHASE 5.0: NEXUS HEALTH RING vs FOLDER ICON */}
                  <div className={`w-14 h-14 bg-black rounded-xl flex items-center justify-center border transition-all ${
                    hasHqInstruction ? 'border-[#27AAE1] shadow-[0_0_35px_#27AAE1]' : 'border-[#27AAE1]/60 shadow-[0_0_35px_rgba(39,170,225,0.4)]'
                  }`}>
                    {isExecutive && healthScore !== null ? (
                      <div className="flex flex-col items-center">
                        <span className={`text-[12px] font-black leading-none ${healthScore > 90 ? 'text-green-500' : healthScore > 75 ? 'text-yellow-500' : 'text-red-500'}`}>
                          {healthScore}
                        </span>
                        <span className="text-[6px] font-bold text-slate-500 uppercase mt-0.5 tracking-tighter">Health</span>
                      </div>
                    ) : (
                      <Folder size={24} className="text-[#27AAE1] drop-shadow-[0_0_22px_#27AAE1]" />
                    )}
                  </div>

                  <div className="text-left">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-xl font-bold text-white tracking-tight">{project.name}</p>
                      {hasHqInstruction && (
                        <div className="flex items-center gap-1 bg-[#27AAE1] text-black px-2 py-0.5 rounded-full animate-bounce">
                          <Zap size={10} fill="black" />
                          <span className="text-[8px] font-black uppercase">HQ Uplink</span>
                        </div>
                      )}
                    </div>
                    <p className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 ${getStatusColor(project.type)}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                      {isExecutive ? 'Asset Authenticated' : (project.type || 'Survey')}
                    </p>
                  </div>
                </div>
                <ChevronRight size={22} className={hasHqInstruction ? 'text-[#27AAE1]' : 'text-slate-800'} />
              </button>
            );
          })}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowModal(false)} />
          <div className="relative w-full bg-slate-900 border border-[#27AAE1]/30 rounded-[2.5rem] p-8 shadow-[0_0_60px_rgba(39,170,225,0.2)] animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-8">
               <h2 className="text-xl font-black italic uppercase tracking-tight">Initialize Site</h2>
               <button onClick={() => setShowModal(false)} className="text-slate-500"><X size={24} /></button>
            </div>
            <div className="space-y-6">
              <input autoFocus type="text" value={newSiteName} onChange={(e) => setNewSiteName(e.target.value)} className="w-full bg-black border border-white/10 rounded-2xl p-5 text-lg font-bold text-white outline-none focus:border-[#27AAE1]/50" placeholder="e.g. Gotham Station" />
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'survey', label: 'Survey', icon: Signal, color: 'text-[#27AAE1]' },
                  { id: 'install', label: 'Install', icon: Hammer, color: 'text-green-500' },
                  { id: 'service', label: 'Service', icon: ClipboardCheck, color: 'text-orange-500' }
                ].map((t) => (
                  <button key={t.id} onClick={() => setProjectType(t.id as any)} className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${projectType === t.id ? 'bg-white/10 border-white/40' : 'bg-black/40 border-white/5 opacity-40'}`}>
                    <t.icon size={18} className={t.color} />
                    <span className="text-[8px] font-black uppercase">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <button disabled={isCreating || !newSiteName} onClick={handleCreate} className="w-full py-5 bg-[#27AAE1] text-black rounded-2xl font-black uppercase tracking-widest mt-8 flex items-center justify-center gap-3">
              {isCreating ? <Loader2 className="animate-spin" /> : 'Confirm Deployment'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

npm run build; npx cap sync android; cd android; ./gradlew assembleDebug; cd ..; git add .; git commit -m "🚀 PHASE 5.0: Nexus Executive Portfolio List & Health Index"; git push origin main; & "C:\Users\GFC\AppData\Local\Android\Sdk\platform-tools\adb.exe" install -r android/app/build/outputs/apk/debug/app-debug.apk