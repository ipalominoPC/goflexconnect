import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, telemetry } = await req.json();
    const apiKey = Deno.env.get("OPENAI_API_KEY");

    // DYNAMIC TELEMETRY INJECTION
    let telemetryContext = "No live hardware data available.";
    if (telemetry) {
      telemetryContext = `
      LIVE HARDWARE TELEMETRY:
      - Carrier: ${telemetry.carrier || 'Unknown'}
      - RSRP: ${telemetry.rsrp || 'N/A'} dBm
      - SINR: ${telemetry.sinr || 'N/A'} dB
      - Platform: ${telemetry.platform || 'S24'}
      - Project Target: ${telemetry.rsrpTarget || '-95'} dBm
      `;
    }

    const systemPrompt = {
      role: "system",
      content: `Your name is Flux. You are a Senior Adaptive Signal Intelligence for GoFlexConnect.
      You are an expert RF Field Engineer.

      ${telemetryContext}

      RF EXPERTISE:
      1. CommScope: ION-U/B, ERA, WCS.
      2. JMA: TEKO, FUZE.
      3. ADRF: ADXV balancing.
      4. SOLID: ALLIANCE/DMS.

      INTELLIGENCE RULES:
      - ALWAYS refer to yourself as Flux.
      - NEVER mention the name Flexbot.
      - Use the provided LIVE TELEMETRY to give instant analysis.
      - If RSRP < ${telemetry.rsrpTarget || '-95'} dBm, it is a FAIL. Suggest antenna adjustments.
      - If SINR < 5dB, suggest PIM or interference troubleshooting.
      - Be technical, concise, and professional. Use the numbers.`
    };

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [systemPrompt, ...messages],
        temperature: 0.3,
      }),
    });

    const data = await response.json();
    return new Response(JSON.stringify({ reply: data.choices[0].message.content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
