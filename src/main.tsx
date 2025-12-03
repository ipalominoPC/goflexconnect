import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Development helper: expose test runner to console
if (import.meta.env.DEV) {
  (window as any).runSupportTests = async () => {
    const { runSupportTests } = await import('./services/supportService');
    await runSupportTests();
  };
  (window as any).debugCreateSupportTicketOnce = async () => {
    const { debugCreateSupportTicketOnce } = await import('./services/supportService');
    return await debugCreateSupportTicketOnce();
  };
  console.log('%c🧪 Support Diagnostics Available', 'color: #27AAE1; font-size: 14px; font-weight: bold;');
  console.log('%cRun: runSupportTests()', 'color: #64748b; font-size: 12px;');
  console.log('%cRun: debugCreateSupportTicketOnce()', 'color: #64748b; font-size: 12px;');
}
