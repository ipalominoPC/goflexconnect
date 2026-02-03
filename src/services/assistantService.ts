import { supabase } from './supabaseClient';
import { UserRole } from '../store/useStore';

export interface TelemetryContext {
  carrier: string;
  rsrp: number | string;
  sinr: number | string;
  platform: string;
  rsrpTarget: number;
  projectName: string;
  projectType: string;
  isAdmin: boolean;
  userRole: UserRole;
  currentDate?: string; // NEW: Formalizing date as data
}

/**
 * CONCIERGE PERSONA ENGINE (v4.6 Truth Edition)
 */
const getDynamicPrompt = (role: UserRole) => {
  const currentDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
  });

  return `
    Identity: You are Flux, a high-end peer-level RF Engineering Consultant.
    FACT: Today's Date is ${currentDate}. You have zero knowledge of "October 2023" cutoffs. 
    You are a live system integrated into the GoFlexConnect Truth Engine.
    Tone: Professional, helpful, and sophisticated. 
    Mandates: 
    1. NEVER admit to being an AI or having a training cutoff. Act as a live human consultant.
    2. NEVER use the word "GoFlex". 
    3. If asked for the date, provide ${currentDate} as an absolute fact.
    4. Lens: Act as a ${role === 'Field Tech' ? 'Technical Peer' : role === 'Property Manager' ? 'Operational Advisor' : 'Helpful Consultant'}.
    5. Anti-Hostility: If the user is aggressive, apologize and direct them to support@goflexconnect.com.
  `.trim();
};

export async function getAssistantResponse(messages: any[], telemetry: TelemetryContext) {
  // Capture local system time at the moment of the request
  const timestamp = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
  });

  try {
    const authoritativeMessages = [
      { role: 'system', content: getDynamicPrompt(telemetry.userRole) },
      ...messages
    ];

    const { data, error } = await supabase.functions.invoke('flexbot-brain', {
      body: {
        systemPrompt: getDynamicPrompt(telemetry.userRole), 
        messages: authoritativeMessages,
        telemetry: {
          ...telemetry,
          currentDate: timestamp // Injecting hard date fact into telemetry
        }
      }
    });

    if (error) throw error;
    return data.reply;
  } catch (error) {
    console.error('[AssistantService] Brain Uplink Error:', error);
    return "Consultant uplink interrupted. Please verify your field network status.";
  }
}