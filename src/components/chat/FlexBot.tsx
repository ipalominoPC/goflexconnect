import { useState, useEffect, useRef } from 'react';
import { Send, X, UserCircle, Briefcase, HelpCircle, Lock, ShieldCheck, CloudOff } from 'lucide-react';
import { useStore, UserRole } from '../../store/useStore';
import { Capacitor } from '@capacitor/core';
import { getCellularSignal } from '../../services/cellularSignalService';
import { getAssistantResponse } from '../../services/assistantService';
import { generateUUID } from '../../utils/uuid'; 
import { supabase } from '../../services/supabaseClient';
import './FlexBot.css';

export default function FlexBot() {
  const { projects, currentProjectId, measurements, settings, isAdmin, user, userRole, setUserRole } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false); 
  
  // SESSION GOVERNANCE
  const [messages, setMessages] = useState<any[]>([]);
  const [conversationId, setConversationId] = useState<string>('');
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<'idle' | 'thinking' | 'speaking'>('idle');
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isNative = Capacitor.isNativePlatform();
  const activeProject = projects.find(p => p.id === currentProjectId);

  // PHASE 4.7: RESILIENCE BUFFER LOGIC
  const persistToLedger = async (msg: any) => {
    try {
      const { error } = await supabase.from('chat_messages').insert([msg]);
      if (error) throw error;
      setIsOfflineMode(false);
    } catch (e) {
      setIsOfflineMode(true);
      const buffer = JSON.parse(localStorage.getItem('gfc_chat_buffer') || '[]');
      buffer.push({ ...msg, buffered_at: new Date().toISOString() });
      localStorage.setItem('gfc_chat_buffer', JSON.stringify(buffer));
      console.warn('[Flux Resilience] Sub-basement detected. Message buffered.');
    }
  };

  useEffect(() => { 
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      if (!conversationId) setConversationId(generateUUID());
      
      // Attempt to flush buffer on open
      const buffer = JSON.parse(localStorage.getItem('gfc_chat_buffer') || '[]');
      if (buffer.length > 0) {
        Promise.all(buffer.map((msg: any) => supabase.from('chat_messages').insert([msg])))
          .then(() => {
            localStorage.removeItem('gfc_chat_buffer');
            setIsOfflineMode(false);
          })
          .catch(() => setIsOfflineMode(true));
      }
    }
  }, [messages, isOpen, status]);

  const selectProtocol = async (role: UserRole) => {
    setUserRole(role);
    setIsInitialized(true);
    
    const today = new Date().toLocaleDateString('en-US', { 
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
    });

    const greeting = `Hi, I'm Flux. Today is ${today}. Secure link established for ${activeProject?.name || 'this mission'}. How shall we proceed with your RF strategy?`;
    setMessages([{ role: 'assistant', content: greeting }]);

    await persistToLedger({
      conversation_id: conversationId,
      user_id: user?.id,
      role: 'assistant',
      content: greeting
    });
  };

  const handleSend = async () => {
    if (!input.trim() || status === 'thinking') return;
    
    const nastyWords = ['fuck', 'shit', 'asshole', 'bitch'];
    if (nastyWords.some(word => input.toLowerCase().includes(word))) {
      const shieldMsg = "My apologies, I am designed for professional RF consultation only. For further assistance, please contact our human engineering team at support@goflexconnect.com.";
      setMessages(prev => [...prev, { role: 'user', content: input }, { role: 'assistant', content: shieldMsg }]);
      
      await persistToLedger({ conversation_id: conversationId, user_id: user?.id, role: 'user', content: input });
      await persistToLedger({ conversation_id: conversationId, user_id: user?.id, role: 'assistant', content: shieldMsg });
      
      setInput('');
      return;
    }

    let liveSignal = null;
    if (isNative) { try { liveSignal = await getCellularSignal(); } catch (e) {} }
    const latestMeasure = measurements[measurements.length - 1];
    
    const telemetryContext = {
      carrier: liveSignal?.carrier || latestMeasure?.carrierName || 'N/A',
      rsrp: liveSignal?.rsrp || latestMeasure?.rsrp || 'N/A',
      sinr: liveSignal?.sinr || latestMeasure?.sinr || 'N/A',
      platform: isNative ? 'S24-Hardware-Modem' : 'Cloud-Web-Dashboard',
      rsrpTarget: settings.rsrpTarget,
      projectName: activeProject?.name || 'Unnamed Mission',
      projectType: activeProject?.type || 'RF Survey',
      projectId: currentProjectId,
      userEmail: user?.email,      
      userRole: userRole,
      isAdmin: isAdmin,
      currentDate: new Date().toLocaleDateString('en-US', { 
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
      }),
      conversationId: conversationId
    };

    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setStatus('thinking');

    // Resilient Uplink for User Message
    persistToLedger({
      conversation_id: conversationId,
      user_id: user?.id,
      role: 'user',
      content: input
    });

    const botReply = await getAssistantResponse([...messages, userMsg], telemetryContext);
    
    // Resilient Uplink for Bot Response
    await persistToLedger({
      conversation_id: conversationId,
      user_id: user?.id,
      role: 'assistant',
      content: botReply
    });

    setMessages(prev => [...prev, { role: 'assistant', content: botReply }]);
    setStatus('idle');
  };

  return (
    <div className="fixed bottom-24 right-6 z-[9999] font-inter">
      {!isOpen && (
        <div className="flux-pill-container">
          <button onClick={() => setIsOpen(true)} className="flex items-center gap-3 bg-black/95 backdrop-blur-2xl border border-white/10 px-5 py-3 rounded-full flux-breathing-glow active:scale-95 transition-all group">
            <div className="relative w-5 h-5">
              <div className="absolute inset-0 bg-[#27AAE1] rounded-full blur-md animate-pulse opacity-50" />
              <img src="/chatpill.svg" className="w-full h-full relative z-10" alt="Flux" />
            </div>
            <span className="text-[11px] font-bold text-white/90 tracking-tight italic uppercase">Ask Consultant</span>
          </button>
        </div>
      )}

      {isOpen && (
        <div className="w-[340px] h-[550px] bg-black border border-white/10 rounded-[2.5rem] shadow-[0_0_60px_rgba(0,0,0,1)] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
          
          <div className="p-6 bg-white/5 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-4">
               <div className="flux-avatar-container">
                <img src="/flexbot/avatar-face.png" className="flux-face-img" alt="Flux" />
               </div>
               <div>
                <p className="text-base font-black text-white italic leading-none flex items-center gap-1.5">
                    Flux 
                    <span className="text-[8px] bg-[#27AAE1]/20 text-[#27AAE1] px-1 rounded font-bold">v4.7</span>
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  <p className="text-[10px] text-[#27AAE1] font-black uppercase tracking-widest leading-none">Intelligence</p>
                  {isOfflineMode && <div className="flex items-center gap-1 bg-orange-500/20 px-1 rounded"><CloudOff size={8} className="text-orange-500" /><span className="text-[7px] text-orange-500 font-bold uppercase">Buffered</span></div>}
                </div>
               </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-2 text-slate-500 hover:text-white transition-colors"><X size={20} /></button>
          </div>

          <div className="flex-1 relative overflow-hidden flex flex-col">
            
            {!isInitialized && (
              <div className="protocol-overlay">
                <div className="mb-8 text-center px-4">
                   <h2 className="text-sm font-black text-white italic" style={{ textTransform: 'none' }}>How can I help you today?</h2>
                   <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">Select a lens to view your RF data</p>
                </div>
                <div className="w-full space-y-3 px-4">
                  {[
                    { id: 'Field Tech', label: 'Technical / Field Tech', sub: 'Engineering & Troubleshooting', color: 'protocol-btn-tech', icon: UserCircle },
                    { id: 'Property Manager', label: 'Operational / Property Manager', sub: 'Reliability & Tenant Impact', color: 'protocol-btn-op', icon: Briefcase },
                    { id: 'End User', label: 'Solution / End User', sub: 'Connectivity & Remediation', color: 'protocol-btn-solution', icon: HelpCircle }
                  ].map((p) => (
                    <button key={p.id} onClick={() => selectProtocol(p.id as UserRole)} className={`protocol-btn ${p.color} flex items-center gap-4 group`}>
                      <div className="p-2 rounded-xl bg-white/5 border border-white/10 group-hover:scale-110 transition-transform"><p.icon size={16} className="text-white opacity-90" /></div>
                      <div className="text-left">
                        <p className="text-[11px] font-black text-white tracking-wide">{p.label}</p>
                        <p className="text-[8px] font-bold text-slate-500 uppercase mt-0.5 tracking-tighter">{p.sub}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-6 space-y-5 scrollbar-hide">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[88%] px-5 py-3.5 text-[12.5px] leading-relaxed shadow-sm ${
                    m.role === 'user' ? 'fb-message-user' : 'fb-message-bot'
                  }`}>
                    {m.content}
                  </div>
                </div>
              ))}
              
              {status === 'thinking' && (
                <div className="flex justify-start">
                  <div className="fb-message-bot px-5 py-3 flex items-center gap-2">
                    <span className="text-[9px] font-black text-[#27AAE1] uppercase tracking-tighter mr-1">Analyzing</span>
                    <div className="tesla-dot" />
                    <div className="tesla-dot" />
                    <div className="tesla-dot" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-5 bg-white/5 border-t border-white/5 flex gap-3">
              <input 
                type="text" 
                value={input} 
                onChange={(e) => setInput(e.target.value)} 
                onKeyDown={(e) => e.key === 'Enter' && handleSend()} 
                disabled={!isInitialized} 
                className="flex-1 bg-black border border-white/10 rounded-2xl px-5 py-3 text-[13px] text-white outline-none focus:border-[#27AAE1]/40 placeholder:text-slate-800 disabled:opacity-20" 
                placeholder="Ask your consultant..." 
              />
              <button 
                onClick={handleSend} 
                disabled={!isInitialized || status === 'thinking'} 
                className="bg-white text-black px-5 rounded-2xl active:scale-90 transition-all disabled:opacity-20 shadow-xl"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}