import { useState } from 'react';
import { ArrowLeft, Upload, Radio, BarChart3, FileDown, Target } from 'lucide-react';
import { useStore } from '../store/useStore';
import { exportToJSON } from '../utils/calculations';
import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';

export default function FloorDetail({ floorId, onBack, onStartSurvey }: any) {
  const { floors, projects, measurements: allMs } = useStore();
  const floor = floors.find((f: any) => f.id === floorId);
  const project = projects.find((p: any) => p.id === floor?.projectId);
  const measurements = allMs.filter((m: any) => m.floorId === floorId);

  if (!floor || !project) return <div className="p-20 text-white font-bold">Floor Not Found</div>;

  const handleExportJSON = async () => {
    try {
      const json = exportToJSON(measurements);
      const cleanName = project.name.replace(/\s+/g, '_').toUpperCase();
      const dateStr = new Date().toISOString().split('T')[0];
      const fileName = `GFC_RAW_DATA_${cleanName}_${dateStr}.json`;

      const result = await Filesystem.writeFile({
        path: fileName,
        data: json,
        directory: Directory.Cache,
        encoding: 'utf8' as any
      });
      await Share.share({ title: 'GFC Raw JSON Data', url: result.uri });
    } catch (e) {
      alert('JSON Export failed: ' + e);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 pt-12">
      <button onClick={onBack} className="text-slate-400 mb-6 flex items-center uppercase text-[10px] font-black tracking-widest active:text-[#27AAE1]">
        <ArrowLeft className="w-4 h-4 mr-2"/> Back
      </button>
      <h1 className="text-2xl font-black mb-1 uppercase italic tracking-tighter">{floor.name}</h1>
      <p className="text-[#27AAE1] text-[10px] uppercase font-black tracking-[0.2em] mb-8">{project.name}</p>

      <div className="grid grid-cols-1 gap-4 mb-8">
        <button onClick={onStartSurvey} className="w-full py-5 bg-[#27AAE1] text-white rounded-2xl font-black text-lg shadow-lg active:scale-95 transition-transform">
          COLLECT SIGNAL DATA
        </button>
        <button onClick={handleExportJSON} className="w-full py-4 bg-slate-900 border border-white/10 rounded-xl font-black text-xs flex items-center justify-center gap-2">
          <FileDown className="w-5 h-5 text-[#27AAE1]" /> EXPORT RAW JSON
        </button>
      </div>

      <div className="bg-slate-900/50 rounded-2xl p-6 border border-white/5">
        <h3 className="text-[10px] font-black uppercase text-slate-500 mb-4 tracking-widest">Floor Statistics</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-black/40 p-4 rounded-xl border border-white/5 text-center">
            <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Points</p>
            <p className="text-xl font-black text-[#27AAE1]">{measurements.length}</p>
          </div>
          <div className="bg-black/40 p-4 rounded-xl border border-white/5 text-center">
            <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Status</p>
            <p className="text-xs font-black text-green-500 uppercase">Verified</p>
          </div>
        </div>
      </div>
    </div>
  );
}
