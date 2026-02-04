import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, FileDown, ShieldCheck, ChevronRight, ImagePlus, Loader2, FileText, Flame, FileSpreadsheet, Cloud, Plus, Trash2, AlertTriangle, X, Signal, Hammer, ClipboardCheck, Compass, FileSearch, Zap, ShieldAlert, CheckCircle2, CloudOff } from 'lucide-react';
import { useStore } from '../store/useStore';
import { exportToPDF, exportToCSV, generateMapSnapshot, exportInstallPDF } from '../utils/calculations';
import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { supabase } from '../services/supabaseClient';
import { Capacitor } from '@capacitor/core';
import { db } from '../services/installDatabase';
import DonorAntennaAzimuth from './DonorAntennaAzimuth';

export default function ProjectDetail({ projectId, onBack, onStartSurvey, onViewHeatmap }: any) {
  const { projects, setProjects, floors, setFloors, addFloor, deleteFloor, measurements, settings, user, currentSignal } = useStore();
  const [isExporting, setIsExporting] = useState(false);
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [isUpdatingType, setIsUpdatingType] = useState(false);
  const [showAzimuthTool, setShowAzimuthTool] = useState(false);
  const [donorPhotos, setDonorPhotos] = useState<any[]>([]);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [isSubmittingQuote, setIsSubmittingQuote] = useState(false);
  const [quoteSuccess, setQuoteSuccess] = useState(false);

  // HQ INSTRUCTION STATE
  const [hqInstruction, setHqInstruction] = useState<string | null>(null);

  const [deleteModal, setDeleteModal] = useState<{show: boolean, id: string, name: string, type: 'floor' | 'donor'}>({ 
    show: false, id: '', name: '', type: 'floor' 
  });
  
  const [namingModal, setNamingModal] = useState<{show: boolean, data: string | null}>({ show: false, data: null });
  const [customFloorName, setCustomFloorName] = useState('');
  const [selectedFloorId, setSelectedFloorId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isNative = Capacitor.isNativePlatform();
  const project = projects?.find((p: any) => p.id === projectId);
  const projectFloors = (floors || []).filter((f: any) => f.project_id === projectId || f.projectId === projectId);
  const siteMeasurements = (measurements || []).filter((m: any) => m.projectId === projectId);
  
  // SALES LOGIC: Detector (History + Live Stream)
  const worstSiteRSRP = siteMeasurements.reduce((min, m) => Math.min(min, m.rsrp), 0);
  const worstLiveRSRP = currentSignal?.rsrp || 0;
  const worstDetected = Math.min(worstSiteRSRP || 0, worstLiveRSRP || 0);
  const hasPoorSignal = worstDetected < -105 && worstDetected !== 0;

  const activeFloor = projectFloors.find(f => f.id === selectedFloorId) || projectFloors[0];

  useEffect(() => {
    async function syncData() {
      const photos = await db.getProjectInstalls(projectId);
      setDonorPhotos(photos);
      
      // Fetch floors
      const { data: floorData } = await supabase.from('floors').select('*').eq('project_id', projectId);
      if (floorData) setFloors(floorData);

      // Fetch HQ Instructions
      const { data: ticketData } = await supabase
        .from('support_tickets')
        .select('admin_reply')
        .eq('project_id', projectId)
        .not('admin_reply', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (ticketData && ticketData.length > 0) {
        setHqInstruction(ticketData[0].admin_reply);
      }

      // PHASE 4.7: Recover buffered "Zaps" from sub-basement
      const buffer = JSON.parse(localStorage.getItem('gfc_zap_buffer') || '[]');
      if (buffer.length > 0) {
        for (const item of buffer) {
           try {
             await supabase.from('system_quotes').insert(item.quote);
             await supabase.from('support_tickets').insert(item.ticket);
             // Clear this specific item from buffer
             const newBuffer = buffer.filter((b: any) => b.id !== item.id);
             localStorage.setItem('gfc_zap_buffer', JSON.stringify(newBuffer));
           } catch (e) { break; } // Still offline, wait for next attempt
        }
      }
    }
    if (projectId) syncData();
  }, [projectId, showAzimuthTool]);

  const getTypeConfig = (type: string) => {
    switch(type?.toLowerCase()) {
      case 'install': return { label: 'Installation Mission', color: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/30', icon: Hammer };
      case 'service': return { label: 'Service Protocol', color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/30', icon: ClipboardCheck };
      default: return { label: 'RF Survey Mission', color: 'text-[#27AAE1]', bg: 'bg-[#27AAE1]/10', border: 'border-[#27AAE1]/30', icon: Signal };
    }
  };

  const typeConfig = getTypeConfig(project?.type);

  const handleUpdateType = async (newType: string) => {
    if (isUpdatingType) return;
    setIsUpdatingType(true);
    try {
      await supabase.from('projects').update({ type: newType }).eq('id', projectId);
      const updated = projects.map((p: any) => p.id === projectId ? { ...p, type: newType } : p);
      setProjects(updated);
      setShowTypeModal(false);
    } catch (err) { console.error(err); } finally { setIsUpdatingType(false); }
  };

  const handleRequestQuote = async () => {
    if (!project) return;
    setIsSubmittingQuote(true);
    
    const worstM = siteMeasurements.reduce((prev, curr) => (curr.rsrp < prev.rsrp ? curr : prev), siteMeasurements[0] || { rsrp: currentSignal?.rsrp || 0, carrierName: currentSignal?.carrier });
    const zapNotes = `AUTOMATED RF ALERT: Critical signal gap detected at ${project?.name}. Worst RSRP: ${worstM.rsrp}dBm. Site contains ${siteMeasurements.length} total samples. Requested by: ${user?.email || 'Field Tech'}.`;

    const quotePayload = { project_id: projectId, user_id: user?.id, tech_notes: zapNotes, status: 'pending' };
    const ticketPayload = {
      ticket_number: `REM-${Math.floor(1000 + Math.random() * 9000)}`,
      priority: 'REMEDIATION',
      subject: `Design Review: ${project?.name}`,
      message: zapNotes,
      status: 'new',
      user_id: user?.id,
      project_id: projectId,
      user_email: user?.email
    };

    try {
      // TRUTH: Attempt instant dual-uplink
      const { error: qErr } = await supabase.from('system_quotes').insert(quotePayload);
      const { error: tErr } = await supabase.from('support_tickets').insert(ticketPayload);

      if (qErr || tErr) throw new Error('Network Shield Active');

      setQuoteSuccess(true);
    } catch (err) { 
      // PHASE 4.7: Buffer the Zap locally for later uplink
      console.warn('[SalesEngine] Resilience Active: Buffering Zap locally.');
      const buffer = JSON.parse(localStorage.getItem('gfc_zap_buffer') || '[]');
      buffer.push({ id: crypto.randomUUID(), quote: quotePayload, ticket: ticketPayload });
      localStorage.setItem('gfc_zap_buffer', JSON.stringify(buffer));
      
      // Still show success to the tech, the system handles the rest
      setQuoteSuccess(true);
    } finally { 
      setIsSubmittingQuote(false); 
      setTimeout(() => { setShowQuoteModal(false); setQuoteSuccess(false); }, 2000);
    }
  };

  const confirmUpload = async (name: string) => {
    if (!namingModal.data || isSaving) return;
    setIsSaving(true); setUploading(true);
    
    const newFloor = { 
      id: crypto.randomUUID(), 
      project_id: projectId, 
      name: name || 'Unnamed Floor', 
      image_data: namingModal.data, 
      created_at: new Date().toISOString() 
    };

    try {
      addFloor(newFloor);
      setSelectedFloorId(newFloor.id);
      setNamingModal({ show: false, data: null });
      setCustomFloorName('');
      setUploading(false);
      setIsSaving(false);
      supabase.from('floors').insert([newFloor]).then(({ error }) => {
        if (error) console.error('[Background Sync Fail]', error);
      });
    } catch (err) { 
      console.error(err); 
      setUploading(false); 
      setIsSaving(false); 
    }
  };

  const confirmPurge = async () => {
    try {
      const { id, type } = deleteModal;
      if (type === 'floor') {
        deleteFloor(id);
        supabase.from('floors').delete().eq('id', id).then();
      } else {
        await db.deleteInstall(id);
        setDonorPhotos(await db.getProjectInstalls(projectId));
      }
      setDeleteModal({ show: false, id: '', name: '', type: 'floor' });
    } catch (err) { 
      console.error(err); 
    }
  };

  const handleExport = async (type: 'PDF' | 'CSV' | 'DONOR') => {
    setIsExporting(true); setShowExportOptions(false);
    try {
      const fileName = `GoFlexConnect_${project?.name || 'Site'}_${Date.now()}.${type === 'CSV' ? 'csv' : 'pdf'}`;
      let base64Data = "";
      if (type === 'CSV') {
        base64Data = btoa(exportToCSV(siteMeasurements));
      } else if (type === 'DONOR') {
        const pdfBlob = await exportInstallPDF(donorPhotos, project?.name || 'Site');
        base64Data = await new Promise((res) => {
          const reader = new FileReader();
          reader.onloadend = () => res((reader.result as string).split(',')[1]);
          reader.readAsDataURL(pdfBlob);
        });
      } else {
        const floorImg = activeFloor?.image_data;
        const snapshot = floorImg ? await generateMapSnapshot(floorImg, siteMeasurements, settings.benchmarkMode, settings.rsrpTarget) : null;
        const pdfBlob = await exportToPDF(siteMeasurements, project?.name || 'Site', snapshot, settings.benchmarkMode, settings.rsrpTarget);
        base64Data = await new Promise((res) => {
          const reader = new FileReader();
          reader.onloadend = () => res((reader.result as string).split(',')[1]);
          reader.readAsDataURL(pdfBlob);
        });
      }
      if (isNative) {
        const savedFile = await Filesystem.writeFile({ path: fileName, data: base64Data, directory: Directory.Cache });
        await Share.share({ title: `GoFlexConnect Export`, url: savedFile.uri });
      } else {
        const link = document.createElement('a'); link.href = `data:application/pdf;base64,${base64Data}`; link.download = fileName; link.click();
      }
    } catch (err) { console.error(err); } finally { setIsExporting(false); }
  };

  const getLabelColorClass = (label: string) => {
    const l = label?.toLowerCase() || '';
    if (l.includes('verizon')) return 'text-red-500 border-red-500/50 bg-red-500/10';
    if (l.includes('at&t')) return 'text-blue-400 border-blue-400/50 bg-blue-400/10';
    if (l.includes('t-mobile')) return 'text-[#E20074] border-[#E20074]/50 bg-[#E20074]/10';
    return 'text-[#27AAE1] border-[#27AAE1]/50 bg-[#27AAE1]/10';
  };

  if (!project) return null;
  if (showAzimuthTool) return <DonorAntennaAzimuth projectId={projectId} projectName={project.name} onBack={() => setShowAzimuthTool(false)} />;

  return (
    <div className="min-h-screen bg-black text-white font-inter pb-40 overflow-y-auto">
      <style>{`
        @keyframes landing-pulse { 0% { transform: scale(1); opacity: 0.3; } 50% { transform: scale(1.2); opacity: 0.4; } 100% { transform: scale(1); opacity: 0.3; } }
        @keyframes bar-pulse { 0%, 100% { transform: scaleY(0.8); opacity: 0.5; } 50% { transform: scaleY(1.15); opacity: 1; } }
        @keyframes emergency-red-flash { 0%, 100% { box-shadow: 0 0 30px rgba(239, 68, 68, 0.5); border-color: rgba(239, 68, 68, 0.6); } 50% { box-shadow: 0 0 100px rgba(239, 68, 68, 0.9); border-color: rgba(239, 68, 68, 1); } }
        @keyframes high-intensity-red-pulse { 0%, 100% { box-shadow: 0 0 10px rgba(239, 68, 68, 0.4); border-color: rgba(239, 68, 68, 0.5); } 50% { box-shadow: 0 0 25px rgba(239, 68, 68, 0.8); border-color: rgba(239, 68, 68, 1); } }
        @keyframes alert-glow { 0%, 100% { border-color: rgba(39, 170, 225, 0.3); } 50% { border-color: rgba(39, 170, 225, 1); background: rgba(39, 170, 225, 0.1); } }
        @keyframes azimuth-glow { 0%, 100% { box-shadow: 0 0 15px rgba(39, 170, 225, 0.2); } 50% { box-shadow: 0 0 30px rgba(39, 170, 225, 0.4); } }
        @keyframes hq-glow { 0%, 100% { border-color: rgba(39, 170, 225, 0.4); box-shadow: 0 0 10px rgba(39, 170, 225, 0.2); } 50% { border-color: #27AAE1; box-shadow: 0 0 25px rgba(39, 170, 225, 0.5); } }
      `}</style>
      
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = () => setNamingModal({ show: true, data: reader.result as string });
          reader.readAsDataURL(file);
        }
      }} />

      <div className="bg-slate-900/95 border-b border-white/5 p-4 pt-14 flex items-center justify-between sticky top-0 z-[600] px-6">
        <button onClick={onBack} className="p-2 flex items-center gap-2 text-[#27AAE1] font-bold text-xs uppercase"><ArrowLeft size={20} /> Back</button>
        {isNative ? <ShieldCheck size={20} className="text-[#27AAE1]" /> : <Cloud size={20} className="text-[#27AAE1] animate-pulse" />}
      </div>

      <div className="p-6">
        {hqInstruction && (
          <div className="w-full mb-8 p-6 bg-[#27AAE1]/5 border-2 border-[#27AAE1]/40 rounded-[2rem] animate-[hq-glow_4s_infinite] shadow-2xl relative overflow-hidden">
             <div className="flex items-start gap-4 relative z-10">
               <div className="p-3 bg-[#27AAE1]/20 rounded-2xl border border-[#27AAE1]/40 shrink-0">
                  <Zap className="text-[#27AAE1] animate-pulse" size={24} fill="#27AAE1" />
               </div>
               <div className="text-left">
                  <p className="text-[10px] font-black text-[#27AAE1] uppercase tracking-[0.4em] mb-1">HQ Engineering Directive</p>
                  <p className="text-sm font-bold text-white leading-relaxed italic">"{hqInstruction}"</p>
               </div>
             </div>
             <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#27AAE1]/5 to-transparent -translate-x-full animate-[shimmer_3s_infinite]" />
          </div>
        )}

        {hasPoorSignal && (
          <button 
            onClick={() => setShowQuoteModal(true)}
            className="w-full mb-8 p-6 bg-[#27AAE1]/5 border border-[#27AAE1]/40 rounded-3xl animate-[alert-glow_3s_infinite] flex items-center justify-between gap-4 shadow-2xl active:scale-95 transition-all"
          >
             <div className="flex items-center gap-4">
               <div className="p-3 bg-[#27AAE1]/20 rounded-2xl border border-[#27AAE1]/40">
                  <ShieldAlert className="text-[#27AAE1]" size={24} />
               </div>
               <div className="text-left">
                  <p className="text-[10px] font-black text-[#27AAE1] uppercase tracking-[0.3em]">Analysis Result</p>
                  <p className="text-sm font-bold text-white italic leading-tight">Dead Zone Found ({worstDetected}dBm)</p>
               </div>
             </div>
             <div className="bg-[#27AAE1] text-black px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg">Get Solution</div>
          </button>
        )}

        <div className="flex flex-col items-center mb-10 text-center relative">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-[#27AAE1]/40 rounded-full animate-[landing-pulse_4s_infinite] blur-xl" />
            <img src="/icons/logo-128.png" className="relative w-16 h-16 rounded-2xl border border-[#27AAE1]/30 shadow-2xl" />
          </div>
          <h1 className="text-3xl font-black italic text-white leading-none tracking-tight">GoFlexConnect</h1>
          <p className="text-xs font-bold text-[#27AAE1] tracking-widest uppercase mt-3">{project?.name}</p>
          <div className={`mt-2 px-3 py-1 rounded-full ${typeConfig.bg} border ${typeConfig.border}`}>
             <span className={`text-[8px] font-black uppercase tracking-widest ${typeConfig.color}`}>{typeConfig.label}</span>
          </div>
          
          <button 
            onClick={() => setShowTypeModal(true)} 
            className="mt-6 px-6 py-3 bg-red-600/10 border-2 border-red-600 rounded-2xl flex items-center gap-3 animate-[high-intensity-red-pulse_2s_infinite] active:scale-95 transition-all shadow-lg"
          >
             <AlertTriangle size={16} className="text-red-500" />
             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500">Change Project Type</span>
             <ChevronRight size={14} className="text-red-500/50" />
          </button>
        </div>

        {projectFloors.length === 0 && !uploading ? (
          <button onClick={() => fileInputRef.current?.click()} className="w-full py-16 border-2 border-dashed border-[#27AAE1]/20 rounded-[2.5rem] bg-[#27AAE1]/5 flex flex-col items-center gap-4 shadow-xl active:bg-[#27AAE1]/10 transition-all">
            <ImagePlus size={40} className="text-[#27AAE1]" />
            <div className="text-center px-6">
              <p className="text-lg font-black text-white leading-tight">Upload Initial Floor Plan</p>
              <p className="text-[10px] font-bold text-[#27AAE1] uppercase tracking-widest mt-2">Required for field mission</p>
            </div>
          </button>
        ) : (
          <div className="space-y-8">
            <div className="space-y-3 text-center">
              <p className="text-[10px] text-[#27AAE1] font-black uppercase tracking-[0.4em] italic">Active Mission Target</p>
              <div className="relative">
                <div className="w-full bg-slate-900 border-2 border-[#27AAE1]/40 rounded-[2.2rem] overflow-hidden shadow-[0_0_40px_rgba(39,170,225,0.15)]">
                  <div className="aspect-video w-full bg-black relative flex items-center justify-center overflow-hidden">
                    <img src={activeFloor?.image_data} className="w-full h-full object-contain opacity-90" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-transparent to-transparent" />
                    <div className="absolute bottom-5 left-6 right-6 flex items-end justify-between">
                       <div className="text-left"><p className="text-2xl font-black italic text-white leading-none">{activeFloor?.name}</p><p className="text-[10px] font-bold text-[#27AAE1] uppercase mt-2 tracking-widest">Locked & Ready</p></div>
                       {isNative && (
                         <button onClick={() => onStartSurvey(activeFloor.id)} className="bg-[#27AAE1] text-black px-6 py-4 rounded-2xl font-black text-xs uppercase shadow-xl active:scale-90 transition-all flex flex-col items-center gap-1.5">
                           <div className="flex items-end gap-1 h-3"><div className="w-1 h-full bg-black/40 rounded-full animate-[bar-pulse_2s_infinite_0.1s]" /><div className="w-1 h-full bg-black/40 rounded-full animate-[bar-pulse_2s_infinite_0.3s]" /><div className="w-1 h-full bg-black/40 rounded-full animate-[bar-pulse_2s_infinite_0.5s]" /></div>
                           Start Survey
                         </button>
                       )}
                    </div>
                  </div>
                </div>
                {isNative && <button onClick={() => setDeleteModal({ show: true, id: activeFloor.id, name: activeFloor.name, type: 'floor' })} className="absolute top-4 right-4 p-3 bg-black/60 backdrop-blur-md rounded-full text-red-500 border border-red-500/20"><Trash2 size={20} /></button>}
              </div>
            </div>

            {donorPhotos.length > 0 && (
              <div className="space-y-4">
                <p className="text-[10px] text-[#27AAE1] font-bold uppercase tracking-[0.5em] text-center italic">Donor Antenna Records</p>
                <div className="flex gap-3 overflow-x-auto pb-4 px-2">
                  {donorPhotos.map((photo) => (
                    <div key={photo.id} className="w-36 h-36 bg-slate-900 border border-white/10 rounded-2xl overflow-hidden flex-shrink-0 relative group">
                      <img src={photo.thumbnail} className="w-full h-full object-cover opacity-60 group-active:opacity-100" />
                      <div className={`absolute top-2 left-2 px-1.5 py-0.5 rounded text-[6px] font-black uppercase border ${getLabelColorClass(photo.label)}`}>{photo.label || 'Donor'}</div>
                      <button onClick={(e) => { e.stopPropagation(); setDeleteModal({ show: true, id: photo.id, name: `${photo.label} (${photo.azimuth}°)`, type: 'donor' }); }} className="absolute top-2 right-2 p-1.5 bg-red-600/80 rounded-lg text-white shadow-lg active:scale-90 transition-all"><Trash2 size={12} /></button>
                      <div className="absolute bottom-2 left-0 right-0 text-center"><span className="text-[10px] font-black italic text-white drop-shadow-lg tabular-nums">{photo.azimuth.toString().padStart(3, '0')}°</span></div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-4">
              <p className="text-[10px] text-slate-600 font-bold uppercase tracking-[0.5em] text-center italic">Satellite Floor Stack</p>
              {projectFloors.map(floor => (
                <div key={floor.id} className={`w-full p-4 rounded-2xl flex items-center justify-between border transition-all ${selectedFloorId === floor.id ? 'bg-[#27AAE1]/10 border-[#27AAE1]/50 shadow-[0_0_15px_rgba(39,170,225,0.1)]' : 'bg-slate-900/40 border-white/5 shadow-lg'}`} onClick={() => setSelectedFloorId(floor.id)}>
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 bg-black rounded-xl overflow-hidden border border-white/10"><img src={floor.image_data} className="w-full h-full object-cover" /></div>
                    <div className="text-left"><p className="text-lg font-bold text-white/90 italic leading-none">{floor.name}</p><p className="text-[8px] text-slate-500 uppercase font-bold tracking-widest mt-1">{selectedFloorId === floor.id ? 'Mission Locked' : 'Tap to Target'}</p></div>
                  </div>
                  {selectedFloorId !== floor.id && <button onClick={(e) => { e.stopPropagation(); setDeleteModal({ show: true, id: floor.id, name: floor.name, type: 'floor' }); }} className="p-3 text-red-500/30 active:text-red-500"><Trash2 size={18} /></button>}
                </div>
              ))}
              {isNative && <button onClick={() => fileInputRef.current?.click()} className="w-full py-5 border border-dashed border-white/10 rounded-2xl flex items-center justify-center gap-3 bg-white/5 active:bg-white/10 mt-4">{uploading ? <Loader2 className="animate-spin text-[#27AAE1]" /> : <Plus size={18} className="text-[#27AAE1]" />}<span className="text-[10px] font-bold text-white uppercase tracking-widest">Add Additional Floor</span></button>}
            </div>

            <div className="mt-12 space-y-4">
              <button 
                onClick={() => setShowAzimuthTool(true)} 
                className="w-full py-7 bg-slate-900 border-2 border-[#27AAE1]/60 rounded-2xl flex items-center justify-center gap-6 shadow-xl animate-[azimuth-glow_3s_infinite] active:scale-95 transition-all"
              >
                <Compass className="w-7 h-7 text-[#27AAE1]" />
                <div className="text-left">
                  <p className="text-sm font-black uppercase text-white leading-none">Azimuth Tool</p>
                  <p className="text-[9px] font-bold text-slate-500 uppercase mt-1">Donor Antenna Alignment</p>
                </div>
              </button>

              <button onClick={onViewHeatmap} className="w-full py-7 bg-slate-900 border border-white/10 rounded-2xl flex items-center justify-center gap-6 active:scale-95 transition-all shadow-xl">
                <Flame className="w-7 h-7 text-orange-500" />
                <div className="text-left">
                  <p className="text-sm font-black uppercase text-white leading-none">View Heatmap</p>
                  <p className="text-[9px] font-bold text-slate-500 uppercase mt-1">Full Building Simulation</p>
                </div>
              </button>

              <div className="relative">
                <button onClick={() => setShowExportOptions(!showExportOptions)} className="w-full py-7 bg-slate-900 border border-white/10 rounded-2xl flex items-center justify-center gap-6 active:scale-95 transition-all shadow-xl">
                  {isExporting ? <Loader2 className="w-7 h-7 animate-spin text-[#27AAE1]" /> : <FileDown className="w-7 h-7 text-[#27AAE1]" />}
                  <div className="text-left"><p className="text-sm font-black uppercase text-white leading-none">Export Report</p><p className="text-[9px] font-bold text-slate-500 uppercase mt-1">Professional PDF / CSV</p></div>
                </button>
                {showExportOptions && (
                  <div className="absolute bottom-24 left-0 right-0 bg-slate-800 border border-white/10 rounded-3xl p-3 flex flex-col gap-2 z-[700] shadow-2xl">
                    <button onClick={() => handleExport('PDF')} className="flex items-center justify-between p-5 bg-black/60 rounded-2xl hover:bg-[#27AAE1]/20 transition-all group"><span className="font-black text-xs uppercase text-white">Premium PDF Report</span><FileText className="text-red-500 group-hover:scale-110 transition-transform" /></button>
                    {donorPhotos.length > 0 && (<button onClick={() => handleExport('DONOR')} className="flex items-center justify-between p-5 bg-black/60 border border-[#27AAE1]/30 rounded-2xl hover:bg-[#27AAE1]/20 transition-all group"><span className="font-black text-xs uppercase text-[#27AAE1]">Donor Azimuth Report</span><FileSearch className="text-[#27AAE1] group-hover:scale-110 transition-transform" /></button>)}
                    <button onClick={() => handleExport('CSV')} className="flex items-center justify-between p-5 bg-black/60 rounded-2xl hover:bg-[#27AAE1]/20 transition-all group"><span className="font-black text-xs uppercase text-white">Data CSV Export</span><FileSpreadsheet className="text-green-500 group-hover:scale-110 transition-transform" /></button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SALES MODAL */}
      {showQuoteModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={() => !isSubmittingQuote && setShowQuoteModal(false)} />
          <div className="relative w-full bg-slate-900 border border-[#27AAE1]/40 rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 text-center">
             {quoteSuccess ? (
               <div className="py-12 flex flex-col items-center"><CheckCircle2 className="text-green-500 mb-4 animate-bounce" size={64} /><h2 className="text-2xl font-black uppercase text-white italic">Submission Sent</h2></div>
             ) : (
               <>
                 <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-black italic uppercase text-white leading-tight">Engineering Analysis</h2><button onClick={() => setShowQuoteModal(false)} className="text-slate-500 p-2"><X size={24} /></button></div>
                 <p className="text-xs text-slate-400 mb-8 px-4 font-bold tracking-tight leading-relaxed">Request a certified system design to resolve connectivity issues for <span className="text-[#27AAE1] underline">{project?.name}</span>.</p>
                 <button disabled={isSubmittingQuote} onClick={handleRequestQuote} className="w-full py-5 bg-[#27AAE1] text-black rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 shadow-[0_0_30px_rgba(39,170,225,0.3)]">{isSubmittingQuote ? <Loader2 className="animate-spin" size={20} /> : <><Zap size={18} fill="black" /> Request Design Review</>}</button>
                 <button onClick={() => setShowQuoteModal(false)} className="w-full py-4 text-slate-500 font-bold uppercase text-[10px] mt-4 tracking-widest">Abort Mission</button>
               </>
             )}
          </div>
        </div>
      )}

      {showTypeModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={() => setShowTypeModal(false)} />
          <div className="relative w-full bg-slate-900 border border-red-600 rounded-[2.5rem] p-8 animate-in zoom-in-95 shadow-2xl">
             <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-black italic uppercase text-white leading-tight">Mission Pivot</h2><button onClick={() => setShowTypeModal(false)} className="text-slate-500 p-2"><X size={24} /></button></div>
             <div className="grid grid-cols-1 gap-4">
                {[{ id: 'survey', label: 'RF Survey Mission', icon: Signal, color: 'text-[#27AAE1]' }, { id: 'install', label: 'Installation Mission', icon: Hammer, color: 'text-green-500' }, { id: 'service', label: 'Service Protocol', icon: ClipboardCheck, color: 'text-orange-500' }].map((type) => (
                  <button key={type.id} disabled={isUpdatingType} onClick={() => handleUpdateType(type.id)} className={`w-full p-6 rounded-2xl border-2 flex items-center justify-between transition-all ${project?.type === type.id ? 'border-white/20 bg-white/5' : 'border-white/5 bg-black/40 opacity-40'}`}>
                    <div className="flex items-center gap-4"><type.icon size={24} className={type.color} /><span className={`text-sm font-black uppercase tracking-widest ${type.color}`}>{type.label}</span></div>
                    {project?.type === type.id && <div className={`w-3 h-3 rounded-full ${type.color} animate-pulse shadow-[0_0_10px_currentColor]`} />}
                  </button>
                ))}
             </div>
             <button onClick={() => setShowTypeModal(false)} className="w-full py-4 text-slate-500 font-bold uppercase text-[10px] mt-6 tracking-widest">Abort Pivot</button>
          </div>
        </div>
      )}

      {namingModal.show && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" />
          <div className="relative w-full bg-slate-900 border border-[#27AAE1]/40 rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95">
             <h2 className="text-xl font-black italic uppercase text-white mb-6">Floor Designation</h2>
             <input type="text" value={customFloorName} onChange={(e) => setCustomFloorName(e.target.value)} className="w-full bg-black border border-white/10 rounded-2xl p-5 text-lg font-bold text-white outline-none focus:border-[#27AAE1]/50 mb-6" placeholder="e.g. Basement..." />
             <div className="grid grid-cols-2 gap-3 mb-8">{['Basement', 'Parking', 'Rooftop', 'Mezzanine'].map(quick => (<button key={quick} disabled={isSaving} onClick={() => confirmUpload(quick)} className="py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold uppercase active:bg-[#27AAE1]/20">{quick}</button>))}</div>
             <button disabled={(!customFloorName && !namingModal.data) || isSaving} onClick={() => confirmUpload(customFloorName)} className="w-full py-5 bg-[#27AAE1] text-black rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2">{isSaving ? <Loader2 className="animate-spin" size={18} /> : 'Confirm Plan'}</button>
             <button onClick={() => setNamingModal({ show: false, data: null })} className="w-full py-4 text-slate-500 font-bold uppercase text-[10px] mt-2">Cancel</button>
          </div>
        </div>
      )}

      {deleteModal.show && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-2xl" onClick={() => setDeleteModal({ show: false, id: '', name: '', type: 'floor' })} />
          <div className="relative w-full bg-slate-950 border-4 border-red-600 rounded-[2.5rem] p-8 animate-[emergency-red-flash_1.5s_infinite] shadow-[0_0_120px_rgba(239,68,68,0.7)] text-center">
             <AlertTriangle size={48} className="text-red-500 mb-6 mx-auto" />
             <h2 className="text-2xl font-black uppercase text-white mb-2 leading-none italic uppercase">Purge Protocol</h2>
             <p className="text-xs text-slate-400 font-bold mb-10">Erasing <span className="text-white underline">{deleteModal.name}</span>. Data destruction is permanent.</p>
             <button onClick={confirmPurge} className="w-full py-5 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest border border-white/20 shadow-lg">Confirm Destruction</button>
             <button onClick={() => setDeleteModal({ show: false, id: '', name: '', type: 'floor' })} className="w-full py-4 text-slate-500 uppercase text-[10px] mt-2 tracking-widest">Abort</button>
          </div>
        </div>
      )}
    </div>
  );
}