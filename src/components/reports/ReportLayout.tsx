import { ReactNode } from 'react';
import { ArrowLeft, Printer } from 'lucide-react';

interface ReportLayoutProps {
  title: string;
  projectName: string;
  projectLocation?: string;
  technicianName?: string;
  dateCompleted?: string;
  reportType: 'Survey' | 'Installation';
  isPro: boolean;
  onBack?: () => void;
  children: ReactNode;
}

export default function ReportLayout({
  title,
  projectName,
  projectLocation,
  technicianName,
  dateCompleted,
  reportType,
  isPro,
  onBack,
  children,
}: ReportLayoutProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Non-printable header with back button */}
      <div className="print:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              <span className="font-medium">Back to Project</span>
            </button>
          )}
          <button
            onClick={handlePrint}
            className="ml-auto flex items-center gap-2 px-4 py-2 bg-goflex-blue text-white rounded-lg hover:bg-goflex-blue-dark transition-colors"
          >
            <Printer className="w-4 h-4" />
            Print / Save as PDF
          </button>
        </div>
      </div>

      {/* Printable content area */}
      <div className="max-w-5xl mx-auto px-6 py-8 print:px-0 print:py-0">
        <div className="bg-white rounded-lg shadow-sm print:shadow-none print:rounded-none">
          {/* Report Header */}
          <div className="p-8 border-b border-slate-200 print:border-slate-300">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">{title}</h1>
            <div className="space-y-1 text-slate-700">
              <p className="text-xl font-semibold">{projectName}</p>
              {projectLocation && (
                <p className="text-sm">
                  <span className="font-medium">Location:</span> {projectLocation}
                </p>
              )}
              {technicianName && (
                <p className="text-sm">
                  <span className="font-medium">Technician:</span> {technicianName}
                </p>
              )}
              {dateCompleted && (
                <p className="text-sm">
                  <span className="font-medium">Date Completed:</span>{' '}
                  {new Date(dateCompleted).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>

          {/* Plan Banner - shown but subtle */}
          <div className="print:hidden px-8 py-3 bg-slate-50 border-b border-slate-200">
            {isPro ? (
              <p className="text-sm text-slate-600">
                <span className="font-semibold text-goflex-blue">PRO plan</span> – reports are
                optimized for client delivery.
              </p>
            ) : (
              <p className="text-sm text-slate-600">
                You are currently on the <span className="font-semibold">FREE plan</span>.
                Printed/Exported versions may include GoFlexConnect branding.
              </p>
            )}
          </div>

          {/* Report Content */}
          <div className="p-8">{children}</div>

          {/* Footer - always visible */}
          <div className="px-8 py-6 border-t border-slate-200 print:border-slate-300">
            <p className="text-center text-sm text-slate-500">
              Powered by <span className="font-semibold text-goflex-blue">GoFlexConnect</span> ·{' '}
              <a
                href="https://goflexconnect.com"
                className="hover:underline print:no-underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                goflexconnect.com
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Print-specific styles */}
      <style>{`
        @media print {
          body {
            background: white !important;
          }

          @page {
            margin: 0.75in;
          }

          .print\\:hidden {
            display: none !important;
          }

          .print\\:shadow-none {
            box-shadow: none !important;
          }

          .print\\:rounded-none {
            border-radius: 0 !important;
          }

          .print\\:px-0 {
            padding-left: 0 !important;
            padding-right: 0 !important;
          }

          .print\\:py-0 {
            padding-top: 0 !important;
            padding-bottom: 0 !important;
          }

          .print\\:border-slate-300 {
            border-color: rgb(203 213 225) !important;
          }

          .print\\:no-underline {
            text-decoration: none !important;
          }

          /* Avoid page breaks inside cards/sections */
          .report-section {
            page-break-inside: avoid;
          }

          /* Ensure images don't break across pages */
          img {
            page-break-inside: avoid;
          }

          /* Better table printing */
          table {
            page-break-inside: auto;
          }

          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
        }
      `}</style>
    </div>
  );
}
