import { useState } from 'react';
import { ArrowLeft, BarChart3, FileDown, Sparkles, Upload, Building2, ClipboardCheck, TrendingUp, Target, Cloud, Archive, FolderOpen } from 'lucide-react';
import { useStore } from '../store/useStore';
import { calculateProjectStats, exportToCSV, downloadFile } from '../utils/calculations';
import SurveyInsightsPanel from './SurveyInsightsPanel';

export default function ProjectDetail({ 
  projectId, onBack, onManageFloors, onStartSurvey, onViewHeatmap, onUploadFloorPlan, onCommissioningChecklist 
}: any) {
  const { projects, measurements: allMs, floors: allFl, settings, updateProject } = useStore();
  const [showAI, setShowAI] = useState(false);
  const project = projects.find((p: any) => p.id === projectId);
  const measurements = allMs.filter((m: any) => m.projectId === projectId);
  const floors = allFl.filter((f: any) => f.projectId === projectId);

  if (!project) return <div className="p-20 text-white font-bold">Project Not Found</div>;
  const stats = calculateProjectStats(measurements, settings.thresholds);

  return (
    <div className="min-h-screen bg-black text-white p-6 pt-12">
      <button onClick={onBack} className="text-slate-400 mb-6 flex items-center active:text-[#27AAE1]">
        <ArrowLeft className="w-4 h-4 mr-2"/> Back
      </button>

      {/* 1. BRANDED HEADER LOGO */}
      <div className="flex justify-center mb-6">
        <div className="p-4 bg-[#27AAE1]/10 rounded-[28px] border border-[#27AAE1]/30 shadow-[0_0_20px_rgba(39,170,225,0.4)]">
          <img 
            src="/icons/logo-128.png" 
            alt="GoFlexConnect" 
            className="w-12 h-12 rounded-[22px] shadow-[0_0_10px_rgba(39,170,225,0.6)]" 
          />
        </div>
      </div>

      <h1 className="text-3xl font-black text-center mb-1 tracking-tight italic" style={{ fontFamily: 'Montserrat, sans-serif' }}>GoFlexConnect</h1>
      <p className="text-slate-500 text-[10px] text-center mb-8 uppercase tracking-[0.3em] font-bold">{project.location || 'Premium Site'}</p>

      {/* 2. PRIMARY ACTION: START SURVEY */}
      <button 
        onClick={onStartSurvey} 
        disabled={!project.floorPlanImage} 
        className={`w-full py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all active:scale-95 mb-8 ${
          !project.floorPlanImage ? 'bg-slate-800 text-slate-600 grayscale' : 'bg-[#27AAE1] text-white shadow-[0_0_25px_rgba(39,170,225,0.3)]'
        }`}
      >
        <img src="/icons/logo-128.png" className="w-7 h-7 rounded-lg mr-1" alt="" />
        {project.floorPlanImage ? 'START SURVEY MODE' : 'UPLOAD MAP TO START'}
      </button>

      {/* AI INSIGHTS GATE */}
      {measurements.length > 0 && (
        <div className="mb-8">
          {showAI ? (
            <SurveyInsightsPanel surveyId={projectId} />
          ) : (
            <button 
              onClick={() => setShowAI(true)}
              className="w-full py-4 bg-slate-900 border border-dashed border-[#27AAE1]/30 rounded-xl text-slate-400 font-bold flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5 text-yellow-400" /> GENERATE AI SITE INSIGHTS
            </button>
          )}
        </div>
      )}

      {/* 3. FIELD TOOLS GRID */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        <button onClick={onViewHeatmap} className="col-span-2 py-4 bg-green-600 rounded-xl font-black text-white flex items-center justify-center gap-2 shadow-lg active:scale-95">
          <BarChart3 className="w-6 h-6" /> VIEW HEATMAP
        </button>
        <button className="py-4 bg-violet-600 rounded-xl font-bold text-[10px] flex flex-col items-center gap-2 text-white active:scale-95">
          <TrendingUp className="w-5 h-5" /> TIME SERIES
        </button>
        <button className="py-4 bg-orange-600 rounded-xl font-bold text-[10px] flex flex-col items-center gap-2 text-white active:scale-95">
          <Target className="w-5 h-5" /> BENCHMARK
        </button>
        <button className="col-span-2 py-4 bg-indigo-600 rounded-xl font-bold text-[10px] flex items-center justify-center gap-2 text-white shadow-lg active:scale-95">
          <FileDown className="w-5 h-5" /> GENERATE SITE REPORT
        </button>
      </div>

      {/* 4. PROJECT STATUS MANAGEMENT (ARCHIVE) */}
      <div className="mb-8 pt-4 border-t border-white/5">
        {project.status === 'closed' ? (
          <button 
            onClick={() => updateProject(project.id, { status: 'active' })}
            className="w-full py-3 bg-green-500 text-white shadow-[0_0_20px_rgba(34,197,94,0.4)] font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2"
          >
            <FolderOpen className="w-4 h-4" /> Re-Activate Project
          </button>
        ) : (
          <button 
            onClick={() => { if(window.confirm('Close this project? It will be moved to the archive.')) updateProject(project.id, { status: 'closed' }); }}
            className="w-full py-3 bg-red-950/20 border border-red-500/50 rounded-xl text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)] font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2"
          >
            <Archive className="w-4 h-4" /> Close & Archive Project
          </button>
        )}
      </div>

      {/* MAP PREVIEW AREA */}
      <div className="bg-slate-900 rounded-2xl p-5 border border-white/5 mb-8">
        <div className="flex justify-between items-center mb-4 text-[10px] font-black uppercase text-slate-500 tracking-widest">
          <span>Current Floor Plan</span>
          <button onClick={onUploadFloorPlan} className="text-[#27AAE1]">Update</button>
        </div>
        {project.floorPlanImage ? (
          <img src={project.floorPlanImage} className="w-full h-40 object-contain rounded-lg bg-black/40 border border-white/5" alt="Map" />
        ) : (
          <div className="h-40 border-2 border-dashed border-white/10 rounded-lg flex items-center justify-center text-slate-700 font-black text-xs">NO MAP LOADED</div>
        )}
      </div>
    </div>
  );
}
