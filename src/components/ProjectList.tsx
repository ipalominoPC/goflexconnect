import { Plus, MapPin, Calendar, ChevronRight, Archive, FolderOpen } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useState } from 'react';

export default function ProjectList({ onCreateProject, onSelectProject, onBack }: any) {
  const projects = useStore((state) => state.projects);
  const [showClosed, setShowClosed] = useState(false);

  const activeProjects = projects.filter(p => (p.status || 'active') === 'active');
  const closedProjects = projects.filter(p => p.status === 'closed');

  const ProjectCard = ({ p, isClosed }: { p: any, isClosed?: boolean }) => (
    <button onClick={() => onSelectProject(p.id)} className={`w-full relative bg-gradient-to-r from-slate-900/80 to-slate-900/40 border border-white/5 rounded-[32px] p-7 text-left transition-all active:scale-[0.97] hover:border-[#27AAE1]/40 group overflow-hidden ${isClosed ? 'opacity-60 grayscale' : ''}`}>
      <div className={`absolute left-0 top-0 w-1.5 h-full ${isClosed ? 'bg-slate-500' : 'bg-[#27AAE1] shadow-[4px_0_15px_rgba(39,170,225,0.6)]'} opacity-80`} />
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-2xl font-black group-hover:text-[#27AAE1] transition-colors leading-tight mb-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>{p.name}</h3>
          <div className="flex items-center gap-1.5 text-slate-400 font-bold text-[10px] tracking-[0.2em] uppercase">
             <MapPin className="w-3 h-3" /> {p.location || 'SITE SITE'}
          </div>
        </div>
        <ChevronRight className="w-6 h-6 text-slate-700 group-hover:text-[#27AAE1] transition-all" />
      </div>
      <div className="flex items-center gap-6 pt-2">
         <div className="flex flex-col">
            <span className="text-[9px] text-slate-500 font-black uppercase tracking-tighter">Status</span>
            <span className={`text-xs font-bold ${isClosed ? 'text-slate-400' : 'text-[#27AAE1]'}`}>{isClosed ? 'ARCHIVED' : 'ACTIVE'}</span>
         </div>
         <div className="flex flex-col border-l border-white/10 pl-6">
            <span className="text-[9px] text-slate-500 font-black uppercase tracking-tighter">Created</span>
            <span className="text-xs font-bold text-slate-300">{new Date(p.createdAt).toLocaleDateString()}</span>
         </div>
      </div>
    </button>
  );

  return (
    <div className="min-h-screen bg-black text-white p-6 pt-12 font-sans">
      <div className="flex items-center justify-between mb-12">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-[#27AAE1]/10 rounded-2xl border border-[#27AAE1]/30 shadow-[0_0_15px_rgba(39,170,225,0.5)]">
            <img src="/icons/logo-128.png" className="w-8 h-8 rounded-lg shadow-[0_0_5px_rgba(39,170,225,1)]" alt="Logo" />
          </div>
          <h1 className="text-2xl font-black tracking-tight" style={{ fontFamily: 'Montserrat, sans-serif' }}>GoFlexConnect</h1>
        </div>
        <button onClick={onCreateProject} className="p-3 bg-[#27AAE1] rounded-xl shadow-lg shadow-[#27AAE1]/20 active:scale-95">
          <Plus className="w-6 h-6 text-white" />
        </button>
      </div>

      <div className="space-y-5 pb-20">
        {activeProjects.length === 0 ? (
           <p className="text-center text-slate-600 font-bold py-10 uppercase text-[10px] tracking-widest">No Active Projects</p>
        ) : (
          activeProjects.map((p) => <ProjectCard key={p.id} p={p} />)
        )}

        {closedProjects.length > 0 && (
          <div className="mt-12 pt-8 border-t border-white/10">
            <button 
              onClick={() => setShowClosed(!showClosed)}
              className="w-full flex items-center justify-center gap-2 bg-slate-900/50 py-4 rounded-2xl text-slate-400 font-black text-[10px] uppercase tracking-[0.3em] border border-white/5 shadow-inner"
            >
              {showClosed ? <FolderOpen className="w-4 h-4 text-[#27AAE1]" /> : <Archive className="w-4 h-4" />}
              {showClosed ? 'Hide Archive' : `View Closed Projects (${closedProjects.length})`}
            </button>
            
            {showClosed && (
              <div className="space-y-5 mt-6">
                {closedProjects.map((p) => <ProjectCard key={p.id} p={p} isClosed />)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
