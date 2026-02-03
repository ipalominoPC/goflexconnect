import { useState, useEffect } from 'react';
import { Search, Users, RefreshCw, Loader2, User, Building2, Phone, Mail, Key, ChevronDown, ChevronUp, ShieldAlert } from 'lucide-react';
import { getFleetDirectory, resetUserOnboarding, triggerPasswordResetHQ, FleetMember } from '../../services/adminUserService';

export default function FleetDirectory() {
  const [members, setMembers] = useState<FleetMember[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<FleetMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  // IDENTITY GOVERNANCE STATE
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    loadDirectory();
  }, []);

  useEffect(() => {
    const filtered = members.filter(m => 
      m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.company_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredMembers(filtered);
  }, [searchQuery, members]);

  const loadDirectory = async () => {
    setLoading(true);
    const data = await getFleetDirectory();
    setMembers(data);
    setLoading(false);
  };

  const handleResetOnboarding = async (id: string, email: string) => {
    if (!window.confirm(`FORCE RESET Mission Onboarding for ${email}?`)) return;
    setProcessingId(id);
    try {
      await resetUserOnboarding(id);
      alert('SUCCESS: User onboarding state purged.');
      await loadDirectory();
    } finally {
      setProcessingId(null);
    }
  };

  const handlePasswordReset = async (email: string) => {
    if (!window.confirm(`Send secure password reset link to ${email}?`)) return;
    setProcessingId(email);
    try {
      const { success } = await triggerPasswordResetHQ(email);
      if (success) alert('SUCCESS: Reset token dispatched via encrypted email.');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 animate-pulse">
      <RefreshCw className="w-8 h-8 text-purple-500 animate-spin mb-4" />
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Syncing Identity Nodes...</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* IDENTITY SEARCH */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          placeholder="Query Fleet Identities..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-black/40 border border-purple-500/20 rounded-2xl text-sm text-white placeholder:text-slate-700 focus:border-purple-500/50 outline-none transition-all"
        />
      </div>

      {/* IDENTITY DIRECTORY */}
      <div className="grid grid-cols-1 gap-3 overflow-y-auto max-h-[600px] pr-2 scrollbar-hide pb-10">
        {filteredMembers.map((member) => (
          <div 
            key={member.id} 
            className={`bg-white/[0.02] border rounded-[1.5rem] overflow-hidden transition-all duration-300 ${
              expandedId === member.id ? 'border-purple-500/40 bg-white/[0.04]' : 'border-white/5'
            }`}
          >
            {/* COLLAPSED NODE HEADER */}
            <div 
              onClick={() => setExpandedId(expandedId === member.id ? null : member.id)}
              className="p-5 flex items-center justify-between cursor-pointer group"
            >
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className={`w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center border transition-all ${
                    expandedId === member.id ? 'border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.3)]' : 'border-white/10'
                  }`}>
                    <User size={24} className={expandedId === member.id ? 'text-purple-400' : 'text-slate-500'} />
                  </div>
                  <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-black ${
                    member.status === 'active' ? 'bg-green-500 animate-pulse' : 'bg-slate-600'
                  }`} />
                </div>
                
                <div className="text-left">
                  <p className="text-sm font-black text-white uppercase tracking-tight leading-none mb-1.5">{member.full_name}</p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter leading-none">{member.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black text-purple-400 tabular-nums bg-purple-500/10 px-2.5 py-1 rounded-lg border border-purple-500/20">
                  {member.project_count} Missions
                </span>
                {expandedId === member.id ? <ChevronUp size={18} className="text-slate-500" /> : <ChevronDown size={18} className="text-slate-700" />}
              </div>
            </div>

            {/* EXPANDED ADMINISTRATIVE HUD */}
            {expandedId === member.id && (
              <div className="px-6 pb-6 pt-2 space-y-6 animate-in slide-in-from-top-2 duration-300">
                
                {/* CONTACT & ORG DATA */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                      <p className="text-[7px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1.5">Corporate Entity</p>
                      <div className="flex items-center gap-2 text-[11px] text-white font-bold">
                        <Building2 size={14} className="text-purple-500" /> {member.company_name || 'Individual Contributor'}
                      </div>
                   </div>
                   <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                      <p className="text-[7px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1.5">Direct Voice Link</p>
                      <div className="flex items-center gap-2 text-[11px] text-white font-bold">
                        <Phone size={14} className="text-purple-500" /> {member.phone_number || 'No Link Verified'}
                      </div>
                   </div>
                </div>

                {/* HQ SUPPORT PROTOCOLS */}
                <div className="flex flex-col gap-2">
                   <p className="text-[7px] font-black text-slate-600 uppercase tracking-[0.3em] mb-1 ml-1">Governance Controls</p>
                   <div className="flex gap-2">
                     <button 
                       onClick={(e) => { e.stopPropagation(); handlePasswordReset(member.email); }}
                       disabled={processingId === member.email}
                       className="flex-1 py-3.5 bg-purple-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all disabled:opacity-50"
                     >
                       {processingId === member.email ? <Loader2 size={14} className="animate-spin" /> : <Key size={14} />}
                       Reset Credentials
                     </button>
                     
                     <button 
                       onClick={(e) => { e.stopPropagation(); handleResetOnboarding(member.id, member.email); }}
                       disabled={processingId === member.id}
                       className="flex-1 py-3.5 bg-white/5 border border-white/10 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white/10 active:scale-95 transition-all disabled:opacity-50"
                     >
                       {processingId === member.id ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                       Reset Mission
                     </button>
                   </div>
                </div>

                <div className="flex justify-between items-center text-[7px] text-slate-700 font-bold uppercase tracking-[0.2em] pt-2 border-t border-white/5">
                   <span>Identity node: {member.id}</span>
                   <span>Last Uplink: {new Date(member.last_active || '').toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>
        ))}

        {filteredMembers.length === 0 && (
          <div className="py-20 text-center opacity-40">
             <Users size={32} className="mx-auto text-slate-700 mb-2" />
             <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">No Verified Nodes Found</p>
          </div>
        )}
      </div>
    </div>
  );
}