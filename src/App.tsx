import { useState, useEffect } from 'react';
import { Settings as SettingsIcon } from 'lucide-react';
import { useStore } from './store/useStore';
import { supabase } from './services/supabaseClient';
import { offlineStorage } from './services/offlineStorage';
import { syncService } from './services/syncService';
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
import { saveSpeedTest } from './services/supabaseClient';

type View =
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
  | { type: 'timeSeriesView'; projectId: string; floorId?: string }
  | { type: 'benchmarkTest'; projectId: string; floorId?: string }
  | { type: 'reportView'; projectId: string; floorId?: string }
  | { type: 'driveTest'; projectId: string; floorId?: string }
  | { type: 'backgroundLogging'; projectId: string; floorId?: string }
  | { type: 'cellTowerCompass' }
  | { type: 'commissioningChecklist'; projectId: string; floorId?: string }
  | { type: 'speedTest' }
  | { type: 'linkBudget' }
  | { type: 'settings' }
  | { type: 'diagnostics' }
  | { type: 'thankYou' };

function App() {
  const user = useStore((state) => state.user);
  const setUser = useStore((state) => state.setUser);
  const hasCompletedOnboarding = useStore((state) => state.hasCompletedOnboarding);
  const [currentView, setCurrentView] = useState<View>({ type: 'splash' });
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    offlineStorage.init().then(() => {
      offlineStorage.clearAllPendingSync();
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthChecked(true);
      if (session?.user) {
        syncService.loadDataFromServer();
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        setUser(session?.user ?? null);
        if (session?.user) {
          await syncService.syncWithServer();
        }
      })();
    });

    const unsubscribeOnlineStatus = syncService.onOnlineStatusChange((online) => {
      if (online) {
        syncService.syncWithServer();
      }
    });

    return () => {
      subscription.unsubscribe();
      unsubscribeOnlineStatus();
    };
  }, [setUser]);

  useEffect(() => {
    if (hasCompletedOnboarding && currentView.type === 'onboarding') {
      setCurrentView({ type: 'menu' });
    }
  }, [hasCompletedOnboarding]);

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
        <div className="text-blue-600">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Auth onAuthSuccess={() => {}} />;
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
          }
        }}
        onSettings={() => setCurrentView({ type: 'settings' })}
        onFinish={() => {
          syncService.syncWithServer();
          setCurrentView({ type: 'thankYou' });
        }}
      />
    );
  }

  if (currentView.type === 'speedTest') {
    return (
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
    );
  }

  if (currentView.type === 'linkBudget') {
    return <LinkBudgetCalculator onBack={() => setCurrentView({ type: 'menu' })} />;
  }

  if (currentView.type === 'createProject') {
    return (
      <CreateProject
        onBack={() => setCurrentView({ type: 'projectList' })}
        onProjectCreated={(projectId) => setCurrentView({ type: 'projectDetail', projectId })}
      />
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
        onViewHeatmap={() => setCurrentView({ type: 'heatmapView', projectId: floor?.projectId || '', floorId: currentView.floorId })}
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
    return <CellTowerCompass onBack={() => setCurrentView({ type: 'menu' })} />;
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
    <div className="relative">
      <OnlineStatus />
      <button
        onClick={() => setCurrentView({ type: 'settings' })}
        className="fixed top-4 right-4 z-50 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
        aria-label="Settings"
      >
        <SettingsIcon className="w-6 h-6 text-black" />
      </button>

      <ProjectList
        onCreateProject={() => setCurrentView({ type: 'createProject' })}
        onSelectProject={(projectId) => setCurrentView({ type: 'projectDetail', projectId })}
        onBack={() => setCurrentView({ type: 'menu' })}
      />
    </div>
  );
}

export default App;
