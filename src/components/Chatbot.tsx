import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, HelpCircle, Loader2 } from 'lucide-react';

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
    <div className="fixed bottom-4 right-4 z-50 w-96 bg-white rounded-2xl shadow-2xl flex flex-col max-h-[600px] overflow-hidden">
      <div className="bg-gradient-to-r from-goflex-blue to-goflex-blue-dark px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <MessageCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-white font-semibold">Help Assistant</h3>
            <p className="text-white/80 text-xs">Always here to help</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                message.isBot
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'bg-gradient-to-r from-goflex-blue to-goflex-blue-dark text-white'
              }`}
            >
              <p className="text-sm whitespace-pre-line leading-relaxed">{message.text}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white text-slate-800 shadow-sm rounded-2xl px-4 py-3 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-slate-200 bg-white p-3">
        {error && (
          <div className="mb-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs">
            {error}
          </div>
        )}
        <div className="flex gap-2 mb-2 overflow-x-auto pb-2">
          <button
            onClick={() => handleQuickAction('How do I start a project?')}
            className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-full whitespace-nowrap transition-colors"
          >
            <HelpCircle className="w-3 h-3 inline mr-1" />
            Start Project
          </button>
          <button
            onClick={() => handleQuickAction('How does offline mode work?')}
            className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-full whitespace-nowrap transition-colors"
          >
            <HelpCircle className="w-3 h-3 inline mr-1" />
            Offline Mode
          </button>
          <button
            onClick={() => handleQuickAction('Tell me about heatmaps')}
            className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-full whitespace-nowrap transition-colors"
          >
            <HelpCircle className="w-3 h-3 inline mr-1" />
            Heatmaps
          </button>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask me anything..."
            className="flex-1 px-4 py-2 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-goflex-blue/20 focus:border-goflex-blue transition-all text-sm"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="bg-gradient-to-r from-goflex-blue to-goflex-blue-dark text-white p-2 rounded-xl hover:shadow-lg hover:shadow-goflex-blue/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ChatbotButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-4 right-4 z-40 w-14 h-14 bg-gradient-to-r from-goflex-blue to-goflex-blue-dark text-white rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-200 flex items-center justify-center"
      aria-label="Open help chat"
    >
      <MessageCircle className="w-6 h-6" />
    </button>
  );
}
