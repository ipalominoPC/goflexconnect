import { useState, useEffect } from 'react';
import MobileBottomNav from './components/MobileBottomNav';
import { useStore } from './store/useStore';
import { supabase } from './services/supabaseClient';
import { offlineStorage } from './services/offlineStorage';
import BillingPhaseNoticeBanner from './components/BillingPhaseNoticeBanner';
import Auth from './components/Auth';
import SplashScreen from './components/SplashScreen';
import Onboarding from './components/Onboarding';
import Menu from './components/Menu';
import ProjectList from './components/ProjectList';
import ProjectDetail from './components/ProjectDetail';
import SpeedTest from './components/SpeedTest';
import Settings from './components/Settings';
import Diagnostics from './components/Diagnostics';
import ThankYouPage from './components/ThankYouPage';
import AdminDashboard from './pages/AdminDashboard';
import AdminRouteGuard from './components/AdminRouteGuard';
import { Landing } from './pages/Landing';
import { saveSpeedTest } from './services/supabaseClient';
import AppLayout from './components/AppLayout';
import FlexBot from './components/chat/FlexBot';
import OnlineStatus from './components/OnlineStatus';
import SurveyMode from './components/SurveyMode';
import HeatmapView from './components/HeatmapView';
import CellTowerCompass from './components/CellTowerCompass';
import { AlertCircle, ShieldAlert, Info, X } from 'lucide-react';

type View =
  | { type: 'landing' } | { type: 'auth' } | { type: 'splash' } | { type: 'onboarding' } | { type: 'menu' }
  | { type: 'projectList' } | { type: 'projectDetail'; projectId: string }
  | { type: 'survey'; projectId: string; floorId: string }
  | { type: 'heatmap'; projectId: string }
  | { type: 'admin' } | { type: 'settings' } | { type: 'speedTest' } | { type: 'thankYou' } | { type: 'diagnostics' }
  | { type: 'cellTowerCompass' };

function App() {
  const user = useStore((state) => state.user);
  const isAdmin = useStore((state) => state.isAdmin);
  const setUser = useStore((state) => state.setUser);
  const setProjects = useStore((state) => state.setProjects);
  // MISSION ALERT STATE
  const systemAnnouncement = useStore((state) => state.systemAnnouncement);
  const setSystemAnnouncement = useStore((state) => state.setSystemAnnouncement);

  const [currentView, setCurrentView] = useState<View>({ type: 'landing' });
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    async function initializeApp() {
      try { await offlineStorage.init(); } catch (e) {}
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setAuthChecked(true);
    }
    initializeApp();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setCurrentView({ type: 'auth' });
        useStore.getState().clearUserData();
      }
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, [setUser]);

  // MISSION CONTROL: Data Fetching (Admin vs User)
  useEffect(() => {
    async function loadProjects() {
      if (!user?.id) return;
      try {
        let query = supabase.from('projects').select('*');
        
        // ADMIN BYPASS: If Isaac/Admin, fetch global project stack
        if (!isAdmin) {
          query = query.eq('user_id', user.id);
        }
        
        const { data: projects, error } = await query;
        if (!error && projects) setProjects(projects);
      } catch (err) { console.error('Failed to load projects:', err); }
    }
    loadProjects();
  }, [user?.id, isAdmin, setProjects]);

  // GLOBAL ANNOUNCEMENT REALTIME LISTENER
  useEffect(() => {
    const MASTER_ID = '00000000-0000-0000-0000-000000000001';

    // 1. Initial Fetch
    const getInitialAnnouncement = async () => {
      const { data } = await supabase
        .from('system_announcements')
        .select('*')
        .eq('id', MASTER_ID)
        .single();
      if (data) setSystemAnnouncement(data);
    };
    getInitialAnnouncement();

    // 2. Realtime Subscription
    const channel = supabase.channel('global-alerts')
      .on('postgres_changes', { 
        event: 'UPDATE', 
        table: 'system_announcements', 
        schema: 'public',
        filter: `id=eq.${MASTER_ID}`
      }, (payload) => {
        setSystemAnnouncement(payload.new as any);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [setSystemAnnouncement]);

  // VERIFIER: Shows system version during boot
  if (!authChecked) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
      <div className="text-[#27AAE1] font-bold tracking-[0.3em] animate-pulse italic">GOFLEXCONNECT</div>
      <div className="text-[8px] text-slate-700 font-black uppercase tracking-widest">Truth System v4.4.1</div>
    </div>
  );

  if (currentView.type === 'landing') return <Landing onGetAccess={() => setCurrentView({ type: 'auth' })} onLogIn={() => setCurrentView({ type: 'auth' })} />;
  if (currentView.type === 'auth') return <Auth onAuthSuccess={() => setCurrentView({ type: 'splash' })} />;
  if (!user) return <Landing onGetAccess={() => setCurrentView({ type: 'auth' })} onLogIn={() => setCurrentView({ type: 'auth' })} />;
  if (currentView.type === 'splash') return <SplashScreen onComplete={() => setCurrentView(useStore.getState().hasCompletedOnboarding ? { type: 'menu' } : { type: 'onboarding' })} />;
  if (currentView.type === 'onboarding') return <Onboarding onComplete={() => setCurrentView({ type: 'menu' })} />;

  const handleNavigation = (view: string) => {
    if (view === 'projects') setCurrentView({ type: 'projectList' });
    else setCurrentView({ type: view as any });
  };

  const getAnnouncementStyle = (type: string) => {
    switch(type) {
      case 'critical': return 'bg-red-600/20 border-red-500/50 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.2)]';
      case 'warning': return 'bg-orange-600/20 border-orange-500/50 text-orange-400 shadow-[0_0_20px_rgba(249,115,22,0.2)]';
      default: return 'bg-[#27AAE1]/10 border-[#27AAE1]/30 text-[#27AAE1] shadow-[0_0_20px_rgba(39,170,225,0.1)]';
    }
  };

  return (
    <AppLayout showBottomNav={['menu', 'projectList', 'speedTest', 'settings', 'admin', 'cellTowerCompass'].includes(currentView.type)}>
      
      {/* GLOBAL SYSTEM ANNOUNCEMENT BANNER */}
      {systemAnnouncement?.is_active && (
        <div className={`w-full px-6 py-3 border-b backdrop-blur-md flex items-center gap-4 animate-in slide-in-from-top duration-500 sticky top-0 z-[2000] ${getAnnouncementStyle(systemAnnouncement.type)}`}>
           <div className="shrink-0">
              {systemAnnouncement.type === 'critical' ? <ShieldAlert size={18} /> : systemAnnouncement.type === 'warning' ? <AlertCircle size={18} /> : <Info size={18} />}
           </div>
           <p className="text-[10px] font-black uppercase tracking-widest leading-tight flex-1">
              {systemAnnouncement.message}
           </p>
           {isAdmin && (
             <button onClick={() => setSystemAnnouncement({ ...systemAnnouncement, is_active: false })} className="p-1 hover:opacity-50 transition-opacity">
                <X size={14} />
             </button>
           )}
        </div>
      )}

      <div className="pt-2"><OnlineStatus /></div>
      <FlexBot />
      {user && <BillingPhaseNoticeBanner />}

      <div className="pt-4">
        {currentView.type === 'menu' && <Menu onSelectFeature={(f: any) => handleNavigation(f)} onSettings={() => setCurrentView({ type: 'settings' })} onFinish={() => setCurrentView({ type: 'thankYou' })} />}
        
        {currentView.type === 'projectList' && (
          <ProjectList 
            onSelectProject={(id: string) => setCurrentView({ type: 'projectDetail', projectId: id })} 
            onBack={() => setCurrentView({ type: 'menu' })} 
          />
        )}

        {currentView.type === 'projectDetail' && (
          <ProjectDetail
            projectId={currentView.projectId}
            onBack={() => setCurrentView({ type: 'projectList' })}
            onStartSurvey={(floorId: string) => setCurrentView({ type: 'survey', projectId: currentView.projectId, floorId })}
            onViewHeatmap={() => setCurrentView({ type: 'heatmap', projectId: currentView.projectId })}
          />
        )}

        {currentView.type === 'survey' && <SurveyMode projectId={currentView.projectId} floorId={currentView.floorId} onBack={() => setCurrentView({ type: 'projectDetail', projectId: currentView.projectId })} />}
        {currentView.type === 'heatmap' && <HeatmapView projectId={currentView.projectId} onBack={() => setCurrentView({ type: 'projectDetail', projectId: currentView.projectId })} />}
        
        {currentView.type === 'cellTowerCompass' && <CellTowerCompass onBack={() => setCurrentView({ type: 'menu' })} />}
        
        {currentView.type === 'admin' && (
          <AdminRouteGuard onUnauthorized={() => setCurrentView({ type: 'menu' })}>
            <AdminDashboard 
              onBack={() => setCurrentView({ type: 'menu' })} 
              onViewProject={(id: string) => console.log('[Truth] Internal selection handled by Dashboard')} 
            />
          </AdminRouteGuard>
        )}

        {currentView.type === 'settings' && <Settings onBack={() => setCurrentView({ type: 'menu' })} onShowDiagnostics={() => setCurrentView({ type: 'diagnostics' })} onNavigateToAdmin={() => setCurrentView({ type: 'admin' })} />}
        {currentView.type === 'speedTest' && <SpeedTest onBack={() => setCurrentView({ type: 'menu' })} onSaveResult={saveSpeedTest} />}
        {currentView.type === 'diagnostics' && <Diagnostics onBack={() => setCurrentView({ type: 'settings' })} />}
        {currentView.type === 'thankYou' && <ThankYouPage onBack={() => setCurrentView({ type: 'menu' })} />}
      </div>

      <MobileBottomNav currentView={currentView.type === 'projectList' ? 'projects' : currentView.type} onNavigate={handleNavigation} />
    </AppLayout>
  );
}
export default App;