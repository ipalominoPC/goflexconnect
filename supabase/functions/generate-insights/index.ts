import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface GenerateInsightsRequest {
  surveyId: string;
}

type QualityBucket = 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'NoService';

function getQualityBucket(
  avgRsrp: number | null,
  avgSinr: number | null,
  sampleCount: number
): QualityBucket {
  if (sampleCount <= 0 || avgRsrp == null || avgSinr == null) {
    return 'NoService';
  }

  if (avgRsrp <= -120) {
    return 'NoService';
  }

  if (avgRsrp >= -90 && avgSinr >= 10) {
    return 'Excellent';
  }

  if (avgRsrp >= -100 && avgSinr >= 5) {
    return 'Good';
  }

  if (avgRsrp >= -110 && avgSinr >= 0) {
    return 'Fair';
  }

  return 'Poor';
}

interface ZoneAggregation {
  zoneName: string;
  carrier: string;
  techType: string;
  avgRsrp: number;
  avgRsrq: number;
  avgSinr: number;
  avgRssi: number;
  measurementCount: number;
  qualityBucket: QualityBucket;
}

interface ProblemZone {
  zoneName: string;
  carrier: string;
  tech?: string;
  avgRsrp: number;
  avgSinr: number;
  qualityBucket: string;
  issueDescription?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { surveyId }: GenerateInsightsRequest = await req.json();

    if (!surveyId || typeof surveyId !== 'string') {
      return new Response(
        JSON.stringify({ error: 'surveyId is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', surveyId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (projectError) {
      console.error('Error fetching project:', projectError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch project' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!project) {
      return new Response(
        JSON.stringify({ error: 'Project not found or access denied' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!project.analytics) {
      return new Response(
        JSON.stringify({ error: 'Analytics not available for this survey yet. Please ensure measurements have been synced.' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { data: measurements, error: measurementsError } = await supabase
      .from('measurements')
      .select('*')
      .eq('project_id', surveyId);

    if (measurementsError) {
      console.error('Error fetching measurements:', measurementsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch measurements' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!measurements || measurements.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No measurements found for this project' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { data: floors } = await supabase
      .from('floors')
      .select('id, name, level')
      .eq('project_id', surveyId);

    const floorMap = new Map(
      (floors || []).map((f: any) => [f.id, `${f.name} (Level: ${f.level})`])
    );

    const zoneGroups = new Map<string, any[]>();
    for (const m of measurements) {
      const floorName = m.floor_id ? floorMap.get(m.floor_id) || 'Unknown Floor' : 'Unknown Floor';
      const gridKey = m.grid_x !== null && m.grid_y !== null
        ? `${floorName} - Grid(${m.grid_x},${m.grid_y})`
        : floorName;
      
      if (!zoneGroups.has(gridKey)) {
        zoneGroups.set(gridKey, []);
      }
      zoneGroups.get(gridKey)!.push(m);
    }

    const zones: ZoneAggregation[] = [];
    for (const [zoneName, zoneMeasurements] of zoneGroups.entries()) {
      const avgRsrp = zoneMeasurements.reduce((sum, m) => sum + Number(m.rsrp), 0) / zoneMeasurements.length;
      const avgRsrq = zoneMeasurements.reduce((sum, m) => sum + Number(m.rsrq), 0) / zoneMeasurements.length;
      const avgSinr = zoneMeasurements.reduce((sum, m) => sum + Number(m.sinr), 0) / zoneMeasurements.length;
      const avgRssi = zoneMeasurements.reduce((sum, m) => sum + Number(m.rssi), 0) / zoneMeasurements.length;
      
      const carriers = [...new Set(zoneMeasurements.map((m: any) => m.cell_id))];
      const techTypes = [...new Set(zoneMeasurements.map((m: any) => m.tech_type))];

      const qualityBucket = getQualityBucket(avgRsrp, avgSinr, zoneMeasurements.length);

      zones.push({
        zoneName,
        carrier: carriers.join(', '),
        techType: techTypes.join(', '),
        avgRsrp,
        avgRsrq,
        avgSinr,
        avgRssi,
        measurementCount: zoneMeasurements.length,
        qualityBucket,
      });
    }

    zones.sort((a, b) => a.avgRsrp - b.avgRsrp);

    const allRsrpValues = measurements.map((m: any) => Number(m.rsrp));
    const allSinrValues = measurements.map((m: any) => Number(m.sinr));
    const avgRsrp = allRsrpValues.reduce((sum, v) => sum + v, 0) / allRsrpValues.length;
    const minRsrp = Math.min(...allRsrpValues);
    const maxRsrp = Math.max(...allRsrpValues);
    const avgSinr = allSinrValues.reduce((sum, v) => sum + v, 0) / allSinrValues.length;
    const minSinr = Math.min(...allSinrValues);
    const maxSinr = Math.max(...allSinrValues);

    const excellentCount = measurements.filter((m: any) => Number(m.rsrp) > -70 && Number(m.sinr) > 20).length;
    const goodCount = measurements.filter((m: any) => Number(m.rsrp) > -80 && Number(m.rsrp) <= -70 && Number(m.sinr) > 13).length;
    const fairCount = measurements.filter((m: any) => Number(m.rsrp) > -100 && Number(m.rsrp) <= -80 && Number(m.sinr) > 0).length;
    const poorCount = measurements.filter((m: any) => Number(m.rsrp) > -110 && Number(m.rsrp) <= -100 && Number(m.sinr) <= 0).length;
    const noServiceCount = measurements.filter((m: any) => Number(m.rsrp) <= -110).length;

    const pctExcellent = ((excellentCount / measurements.length) * 100).toFixed(1);
    const pctGood = ((goodCount / measurements.length) * 100).toFixed(1);
    const pctFair = ((fairCount / measurements.length) * 100).toFixed(1);
    const pctPoor = ((poorCount / measurements.length) * 100).toFixed(1);
    const pctNoService = ((noServiceCount / measurements.length) * 100).toFixed(1);

    const techList = [...new Set(measurements.map((m: any) => m.tech_type).filter(Boolean))];
    const carriersList = [...new Set(measurements.map((m: any) => m.cell_id).filter(Boolean))];
    const siteName = project.name;
    const siteTypeOrNotes = project.notes || project.building_level || 'Not specified';

    const zonesJson = JSON.stringify(
      zones.map((z) => ({
        zoneName: z.zoneName,
        carrier: z.carrier,
        tech: z.techType,
        avgRsrp: Math.round(z.avgRsrp * 10) / 10,
        avgSinr: Math.round(z.avgSinr * 10) / 10,
        sampleCount: z.measurementCount,
        qualityBucket: z.qualityBucket,
      })),
      null,
      2
    );

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const systemPrompt = `
You are a senior RF engineer and DAS consultant.

You specialize in explaining complex cellular coverage issues in simple, practical language for non-technical business owners and IT managers.

Your goals:
- Be clear, direct, and concise.
- Focus on what the coverage means for real users (dropped calls, slow data, dead zones).
- Provide practical next steps (what to install, where to focus, what to verify).

You are working inside a tool called GoFlexConnect, used by MSPs, DAS installers, and IT consultants to survey warehouses, hospitals, retail stores, offices, and campuses.

Tone:
- Professional but friendly.
- No hype, no marketing fluff.
- Short paragraphs, easy to skim.
`;

    const analytics = project.analytics;
    const analyticsJson = JSON.stringify(analytics, null, 2);

    const userPrompt = `
You are analyzing a cellular coverage survey from the GoFlexConnect app.

Here is the context for this survey:
- Survey ID: ${surveyId}
- Site / project name: ${siteName ?? 'Unknown'}
- Site type or notes: ${siteTypeOrNotes ?? 'Unknown'}
- Carriers measured: ${carriersList.join(', ') || 'Unknown'}
- Technologies: ${techList.join(', ') || 'Unknown'}

Overall KPIs for this survey (all points combined):
- Average RSRP (dBm): ${avgRsrp.toFixed(1)}
- Minimum RSRP (dBm): ${minRsrp.toFixed(1)}
- Maximum RSRP (dBm): ${maxRsrp.toFixed(1)}
- Average SINR (dB):  ${avgSinr.toFixed(1)}
- Minimum SINR (dB):  ${minSinr.toFixed(1)}
- Maximum SINR (dB):  ${maxSinr.toFixed(1)}

Quality distribution (percentage of measurements):
- Excellent: ${pctExcellent}%
- Good:      ${pctGood}%
- Fair:      ${pctFair}%
- Poor:      ${pctPoor}%
- No service: ${pctNoService}%

Advanced Analytics (computed):
${analyticsJson}

Per-zone or per-area breakdown (JSON, one item per area):
${zonesJson}

Each zone object looks like:
[
  {
    "zoneName": "2nd Floor - South Offices",
    "carrier": "AT&T",
    "tech": "5G NR",
    "avgRsrp": -112,
    "avgSinr": -1.5,
    "sampleCount": 42,
    "qualityBucket": "Poor"
  },
  {
    "zoneName": "Main Entrance",
    "carrier": "Verizon",
    "tech": "4G LTE",
    "avgRsrp": -89,
    "avgSinr": 12.0,
    "sampleCount": 31,
    "qualityBucket": "Good"
  }
]

TASK:

1. Write a short EXECUTIVE SUMMARY (max 180 words) that a non-technical business owner can understand.
   - Mention overall coverage quality.
   - Call out the worst areas and best areas.
   - Mention carriers/technologies only if helpful.

2. Write 3–6 PRACTICAL RECOMMENDATIONS that improve cellular performance.
   - Think like a DAS / RF consultant.
   - Examples: add small DAS nodes, adjust donor antenna placement, improve building penetration, carrier priorities, etc.
   - Be concrete but not too technical.

3. Return a MACHINE-READABLE list of the worst coverage zones (max 5) including:
   - zoneName
   - carrier
   - tech
   - avgRsrp
   - avgSinr
   - qualityBucket (Excellent / Good / Fair / Poor / NoService)

IMPORTANT OUTPUT FORMAT:
Return ONLY a single JSON object with EXACTLY this shape:

{
  "summary": "string",
  "recommendations": [
    "string",
    "string",
    "string"
  ],
  "problem_zones": [
    {
      "zoneName": "string",
      "carrier": "string",
      "tech": "string",
      "avgRsrp": -110,
      "avgSinr": -2.5,
      "qualityBucket": "Poor"
    }
  ]
}

No extra data, no explanations.
`;

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    if (!openaiResponse.ok) {
      const error = await openaiResponse.text();
      console.error('OpenAI API error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to generate insights from AI' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const openaiData = await openaiResponse.json();
    const aiResponseContent = openaiData.choices[0]?.message?.content;
    
    if (!aiResponseContent) {
      return new Response(
        JSON.stringify({ error: 'No response from AI' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const insights = JSON.parse(aiResponseContent);

    const recommendationsText = Array.isArray(insights.recommendations)
      ? insights.recommendations.join('\n\n')
      : insights.recommendations;

    const { data: savedInsight, error: saveError } = await supabase
      .from('survey_insights')
      .upsert(
        {
          survey_id: surveyId,
          summary: insights.summary,
          recommendations: recommendationsText,
          problem_zones: insights.problem_zones || null,
          improvement_notes: null,
        },
        {
          onConflict: 'survey_id',
        }
      )
      .select()
      .single();

    if (saveError) {
      console.error('Error saving insights:', saveError);
      return new Response(
        JSON.stringify({ error: 'Failed to save insights' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify(savedInsight),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in generate-insights function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'An unexpected error occurred',
        details: error instanceof Error ? error.message : String(error)
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
