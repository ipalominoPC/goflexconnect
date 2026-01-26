import { SupabaseClient } from '@supabase/supabase-js';
import { SurveyInsight } from '../types';

export async function fetchSurveyInsight(
  supabase: SupabaseClient,
  surveyId: string
): Promise<SurveyInsight | null> {
  const { data, error } = await supabase
    .from('survey_insights')
    .select('*')
    .eq('survey_id', surveyId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching survey insight:', error);
    throw error;
  }

  if (!data) {
    return null;
  }

  return {
    id: data.id,
    surveyId: data.survey_id,
    summary: data.summary,
    recommendations: data.recommendations,
    problemZones: data.problem_zones,
    improvementNotes: data.improvement_notes,
    createdAt: data.created_at,
  };
}

export async function upsertSurveyInsight(
  supabase: SupabaseClient,
  payload: {
    survey_id: string;
    summary: string;
    recommendations: string;
    problem_zones?: any;
    improvement_notes?: any;
  }
): Promise<SurveyInsight> {
  const { data, error } = await supabase
    .from('survey_insights')
    .upsert(
      {
        survey_id: payload.survey_id,
        summary: payload.summary,
        recommendations: payload.recommendations,
        problem_zones: payload.problem_zones,
        improvement_notes: payload.improvement_notes,
      },
      {
        onConflict: 'survey_id',
      }
    )
    .select()
    .single();

  if (error) {
    console.error('Error upserting survey insight:', error);
    throw error;
  }

  return {
    id: data.id,
    surveyId: data.survey_id,
    summary: data.summary,
    recommendations: data.recommendations,
    problemZones: data.problem_zones,
    improvementNotes: data.improvement_notes,
    createdAt: data.created_at,
  };
}

export async function generateSurveyInsights(surveyId: string): Promise<SurveyInsight> {
  const { supabase } = await import("./supabaseClient");
  
  const { data, error } = await supabase.functions.invoke("generate-insights", {
    body: { surveyId },
  });

  if (error) {
    console.error("AI Function Error:", error);
    throw new Error(error.message || "Failed to generate insights");
  }

  return {
    id: data.id,
    surveyId: data.survey_id,
    summary: data.summary,
    recommendations: data.recommendations,
    problemZones: data.problem_zones,
    improvementNotes: data.improvement_notes,
    createdAt: data.created_at,
  };
}
