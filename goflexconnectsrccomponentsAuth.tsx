[1mdiff --git a/src/App.tsx b/src/App.tsx[m
[1mindex 49c09b3..3fb0e2b 100644[m
[1m--- a/src/App.tsx[m
[1m+++ b/src/App.tsx[m
[36m@@ -33,8 +33,9 @@[m
  *    - Check console for test results[m
  */[m
 [m
[31m-import { useState, useEffect } from 'react';[m
[32m+[m[32mimport { useState, useEffect, useRef } from 'react';[m
 import { Settings as SettingsIcon } from 'lucide-react';[m
[32m+[m[32mimport MobileBottomNav from './components/MobileBottomNav';[m
 import { useStore } from './store/useStore';[m
 import { supabase } from './services/supabaseClient';[m
 import { offlineStorage } from './services/offlineStorage';[m
[36m@@ -55,6 +56,7 @@[m [mimport FloorDetail from './components/FloorDetail';[m
 import FloorPlanUpload from './components/FloorPlanUpload';[m
 import FloorPlanUploadForFloor from './components/FloorPlanUploadForFloor';[m
 import SurveyMode from './components/SurveyMode';[m
[32m+[m[32mimport LiveSurveyMode from './components/LiveSurveyMode';[m
 import HeatmapView from './components/HeatmapView';[m
 import SpeedTest from './components/SpeedTest';[m
 import Settings from './components/Settings';[m
[36m@@ -73,12 +75,15 @@[m [mimport Analytics from './pages/Analytics';[m
 import Reports from './pages/Reports';[m
 import AdminDashboard from './pages/AdminDashboard';[m
 import SelfTestConsole from './pages/SelfTestConsole';[m
[32m+[m[32mimport TestSupportSystem from './pages/TestSupportSystem';[m
 import AdminRouteGuard from './components/AdminRouteGuard';[m
 import { Landing } from './pages/Landing';[m
[32m+[m[32mimport MyTickets from './components/MyTickets';[m
 import FloorHeatmapPage from './pages/FloorHeatmapPage';[m
 import SurveyReportPage from './pages/SurveyReportPage';[m
 import InstallReportPage from './pages/InstallReportPage';[m
 import { saveSpeedTest } from './services/supabaseClient';[m
[32m+[m[32mimport AppLayout from './components/AppLayout';[m
 [m
 type View =[m
   | { type: 'landing' }[m
[36m@@ -109,7 +114,9 @@[m [mtype View =[m
   | { type: 'analytics' }[m
   | { type: 'reports' }[m
   | { type: 'admin' }[m
[32m+[m[32m  | { type: 'myTickets' }[m
   | { type: 'selfTest' }[m
[32m+[m[32m  | { type: 'testSupport' }[m
   | { type: 'settings' }[m
   | { type: 'diagnostics' }[m
   | { type: 'thankYou' }[m
[36m@@ -123,6 +130,7 @@[m [mfunction App() {[m
   const hasCompletedOnboarding = useStore((state) => state.hasCompletedOnboarding);[m
   const [currentView, setCurrentView] = useState<View>({ type: 'landing' });[m
   const [authChecked, setAuthChecked] = useState(false);[m
[32m+[m[32m  const onboardingNavigatedRef = useRef(false);[m
 [m
   // Inactivity timer configuration[m
   const sessionTimeoutMs = (settings.sessionTimeoutMinutes || 30) * 60 * 1000;[m
[36m@@ -137,80 +145,123 @@[m [mfunction App() {[m
     onLogout: async () => {[m
       console.log('[Inactivity] Auto-logout due to inactivity');[m
       await supabase.auth.signOut();[m
[31m-      setCurrentView({ type: 'auth' });[m
[32m+[m[32m      window.location.href = '/';[m
[32m+[m[32m      setTimeout(() => {[m
[32m+[m[32m        window.location.href = '/';[m
[32m+[m[32m      }, 1000);[m
     },[m
     enabled: !!user, // Only enable when user is logged in[m
   });[m
 [m
   useEffect(() => {[m
[31m-    offlineStorage.init().then(() => {[m
[31m-      offlineStorage.clearAllPendingSync();[m
[31m-    });[m
[32m+[m[32m    let isMounted = true;[m
[32m+[m
[32m+[m[32m    async function initializeApp() {[m
[32m+[m[32m      try {[m
[32m+[m[32m        await offlineStorage.init();[m
[32m+[m[32m        await offlineStorage.clearAllPendingSync();[m
[32m+[m[32m      } catch (error) {[m
[32m+[m[32m        console.error('[App] Failed to init offline storage:', error);[m
[32m+[m[32m      }[m
[32m+[m
[32m+[m[32m      try {[m
[32m+[m[32m        const { data: { session }, error } = await supabase.auth.getSession();[m
[32m+[m[32m        if (error) {[m
[32m+[m[32m          console.error('[App] Failed to get session:', error);[m
[32m+[m[32m        }[m
 [m
[31m-    supabase.auth.getSession().then(({ data: { session } }) => {[m
[31m-      setUser(session?.user ?? null);[m
[31m-      setAuthChecked(true);[m
[31m-      if (session?.user) {[m
[31m-        syncService.loadDataFromServer();[m
[32m+[m[32m        if (isMounted) {[m
[32m+[m[32m          setUser(session?.user ?? null);[m
[32m+[m[32m          setAuthChecked(true);[m
[32m+[m
[32m+[m[32m          if (session?.user) {[m
[32m+[m[32m            syncService.loadDataFromServer().catch(err => {[m
[32m+[m[32m              console.error('[App] Failed to load data from server:', err);[m
[32m+[m[32m            });[m
[32m+[m[32m          }[m
[32m+[m[32m        }[m
[32m+[m[32m      } catch (error) {[m
[32m+[m[32m        console.error('[App] Error during session check:', error);[m
[32m+[m[32m        if (isMounted) {[m
[32m+[m[32m          setAuthChecked(true);[m
[32m+[m[32m        }[m
       }[m
[31m-    });[m
[32m+[m[32m    }[m
[32m+[m
[32m+[m[32m    initializeApp();[m
 [m
     const {[m
       data: { subscription },[m
     } = supabase.auth.onAuthStateChange((event, session) => {[m
       (async () => {[m
[32m+[m[32m        if (!isMounted) return;[m
[32m+[m
         const prevUser = useStore.getState().user;[m
         const newUser = session?.user ?? null;[m
 [m
[31m-        // CRITICAL: Clear data on logout or user change[m
         if (event === 'SIGNED_OUT' || (prevUser && newUser && prevUser.id !== newUser.id)) {[m
           console.warn('[App] User logout or change - clearing all data');[m
[31m-          useStore.getState().clearUserData();[m
 [m
[31m-          // Also clear localStorage and IndexedDB[m
[31m-          localStorage.clear();[m
[31m-          try {[m
[31m-            await offlineStorage.clearAllData();[m
[31m-          } catch (error) {[m
[31m-            console.error('Failed to clear offline data:', error);[m
[32m+[m[32m          // Force navigation to auth view IMMEDIATELY for better UX[m
[32m+[m[32m          if (event === 'SIGNED_OUT') {[m
[32m+[m[32m            console.log('[App] SIGNED_OUT - redirecting to auth');[m
[32m+[m[32m            setCurrentView({ type: 'auth' });[m
           }[m
[31m-        }[m
 [m
[31m-        setUser(newUser);[m
[32m+[m[32m          // Clear data in background (don't block UI)[m
[32m+[m[32m          useStore.getState().clearUserData();[m
[32m+[m[32m          localStorage.clear();[m
[32m+[m[32m          offlineStorage.clearAllData().catch(error => {[m
[32m+[m[32m            console.error('[App] Failed to clear offline data:', error);[m
[32m+[m[32m          });[m
[32m+[m[32m        }[m
 [m
[31m-        // Load fresh data on new login[m
[31m-        if (newUser && (!prevUser || prevUser.id !== newUser.id)) {[m
[31m-          console.log('[App] New user login - loading fresh data');[m
[31m-          await syncService.loadDataFromServer();[m
[31m-        } else if (newUser) {[m
[31m-          await syncService.syncWithServer();[m
[32m+[m[32m        if (isMounted) {[m
[32m+[m[32m          setUser(newUser);[m
[32m+[m
[32m+[m[32m          if (newUser && (!prevUser || prevUser.id !== newUser.id)) {[m
[32m+[m[32m            console.log('[App] New user login - loading fresh data');[m
[32m+[m[32m            await syncService.loadDataFromServer().catch(err => {[m
[32m+[m[32m              console.error('[App] Failed to load data:', err);[m
[32m+[m[32m            });[m
[32m+[m[32m          } else if (newUser) {[m
[32m+[m[32m            await syncService.syncWithServer().catch(err => {[m
[32m+[m[32m              console.error('[App] Failed to sync:', err);[m
[32m+[m[32m            });[m
[32m+[m[32m          }[m
         }[m
       })();[m
     });[m
 [m
     const unsubscribeOnlineStatus = syncService.onOnlineStatusChange((online) => {[m
       if (online) {[m
[31m-        syncService.syncWithServer();[m
[32m+[m[32m        syncService.syncWithServer().catch(err => {[m
[32m+[m[32m          console.error('[App] Failed to sync on reconnect:', err);[m
[32m+[m[32m        });[m
       }[m
     });[m
 [m
     return () => {[m
[32m+[m[32m      isMounted = false;[m
       subscription.unsubscribe();[m
       unsubscribeOnlineStatus();[m
     };[m
   }, [setUser]);[m
 [m
   useEffect(() => {[m
[31m-    if (hasCompletedOnboarding && currentView.type === 'onboarding') {[m
[32m+[m[32m    if (hasCompletedOnboarding && currentView.type === 'onboarding' && !onboardingNavigatedRef.current) {[m
[32m+[m[32m      onboardingNavigatedRef.current = true;[m
       setCurrentView({ type: 'menu' });[m
     }[m
[31m-  }, [hasCompletedOnboarding]);[m
[32m+[m[32m  }, [hasCompletedOnboarding, currentView.type]);[m
 [m
   if (!authChecked) {[m
     return ([m
[31m-      <div className="min-h-screen bg-goflex-bg flex items-center justify-center">[m
[31m-        <div className="text-goflex-blue">Loading...</div>[m
[31m-      </div>[m
[32m+[m[32m      <AppLayout>[m
[32m+[m[32m        <div className="flex items-center justify-center min-h-screen">[m
[32m+[m[32m          <div className="text-goflex-blue">Loading...</div>[m
[32m+[m[32m        </div>[m
[32m+[m[32m      </AppLayout>[m
     );[m
   }[m
 [m
[36m@@ -250,7 +301,8 @@[m [mfunction App() {[m
 [m
   if (currentView.type === 'menu') {[m
     return ([m
[31m-      <Menu[m
[32m+[m[32m      <AppLayout showBottomNav>[m
[32m+[m[32m        <Menu[m
         onSelectFeature={(feature) => {[m
           if (feature === 'projects') {[m
             setCurrentView({ type: 'projectList' });[m
[36m@@ -266,6 +318,8 @@[m [mfunction App() {[m
             setCurrentView({ type: 'reports' });[m
           } else if (feature === 'admin') {[m
             setCurrentView({ type: 'admin' });[m
[32m+[m[32m          } else if (feature === 'myTickets') {[m
[32m+[m[32m            setCurrentView({ type: 'myTickets' });[m
           }[m
         }}[m
         onSettings={() => setCurrentView({ type: 'settings' })}[m
[36m@@ -273,35 +327,76 @@[m [mfunction App() {[m
           syncService.syncWithServer();[m
           setCurrentView({ type: 'thankYou' });[m
         }}[m
[31m-      />[m
[32m+[m[32m        />[m
[32m+[m[32m        <MobileBottomNav[m
[32m+[m[32m          currentView="menu"[m
[32m+[m[32m          onNavigate={(view) => {[m
[32m+[m[32m            if (view === 'menu') {[m
[32m+[m[32m              setCurrentView({ type: 'menu' });[m
[32m+[m[32m            } else if (view === 'projects') {[m
[32m+[m[32m              setCurrentView({ type: 'projectList' });[m
[32m+[m[32m            } else if (view === 'speedTest') {[m
[32m+[m[32m              setCurrentView({ type: 'speedTest' });[m
[32m+[m[32m            } else if (view === 'support') {[m
[32m+[m[32m              window.dispatchEvent(new CustomEvent('open-support'));[m
[32m+[m[32m            } else if (view === 'settings') {[m
[32m+[m[32m              setCurrentView({ type: 'settings' });[m
[32m+[m[32m            }[m
[32m+[m[32m          }}[m
[32m+[m[32m        />[m
[32m+[m[32m      </AppLayout>[m
     );[m
   }[m
 [m
   if (currentView.type === 'speedTest') {[m
     return ([m
[31m-      <SpeedTest[m
[31m-        onBack={() => setCurrentView({ type: 'menu' })}[m
[31m-        onSaveResult={async (result) => {[m
[31m-          try {[m
[31m-            await saveSpeedTest(result);[m
[31m-          } catch (error) {[m
[31m-            console.error('Failed to save speed test:', error);[m
[31m-          }[m
[31m-        }}[m
[31m-      />[m
[32m+[m[32m      <AppLayout showBottomNav>[m
[32m+[m[32m        <SpeedTest[m
[32m+[m[32m          onBack={() => setCurrentView({ type: 'menu' })}[m
[32m+[m[32m          onSaveResult={async (result) => {[m
[32m+[m[32m            try {[m
[32m+[m[32m              await saveSpeedTest(result);[m
[32m+[m[32m            } catch (error) {[m
[32m+[m[32m              console.error('Failed to save speed test:', error);[m
[32m+[m[32m            }[m
[32m+[m[32m          }}[m
[32m+[m[32m        />[m
[32m+[m[32m        <MobileBottomNav[m
[32m+[m[32m          currentView="speedTest"[m
[32m+[m[32m          onNavigate={(view) => {[m
[32m+[m[32m            if (view === 'menu') {[m
[32m+[m[32m              setCurrentView({ type: 'menu' });[m
[32m+[m[32m            } else if (view === 'projects') {[m
[32m+[m[32m              setCurrentView({ type: 'projectList' });[m
[32m+[m[32m            } else if (view === 'speedTest') {[m
[32m+[m[32m              setCurrentView({ type: 'speedTest' });[m
[32m+[m[32m            } else if (view === 'support') {[m
[32m+[m[32m              window.dispatchEvent(new CustomEvent('open-support'));[m
[32m+[m[32m            } else if (view === 'settings') {[m
[32m+[m[32m              setCurrentView({ type: 'settings' });[m
[32m+[m[32m            }[m
[32m+[m[32m          }}[m
[32m+[m[32m        />[m
[32m+[m[32m      </AppLayout>[m
     );[m
   }[m
 [m
   if (currentView.type === 'linkBudget') {[m
[31m-    return <LinkBudgetCalculator onBack={() => setCurrentView({ type: 'menu' })} />;[m
[32m+[m[32m    return ([m
[32m+[m[32m      <AppLayout>[m
[32m+[m[32m        <LinkBudgetCalculator onBack={() => setCurrentView({ type: 'menu' })} />[m
[32m+[m[32m      </AppLayout>[m
[32m+[m[32m    );[m
   }[m
 [m
   if (currentView.type === 'createProject') {[m
     return ([m
[31m-      <CreateProject[m
[31m-        onBack={() => setCurrentView({ type: 'projectList' })}[m
[31m-        onProjectCreated={(projectId) => setCurrentView({ type: 'projectDetail', projectId })}[m
[31m-      />[m
[32m+[m[32m      <AppLayout>[m
[32m+[m[32m        <CreateProject[m
[32m+[m[32m          onBack={() => setCurrentView({ type: 'projectList' })}[m
[32m+[m[32m          onProjectCreated={(projectId) => setCurrentView({ type: 'projectDetail', projectId })}[m
[32m+[m[32m        />[m
[32m+[m[32m      </AppLayout>[m
     );[m
   }[m
 [m
[36m@@ -492,20 +587,30 @@[m [mfunction App() {[m
   }[m
 [m
   if (currentView.type === 'cellTowerCompass') {[m
[31m-    return <CellTowerCompass onBack={() => setCurrentView({ type: 'menu' })} />;[m
[32m+[m[32m    return ([m
[32m+[m[32m      <AppLayout>[m
[32m+[m[32m        <CellTowerCompass onBack={() => setCurrentView({ type: 'menu' })} />[m
[32m+[m[32m      </AppLayout>[m
[32m+[m[32m    );[m
   }[m
 [m
   if (currentView.type === 'analytics') {[m
     return ([m
[31m-      <Analytics[m
[31m-        onBack={() => setCurrentView({ type: 'menu' })}[m
[31m-        onViewProject={(projectId) => setCurrentView({ type: 'projectDetail', projectId })}[m
[31m-      />[m
[32m+[m[32m      <AppLayout>[m
[32m+[m[32m        <Analytics[m
[32m+[m[32m          onBack={() => setCurrentView({ type: 'menu' })}[m
[32m+[m[32m          onViewProject={(projectId) => setCurrentView({ type: 'projectDetail', projectId })}[m
[32m+[m[32m        />[m
[32m+[m[32m      </AppLayout>[m
     );[m
   }[m
 [m
   if (currentView.type === 'reports') {[m
[31m-    return <Reports onBack={() => setCurrentView({ type: 'menu' })} />;[m
[32m+[m[32m    return ([m
[32m+[m[32m      <AppLayout>[m
[32m+[m[32m        <Reports onBack={() => setCurrentView({ type: 'menu' })} />[m
[32m+[m[32m      </AppLayout>[m
[32m+[m[32m    );[m
   }[m
 [m
   if (currentView.type === 'surveyReport') {[m
[36m@@ -537,6 +642,12 @@[m [mfunction App() {[m
     );[m
   }[m
 [m
[32m+[m[32m  if (currentView.type === 'myTickets') {[m
[32m+[m[32m    return ([m
[32m+[m[32m      <MyTickets onBack={() => setCurrentView({ type: 'menu' })} />[m
[32m+[m[32m    );[m
[32m+[m[32m  }[m
[32m+[m
   if (currentView.type === 'selfTest') {[m
     return ([m
       <AdminRouteGuard onUnauthorized={() => setCurrentView({ type: 'menu' })}>[m
[36m@@ -545,6 +656,10 @@[m [mfunction App() {[m
     );[m
   }[m
 [m
[32m+[m[32m  if (currentView.type === 'testSupport') {[m
[32m+[m[32m    return <TestSupportSystem />;[m
[32m+[m[32m  }[m
[32m+[m
   if (currentView.type === 'commissioningChecklist') {[m
     const backView = currentView.floorId[m
       ? { type: 'floorDetail' as const, floorId: currentView.floorId }[m
[36m@@ -577,37 +692,60 @@[m [mfunction App() {[m
   }[m
 [m
   return ([m
[31m-    <div className="relative">[m
[31m-      {/* Billing Phase Notice Banner - shown at top when user is logged in */}[m
[31m-      {user && <BillingPhaseNoticeBanner />}[m
[31m-[m
[31m-      <OnlineStatus />[m
[31m-      <button[m
[31m-        onClick={() => setCurrentView({ type: 'settings' })}[m
[31m-        className="fixed top-4 right-4 z-50 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors"[m
[31m-        aria-label="Settings"[m
[31m-      >[m
[31m-        <SettingsIcon className="w-6 h-6 text-black" />[m
[31m-      </button>[m
[31m-[m
[31m-      {/* Inactivity Warning Modal */}[m
[31m-      <InactivityWarningModal[m
[31m-        isOpen={isWarningShown && !!user}[m
[31m-        onStaySignedIn={resetTimer}[m
[31m-        onSignOut={async () => {[m
[31m-          await supabase.auth.signOut();[m
[31m-          setCurrentView({ type: 'auth' });[m
[31m-        }}[m
[31m-        remainingMinutes={5}[m
[31m-      />[m
[32m+[m[32m    <AppLayout showBottomNav>[m
[32m+[m[32m      <div className="relative w-full flex flex-col items-center">[m
[32m+[m[32m        {/* Billing Phase Notice Banner - shown at top when user is logged in */}[m
[32m+[m[32m        {user && <BillingPhaseNoticeBanner />}[m
[32m+[m
[32m+[m[32m        <OnlineStatus />[m
[32m+[m[32m        <button[m
[32m+[m[32m          onClick={() => setCurrentView({ type: 'settings' })}[m
[32m+[m[32m          className="fixed top-4 right-4 z-50 w-12 h-12 bg-white dark:bg-slate-800 rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors touch-target lg:block hidden"[m
[32m+[m[32m          aria-label="Settings"[m
[32m+[m[32m        >[m
[32m+[m[32m          <SettingsIcon className="w-6 h-6 text-slate-900 dark:text-slate-100" />[m
[32m+[m[32m        </button>[m
[32m+[m
[32m+[m[32m        {/* Inactivity Warning Modal */}[m
[32m+[m[32m        <InactivityWarningModal[m
[32m+[m[32m          isOpen={isWarningShown && !!user}[m
[32m+[m[32m          onStaySignedIn={resetTimer}[m
[32m+[m[32m          onSignOut={async () => {[m
[32m+[m[32m            await supabase.auth.signOut();[m
[32m+[m[32m            window.location.href = '/';[m
[32m+[m[32m            setTimeout(() => {[m
[32m+[m[32m              window.location.href = '/';[m
[32m+[m[32m            }, 1000);[m
[32m+[m[32m          }}[m
[32m+[m[32m          remainingMinutes={5}[m
[32m+[m[32m        />[m
 [m
[31m-      <ProjectList[m
[31m-        onCreateProject={() => setCurrentView({ type: 'createProject' })}[m
[31m-        onSelectProject={(projectId) => setCurrentView({ type: 'projectDetail', projectId })}[m
[31m-        onBack={() => setCurrentView({ type: 'menu' })}[m
[31m-      />[m
[31m-    </div>[m
[32m+[m[32m        <ProjectList[m
[32m+[m[32m          onCreateProject={() => setCurrentView({ type: 'createProject' })}[m
[32m+[m[32m          onSelectProject={(projectId) => setCurrentView({ type: 'projectDetail', projectId })}[m
[32m+[m[32m          onBack={() => setCurrentView({ type: 'menu' })}[m
[32m+[m[32m        />[m
[32m+[m
[32m+[m[32m        <MobileBottomNav[m
[32m+[m[32m          currentView="projects"[m
[32m+[m[32m          onNavigate={(view) => {[m
[32m+[m[32m            if (view === 'menu') {[m
[32m+[m[32m              setCurrentView({ type: 'menu' });[m
[32m+[m[32m            } else if (view === 'projects') {[m
[32m+[m[32m              setCurrentView({ type: 'projectList' });[m
[32m+[m[32m            } else if (view === 'speedTest') {[m
[32m+[m[32m              setCurrentView({ type: 'speedTest' });[m
[32m+[m[32m            } else if (view === 'support') {[m
[32m+[m[32m              window.dispatchEvent(new CustomEvent('open-support'));[m
[32m+[m[32m            } else if (view === 'settings') {[m
[32m+[m[32m              setCurrentView({ type: 'settings' });[m
[32m+[m[32m            }[m
[32m+[m[32m          }}[m
[32m+[m[32m        />[m
[32m+[m[32m      </div>[m
[32m+[m[32m    </AppLayout>[m
   );[m
 }[m
 [m
 export default App;[m
[41m+[m
