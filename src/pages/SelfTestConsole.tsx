import { useState } from 'react';
import { ArrowLeft, Play, CheckCircle, XCircle, Clock, AlertCircle, Bug } from 'lucide-react';
import { TEST_SCENARIOS, runTests, runAllTests, TestResult, testRLSPolicies } from '../services/selfTest';

interface SelfTestConsoleProps {
  onBack: () => void;
}

export default function SelfTestConsole({ onBack }: SelfTestConsoleProps) {
  const [selectedTests, setSelectedTests] = useState<Set<string>>(new Set());
  const [results, setResults] = useState<TestResult[]>([]);
  const [running, setRunning] = useState(false);
  const [rlsDiagnostic, setRlsDiagnostic] = useState<{ success: boolean; details: string[]; errors: string[] } | null>(null);

  const handleSelectAll = () => {
    if (selectedTests.size === TEST_SCENARIOS.length) {
      setSelectedTests(new Set());
    } else {
      setSelectedTests(new Set(TEST_SCENARIOS.map((s) => s.id)));
    }
  };

  const handleToggleTest = (testId: string) => {
    const newSelected = new Set(selectedTests);
    if (newSelected.has(testId)) {
      newSelected.delete(testId);
    } else {
      newSelected.add(testId);
    }
    setSelectedTests(newSelected);
  };

  const handleRunAll = async () => {
    setRunning(true);
    try {
      const testResults = await runAllTests();
      setResults(testResults);
    } catch (error) {
      console.error('Error running tests:', error);
    } finally {
      setRunning(false);
    }
  };

  const handleRunSelected = async () => {
    if (selectedTests.size === 0) {
      alert('Please select at least one test to run');
      return;
    }

    setRunning(true);
    try {
      const testResults = await runTests(Array.from(selectedTests));
      setResults(testResults);
    } catch (error) {
      console.error('Error running tests:', error);
    } finally {
      setRunning(false);
    }
  };

  const handleRLSDiagnostic = async () => {
    console.log('Running RLS diagnostic...');
    const result = await testRLSPolicies();
    setRlsDiagnostic(result);
    console.log('RLS Diagnostic Result:', result);
  };

  const getResultForTest = (testId: string) => {
    return results.find((r) => r.id === testId);
  };

  const passCount = results.filter((r) => r.status === 'PASS').length;
  const failCount = results.filter((r) => r.status === 'FAIL').length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={onBack}
            className="group flex items-center text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
            <span className="font-semibold">Back to Admin Dashboard</span>
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-[#27AAE1]/10 dark:bg-[#27AAE1]/20 rounded-xl flex items-center justify-center">
              <Play className="w-6 h-6 text-[#27AAE1]" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100">
                Self-Test Console
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Automated testing for usage limits and admin alerts
              </p>
            </div>
          </div>

          {/* Info Banner */}
          <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800 dark:text-blue-300">
              <p className="font-semibold mb-1">Safe for Production</p>
              <p>
                Self-tests create and clean up internal test data automatically. They do not affect real users or
                production data. Test users are prefixed with <code className="px-1 py-0.5 bg-blue-100 dark:bg-blue-900 rounded text-xs">test-selftest@</code> and
                projects with <code className="px-1 py-0.5 bg-blue-100 dark:bg-blue-900 rounded text-xs">[SELFTEST]</code>.
              </p>
            </div>
          </div>

          {/* RLS Diagnostic Button */}
          <div className="mt-4">
            <button
              onClick={handleRLSDiagnostic}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-all flex items-center gap-2"
            >
              <Bug className="w-4 h-4" />
              Run RLS Diagnostic
            </button>
            {rlsDiagnostic && (
              <div className={`mt-3 p-4 rounded-lg ${rlsDiagnostic.success ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'}`}>
                <p className={`font-semibold mb-2 ${rlsDiagnostic.success ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'}`}>
                  {rlsDiagnostic.success ? 'RLS Policies: PASS' : 'RLS Policies: FAIL'}
                </p>
                <div className="text-sm space-y-1">
                  {rlsDiagnostic.details.map((detail, i) => (
                    <p key={i} className="text-slate-700 dark:text-slate-300">{detail}</p>
                  ))}
                  {rlsDiagnostic.errors.map((error, i) => (
                    <p key={i} className="text-red-700 dark:text-red-400 font-semibold">{error}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">Test Scenarios</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Select scenarios to run or run all at once
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleRunSelected}
                disabled={running || selectedTests.size === 0}
                className="px-6 py-2.5 bg-slate-600 hover:bg-slate-700 disabled:bg-slate-400 dark:disabled:bg-slate-700 text-white font-semibold rounded-lg transition-all disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Play className="w-4 h-4" />
                Run Selected ({selectedTests.size})
              </button>
              <button
                onClick={handleRunAll}
                disabled={running}
                className="px-6 py-2.5 bg-[#27AAE1] hover:bg-[#0178B7] disabled:bg-[#27AAE1]/50 text-white font-semibold rounded-lg transition-all disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Play className="w-4 h-4" />
                Run All Tests
              </button>
            </div>
          </div>

          {/* Test Selection */}
          <div className="space-y-2 mb-6">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
              <input
                type="checkbox"
                id="select-all"
                checked={selectedTests.size === TEST_SCENARIOS.length}
                onChange={handleSelectAll}
                disabled={running}
                className="w-4 h-4 text-[#27AAE1] border-slate-300 dark:border-slate-600 rounded focus:ring-[#27AAE1] focus:ring-offset-0"
              />
              <label htmlFor="select-all" className="text-sm font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                Select All
              </label>
            </div>

            {TEST_SCENARIOS.map((scenario) => {
              const result = getResultForTest(scenario.id);
              return (
                <div
                  key={scenario.id}
                  className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <input
                    type="checkbox"
                    id={`test-${scenario.id}`}
                    checked={selectedTests.has(scenario.id)}
                    onChange={() => handleToggleTest(scenario.id)}
                    disabled={running}
                    className="mt-0.5 w-4 h-4 text-[#27AAE1] border-slate-300 dark:border-slate-600 rounded focus:ring-[#27AAE1] focus:ring-offset-0"
                  />
                  <div className="flex-1">
                    <label
                      htmlFor={`test-${scenario.id}`}
                      className="text-sm font-semibold text-slate-900 dark:text-slate-100 cursor-pointer block mb-1"
                    >
                      {scenario.id}: {scenario.name}
                    </label>
                    <p className="text-xs text-slate-600 dark:text-slate-400">{scenario.description}</p>
                  </div>
                  {result && (
                    <div className="flex-shrink-0">
                      {result.status === 'PASS' ? (
                        <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-500" />
                      ) : result.status === 'FAIL' ? (
                        <XCircle className="w-5 h-5 text-red-600 dark:text-red-500" />
                      ) : (
                        <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-500 animate-spin" />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Test Results */}
        {results.length > 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">Test Results</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {passCount} passed, {failCount} failed out of {results.length} tests
                </p>
              </div>
              {passCount + failCount === results.length && (
                <div className="text-right">
                  {failCount === 0 ? (
                    <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-semibold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800">
                      <CheckCircle className="w-4 h-4 mr-1.5" />
                      All Tests Passed
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-semibold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800">
                      <XCircle className="w-4 h-4 mr-1.5" />
                      {failCount} Test{failCount > 1 ? 's' : ''} Failed
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">
                      Test ID
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">
                      Name
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">
                      Duration
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((result) => (
                    <tr
                      key={result.id}
                      className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="py-3 px-4 text-sm font-mono font-semibold text-slate-700 dark:text-slate-300">
                        {result.id}
                      </td>
                      <td className="py-3 px-4 text-sm font-medium text-slate-900 dark:text-slate-100">
                        {result.name}
                      </td>
                      <td className="py-3 px-4">
                        {result.status === 'PASS' ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800">
                            <CheckCircle className="w-3.5 h-3.5 mr-1" />
                            PASS
                          </span>
                        ) : result.status === 'FAIL' ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800">
                            <XCircle className="w-3.5 h-3.5 mr-1" />
                            FAIL
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800">
                            <Clock className="w-3.5 h-3.5 mr-1" />
                            RUNNING
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">
                        {result.duration ? `${result.duration}ms` : '-'}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400 max-w-md">
                        <div className="line-clamp-2" title={result.details}>
                          {result.details}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Running Indicator */}
        {running && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-8 max-w-md w-full mx-4">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-[#27AAE1] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">Running Tests...</h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Creating test users, checking limits, and validating alerts. This may take a few moments.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
