import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Camera, Compass, MapPin, Loader2, X, AlertTriangle, Check, Tag, Trash2, ZoomIn, CloudOff } from 'lucide-react';
import { db, InstallPhoto } from '../services/installDatabase';
import { processInstallImage } from '../services/imageProcessor';
import { supabase } from '../services/supabaseClient';
import { useStore } from '../store/useStore';

interface Props {
  projectId: string;
  projectName: string;
  onBack: () => void;
}

export default function DonorAntennaAzimuth({ projectId, projectName, onBack }: Props) {
  const { user } = useStore();
  const [heading, setHeading] = useState<number>(0);
  const [location, setLocation] = useState<{lat: number, lon: number}>({lat: 0, lon: 0});
  const [capturing, setCapturing] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [recentPhotos, setRecentPhotos] = useState<InstallPhoto[]>([]);
  
  const [labelModal, setLabelModal] = useState<{show: boolean, rawBlob: Blob | null}>({ show: false, rawBlob: null });
  const [customLabel, setCustomLabel] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<InstallPhoto | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    async function initSensors() {
      if (window.DeviceOrientationEvent) {
        const handler = (e: any) => {
          if (e.alpha !== null) {
            const val = e.webkitCompassHeading || (360 - e.alpha);
            setHeading(Math.round(val));
          }
        };
        window.addEventListener('deviceorientationabsolute', handler, true);
      }
      navigator.geolocation.watchPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        null, { enableHighAccuracy: true }
      );
      setRecentPhotos(await db.getProjectInstalls(projectId));
    }
    initSensors();
    return () => streamRef.current?.getTracks().forEach(t => t.stop());
  }, [projectId]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => { videoRef.current?.play(); setCameraReady(true); };
      }
    } catch (err: any) { setCameraError('Camera failed to start'); }
  };

  const capturePhoto = async () => {
    if (!videoRef.current || capturing) return;
    setCapturing(true);
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 1280;
    canvas.height = videoRef.current.videoHeight || 720;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(videoRef.current, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      setLabelModal({ show: true, rawBlob: blob });
      setCapturing(false);
    }, 'image/jpeg', 0.95);
  };

  const getLabelStyles = (label: string) => {
    const l = label.toLowerCase();
    if (l.includes('verizon')) return { text: 'Verizon', color: 'text-red-500', border: 'border-red-600', bg: 'bg-red-600/5' };
    if (l.includes('at&t')) return { text: 'AT&T', color: 'text-blue-400', border: 'border-blue-600', bg: 'bg-blue-600/5' };
    if (l.includes('t-mobile')) return { text: 'T-Mobile', color: 'text-pink-500', border: 'border-pink-600', bg: 'bg-pink-600/5' };
    return { text: label, color: 'text-white', border: 'border-white/20', bg: 'bg-white/5' };
  };

  const confirmSaveWithLabel = async (label: string) => {
    if (!labelModal.rawBlob || isSaving || !user) return;
    setIsSaving(true);
    const finalLabel = label.trim() || 'Unknown Donor';
    
    try {
      // 1. Process Watermark (Fast/Local)
      const processed = await processInstallImage(labelModal.rawBlob, {
        azimuth: heading, lat: location.lat, lon: location.lon, projectName: projectName, label: finalLabel, isPro: false 
      });

      // 2. INSTANT SAVE TO VAULT (Field Tech Perspective)
      const localId = crypto.randomUUID();
      const photoData: InstallPhoto = {
        id: localId,
        userId: user.id,
        projectId,
        projectName,
        label: finalLabel,
        azimuth: heading,
        latitude: location.lat,
        longitude: location.lon,
        imageBlob: processed.blob,
        thumbnail: processed.thumb,
        createdAt: Date.now(),
        isSynced: false // Marked for background sync
      };
      
      await db.saveInstall(photoData);
      setRecentPhotos(await db.getProjectInstalls(projectId));
      
      // Close modal immediately so tech can take next photo
      setLabelModal({ show: false, rawBlob: null });
      setCustomLabel('');
      setShowCustomInput(false);
      setIsSaving(false);

      // 3. BACKGROUND SILENT SYNC (Non-blocking)
      const fileName = `${user.id}/${projectId}/${Date.now()}.jpg`;
      
      const { data: uploadData } = await supabase.storage
        .from('donor-images')
        .upload(fileName, processed.blob, { contentType: 'image/jpeg' });

      if (uploadData) {
        const { data: { publicUrl } } = supabase.storage.from('donor-images').getPublicUrl(fileName);
        const { error: dbErr } = await supabase.from('azimuth_records').insert({
          id: localId,
          project_id: projectId,
          user_id: user.id,
          azimuth: heading,
          latitude: location.lat,
          longitude: location.lon,
          image_url: publicUrl,
          notes: finalLabel
        });

        if (!dbErr) {
          await db.markAsSynced(localId);
          setRecentPhotos(await db.getProjectInstalls(projectId));
        }
      }
    } catch (err) {
      console.error("Local save successful, background sync pending", err);
      setLabelModal({ show: false, rawBlob: null });
      setIsSaving(false);
    }
  };

  const confirmPurge = async () => {
    if (!deleteConfirm) return;
    await db.deleteInstall(deleteConfirm);
    setRecentPhotos(await db.getProjectInstalls(projectId));
    setDeleteConfirm(null);
    setSelectedPhoto(null);
  };

  return (
    <div className="fixed inset-0 bg-black z-[10000] flex flex-col font-inter overflow-hidden">
      <style>{`
        @keyframes scan-line { 0% { top: 0%; } 100% { top: 100%; } }
        @keyframes sweep { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes emergency-red-flash { 0%, 100% { box-shadow: 0 0 30px rgba(239, 68, 68, 0.5); border-color: rgba(239, 68, 68, 0.6); } 50% { box-shadow: 0 0 100px rgba(239, 68, 68, 0.9); border-color: rgba(239, 68, 68, 1); } }
      `}</style>

      <div className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between z-[100] bg-gradient-to-b from-black via-black/80 to-transparent pt-14">
        <button onClick={onBack} className="p-4 bg-black/60 backdrop-blur-xl rounded-2xl text-[#27AAE1] border border-white/10 active:scale-90 transition-all"><ArrowLeft size={28} /></button>
        <div className="text-center">
          <p className="text-[10px] font-black text-[#27AAE1] uppercase tracking-[0.4em]">Donor Optics HUD</p>
          <p className="text-sm font-bold italic text-white mt-1 uppercase">{projectName}</p>
        </div>
        <div className="w-12 h-12" />
      </div>

      <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
        {!cameraReady && (
          <div className="absolute inset-0 z-[50] bg-black flex flex-col items-center justify-center">
             <div className="relative w-72 h-72 border border-[#27AAE1]/10 rounded-full flex items-center justify-center">
                <div className="absolute inset-0 border-r-2 border-[#27AAE1]/40 rounded-full animate-[sweep_4s_linear_infinite]" />
                <Compass className="text-[#27AAE1] animate-pulse" size={48} />
             </div>
             <button onClick={startCamera} className="mt-12 px-8 py-4 bg-[#27AAE1] rounded-full text-black font-black uppercase text-sm active:scale-95 shadow-[0_0_40px_rgba(39,170,225,0.4)] tracking-widest">📷 START CAMERA</button>
          </div>
        )}
        <video ref={videoRef} autoPlay={false} playsInline muted className="w-full h-full object-cover" />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[60]">
           <div className="w-40 h-40 border border-[#27AAE1]/10 rounded-full flex items-center justify-center"><div className="w-2 h-2 bg-red-600 rounded-full shadow-[0_0_20px_red]" /></div>
        </div>
        <div className="absolute bottom-44 left-6 right-6 flex items-end justify-between pointer-events-none z-[70]">
           <div className="bg-black/80 backdrop-blur-2xl border border-[#27AAE1]/40 p-6 rounded-[2.5rem] shadow-2xl min-w-[140px]">
              <p className="text-5xl font-black italic text-white leading-none tracking-tighter tabular-nums">{heading.toString().padStart(3, '0')}°</p>
           </div>
           <div className="bg-black/80 backdrop-blur-2xl border border-white/5 p-5 rounded-3xl text-right">
              <p className="text-[10px] font-mono text-white tracking-tighter tabular-nums">{location.lat.toFixed(5)}<br/>{location.lon.toFixed(5)}</p>
           </div>
        </div>
      </div>

      <div className="h-44 bg-black border-t border-white/10 flex items-center px-8 gap-6 overflow-x-auto z-[100]">
         <button onClick={capturePhoto} disabled={capturing || !cameraReady} className="w-24 h-24 bg-[#27AAE1] rounded-full flex items-center justify-center flex-shrink-0 active:scale-95 border-[6px] border-black disabled:opacity-50">
            {capturing ? <Loader2 className="animate-spin text-black" size={36} /> : <Camera size={44} className="text-black" />}
         </button>
         <div className="flex gap-4">
            {recentPhotos.map((p) => {
              const styles = getLabelStyles(p.label || '');
              return (
                <button key={p.id} onClick={() => setSelectedPhoto(p)} className="relative w-24 h-24 rounded-2xl overflow-hidden border border-white/10 flex-shrink-0 active:scale-90 transition-all group">
                  <img src={p.thumbnail} className="w-full h-full object-cover grayscale brightness-50 group-active:grayscale-0" alt="cap" />
                  <div className={`absolute top-1 left-1 px-1.5 py-0.5 rounded text-[6px] font-black uppercase border ${styles.bg} ${styles.border} ${styles.color}`}>
                    {styles.text}
                  </div>
                  <div className="absolute bottom-1 right-1">
                    {!p.isSynced ? <CloudOff size={10} className="text-orange-500" /> : <div className="w-1.5 h-1.5 rounded-full bg-green-500" />}
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20"><ZoomIn size={16} className="text-white opacity-0 group-hover:opacity-100" /></div>
                </button>
              );
            })}
         </div>
      </div>

      {selectedPhoto && (
        <div className="fixed inset-0 z-[20000] bg-black flex flex-col font-inter animate-in fade-in zoom-in-95">
          <div className="absolute top-0 left-0 right-0 p-8 flex items-center justify-between z-50 bg-gradient-to-b from-black to-transparent pt-14">
            <button onClick={() => setSelectedPhoto(null)} className="p-4 bg-black/60 backdrop-blur-xl rounded-2xl text-white border border-white/10 active:scale-90"><ArrowLeft size={24} /></button>
            <div className="text-center">
              <p className={`text-[10px] font-black uppercase tracking-[0.4em] ${getLabelStyles(selectedPhoto.label || '').color}`}>{selectedPhoto.label}</p>
              <p className="text-xs font-bold text-white/40 uppercase mt-1">Azimuth: {selectedPhoto.azimuth}°</p>
            </div>
            <button onClick={() => setDeleteConfirm(selectedPhoto.id!)} className="p-4 bg-red-600/20 backdrop-blur-xl rounded-2xl text-red-500 border border-red-500/20 active:bg-red-600 active:text-white"><Trash2 size={24} /></button>
          </div>
          <div className="flex-1 flex items-center justify-center p-4">
            <img src={URL.createObjectURL(selectedPhoto.imageBlob)} className="max-w-full max-h-[70vh] rounded-3xl shadow-2xl border border-white/5" alt="zoomed" />
          </div>
          <div className="p-10 bg-slate-900/50 border-t border-white/5 flex justify-between items-center text-[10px] font-black text-slate-500 uppercase tracking-widest">
             <div>GPS: {selectedPhoto.latitude.toFixed(5)}, {selectedPhoto.longitude.toFixed(5)}</div>
             <div className="flex items-center gap-2">
               {!selectedPhoto.isSynced && <CloudOff size={12} className="text-orange-500" />}
               <span>{selectedPhoto.isSynced ? 'Synced to Cloud' : 'Pending Sync'}</span>
             </div>
          </div>
        </div>
      )}

      {labelModal.show && (
        <div className="fixed inset-0 z-[20000] flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-md" />
          <div className="relative w-full bg-slate-900 border border-[#27AAE1]/30 rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95">
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-black italic uppercase text-white tracking-tight">Designate Donor</h2>
                {!isSaving && <button onClick={() => setLabelModal({show: false, rawBlob: null})} className="text-slate-500"><X size={24} /></button>}
             </div>
             {!showCustomInput ? (
               <div className="grid grid-cols-1 gap-3">
                 {[
                   { name: 'Verizon', style: 'border-red-600 text-red-500 bg-red-600/5' },
                   { name: 'AT&T', style: 'border-blue-600 text-blue-500 bg-blue-600/5' },
                   { name: 'T-Mobile', style: 'border-[#E20074] text-[#E20074] bg-[#E20074]/5' }
                 ].map((c) => (
                   <button key={c.name} disabled={isSaving} onClick={() => confirmSaveWithLabel(c.name)} className={`w-full p-6 rounded-2xl border-2 flex items-center justify-between transition-all active:scale-95 ${c.style}`}>
                     <span className="text-lg font-black uppercase tracking-widest">{c.name}</span>
                     {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} />}
                   </button>
                 ))}
                 <button onClick={() => setShowCustomInput(true)} className="w-full p-6 rounded-2xl border border-white/10 bg-black/40 text-slate-400 flex items-center justify-between mt-2"><span className="text-lg font-black uppercase tracking-widest">Other / Custom</span><Tag size={20} /></button>
               </div>
             ) : (
               <div className="space-y-6">
                 <input autoFocus type="text" value={customLabel} onChange={(e) => setCustomLabel(e.target.value)} placeholder="Enter label..." className="w-full bg-black border border-[#27AAE1]/30 rounded-2xl p-5 text-lg font-bold text-white outline-none" />
                 <button onClick={() => confirmSaveWithLabel(customLabel)} disabled={!customLabel.trim() || isSaving} className="w-full py-5 bg-[#27AAE1] text-black rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2">
                    {isSaving ? <Loader2 className="animate-spin" size={18} /> : 'Confirm Label'}
                 </button>
               </div>
             )}
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-[30000] flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-2xl" />
          <div className="relative w-full bg-slate-950 border-4 border-red-600 rounded-[2.5rem] p-8 animate-[emergency-red-flash_1.5s_infinite]">
             <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-red-600/30 rounded-full flex items-center justify-center mb-6 border-2 border-red-500"><AlertTriangle size={48} className="text-red-500" /></div>
                <h2 className="text-2xl font-black italic uppercase text-white mb-2">Purge Protocol</h2>
                <p className="text-xs text-slate-400 font-bold mb-10 px-4">This antenna record will be permanently destroyed from the vault.</p>
                <div className="w-full flex flex-col gap-4 mt-8">
                  <button onClick={confirmPurge} className="w-full py-5 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest">Confirm Destruction</button>
                  <button onClick={() => setDeleteConfirm(null)} className="w-full py-4 text-slate-500 font-black uppercase text-[10px]">Abort Mission</button>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}