import { Radio, MapPin, FolderKanban } from 'lucide-react';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { SecondaryButton } from '../components/ui/SecondaryButton';

interface LandingProps {
  onGetAccess: () => void;
  onLogIn: () => void;
}

export function Landing({ onGetAccess, onLogIn }: LandingProps) {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-goflex-bg">
      <nav className="sticky top-0 z-50 bg-goflex-bg/95 backdrop-blur-sm border-b border-gray-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <img
                src="/icons/logo-96.png"
                alt="GoFlexConnect logo"
                className="h-8 w-8 rounded-lg shadow-[0_0_10px_rgba(39,170,225,0.8)] border border-[#27AAE1]/30"
              />
              <h1 className="text-xl font-bold text-white dark:text-white" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                GoFlexConnect
              </h1>
            </div>

            <div className="hidden md:flex items-center space-x-8">
              <button
                onClick={() => scrollToSection('hero')}
                className="text-gray-300 hover:text-white transition-colors"
              >
                Home
              </button>
              <button
                onClick={() => scrollToSection('features')}
                className="text-gray-300 hover:text-white transition-colors"
              >
                Features
              </button>
              <button
                onClick={() => scrollToSection('early-access')}
                className="text-gray-300 hover:text-white transition-colors"
              >
                Early Access
              </button>
              <button
                onClick={() => scrollToSection('contact')}
                className="text-gray-300 hover:text-white transition-colors"
              >
                Contact
              </button>
              <PrimaryButton onClick={onGetAccess} className="py-2 px-6">
                Get Free Access
              </PrimaryButton>
            </div>

            <div className="md:hidden">
              <PrimaryButton onClick={onGetAccess} className="py-2 px-4 text-sm">
                Get Access
              </PrimaryButton>
            </div>
          </div>
        </div>
      </nav>

      <section id="hero" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
                Cellular Signal Survey & Analysis Tool
              </h1>
              <p className="text-lg text-gray-300">
                Professional 4G and 5G signal surveying for RF engineers. Create detailed heatmaps,
                analyze network performance, and optimize coverage with real-time data collection and visualization.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <PrimaryButton onClick={onGetAccess}>
                  Get Free Access
                </PrimaryButton>
                <SecondaryButton onClick={onLogIn}>
                  Log In
                </SecondaryButton>
              </div>
            </div>

            <div className="relative">
              <div className="bg-goflex-card rounded-2xl p-8 shadow-2xl border border-gray-800">
                <div className="aspect-video bg-gradient-to-br from-gray-900 to-gray-950 rounded-lg relative overflow-hidden">
                  <div
                    className="absolute inset-0 opacity-60"
                    style={{
                      background: 'radial-gradient(circle at 30% 40%, rgba(39, 170, 225, 0.8) 0%, rgba(39, 170, 225, 0.4) 20%, rgba(1, 120, 183, 0.3) 40%, transparent 70%)',
                    }}
                  />
                  <div
                    className="absolute inset-0 opacity-40"
                    style={{
                      background: 'radial-gradient(circle at 70% 60%, rgba(6, 180, 215, 0.6) 0%, rgba(6, 180, 215, 0.3) 25%, transparent 50%)',
                    }}
                  />
                  <div className="absolute top-4 right-4 bg-goflex-bg/80 backdrop-blur-sm px-4 py-2 rounded-lg">
                    <div className="text-xs text-gray-400">RSRP</div>
                    <div className="text-lg font-bold text-goflex-blue">-75 dBm</div>
                  </div>
                  <div className="absolute bottom-4 left-4 flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-goflex-card/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Powerful Features
            </h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              The ultimate tool for cellular surveying — get network optimization, fast.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-goflex-card rounded-xl p-8 border border-gray-800 hover:border-goflex-blue transition-colors">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-6 bg-[#27AAE1]/10 border border-[#27AAE1]/20 shadow-[0_0_15px_rgba(39,170,225,0.4)]">
                <Radio className="w-7 h-7 text-[#27AAE1] drop-shadow-[0_0_5px_rgba(39,170,225,0.8)]" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                4G & 5G Signal Scanning
              </h3>
              <p className="text-gray-400">
                Capture detailed cellular metrics including RSRP, RSRQ, SINR, and RSSI.
                Support for all major carriers and network technologies.
              </p>
            </div>

            <div className="bg-goflex-card rounded-xl p-8 border border-gray-800 hover:border-goflex-blue transition-colors">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-6 bg-[#27AAE1]/10 border border-[#27AAE1]/20 shadow-[0_0_15px_rgba(39,170,225,0.4)]">
                <MapPin className="w-7 h-7 text-[#27AAE1] drop-shadow-[0_0_5px_rgba(39,170,225,0.8)]" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                Live Heatmap Generation
              </h3>
              <p className="text-gray-400">
                Visualize coverage in real-time with color-coded heatmaps overlaid on floor plans.
                Identify dead zones and optimize placement.
              </p>
            </div>

            <div className="bg-goflex-card rounded-xl p-8 border border-gray-800 hover:border-goflex-blue transition-colors">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-6 bg-[#27AAE1]/10 border border-[#27AAE1]/20 shadow-[0_0_15px_rgba(39,170,225,0.4)]">
                <FolderKanban className="w-7 h-7 text-[#27AAE1] drop-shadow-[0_0_5px_rgba(39,170,225,0.8)]" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                Project-Based Management
              </h3>
              <p className="text-gray-400">
                Organize surveys by project and floor. Track multiple sites, generate reports,
                and maintain a complete history of all measurements.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="early-access" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Early Access: Join Free Today
            </h2>
            <p className="text-lg text-gray-400">
              Be among the first to experience GoFlexConnect while it's in beta
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            <div className="bg-goflex-card rounded-xl p-8 border border-gray-800">
              <h3 className="text-2xl font-bold text-white mb-6">
                Early Access Benefits
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <div className="w-6 h-6 rounded-full bg-goflex-blue/20 flex items-center justify-center mt-0.5 mr-3 flex-shrink-0">
                    <div className="w-2 h-2 rounded-full bg-goflex-blue"></div>
                  </div>
                  <span className="text-gray-300">
                    <strong className="text-white">Full access</strong> to all current features
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="w-6 h-6 rounded-full bg-goflex-blue/20 flex items-center justify-center mt-0.5 mr-3 flex-shrink-0">
                    <div className="w-2 h-2 rounded-full bg-goflex-blue"></div>
                  </div>
                  <span className="text-gray-300">
                    <strong className="text-white">No credit card</strong> required during beta
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="w-6 h-6 rounded-full bg-goflex-blue/20 flex items-center justify-center mt-0.5 mr-3 flex-shrink-0">
                    <div className="w-2 h-2 rounded-full bg-goflex-blue"></div>
                  </div>
                  <span className="text-gray-300">
                    <strong className="text-white">Help shape</strong> the product roadmap
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="w-6 h-6 rounded-full bg-goflex-blue/20 flex items-center justify-center mt-0.5 mr-3 flex-shrink-0">
                    <div className="w-2 h-2 rounded-full bg-goflex-blue"></div>
                  </div>
                  <span className="text-gray-300">
                    <strong className="text-white">Priority support</strong> from our team
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="w-6 h-6 rounded-full bg-goflex-blue/20 flex items-center justify-center mt-0.5 mr-3 flex-shrink-0">
                    <div className="w-2 h-2 rounded-full bg-goflex-blue"></div>
                  </div>
                  <span className="text-gray-300">
                    <strong className="text-white">Grandfathered pricing</strong> when we launch premium
                  </span>
                </li>
              </ul>
            </div>

            <div className="bg-goflex-card rounded-xl p-8 border border-gray-800">
              <h3 className="text-2xl font-bold text-white mb-6">
                Coming in Premium
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center mt-0.5 mr-3 flex-shrink-0">
                    <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                  </div>
                  <span className="text-gray-400">
                    Advanced analytics and AI-powered insights
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center mt-0.5 mr-3 flex-shrink-0">
                    <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                  </div>
                  <span className="text-gray-400">
                    Team collaboration and project sharing
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center mt-0.5 mr-3 flex-shrink-0">
                    <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                  </div>
                  <span className="text-gray-400">
                    Custom branded reports and white-labeling
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center mt-0.5 mr-3 flex-shrink-0">
                    <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                  </div>
                  <span className="text-gray-400">
                    API access for third-party integrations
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center mt-0.5 mr-3 flex-shrink-0">
                    <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                  </div>
                  <span className="text-gray-400">
                    Enterprise support and SLA guarantees
                  </span>
                </li>
              </ul>
              <div className="mt-6 pt-6 border-t border-gray-800">
                <p className="text-sm text-gray-500 italic">
                  Premium features coming Q2 2026
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="contact" className="py-20 px-4 sm:px-6 lg:px-8 bg-goflex-card/30">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Start using GoFlexConnect free
          </h2>
          <p className="text-lg text-gray-400 mb-8">
            No credit card needed. Premium features coming soon.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <PrimaryButton onClick={onGetAccess}>
              Get Free Access
            </PrimaryButton>
            <SecondaryButton onClick={onLogIn}>
              Log In
            </SecondaryButton>
          </div>
        </div>
      </section>

      <footer className="py-8 px-4 sm:px-6 lg:px-8 border-t border-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <span className="text-sm text-gray-500">
                © 2025 GoFlexConnect. All rights reserved.
              </span>
            </div>
            <div className="flex space-x-6">
              <button className="text-sm text-gray-400 hover:text-white transition-colors">
                Privacy Policy
              </button>
              <button className="text-sm text-gray-400 hover:text-white transition-colors">
                Terms of Service
              </button>
              <button className="text-sm text-gray-400 hover:text-white transition-colors">
                Contact
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
