import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { surveyId } = await req.json();
    const authHeader = req.headers.get('Authorization')!;
    
    // 1. Connect to Database
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // 2. Fetch Measurements
    const { data: measurements, error: mError } = await supabase
      .from('measurements')
      .select('*')
      .eq('project_id', surveyId);

    if (mError) throw new Error("DB Error: " + mError.message);
    if (!measurements || measurements.length === 0) throw new Error("No measurements found in DB for this project.");

    // 3. Prepare AI Prompt
    const avgRsrp = measurements.reduce((sum, m) => sum + (m.rsrp || 0), 0) / measurements.length;
    const apiKey = Deno.env.get('OPENAI_API_KEY');
    if (!apiKey) throw new Error("OpenAI API Key is missing from Supabase Secrets.");

    // 4. Call OpenAI
    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a Senior RF Engineer. Return JSON with keys: summary (string), recommendations (array of strings).' },
          { role: 'user', content: 'Analyze this survey. Avg RSRP: ' + avgRsrp + 'dBm. Total samples: ' + measurements.length }
        ],
        response_format: { type: 'json_object' }
      })
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      throw new Error("OpenAI API Error: " + errText);
    }

    const aiData = await aiResponse.json();
    const content = JSON.parse(aiData.choices[0].message.content);

    // 5. Save and Return
    const { data: finalData, error: saveError } = await supabase
      .from('survey_insights')
      .upsert({
        survey_id: surveyId,
        summary: content.summary,
        recommendations: Array.isArray(content.recommendations) ? content.recommendations.join('\n') : content.recommendations
      }, { onConflict: 'survey_id' })
      .select().single();

    if (saveError) throw new Error("Save Error: " + saveError.message);

    return new Response(JSON.stringify(finalData), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200 
    });

  } catch (error) {
    // This sends the EXACT error message back to your Samsung S24 screen
    return new Response(JSON.stringify({ error: error.message }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400 
    });
  }
});
