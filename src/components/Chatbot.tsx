import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, HelpCircle, Loader2, MapPin, Radio, TrendingUp } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: number;
}

interface ChatbotProps {
  isOpen: boolean;
  onClose: () => void;
}

const FAQ_RESPONSES: Record<string, string> = {
  'how to start': 'To start a survey project:\n1. Click "Survey Projects" from the main menu\n2. Create a new project with the "+" button\n3. Upload a floor plan (optional)\n4. Click "Start Survey" to begin collecting measurements',
  'floor plan': 'To upload a floor plan:\n1. Open or create a project\n2. Click "Upload Floor Plan"\n3. Select an image file from your device\n4. The floor plan will be used as a background for your heatmap',
  'take measurement': 'To take a measurement:\n1. Enter survey mode from your project\n2. Tap on the floor plan where you want to measure\n3. The app will capture signal data automatically\n4. Measurements appear as colored points on the heatmap',
  'offline': 'GoFlexConnect works offline! All your data is stored locally and will automatically sync to the cloud when you reconnect to the internet.',
  'speed test': 'To run a speed test:\n1. Click "Speed Test" from the main menu\n2. Tap "Run Speed Test"\n3. Wait for the test to complete\n4. View detailed network metrics and signal strength',
  'heatmap': 'The heatmap visualizes signal strength across your floor plan:\n- Green = Good signal\n- Yellow = Fair signal\n- Red = Poor signal\n\nYou can change the metric (RSRP, RSRQ, SINR, RSSI) from the dropdown menu.',
  'export': 'To export your data:\n1. Open a project\n2. View the diagnostics page\n3. Use the export options to save measurements as CSV or generate reports',
  'help': 'I can help you with:\n• Starting a survey project\n• Uploading floor plans\n• Taking measurements\n• Understanding heatmaps\n• Running speed tests\n• Working offline\n• Exporting data\n\nJust ask me anything!',
};

export default function Chatbot({ isOpen, onClose }: ChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hi! I'm here to help you use GoFlexConnect. Ask me anything about surveying, measurements, or app features!",
      isBot: true,
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getAiResponse = async (userMessage: string): Promise<string> => {
    try {
      const conversationHistory = messages
        .slice(-6)
        .map((msg) => ({
          role: msg.isBot ? 'assistant' : 'user',
          content: msg.text,
        }));

      const response = await fetch(`${supabaseUrl}/functions/v1/chatbot`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          conversationHistory,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      return data.response;
    } catch (error) {
      console.error('Error getting AI response:', error);
      throw error;
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      isBot: false,
      timestamp: Date.now(),
    };

    const messageText = input;
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const aiResponseText = await getAiResponse(messageText);

      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponseText,
        isBot: true,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, botResponse]);
    } catch (error) {
      console.error('Error in handleSend:', error);
      setError('Sorry, I\'m having trouble connecting right now. Please try again.');

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'I apologize, but I\'m having trouble responding right now. Please try again in a moment, or ask about: starting projects, floor plans, measurements, heatmaps, speed tests, or offline mode.',
        isBot: true,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (question: string) => {
    setInput(question);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-50 w-full max-w-md sm:w-96 bg-white dark:bg-slate-900 rounded-xl shadow-2xl flex flex-col max-h-[600px] border border-slate-200 dark:border-slate-700 mx-4 sm:mx-0 transition-all duration-200 ease-out animate-in slide-in-from-bottom-4"
      style={{ maxHeight: 'calc(100vh - 2rem)' }}
    >
      <div className="bg-slate-100 dark:bg-slate-800 px-4 py-3 flex items-center justify-between border-b border-slate-200 dark:border-slate-700 rounded-t-xl">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#27AAE1] rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
            <img
              src="/icons/logo-96.png"
              alt="GoFlexConnect"
              className="w-5 h-5 object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
                (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
              }}
            />
            <MessageCircle className="w-5 h-5 text-white hidden" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
              GoFlexConnect Assistant
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
              Here to help with RF surveys
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg p-1.5 transition-colors focus:outline-none focus:ring-2 focus:ring-[#27AAE1]/40"
          aria-label="Close chat"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 dark:bg-slate-900/50">
        {messages.map((message, index) => (
          <div
            key={message.id}
            className={`flex ${message.isBot ? 'justify-start' : 'justify-end'} animate-in fade-in slide-in-from-bottom-2`}
            style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'backwards' }}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                message.isBot
                  ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 shadow-sm border border-slate-200 dark:border-slate-700'
                  : 'bg-[#27AAE1] text-white shadow-sm'
              }`}
            >
              <p className="text-sm whitespace-pre-line leading-relaxed">{message.text}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2">
            <div className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 shadow-sm border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2.5 flex items-center gap-2">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-[#27AAE1] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-2 h-2 bg-[#27AAE1] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-2 h-2 bg-[#27AAE1] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
              <span className="text-xs text-slate-600 dark:text-slate-400">Assistant is thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 rounded-b-xl">
        {error && (
          <div className="mb-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-3 py-2 rounded-lg text-xs animate-in fade-in slide-in-from-top-1">
            {error}
          </div>
        )}

        <div className="flex flex-wrap gap-2 mb-3">
          <button
            onClick={() => handleQuickAction('How do I start a project?')}
            className="group text-xs border-2 border-[#27AAE1]/30 hover:border-[#27AAE1] dark:border-[#27AAE1]/20 dark:hover:border-[#27AAE1] text-slate-700 dark:text-slate-300 hover:text-[#27AAE1] dark:hover:text-[#27AAE1] px-3 py-1.5 rounded-full whitespace-nowrap transition-all duration-200 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-[#27AAE1]/40"
            aria-label="Ask about starting a project"
          >
            <MapPin className="w-3 h-3 inline mr-1 transition-transform group-hover:scale-110" />
            Start Project
          </button>
          <button
            onClick={() => handleQuickAction('How does offline mode work?')}
            className="group text-xs border-2 border-[#27AAE1]/30 hover:border-[#27AAE1] dark:border-[#27AAE1]/20 dark:hover:border-[#27AAE1] text-slate-700 dark:text-slate-300 hover:text-[#27AAE1] dark:hover:text-[#27AAE1] px-3 py-1.5 rounded-full whitespace-nowrap transition-all duration-200 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-[#27AAE1]/40"
            aria-label="Ask about offline mode"
          >
            <Radio className="w-3 h-3 inline mr-1 transition-transform group-hover:scale-110" />
            Offline Mode
          </button>
          <button
            onClick={() => handleQuickAction('Tell me about heatmaps')}
            className="group text-xs border-2 border-[#27AAE1]/30 hover:border-[#27AAE1] dark:border-[#27AAE1]/20 dark:hover:border-[#27AAE1] text-slate-700 dark:text-slate-300 hover:text-[#27AAE1] dark:hover:text-[#27AAE1] px-3 py-1.5 rounded-full whitespace-nowrap transition-all duration-200 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-[#27AAE1]/40"
            aria-label="Ask about heatmaps"
          >
            <TrendingUp className="w-3 h-3 inline mr-1 transition-transform group-hover:scale-110" />
            Heatmaps
          </button>
        </div>

        <div className="flex gap-2 items-end">
          <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border-2 border-slate-200 dark:border-slate-700 focus-within:border-[#27AAE1] dark:focus-within:border-[#27AAE1] transition-colors">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask me anything..."
              disabled={isLoading}
              className="w-full px-4 py-2.5 bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-500 focus:outline-none disabled:opacity-50"
              aria-label="Type your message"
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="bg-[#27AAE1] hover:bg-[#0178B7] text-white p-2.5 rounded-2xl hover:shadow-lg hover:shadow-[#27AAE1]/25 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none focus:outline-none focus:ring-2 focus:ring-[#27AAE1]/40 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-900"
            aria-label="Send message"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>

        <div className="mt-2 text-center">
          <p className="text-xs text-slate-500 dark:text-slate-500">
            Powered by GoFlexConnect AI
          </p>
        </div>
      </div>
    </div>
  );
}

export function ChatbotButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-4 right-4 z-40 w-14 h-14 bg-[#27AAE1] hover:bg-[#0178B7] text-white rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-200 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-[#27AAE1]/40 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-900"
      aria-label="Open help chat"
    >
      <MessageCircle className="w-6 h-6" />
    </button>
  );
}
