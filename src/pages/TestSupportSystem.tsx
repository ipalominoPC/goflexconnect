import { useState } from 'react';
import { Play, CheckCircle, XCircle, Clock } from 'lucide-react';
import { runAllSupportTicketTests } from '../tests/supportTicketSystemTest';

export default function TestSupportSystem() {
  const [running, setRunning] = useState(false);
  const [completed, setCompleted] = useState(false);

  const handleRunTests = async () => {
    setRunning(true);
    setCompleted(false);

    console.clear();
    console.log('%c🧪 Starting Support Ticket System Tests...', 'color: #27AAE1; font-size: 16px; font-weight: bold;');

    try {
      await runAllSupportTicketTests();
      setCompleted(true);
    } catch (error) {
      console.error('Test suite failed:', error);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">
              Support Ticket System Test Suite
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Comprehensive tests for the GoFlexConnect support ticket system
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Test Coverage
            </h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium text-slate-900 dark:text-white">Happy Path</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    Complete ticket creation with email notification
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium text-slate-900 dark:text-white">Ticket Number Uniqueness</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    Generate multiple unique ticket numbers
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium text-slate-900 dark:text-white">Support Inbox Integration</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    Verify tickets appear in admin inbox
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium text-slate-900 dark:text-white">Validation</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    Test required field validation
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium text-slate-900 dark:text-white">Email Format</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    Verify email sending and format
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium text-slate-900 dark:text-white">Category Support</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    Test all ticket categories
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium text-slate-900 dark:text-white">Metadata & Status</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    Verify default values and timestamps
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800 dark:text-amber-200">
                <div className="font-semibold mb-1">Before Running Tests:</div>
                <ul className="list-disc list-inside space-y-1">
                  <li>Open DevTools Console (F12) to see detailed test output</li>
                  <li>Tests will create real tickets in the database</li>
                  <li>Tests will attempt to send real emails</li>
                  <li>Running as admin will enable full Support Inbox verification</li>
                </ul>
              </div>
            </div>
          </div>

          <button
            onClick={handleRunTests}
            disabled={running}
            className="w-full bg-[#27AAE1] hover:bg-[#0178B7] disabled:bg-slate-400 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-[#27AAE1]/25 flex items-center justify-center gap-3"
          >
            {running ? (
              <>
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                <span>Running Tests...</span>
              </>
            ) : completed ? (
              <>
                <CheckCircle className="w-6 h-6" />
                <span>Tests Completed - Check Console</span>
              </>
            ) : (
              <>
                <Play className="w-6 h-6" />
                <span>Run All Tests</span>
              </>
            )}
          </button>

          {completed && (
            <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-green-800 dark:text-green-200 mb-1">
                    Test Suite Completed
                  </div>
                  <div className="text-sm text-green-700 dark:text-green-300">
                    Check the console for detailed test results and verification steps.
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
              Console Output Guide
            </h3>
            <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <div className="flex items-start gap-2">
                <span className="text-[#27AAE1] font-mono">[Support]</span>
                <span>= Service layer logs (ticket creation, email sending)</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-purple-600 dark:text-purple-400 font-mono">[Test]</span>
                <span>= Test runner logs (verification steps)</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-600 dark:text-green-400 font-mono">✅</span>
                <span>= Test passed</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-red-600 dark:text-red-400 font-mono">❌</span>
                <span>= Test failed</span>
              </div>
            </div>
          </div>

          <div className="mt-6 text-center">
            <a
              href="/"
              className="text-[#27AAE1] hover:text-[#0178B7] font-medium transition-colors"
            >
              ← Back to App
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
