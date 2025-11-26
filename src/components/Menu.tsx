import { useState } from 'react';
import { Folder, Gauge, Settings as SettingsIcon, LogOut, Calculator, Compass, HelpCircle } from 'lucide-react';
import Chatbot, { ChatbotButton } from './Chatbot';
import SupportForm from './SupportForm';

interface MenuProps {
  onSelectFeature: (feature: 'projects' | 'speedTest' | 'linkBudget' | 'cellTowerCompass') => void;
  onSettings: () => void;
  onFinish: () => void;
}

export default function Menu({ onSelectFeature, onSettings, onFinish }: MenuProps) {
  const [chatbotOpen, setChatbotOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8">
        <div className="fixed top-4 right-4 z-50 flex gap-2">
          <button
            onClick={() => setSupportOpen(true)}
            className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
            aria-label="Contact Support"
            title="Contact Support"
          >
            <HelpCircle className="w-6 h-6 text-slate-700" />
          </button>
          <button
            onClick={onFinish}
            className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
            aria-label="Finish for now"
            title="Finish for now"
          >
            <LogOut className="w-6 h-6 text-slate-700" />
          </button>
          <button
            onClick={onSettings}
            className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
            aria-label="Settings"
          >
            <SettingsIcon className="w-6 h-6 text-slate-700" />
          </button>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <img
              src="/GFConnect.PNG"
              alt="GoFlexConnect Logo"
              className="h-32 mx-auto mb-4"
            />
            <p className="text-slate-600 text-lg">
              Select a feature to get started
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <button
              onClick={() => onSelectFeature('projects')}
              className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 text-left"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Folder className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">
                Survey Projects
              </h2>
              <p className="text-slate-600 leading-relaxed">
                Create and manage site survey projects, upload floor plans, collect measurements, and generate heatmaps
              </p>
            </button>

            <button
              onClick={() => onSelectFeature('speedTest')}
              className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 text-left"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Gauge className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">
                Speed Test
              </h2>
              <p className="text-slate-600 leading-relaxed">
                Test your network speed and view detailed cellular metrics including signal strength and network information
              </p>
            </button>

            <button
              onClick={() => onSelectFeature('linkBudget')}
              className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 text-left"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Calculator className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">
                Link Budget
              </h2>
              <p className="text-slate-600 leading-relaxed">
                Calculate RF link budgets with path loss models for LTE and 5G network planning
              </p>
            </button>

            <button
              onClick={() => onSelectFeature('cellTowerCompass')}
              className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 text-left"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Compass className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">
                Cell Tower Compass
              </h2>
              <p className="text-slate-600 leading-relaxed">
                Find and navigate to nearby cell towers with compass direction guidance
              </p>
            </button>
          </div>

          <div className="mt-8 text-center">
            <p className="text-slate-500 text-sm">
              More features coming soon
            </p>
          </div>
        </div>

        {!chatbotOpen && <ChatbotButton onClick={() => setChatbotOpen(true)} />}
        <Chatbot isOpen={chatbotOpen} onClose={() => setChatbotOpen(false)} />
        {supportOpen && <SupportForm onClose={() => setSupportOpen(false)} />}
      </div>
    </div>
  );
}
