import { useState, useEffect } from 'react';
import { Sparkles, Loader2, AlertTriangle, RefreshCw, ShieldCheck, Lightbulb } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { fetchSurveyInsight, generateSurveyInsights } from '../services/analyticsService';
import { SurveyInsight, Measurement } from '../types';
import { getQualityBucketColor, QualityBucket } from '../utils/qualityUtils';
import { calculateSurveyConfidence, getRecommendedNextAction, checkSevereDeadZones, SurveyConfidence } from '../utils/analyticsBuilder';
import AdSlot from './AdSlot';
import FreeWatermark from './FreeWatermark';
import UsageNoticeBar from './UsageNoticeBar';
import UpgradeProModal from './UpgradeProModal';
import { useStore } from '../store/useStore';
import { assertCanUseAiInsights, trackAndEnforceAiInsightGeneration } from '../services/planService';

interface SurveyInsightsPanelProps {
  surveyId: string;
}

export default function SurveyInsightsPanel({ surveyId }: SurveyInsightsPanelProps) {
  const settings = useStore((state) => state.settings);
  const user = useStore((state) => state.user);
  const [insights, setInsights] = useState<SurveyInsight | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState<boolean>(false);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [confidence, setConfidence] = useState<SurveyConfidence | null>(null);
  const [recommendedAction, setRecommendedAction] = useState<string>('');
  const [coverageQuality, setCoverageQuality] = useState<QualityBucket>('NoService');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [limitError, setLimitError] = useState<string | null>(null);

  useEffect(() => {
    loadInsights();
    loadMeasurements();
  }, [surveyId]);

  const loadMeasurements = async () => {
    try {
      const { data: measurementData, error: measurementError } = await supabase
        .from('measurements')
        .select('*')
        .eq('project_id', surveyId);

      if (measurementError) throw measurementError;

      const measurements = (measurementData || []) as Measurement[];
      setMeasurements(measurements);

      const conf = calculateSurveyConfidence(measurements);
      setConfidence(conf);

      if (measurements.length > 0) {
        const avgRsrp = measurements.reduce((sum, m) => sum + (m.rsrp || 0), 0) / measurements.length;
        const avgSinr = measurements.reduce((sum, m) => sum + (m.sinr || 0), 0) / measurements.length;

        let quality: QualityBucket = 'NoService';
        if (avgRsrp >= -70) quality = 'Excellent';
        else if (avgRsrp >= -85) quality = 'Good';
        else if (avgRsrp >= -95) quality = 'Fair';
        else quality = 'Poor';

        setCoverageQuality(quality);

        const hasSevereDeadZones = checkSevereDeadZones(measurements);
        const action = getRecommendedNextAction({
          coverageGrade: quality,
          confidenceLevel: conf.level,
          hasSevereDeadZones,
        });
        setRecommendedAction(action);
      }
    } catch (err) {
      console.error('Error loading measurements:', err);
    }
  };

  const loadInsights = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchSurveyInsight(supabase, surveyId);
      setInsights(data);
    } catch (err) {
      console.error('Error loading insights:', err);
      setError(err instanceof Error ? err.message : 'Failed to load insights');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    setLimitError(null);

    // Check AI insights limit before generating
    if (user) {
      const limitCheck = await assertCanUseAiInsights(user.id);

      if (!limitCheck.allowed) {
        setLimitError(limitCheck.message || 'AI Insights limit reached');
        return;
      }
    }

    try {
      setGenerating(true);
      setError(null);
      const data = await generateSurveyInsights(surveyId);
      setInsights(data);

      // Track usage after successful generation
      if (user) {
        await trackAndEnforceAiInsightGeneration(user.id);
      }
    } catch (err) {
      console.error('Error generating insights:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate insights');
    } finally {
      setGenerating(false);
    }
  };


  const parseRecommendations = (recommendations: string): string[] => {
    if (!recommendations) return [];
    return recommendations
      .split(/\n\n|\n-|\n•/)
      .map((r) => r.trim())
      .filter((r) => r.length > 0);
  };

  if (loading) {
    return (
      <section className="mt-6 rounded-2xl bg-white border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 text-goflex-blue animate-spin mr-3" />
          <p className="text-gray-600 font-medium">Loading AI insights...</p>
        </div>
      </section>
    );
  }

  return (
    <>
      {/* Usage Notice for AI Insights */}
      <div className="mt-6">
        <UsageNoticeBar
          context={{ type: 'ai_insights' }}
          onUpgrade={() => setShowUpgradeModal(true)}
        />
      </div>

      <section className="mt-6 rounded-2xl bg-white border border-gray-100 shadow-sm p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-goflex-blue" />
            AI Insights
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            GoFlexConnect analyzes your measurements and summarizes what's working—and what isn't.
          </p>
        </div>
        {insights && (
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Regenerating…
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Regenerate
              </>
            )}
          </button>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-800">Error</p>
            <p className="text-sm text-red-600 mt-1">
              {error ? error : error.includes('Analytics not available')
                ? "We haven't finished processing analytics for this survey yet. Try again in a few minutes after the survey data has synced."
                : "We couldn't generate insights for this survey. Please try again in a moment."}
            </p>
            <button
              onClick={loadInsights}
              className="mt-3 text-sm font-semibold text-red-700 hover:text-red-800 underline"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {confidence && (
        <div className="mb-6 bg-gradient-to-br from-slate-50 to-slate-50/50 dark:from-slate-900/30 dark:to-slate-900/10 rounded-xl p-6 border border-slate-200 dark:border-slate-800">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">Survey Confidence</h3>
              </div>
              <div className="flex items-center gap-3 mb-3">
                <span
                  className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold ${
                    confidence.level === 'High'
                      ? 'bg-green-100 text-green-800 border border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700'
                      : confidence.level === 'Medium'
                      ? 'bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700'
                      : 'bg-orange-100 text-orange-800 border border-orange-300 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700'
                  }`}
                >
                  {confidence.level} Confidence
                </span>
                <span className="text-slate-600 dark:text-slate-400 text-sm">
                  {measurements.length} measurement{measurements.length !== 1 ? 's' : ''} collected
                </span>
              </div>
              <ul className="space-y-1 text-sm">
                {confidence.reasons.slice(0, 2).map((reason, idx) => (
                  <li key={idx} className="text-slate-600 dark:text-slate-400 flex items-start gap-2">
                    <span className="text-slate-400 dark:text-slate-600 mt-1">•</span>
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {recommendedAction && (
        <div className="mb-6 bg-gradient-to-br from-cyan-50 to-cyan-50/50 dark:from-cyan-950/30 dark:to-cyan-950/10 rounded-xl p-6 border border-cyan-200 dark:border-cyan-900/50">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-goflex-blue/10 dark:bg-goflex-blue/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Lightbulb className="w-5 h-5 text-goflex-blue" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50 mb-2">Recommended Next Action</h3>
              <p className="text-slate-900 dark:text-white font-medium leading-relaxed">
                {recommendedAction}
              </p>
            </div>
          </div>
        </div>
      )}

      {!insights && !error && (
        <div className="text-center py-12">
          <Sparkles className="w-16 h-16 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            No AI insights yet
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md mx-auto">
            Run at least one survey and collect measurements on a floor to unlock AI-powered insights.
          </p>
          {limitError && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg inline-block">
              <p className="text-sm text-red-800 dark:text-red-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                {limitError}
              </p>
            </div>
          )}
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-goflex-blue to-goflex-blue-dark text-white text-sm font-semibold hover:shadow-lg hover:shadow-goflex-blue/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating insights…
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Start Survey Mode
              </>
            )}
          </button>
        </div>
      )}

      {insights && !error && (
        <div className="space-y-6">

          <div className="bg-gradient-to-br from-blue-50 to-blue-50/50 dark:from-blue-950/30 dark:to-blue-950/10 rounded-xl p-6 border border-blue-100 dark:border-blue-900/50">
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-3">Executive Summary</h3>
            <p className="text-slate-900 dark:text-white font-medium leading-relaxed whitespace-pre-wrap">{insights.summary}</p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-50/50 dark:from-green-950/30 dark:to-green-950/10 rounded-xl p-6 border border-green-100 dark:border-green-900/50">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50 mb-4">Recommendations</h3>
            <ul className="list-disc pl-5 space-y-2">
              {parseRecommendations(insights.recommendations).map((rec, index) => (
                <li key={index} className="text-slate-900 dark:text-white font-medium leading-relaxed">
                  {rec}
                </li>
              ))}
            </ul>
          </div>

          {insights.problemZones &&
            Array.isArray(insights.problemZones) &&
            insights.problemZones.length > 0 && (
              <div className="bg-gradient-to-br from-orange-50 to-orange-50/50 dark:from-orange-950/30 dark:to-orange-950/10 rounded-xl p-6 border border-orange-100 dark:border-orange-900/50">
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50 mb-4">Problem Areas</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-orange-200 dark:border-orange-900/50">
                        <th className="text-left py-3 px-3 font-semibold text-slate-700 dark:text-slate-300 text-sm">
                          Zone
                        </th>
                        <th className="text-left py-3 px-3 font-semibold text-slate-700 dark:text-slate-300 text-sm">
                          Carrier
                        </th>
                        <th className="text-left py-3 px-3 font-semibold text-slate-700 dark:text-slate-300 text-sm">
                          Tech
                        </th>
                        <th className="text-right py-3 px-3 font-semibold text-slate-700 dark:text-slate-300 text-sm">
                          Avg RSRP
                        </th>
                        <th className="text-right py-3 px-3 font-semibold text-slate-700 dark:text-slate-300 text-sm">
                          Avg SINR
                        </th>
                        <th className="text-center py-3 px-3 font-semibold text-slate-700 dark:text-slate-300 text-sm">
                          Quality
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {insights.problemZones.map((zone: any, index: number) => (
                        <tr key={index} className="border-b border-orange-100 dark:border-orange-900/30 last:border-0">
                          <td className="py-3 px-3">
                            <p className="font-semibold text-slate-900 dark:text-slate-50 text-sm">{zone.zoneName}</p>
                            {zone.issueDescription && (
                              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{zone.issueDescription}</p>
                            )}
                          </td>
                          <td className="py-3 px-3 text-slate-700 dark:text-slate-300 text-sm">{zone.carrier}</td>
                          <td className="py-3 px-3 text-slate-700 dark:text-slate-300 text-sm">{zone.tech || 'N/A'}</td>
                          <td className="py-3 px-3 text-right font-mono text-sm text-slate-700 dark:text-slate-300">
                            {zone.avgRsrp?.toFixed(1)} dBm
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-sm text-slate-700 dark:text-slate-300">
                            {zone.avgSinr?.toFixed(1)} dB
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getQualityBucketColor(
                                zone.qualityBucket as QualityBucket
                              )}`}
                            >
                              {zone.qualityBucket}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          <div className="pt-6 border-t border-gray-100 dark:border-gray-800 text-center">
            <p className="text-sm text-gray-600 mb-3">
              Need a fresh read on the latest measurements?
            </p>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Regenerating…
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Regenerate Insights
                </>
              )}
            </button>
            <p className="text-xs text-gray-500 mt-4">
              Generated on {new Date(insights.createdAt).toLocaleString()}
            </p>
          </div>

          <AdSlot placement="analytics-sidebar" />

          {settings.plan !== 'pro' && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <FreeWatermark variant="export" position="bottom-center" />
            </div>
          )}
        </div>
      )}
      </section>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <UpgradeProModal onClose={() => setShowUpgradeModal(false)} />
      )}
    </>
  );
}



