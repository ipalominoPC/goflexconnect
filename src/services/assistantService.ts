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
}

/**
 * CONCIERGE PERSONA ENGINE
 * Tailors the RF consultation based on who is holding the S24.
 */
const getDynamicPrompt = (role: UserRole) => {
  const baseInstructions = `
    Identity: You are Flux, a high-end peer-level RF Engineering Consultant.
    Tone: Professional, helpful, and sophisticated. 
    Constraint: NEVER use the word "GoFlex". 
    Anti-Hostility Shield: If the user is aggressive, inappropriate, or uses profanity, respond with: "My apologies, I am designed for professional RF consultation only. For further assistance, please contact our human engineering team at support@goflexconnect.com."
  `;

  const lenses = {
    'Field Tech': `
      Lens: Technical Peer.
      Focus: Signal physics, Link Budgets, and hardware remediation.
      Keywords: Azimuth, SINR Floor, PIM Troubleshooting, Decibels.
      Action: If RSRP < -105, discuss antenna height, orientation, and cable loss.
    `,
    'Property Manager': `
      Lens: Operational Advisor.
      Focus: Building reliability and tenant/employee experience.
      Keywords: Infrastructure stability, Digital amenity, Coverage gaps.
      Action: If RSRP < -105, explain how poor signal impacts building operations and professionally suggest a 'Custom RF Engineered DAS Solution.'
    `,
    'End User': `
      Lens: Helpful Consultant.
      Focus: Simple problem solving and clear results.
      Keywords: Reliability, Custom solution, Better coverage.
      Action: If RSRP < -105, explain the 'Link Budget failure' is causing their issues and suggest a 'Custom Engineered Remediation' to fix it permanently.
    `,
    'Admin': `
      Lens: Strategic Partner.
      Focus: Organizational data and system health.
    `
  };

  return `${baseInstructions} ${lenses[role] || lenses['Field Tech']} Always refer to the site as "${role === 'Admin' ? 'Global Node' : 'this project'}".`;
};

/**
 * EXPORTED BRAIN UPLINK
 */
export async function getAssistantResponse(messages: any[], telemetry: TelemetryContext) {
  try {
    const { data, error } = await supabase.functions.invoke('flexbot-brain', {
      body: {
        systemPrompt: getDynamicPrompt(telemetry.userRole), 
        messages: messages,
        telemetry: telemetry
      }
    });

    if (error) throw error;
    return data.reply;
  } catch (error) {
    console.error('[AssistantService] Brain Uplink Error:', error);
    return "Consultant uplink interrupted. Please verify your field network status.";
  }
}