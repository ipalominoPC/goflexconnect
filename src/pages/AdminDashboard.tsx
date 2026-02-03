import { useState, useEffect } from 'react';
import { ArrowLeft, Users, Radio, LifeBuoy, Bot, Zap, RefreshCw, Activity, Play, AlertCircle, Wifi, Clock, ShieldAlert, BarChart3, Maximize2, Loader2, ShieldCheck, CheckCircle2, UserPlus, Globe, LayoutGrid, Database, Megaphone, Send, Power } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { fetchAdminSummaryStats } from '../services/adminMetrics';
import { useStore } from '../store/useStore';
import { injectSimulationTicket } from '../services/adminSupportService'; 
import AdminSupportInbox from '../components/admin/AdminSupportInbox';
import FleetDirectory from '../components/admin/FleetDirectory'; 
import ProjectVault from '../components/admin/ProjectVault'; 
import LiveSparkline from '../components/admin/LiveSparkline';
import ProjectDetail from '../components/ProjectDetail'; 

export default function AdminDashboard({ onBack }: any) {
  const { user, isAdmin, projects } = useStore();
  const [summaryStats, setSummaryStats] = useState<any>(null);
  const [liveTelemetry, setLiveTelemetry] = useState<Record<string, number[]>>({});
  const [loading, setLoading] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [connStatus, setConnStatus] = useState<'Linked' | 'Offline'>('Offline');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [activeTab, setActiveTab] = useState<'remediation' | 'fleet' | 'vault'>('remediation');

  const [activityFeed, setActivityFeed] = useState<any[]>([]);
  const [notification, setNotification] = useState<{show: boolean, msg: string, type: 'success' | 'error'}>({
    show: false, msg: '', type: 'success'
  });

  // BROADCAST CONSOLE STATE
  const [bcMessage, setBcMessage] = useState('');
  const [bcType, setBcType] = useState<'info' | 'warning' | 'critical'>('info');
  const [bcActive, setBcActive] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  useEffect(() => {
    loadMissionControlData();
    loadCurrentAnnouncement();
    
    const radarChannel = supabase.channel('mission-radar-v4')
      .on('postgres_changes', { event: 'INSERT', table: 'measurements', schema: 'public' }, (payload) => {
        const newPing = payload?.new;
        if (newPing?.user_id && typeof newPing?.rsrp === 'number') {
          // Task 2: Resolve Project Context for HQ Feed
          const proj = projects?.find(p => p.id === newPing.project_id);
          const location = proj ? proj.name : `Site ${newPing.project_id?.slice(0,4) || 'Unknown'}`;

          setLiveTelemetry(prev => {
            const isFirstPing = !prev[newPing.user_id] || prev[newPing.user_id].length === 0;
            if (isFirstPing) {
               triggerNotify(`NODE ACTIVE: ${location}`, 'success');
            }
            return {
              ...prev,
              [newPing.user_id]: [...(prev[newPing.user_id] || []), newPing.rsrp].slice(-20)
            };
          });
          
          addActivityLog('USAGE', `Signal Uplink: ${location} (${newPing.rsrp} dBm)`);
        }
      })
      .subscribe();

    const userChannel = supabase.channel('user-growth')
      .on('postgres_changes', { event: 'INSERT', table: 'profiles', schema: 'public' }, (payload) => {
        const newUser = payload.new;
        triggerNotify(`NEW USER: ${newUser.email || 'Anonymous'}`, 'success');
        addActivityLog('NEW_USER', `Account Created: ${newUser.email || 'Unknown'}`);
        setRefreshTrigger(p => p + 1);
      })
      .subscribe();
      
    setConnStatus('Linked');
    return () => { 
      supabase.removeChannel(radarChannel); 
      supabase.removeChannel(userChannel);
    };
  }, [refreshTrigger, projects]);

  const loadCurrentAnnouncement = async () => {
    const { data } = await supabase.from('system_announcements').select('*').eq('id', '00000000-0000-0000-0000-000000000001').single();
    if (data) {
      setBcMessage(data.message);
      setBcType(data.type);
      setBcActive(data.is_active);
    }
  };

  const handleUpdateBroadcast = async (shouldBeActive: boolean) => {
    setIsBroadcasting(true);
    try {
      const { error } = await supabase.from('system_announcements').update({
        message: bcMessage,
        type: bcType,
        is_active: shouldBeActive,
        updated_at: new Date().toISOString()
      }).eq('id', '00000000-0000-0000-0000-000000000001');

      if (!error) {
        setBcActive(shouldBeActive);
        triggerNotify(shouldBeActive ? 'BROADCAST LIVE' : 'BROADCAST TERMINATED', 'success');
      }
    } catch (e) {
      triggerNotify('BROADCAST FAILED', 'error');
    } finally {
      setIsBroadcasting(false);
    }
  };

  const addActivityLog = (type: 'USAGE' | 'NEW_USER' | 'SIMULATION', message: string) => {
    setActivityFeed(prev => [{ id: Math.random(), type, message, time: new Date() }, ...prev].slice(0, 15));
  };

  const loadMissionControlData = async () => {
    setLoading(true);
    const stats = await fetchAdminSummaryStats().catch(() => null);
    setSummaryStats(stats || {});
    setLoading(false);
  };

  const triggerNotify = (msg: string, type: 'success' | 'error' = 'success') => {
    setNotification({ show: true, msg, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 4000);
  };

  const handleSimulationUplink = async () => {
    if (!user?.id || !user?.email) return;
    setIsSimulating(true);
    try {
      await injectSimulationTicket(user.id, user.email);
      setRefreshTrigger(prev => prev + 1);
      triggerNotify('SIMULATION DATA INJECTED', 'success');
      addActivityLog('SIMULATION', 'Mock node injected by HQ.');
    } catch (e: any) {
      triggerNotify(e.message.toUpperCase(), 'error');
    } finally {
      setTimeout(() => setIsSimulating(false), 500);
    }
  };

  return (
    <div className="min-h-screen bg-[#05070A] text-white font-sans flex flex-col selection:bg-[#27AAE1]/30">
      
      {/* NOTIFICATION HUD */}
      <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-[5000] transition-all duration-500 transform ${notification.show ? 'translate-y-0 opacity-100' : '-translate-y-12 opacity-0 pointer-events-none'}`}>
        <div className={`px-6 py-3 rounded-2xl border backdrop-blur-2xl shadow-2xl flex items-center gap-3 ${
          notification.type === 'success' ? 'border-[#27AAE1]/40 bg-[#27AAE1]/10' : 'border-red-500/40 bg-red-500/10'
        }`}>
          {notification.type === 'success' ? <UserPlus className="text-[#27AAE1]" size={18} /> : <AlertCircle className="text-red-500" size={18} />}
          <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${notification.type === 'success' ? 'text-[#27AAE1]' : 'text-red-500'}`}>
            {notification.msg}
          </span>
        </div>
      </div>

      {/* HEADER */}
      <div className="h-20 border-b border-white/10 bg-black/80 backdrop-blur-xl px-6 flex items-center justify-between sticky top-0 z-[1002] shrink-0">
        <div className="flex items-center gap-6">
          <button onClick={onBack} className="p-2 text-slate-500 hover:text-[#27AAE1] transition-all"><ArrowLeft size={24} /></button>
          <div>
            <h2 className="text-[9px] font-black text-[#27AAE1] mb-0.5 tracking-[0.3em] uppercase leading-none">Truth Engine v4.5</h2>
            <h1 className="text-sm font-bold text-white tracking-tight" style={{ textTransform: 'none' }}>Command Center HQ</h1>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-[#27AAE1]/5`}>
            <div className={`w-1.5 h-1.5 rounded-full bg-[#27AAE1] animate-pulse shadow-[0_0_8px_#22c55e]`} />
            <span className="text-[9px] font-black text-[#27AAE1] uppercase tracking-tighter">Live</span>
          </div>
          <button onClick={() => setRefreshTrigger(p => p+1)} className={`p-2 text-slate-500 ${loading ? 'animate-spin' : ''}`}><RefreshCw size={18} /></button>
        </div>
      </div>

      {/* MAIN CONTAINER: Natural Scroll for Mobile, Locked for Desktop */}
      <div className="flex-1 flex flex-col lg:flex-row lg:h-[calc(100vh-80px)] lg:overflow-hidden">
        
        {/* RIGHT PANE: MISSION SPECTATOR & RADAR */}
        <div className="w-full lg:flex-1 lg:order-2 bg-[#080A0F] relative p-4 lg:p-8 flex flex-col gap-6 lg:overflow-y-auto">
          {selectedProjectId ? (
            <div className="w-full flex flex-col relative animate-in fade-in zoom-in-95 min-h-[600px]">
               <div className="absolute top-4 right-4 z-[1001]">
                  <button onClick={() => setSelectedProjectId(null)} className="px-4 py-2 bg-red-600/20 border-2 border-red-600/40 rounded-xl text-red-500 text-[10px] font-black uppercase tracking-widest hover:bg-red-600/30 transition-all shadow-xl backdrop-blur-md">Exit Spectator</button>
               </div>
               <ProjectDetail projectId={selectedProjectId} onBack={() => setSelectedProjectId(null)} />
            </div>
          ) : (
            <div className="w-full flex flex-col gap-6">
              <div className="bg-[#0A0F1A] border-2 border-[#27AAE1]/30 rounded-[2rem] p-6 lg:p-10 shadow-2xl relative overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
                  <div className="flex items-center gap-4">
                    <Activity className="text-[#27AAE1] animate-pulse" size={24} />
                    <div>
                        <h2 className="text-lg font-bold text-white" style={{ textTransform: 'none' }}>Live Signal Radar</h2>
                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">S24 Field Nodes</p>
                    </div>
                  </div>
                  <button onClick={handleSimulationUplink} disabled={isSimulating} className="px-6 py-3 bg-purple-600 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg active:scale-95 transition-all">
                    {isSimulating ? <Loader2 className="animate-spin" size={14} /> : <Zap size={14} fill="white" />} Inject Simulation
                  </button>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mt-8 relative z-10">
                  {Object.entries(liveTelemetry).map(([id, pings]) => (
                    <div key={id} className="bg-black/60 border border-white/5 rounded-2xl p-6 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-[9px] font-black text-[#27AAE1] uppercase mb-1">Node: {id.slice(0, 6)}</p>
                        <p className="text-4xl font-black text-white leading-none tabular-nums">{pings[pings.length - 1]}<span className="text-xs text-slate-500 ml-1">dBm</span></p>
                      </div>
                      <div className="flex-1 h-12 max-w-[50%]"><LiveSparkline data={pings} /></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* LEFT PANE: PORTAL RAIL */}
        <div className="w-full lg:w-[500px] border-t lg:border-t-0 lg:border-r border-white/10 flex flex-col bg-black/40 shrink-0">
          
          {/* TABS */}
          <div className="p-4 bg-black/60 border-b border-white/5 flex gap-2 sticky top-20 lg:static z-[1001]">
             <button 
               onClick={() => setActiveTab('remediation')}
               className={`flex-1 min-w-[100px] flex items-center justify-center gap-2 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                 activeTab === 'remediation' ? 'bg-[#27AAE1] text-black shadow-[0_0_10px_#27AAE1]' : 'bg-white/5 text-slate-500'
               }`}
             >
                <ShieldAlert size={12} /> REMED
             </button>
             <button 
               onClick={() => setActiveTab('fleet')}
               className={`flex-1 min-w-[100px] flex items-center justify-center gap-2 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                 activeTab === 'fleet' ? 'bg-purple-600 text-white shadow-[0_0_10px_#A855F7]' : 'bg-white/5 text-slate-500'
               }`}
             >
                <Users size={12} /> FLEET
             </button>
             <button 
               onClick={() => setActiveTab('vault')}
               className={`flex-1 min-w-[100px] flex items-center justify-center gap-2 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                 activeTab === 'vault' ? 'bg-orange-500 text-black shadow-[0_0_10px_#F97316]' : 'bg-white/5 text-slate-500'
               }`}
             >
                <Database size={12} /> VAULT
             </button>
          </div>

          {/* TAB CONTENT: Scrollable internally on Desktop, natural on mobile */}
          <div className="flex-1 flex flex-col lg:overflow-y-auto scrollbar-hide">
            {activeTab === 'remediation' && (
              <div className="flex flex-col">
                {/* GLOBAL BROADCAST HUB (NEW) */}
                <div className="p-6 border-b border-white/10 bg-[#27AAE1]/5">
                   <h3 className="text-[10px] font-black text-[#27AAE1] uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                      <Megaphone size={12} /> Fleet Broadcast Hub
                   </h3>
                   <div className="space-y-3">
                      <textarea 
                        value={bcMessage}
                        onChange={(e) => setBcMessage(e.target.value)}
                        placeholder="Fleet-wide message..."
                        className="w-full h-16 bg-black/50 border border-white/10 rounded-xl p-3 text-[11px] text-white placeholder:text-slate-700 outline-none focus:border-[#27AAE1]/40"
                      />
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex gap-1">
                          {(['info', 'warning', 'critical'] as const).map(type => (
                            <button 
                              key={type}
                              onClick={() => setBcType(type)}
                              className={`px-2 py-1 rounded text-[8px] font-black uppercase tracking-tighter border transition-all ${
                                bcType === type 
                                ? 'bg-white/10 border-[#27AAE1] text-[#27AAE1]' 
                                : 'bg-black border-white/5 text-slate-600'
                              }`}
                            >
                              {type}
                            </button>
                          ))}
                        </div>
                        <div className="flex gap-2">
                           <button 
                             onClick={() => handleUpdateBroadcast(!bcActive)}
                             disabled={isBroadcasting}
                             className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${
                               bcActive 
                               ? 'bg-red-600/20 text-red-500 border border-red-600/40 shadow-[0_0_10px_rgba(220,38,38,0.2)]' 
                               : 'bg-[#27AAE1] text-black shadow-[0_0_10px_#27AAE1]'
                             }`}
                           >
                             {isBroadcasting ? <Loader2 size={12} className="animate-spin" /> : bcActive ? <Power size={12} /> : <Send size={12} />}
                             {bcActive ? 'Kill Alert' : 'Broadcast'}
                           </button>
                        </div>
                      </div>
                   </div>
                </div>

                <div className="p-6 border-b border-white/5 flex flex-col bg-white/[0.01]">
                   <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                      <Globe size={12} className="text-[#27AAE1]" /> Network Activity
                   </h3>
                   <div className="space-y-2 max-h-32 overflow-y-auto scrollbar-hide">
                      {activityFeed.map(log => (
                        <div key={log.id} className="flex items-start gap-3 animate-in slide-in-from-left-2">
                           <div className={`mt-1.5 w-1 h-1 rounded-full shrink-0 ${log.type === 'NEW_USER' ? 'bg-green-500' : 'bg-[#27AAE1]'}`} />
                           <p className="text-[10px] text-slate-300">
                              <span className="text-slate-600 font-mono mr-2">{log.time.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                              {log.message}
                           </p>
                        </div>
                      ))}
                   </div>
                </div>
                <div className="p-4 pb-20 lg:pb-4">
                   <AdminSupportInbox key={refreshTrigger} onViewProject={(id) => setSelectedProjectId(id)} />
                </div>
              </div>
            )}
            
            {activeTab === 'fleet' && (
              <div className="p-6 pb-20 lg:pb-4">
                 <FleetDirectory />
              </div>
            )}

            {activeTab === 'vault' && (
              <div className="p-6 pb-20 lg:pb-4">
                 <ProjectVault onSpectate={(id) => setSelectedProjectId(id)} />
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}