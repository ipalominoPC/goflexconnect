/**
 * GoFlexConnect Main Application
 *
 * MANUAL ONBOARDING TEST INSTRUCTIONS:
 *
 * 1. FREE NEW USER (first login):
 *    - Create a brand-new account with non-admin email
 *    - Log in → EXPECT: onboarding modal appears automatically
 *    - Click "Get Started" → EXPECT: modal closes, navigates to Projects view
 *    - Check database: profiles.has_seen_onboarding should be true
 *    - Refresh app → EXPECT: modal does NOT reappear
 *
 * 2. FREE EXISTING USER (has_seen_onboarding = true):
 *    - Log in with existing user → EXPECT: NO onboarding modal
 *
 * 3. ADMIN USER:
 *    - Log in with admin email (see config/admin.ts)
 *    - EXPECT: NO onboarding modal
 *    - EXPECT: NO "Replay welcome tour" in Settings
 *    - Admin views unchanged
 *
 * 4. SETTINGS "REPLAY WELCOME TOUR":
 *    - Log in as non-admin user
 *    - Go to Settings
 *    - Click "Replay welcome tour" button
 *    - EXPECT: Page reloads and onboarding modal shows again
 *    - Click "Skip for now" or "Get Started"
 *    - EXPECT: Modal does NOT reappear on refresh
 *
 * 5. DEVELOPER TESTING (Dev Console):
 *    - Import: import { runOnboardingSelfTest } from './tests/onboardingSelfTest';
 *    - Run: runOnboardingSelfTest('user-id-here');
 *    - Check console for test results
 */

import { useState, useEffect, useRef } from 'react';
import { Settings as SettingsIcon } from 'lucide-react';
import MobileBottomNav from './components/MobileBottomNav';
import { useStore } from './store/useStore';
import { supabase } from './services/supabaseClient';
import { offlineStorage } from './services/offlineStorage';
import { syncService } from './services/syncService';
import { useInactivityTimer } from './hooks/useInactivityTimer';
import InactivityWarningModal from './components/InactivityWarningModal';
import BillingPhaseNoticeBanner from './components/BillingPhaseNoticeBanner';
import Auth from './components/Auth';
import SplashScreen from './components/SplashScreen';
import Onboarding from './components/Onboarding';
import Menu from './components/Menu';
import ProjectList from './components/ProjectList';
import CreateProject from './components/CreateProject';
import ProjectDetail from './components/ProjectDetail';
import FloorList from './components/FloorList';
import CreateFloor from './components/CreateFloor';
import FloorDetail from './components/FloorDetail';
import FloorPlanUpload from './components/FloorPlanUpload';
import FloorPlanUploadForFloor from './components/FloorPlanUploadForFloor';
import SurveyMode from './components/SurveyMode';
import LiveSurveyMode from './components/LiveSurveyMode';
import HeatmapView from './components/HeatmapView';
import SpeedTest from './components/SpeedTest';
import Settings from './components/Settings';
import Diagnostics from './components/Diagnostics';
import ThankYouPage from './components/ThankYouPage';
import OnlineStatus from './components/OnlineStatus';
import LinkBudgetCalculator from './components/LinkBudgetCalculator';
import TimeSeriesChart from './components/TimeSeriesChart';
import BenchmarkTest from './components/BenchmarkTest';
import ReportGenerator from './components/ReportGenerator';
import DriveTestMode from './components/DriveTestMode';
import BackgroundLogging from './components/BackgroundLogging';
import CellTowerCompass from './components/CellTowerCompass';
import CommissioningChecklist from './components/CommissioningChecklist';
import Analytics from './pages/Analytics';
import Reports from './pages/Reports';
import AdminDashboard from './pages/AdminDashboard';
import SelfTestConsole from './pages/SelfTestConsole';
import TestSupportSystem from './pages/TestSupportSystem';
import AdminRouteGuard from './components/AdminRouteGuard';
import { Landing } from './pages/Landing';
import MyTickets from './components/MyTickets';
import FloorHeatmapPage from './pages/FloorHeatmapPage';
import SurveyReportPage from './pages/SurveyReportPage';
import InstallReportPage from './pages/InstallReportPage';
import { saveSpeedTest } from './services/supabaseClient';
import AppLayout from './components/AppLayout';

type View =
  | { type: 'landing' }
  | { type: 'auth' }
  | { type: 'splash' }
  | { type: 'onboarding' }
  | { type: 'menu' }
  | { type: 'projectList' }
  | { type: 'createProject' }
  | { type: 'projectDetail'; projectId: string }
  | { type: 'floorList'; projectId: string }
  | { type: 'createFloor'; projectId: string }
  | { type: 'floorDetail'; floorId: string }
  | { type: 'floorPlanUpload'; projectId: string }
  | { type: 'floorPlanUploadForFloor'; floorId: string }
  | { type: 'surveyMode'; projectId: string; floorId?: string }
  | { type: 'heatmapView'; projectId: string; floorId?: string }
  | { type: 'floorHeatmap'; projectId: string; floorId: string }
  | { type: 'timeSeriesView'; projectId: string; floorId?: string }
  | { type: 'benchmarkTest'; projectId: string; floorId?: string }
  | { type: 'reportView'; projectId: string; floorId?: string }
  | { type: 'driveTest'; projectId: string; floorId?: string }
  | { type: 'backgroundLogging'; projectId: string; floorId?: string }
  | { type: 'cellTowerCompass' }
  | { type: 'commissioningChecklist'; projectId: string; floorId?: string }
  | { type: 'speedTest' }
  | { type: 'linkBudget' }
  | { type: 'analytics' }
  | { type: 'reports' }
  | { type: 'admin' }
  | { type: 'myTickets' }
  | { type: 'selfTest' }
  | { type: 'testSupport' }
  | { type: 'settings' }
  | { type: 'diagnostics' }
  | { type: 'thankYou' }
  | { type: 'surveyReport'; projectId: string }
  | { type: 'installReport'; projectId: string };

function App() {
  const user = useStore((state) => state.user);
  const setUser = useStore((state) => state.setUser);
  const settings = useStore((state) => state.settings);
  const hasCompletedOnboarding = useStore((state) => state.hasCompletedOnboarding);
  const [currentView, setCurrentView] = useState<View>({ type: 'landing' });
  const [authChecked, setAuthChecked] = useState(false);
  const onboardingNavigatedRef = useRef(false);

  // Inactivity timer configuration
  const sessionTimeoutMs = (settings.sessionTimeoutMinutes || 30) * 60 * 1000;
  const warningTimeoutMs = sessionTimeoutMs - (5 * 60 * 1000); // Warning 5 minutes before logout

  const { isWarningShown, resetTimer } = useInactivityTimer({
    warningTimeoutMs,
    logoutTimeoutMs: sessionTimeoutMs,
    onWarning: () => {
      // Warning is shown via isWarningShown state
    },
    onLogout: async () => {
      console.log('[Inactivity] Auto-logout due to inactivity');
      await supabase.auth.signOut();
      window.location.href = '/';
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
    },
    enabled: !!user, // Only enable when user is logged in
  });

  useEffect(() => {
    let isMounted = true;

    async function initializeApp() {
      try {
        await offlineStorage.init();
        await offlineStorage.clearAllPendingSync();
      } catch (error) {
        console.error('[App] Failed to init offline storage:', error);
      }

      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('[App] Failed to get session:', error);
        }

        if (isMounted) {
          setUser(session?.user ?? null);
          setAuthChecked(true);

          if (session?.user) {
            syncService.loadDataFromServer().catch(err => {
              console.error('[App] Failed to load data from server:', err);
            });
          }
        }
      } catch (error) {
        console.error('[App] Error during session check:', error);
        if (isMounted) {
          setAuthChecked(true);
        }
      }
    }

    initializeApp();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      (async () => {
        if (!isMounted) return;

        const prevUser = useStore.getState().user;
        const newUser = session?.user ?? null;

        if (event === 'SIGNED_OUT' || (prevUser && newUser && prevUser.id !== newUser.id)) {
          console.warn('[App] User logout or change - clearing all data');

          // Force navigation to auth view IMMEDIATELY for better UX
          if (event === 'SIGNED_OUT') {
            console.log('[App] SIGNED_OUT - redirecting to auth');
            setCurrentView({ type: 'auth' });
          }

          // Clear data in background (don't block UI)
          useStore.getState().clearUserData();
          localStorage.clear();
          offlineStorage.clearAllData().catch(error => {
            console.error('[App] Failed to clear offline data:', error);
          });
        }

        if (isMounted) {
          setUser(newUser);

          if (newUser && (!prevUser || prevUser.id !== newUser.id)) {
            console.log('[App] New user login - loading fresh data');
            await syncService.loadDataFromServer().catch(err => {
              console.error('[App] Failed to load data:', err);
            });
          } else if (newUser) {
            await syncService.syncWithServer().catch(err => {
              console.error('[App] Failed to sync:', err);
            });
          }
        }
      })();
    });

    const unsubscribeOnlineStatus = syncService.onOnlineStatusChange((online) => {
      if (online) {
        syncService.syncWithServer().catch(err => {
          console.error('[App] Failed to sync on reconnect:', err);
        });
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      unsubscribeOnlineStatus();
    };
  }, [setUser]);

  useEffect(() => {
    if (hasCompletedOnboarding && currentView.type === 'onboarding' && !onboardingNavigatedRef.current) {
      onboardingNavigatedRef.current = true;
      setCurrentView({ type: 'menu' });
    }
  }, [hasCompletedOnboarding, currentView.type]);

  if (!authChecked) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-goflex-blue">Loading...</div>
        </div>
      </AppLayout>
    );
  }

  if (currentView.type === 'landing') {
    return (
      <Landing
        onGetAccess={() => setCurrentView({ type: 'auth' })}
        onLogIn={() => setCurrentView({ type: 'auth' })}
      />
    );
  }

  if (currentView.type === 'auth') {
    return <Auth onAuthSuccess={() => setCurrentView({ type: 'splash' })} />;
  }

  if (!user) {
    return (
      <Landing
        onGetAccess={() => setCurrentView({ type: 'auth' })}
        onLogIn={() => setCurrentView({ type: 'auth' })}
      />
    );
  }

  if (currentView.type === 'splash') {
    return (
      <SplashScreen
        onComplete={() => setCurrentView(hasCompletedOnboarding ? { type: 'menu' } : { type: 'onboarding' })}
      />
    );
  }

  if (currentView.type === 'onboarding') {
    return <Onboarding />;
  }

  if (currentView.type === 'menu') {
    return (
      <AppLayout showBottomNav>
        <Menu
        onSelectFeature={(feature) => {
          if (feature === 'projects') {
            setCurrentView({ type: 'projectList' });
          } else if (feature === 'speedTest') {
            setCurrentView({ type: 'speedTest' });
          } else if (feature === 'linkBudget') {
            setCurrentView({ type: 'linkBudget' });
          } else if (feature === 'cellTowerCompass') {
            setCurrentView({ type: 'cellTowerCompass' });
          } else if (feature === 'analytics') {
            setCurrentView({ type: 'analytics' });
          } else if (feature === 'reports') {
            setCurrentView({ type: 'reports' });
          } else if (feature === 'admin') {
            setCurrentView({ type: 'admin' });
          } else if (feature === 'myTickets') {
            setCurrentView({ type: 'myTickets' });
          }
        }}
        onSettings={() => setCurrentView({ type: 'settings' })}
        onFinish={() => {
          syncService.syncWithServer();
          setCurrentView({ type: 'thankYou' });
        }}
        />
        <MobileBottomNav
          currentView="menu"
          onNavigate={(view) => {
            if (view === 'menu') {
              setCurrentView({ type: 'menu' });
            } else if (view === 'projects') {
              setCurrentView({ type: 'projectList' });
            } else if (view === 'speedTest') {
              setCurrentView({ type: 'speedTest' });
            } else if (view === 'support') {
              window.dispatchEvent(new CustomEvent('open-support'));
            } else if (view === 'settings') {
              setCurrentView({ type: 'settings' });
            }
          }}
        />
      </AppLayout>
    );
  }

  if (currentView.type === 'speedTest') {
    return (
      <AppLayout showBottomNav>
        <SpeedTest
          onBack={() => setCurrentView({ type: 'menu' })}
          onSaveResult={async (result) => {
            try {
              await saveSpeedTest(result);
            } catch (error) {
              console.error('Failed to save speed test:', error);
            }
          }}
        />
        <MobileBottomNav
          currentView="speedTest"
          onNavigate={(view) => {
            if (view === 'menu') {
              setCurrentView({ type: 'menu' });
            } else if (view === 'projects') {
              setCurrentView({ type: 'projectList' });
            } else if (view === 'speedTest') {
              setCurrentView({ type: 'speedTest' });
            } else if (view === 'support') {
              window.dispatchEvent(new CustomEvent('open-support'));
            } else if (view === 'settings') {
              setCurrentView({ type: 'settings' });
            }
          }}
        />
      </AppLayout>
    );
  }

  if (currentView.type === 'linkBudget') {
    return (
      <AppLayout>
        <LinkBudgetCalculator onBack={() => setCurrentView({ type: 'menu' })} />
      </AppLayout>
    );
  }

  if (currentView.type === 'createProject') {
    return (
      <AppLayout>
        <CreateProject
          onBack={() => setCurrentView({ type: 'projectList' })}
          onProjectCreated={(projectId) => setCurrentView({ type: 'projectDetail', projectId })}
        />
      </AppLayout>
    );
  }

  if (currentView.type === 'projectDetail') {
    return (
      <ProjectDetail
        projectId={currentView.projectId}
        onBack={() => setCurrentView({ type: 'projectList' })}
        onManageFloors={() => setCurrentView({ type: 'floorList', projectId: currentView.projectId })}
        onStartSurvey={() => setCurrentView({ type: 'surveyMode', projectId: currentView.projectId })}
        onViewHeatmap={() => setCurrentView({ type: 'heatmapView', projectId: currentView.projectId })}
        onUploadFloorPlan={() => setCurrentView({ type: 'floorPlanUpload', projectId: currentView.projectId })}
        onViewTimeSeries={() => setCurrentView({ type: 'timeSeriesView', projectId: currentView.projectId })}
        onBenchmarkTest={() => setCurrentView({ type: 'benchmarkTest', projectId: currentView.projectId })}
        onGenerateReport={() => setCurrentView({ type: 'reportView', projectId: currentView.projectId })}
        onDriveTest={() => setCurrentView({ type: 'driveTest', projectId: currentView.projectId })}
        onBackgroundLogging={() => setCurrentView({ type: 'backgroundLogging', projectId: currentView.projectId })}
        onCommissioningChecklist={() => setCurrentView({ type: 'commissioningChecklist', projectId: currentView.projectId })}
        onGenerateSurveyReport={() => setCurrentView({ type: 'surveyReport', projectId: currentView.projectId })}
        onGenerateInstallReport={() => setCurrentView({ type: 'installReport', projectId: currentView.projectId })}
      />
    );
  }

  if (currentView.type === 'floorPlanUpload') {
    return (
      <FloorPlanUpload
        projectId={currentView.projectId}
        onBack={() => setCurrentView({ type: 'projectDetail', projectId: currentView.projectId })}
      />
    );
  }

  if (currentView.type === 'floorList') {
    return (
      <FloorList
        projectId={currentView.projectId}
        onBack={() => setCurrentView({ type: 'projectDetail', projectId: currentView.projectId })}
        onAddFloor={() => setCurrentView({ type: 'createFloor', projectId: currentView.projectId })}
        onSelectFloor={(floorId) => setCurrentView({ type: 'floorDetail', floorId })}
      />
    );
  }

  if (currentView.type === 'createFloor') {
    return (
      <CreateFloor
        projectId={currentView.projectId}
        onBack={() => setCurrentView({ type: 'floorList', projectId: currentView.projectId })}
        onFloorCreated={(floorId) => setCurrentView({ type: 'floorDetail', floorId })}
      />
    );
  }

  if (currentView.type === 'floorDetail') {
    const floor = useStore.getState().getFloorById(currentView.floorId);
    return (
      <FloorDetail
        floorId={currentView.floorId}
        onBack={() => setCurrentView({ type: 'floorList', projectId: floor?.projectId || '' })}
        onStartSurvey={() => setCurrentView({ type: 'surveyMode', projectId: floor?.projectId || '', floorId: currentView.floorId })}
        onViewHeatmap={() => setCurrentView({ type: 'floorHeatmap', projectId: floor?.projectId || '', floorId: currentView.floorId })}
        onUploadFloorPlan={() => setCurrentView({ type: 'floorPlanUploadForFloor', floorId: currentView.floorId })}
        onViewTimeSeries={() => setCurrentView({ type: 'timeSeriesView', projectId: floor?.projectId || '', floorId: currentView.floorId })}
        onBenchmarkTest={() => setCurrentView({ type: 'benchmarkTest', projectId: floor?.projectId || '', floorId: currentView.floorId })}
        onGenerateReport={() => setCurrentView({ type: 'reportView', projectId: floor?.projectId || '', floorId: currentView.floorId })}
        onDriveTest={() => setCurrentView({ type: 'driveTest', projectId: floor?.projectId || '', floorId: currentView.floorId })}
      />
    );
  }

  if (currentView.type === 'floorPlanUploadForFloor') {
    return (
      <FloorPlanUploadForFloor
        floorId={currentView.floorId}
        onBack={() => setCurrentView({ type: 'floorDetail', floorId: currentView.floorId })}
      />
    );
  }

  if (currentView.type === 'floorHeatmap') {
    const floor = useStore.getState().getFloorById(currentView.floorId);
    return (
      <FloorHeatmapPage
        projectId={currentView.projectId}
        floorId={currentView.floorId}
        onBack={() => setCurrentView({ type: 'floorList', projectId: currentView.projectId })}
      />
    );
  }

  if (currentView.type === 'surveyMode') {
    const backView = currentView.floorId
      ? { type: 'floorDetail' as const, floorId: currentView.floorId }
      : { type: 'projectDetail' as const, projectId: currentView.projectId };

    return (
      <SurveyMode
        projectId={currentView.projectId}
        floorId={currentView.floorId}
        onBack={() => setCurrentView(backView)}
      />
    );
  }

  if (currentView.type === 'heatmapView') {
    const backView = currentView.floorId
      ? { type: 'floorDetail' as const, floorId: currentView.floorId }
      : { type: 'projectDetail' as const, projectId: currentView.projectId };

    return (
      <HeatmapView
        projectId={currentView.projectId}
        floorId={currentView.floorId}
        onBack={() => setCurrentView(backView)}
      />
    );
  }

  if (currentView.type === 'timeSeriesView') {
    const backView = currentView.floorId
      ? { type: 'floorDetail' as const, floorId: currentView.floorId }
      : { type: 'projectDetail' as const, projectId: currentView.projectId };

    return (
      <TimeSeriesChart
        projectId={currentView.projectId}
        floorId={currentView.floorId}
        onBack={() => setCurrentView(backView)}
      />
    );
  }

  if (currentView.type === 'benchmarkTest') {
    const backView = currentView.floorId
      ? { type: 'floorDetail' as const, floorId: currentView.floorId }
      : { type: 'projectDetail' as const, projectId: currentView.projectId };

    return (
      <BenchmarkTest
        projectId={currentView.projectId}
        floorId={currentView.floorId}
        onBack={() => setCurrentView(backView)}
      />
    );
  }

  if (currentView.type === 'reportView') {
    const backView = currentView.floorId
      ? { type: 'floorDetail' as const, floorId: currentView.floorId }
      : { type: 'projectDetail' as const, projectId: currentView.projectId };

    return (
      <ReportGenerator
        projectId={currentView.projectId}
        floorId={currentView.floorId}
        onBack={() => setCurrentView(backView)}
      />
    );
  }

  if (currentView.type === 'driveTest') {
    const backView = currentView.floorId
      ? { type: 'floorDetail' as const, floorId: currentView.floorId }
      : { type: 'projectDetail' as const, projectId: currentView.projectId };

    return (
      <DriveTestMode
        projectId={currentView.projectId}
        floorId={currentView.floorId}
        onBack={() => setCurrentView(backView)}
      />
    );
  }

  if (currentView.type === 'backgroundLogging') {
    const backView = currentView.floorId
      ? { type: 'floorDetail' as const, floorId: currentView.floorId }
      : { type: 'projectDetail' as const, projectId: currentView.projectId };

    return (
      <BackgroundLogging
        projectId={currentView.projectId}
        floorId={currentView.floorId}
        onBack={() => setCurrentView(backView)}
      />
    );
  }

  if (currentView.type === 'cellTowerCompass') {
    return (
      <AppLayout>
        <CellTowerCompass onBack={() => setCurrentView({ type: 'menu' })} />
      </AppLayout>
    );
  }

  if (currentView.type === 'analytics') {
    return (
      <AppLayout>
        <Analytics
          onBack={() => setCurrentView({ type: 'menu' })}
          onViewProject={(projectId) => setCurrentView({ type: 'projectDetail', projectId })}
        />
      </AppLayout>
    );
  }

  if (currentView.type === 'reports') {
    return (
      <AppLayout>
        <Reports onBack={() => setCurrentView({ type: 'menu' })} />
      </AppLayout>
    );
  }

  if (currentView.type === 'surveyReport') {
    return (
      <SurveyReportPage
        projectId={currentView.projectId}
        onBack={() => setCurrentView({ type: 'projectDetail', projectId: currentView.projectId })}
      />
    );
  }

  if (currentView.type === 'installReport') {
    return (
      <InstallReportPage
        projectId={currentView.projectId}
        onBack={() => setCurrentView({ type: 'projectDetail', projectId: currentView.projectId })}
      />
    );
  }

  if (currentView.type === 'admin') {
    return (
      <AdminRouteGuard onUnauthorized={() => setCurrentView({ type: 'menu' })}>
        <AdminDashboard
          onBack={() => setCurrentView({ type: 'menu' })}
          onSelfTest={() => setCurrentView({ type: 'selfTest' })}
        />
      </AdminRouteGuard>
    );
  }

  if (currentView.type === 'myTickets') {
    return (
      <MyTickets onBack={() => setCurrentView({ type: 'menu' })} />
    );
  }

  if (currentView.type === 'selfTest') {
    return (
      <AdminRouteGuard onUnauthorized={() => setCurrentView({ type: 'menu' })}>
        <SelfTestConsole onBack={() => setCurrentView({ type: 'admin' })} />
      </AdminRouteGuard>
    );
  }

  if (currentView.type === 'testSupport') {
    return <TestSupportSystem />;
  }

  if (currentView.type === 'commissioningChecklist') {
    const backView = currentView.floorId
      ? { type: 'floorDetail' as const, floorId: currentView.floorId }
      : { type: 'projectDetail' as const, projectId: currentView.projectId };

    return (
      <CommissioningChecklist
        projectId={currentView.projectId}
        floorId={currentView.floorId}
        onBack={() => setCurrentView(backView)}
      />
    );
  }

  if (currentView.type === 'settings') {
    return (
      <Settings
        onBack={() => setCurrentView({ type: 'menu' })}
        onShowDiagnostics={() => setCurrentView({ type: 'diagnostics' })}
      />
    );
  }

  if (currentView.type === 'diagnostics') {
    return <Diagnostics onBack={() => setCurrentView({ type: 'settings' })} />;
  }

  if (currentView.type === 'thankYou') {
    return <ThankYouPage onBackToApp={() => setCurrentView({ type: 'menu' })} />;
  }

  return (
    <AppLayout showBottomNav>
      <div className="relative w-full flex flex-col items-center">
        {/* Billing Phase Notice Banner - shown at top when user is logged in */}
        {user && <BillingPhaseNoticeBanner />}

        <OnlineStatus />
        <button
          onClick={() => setCurrentView({ type: 'settings' })}
          className="fixed top-4 right-4 z-50 w-12 h-12 bg-white dark:bg-slate-800 rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors touch-target lg:block hidden"
          aria-label="Settings"
        >
          <SettingsIcon className="w-6 h-6 text-slate-900 dark:text-slate-100" />
        </button>

        {/* Inactivity Warning Modal */}
        <InactivityWarningModal
          isOpen={isWarningShown && !!user}
          onStaySignedIn={resetTimer}
          onSignOut={async () => {
            await supabase.auth.signOut();
            window.location.href = '/';
            setTimeout(() => {
              window.location.href = '/';
            }, 1000);
          }}
          remainingMinutes={5}
        />

        <ProjectList
          onCreateProject={() => setCurrentView({ type: 'createProject' })}
          onSelectProject={(projectId) => setCurrentView({ type: 'projectDetail', projectId })}
          onBack={() => setCurrentView({ type: 'menu' })}
        />

        <MobileBottomNav
          currentView="projects"
          onNavigate={(view) => {
            if (view === 'menu') {
              setCurrentView({ type: 'menu' });
            } else if (view === 'projects') {
              setCurrentView({ type: 'projectList' });
            } else if (view === 'speedTest') {
              setCurrentView({ type: 'speedTest' });
            } else if (view === 'support') {
              window.dispatchEvent(new CustomEvent('open-support'));
            } else if (view === 'settings') {
              setCurrentView({ type: 'settings' });
            }
          }}
        />
      </div>
    </AppLayout>
  );
}

export default App;

