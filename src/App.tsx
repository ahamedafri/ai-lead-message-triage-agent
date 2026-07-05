import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageItem, 
  FeedbackLog, 
  ChannelType, 
  AIPrediction, 
  PriorityType, 
  LeadQualityType 
} from './types';
import { 
  SAMPLE_MESSAGES_DATA, 
  heuristicClassify 
} from './services/classifier';
import { MessageCard } from './components/MessageCard';
import { FeedbackDashboard } from './components/FeedbackDashboard';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Send, 
  Sparkles, 
  Key, 
  Moon, 
  Sun, 
  CheckCircle, 
  Activity,
  Filter,
  Volume2,
  VolumeX,
  HelpCircle,
  Inbox,
  Settings,
  Database,
  Sliders,
  Check,
  Terminal
} from 'lucide-react';

const CHANNELS_CONFIG = [
  { id: 'whatsapp' as ChannelType, name: 'WhatsApp', color: 'bg-emerald-500' },
  { id: 'instagram' as ChannelType, name: 'Instagram', color: 'bg-pink-500' },
  { id: 'website' as ChannelType, name: 'Website Form', color: 'bg-purple-500' },
  { id: 'email' as ChannelType, name: 'Email', color: 'bg-blue-500' }
];

export default function App() {
  // Tabs: 'inbox' (Business view) or 'settings' (Technical config & feedback logs)
  const [activeTab, setActiveTab] = useState<'inbox' | 'settings'>('inbox');

  // Theme & State
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  const [apiStatus, setApiStatus] = useState<'online' | 'offline'>('offline');
  const [backendModel, setBackendModel] = useState<string>('llama-3.3-70b-versatile');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Messages and Feed Data
  const [messages, setMessages] = useState<MessageItem[]>(() => {
    const saved = localStorage.getItem('triage_messages');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  // Feedback loop logs
  const [feedbackLogs, setFeedbackLogs] = useState<FeedbackLog[]>(() => {
    const saved = localStorage.getItem('triage_feedback_logs');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  // Simulator Playback state
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simIndex, setSimIndex] = useState<number>(0);
  const simTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Manual Input fields
  const [manualChannel, setManualChannel] = useState<ChannelType>('whatsapp');
  const [manualSender, setManualSender] = useState<string>('');
  const [manualMessage, setManualMessage] = useState<string>('');
  const [isManualAnalyzing, setIsManualAnalyzing] = useState<boolean>(false);

  // Filters State
  const [activeFilter, setActiveFilter] = useState<string>('all');

  // Fetch backend config status on load
  useEffect(() => {
    async function checkConfig() {
      try {
        const res = await fetch('/api/config-status');
        if (res.ok) {
          const data = await res.json();
          setApiStatus(data.status);
          setBackendModel(data.model);
        }
      } catch (err) {
        console.error("Failed to fetch server config status:", err);
      }
    }
    checkConfig();
  }, []);

  // Trigger Theme updates
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Sync state to LocalStorage
  useEffect(() => {
    localStorage.setItem('triage_messages', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('triage_feedback_logs', JSON.stringify(feedbackLogs));
  }, [feedbackLogs]);

  // Audio indicator for sound effects
  const playSfx = (type: 'beep' | 'success' | 'alert') => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'beep') {
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
      } else if (type === 'success') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08); // E5
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.18);
      } else if (type === 'alert') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, ctx.currentTime); // A3
        osc.frequency.setValueAtTime(180, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.22);
      }
    } catch (e) {
      console.warn('Web Audio API not supported/allowed in this container view.', e);
    }
  };

  // Perform classification (hitting the server-side proxy)
  const executeClassification = async (
    channel: ChannelType,
    sender: string,
    messageText: string
  ): Promise<AIPrediction> => {
    try {
      const response = await fetch('/api/classify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ channel, sender, message: messageText })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} - failed to classify message`);
      }

      const prediction = await response.json();
      if (prediction._isFallback) {
        setErrorMessage(prediction._msg || "Using simulated local classification.");
        setTimeout(() => setErrorMessage(null), 6000);
      }
      return prediction;
    } catch (err: any) {
      console.warn('Backend proxy failed, falling back to smart local logic', err);
      setErrorMessage(`Server Connection Error: ${err.message}. Showing simulated local classification.`);
      setTimeout(() => setErrorMessage(null), 6000);
      return heuristicClassify(channel, sender, messageText);
    }
  };

  // Run the sequential simulation
  const addNextSimulatedMessage = async () => {
    if (simIndex >= SAMPLE_MESSAGES_DATA.length) {
      setIsSimulating(false);
      setSimIndex(0);
      playSfx('success');
      return;
    }

    const nextSample = SAMPLE_MESSAGES_DATA[simIndex];
    setSimIndex(prev => prev + 1);

    // Create unique message
    const tempId = `sim-${Date.now()}-${nextSample.id}`;
    const newMsgItem: MessageItem = {
      id: tempId,
      channel: nextSample.channel,
      sender: nextSample.sender,
      message: nextSample.message,
      timestamp: new Date().toISOString(),
      priority: 'normal',
      leadQuality: 'unclear',
      review: false,
      category: 'Processing...',
      reasoning: 'AI is categorizing...',
      reply: '',
      status: 'pending',
      isAnalyzing: true
    };

    setMessages(prev => [newMsgItem, ...prev]);
    playSfx('beep');

    // Simulate small latency
    setTimeout(async () => {
      try {
        const prediction = await executeClassification(
          nextSample.channel,
          nextSample.sender,
          nextSample.message
        );

        setMessages(prev => 
          prev.map(m => m.id === tempId ? {
            ...m,
            ...prediction,
            reply: '', // Explicitly let user click "Draft with AI"
            isAnalyzing: false
          } : m)
        );

        if (prediction.priority === 'urgent' || prediction.review) {
          playSfx('alert');
        } else {
          playSfx('success');
        }
      } catch (error) {
        const fbPrediction = heuristicClassify(nextSample.channel, nextSample.sender, nextSample.message);
        setMessages(prev => 
          prev.map(m => m.id === tempId ? {
            ...m,
            ...fbPrediction,
            reply: '', // Explicitly let user click "Draft with AI"
            isAnalyzing: false
          } : m)
        );
      }
    }, 1200);
  };

  // Start / Pause simulator feed
  useEffect(() => {
    if (isSimulating) {
      addNextSimulatedMessage();
      simTimerRef.current = setInterval(() => {
        addNextSimulatedMessage();
      }, 5500);
    } else {
      if (simTimerRef.current) {
        clearInterval(simTimerRef.current);
        simTimerRef.current = null;
      }
    }

    return () => {
      if (simTimerRef.current) clearInterval(simTimerRef.current);
    };
  }, [isSimulating, simIndex]);

  // Click single message chip to fill form
  const handleChipClick = (sampleId: string) => {
    const found = SAMPLE_MESSAGES_DATA.find(s => s.id === sampleId);
    if (found) {
      setManualChannel(found.channel);
      setManualSender(found.sender);
      setManualMessage(found.message);
      playSfx('beep');
    }
  };

  // Manual Message submission
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualSender.trim() || !manualMessage.trim()) return;

    setIsManualAnalyzing(true);
    const tempId = `manual-${Date.now()}`;
    const newMsgItem: MessageItem = {
      id: tempId,
      channel: manualChannel,
      sender: manualSender.trim(),
      message: manualMessage.trim(),
      timestamp: new Date().toISOString(),
      priority: 'normal',
      leadQuality: 'unclear',
      review: false,
      category: 'Processing...',
      reasoning: 'Llama 3 is reading...',
      reply: '',
      status: 'pending',
      isAnalyzing: true
    };

    setMessages(prev => [newMsgItem, ...prev]);
    playSfx('beep');

    try {
      const prediction = await executeClassification(manualChannel, manualSender.trim(), manualMessage.trim());
      setMessages(prev => 
        prev.map(m => m.id === tempId ? {
          ...m,
          ...prediction,
          reply: '', // Explicitly let user click "Draft with AI"
          isAnalyzing: false
        } : m)
      );

      if (prediction.priority === 'urgent' || prediction.review) {
        playSfx('alert');
      } else {
        playSfx('success');
      }

      setManualSender('');
      setManualMessage('');
    } catch (e) {
      const fb = heuristicClassify(manualChannel, manualSender.trim(), manualMessage.trim());
      setMessages(prev => 
        prev.map(m => m.id === tempId ? {
          ...m,
          ...fb,
          reply: '', // Explicitly let user click "Draft with AI"
          isAnalyzing: false
        } : m)
      );
    } finally {
      setIsManualAnalyzing(false);
    }
  };

  // Message Card actions (Feedback logger logic)
  const handleMessageAction = (
    messageId: string,
    action: 'approve' | 'edit' | 'reject',
    customReplyText: string,
    aiPrediction: AIPrediction
  ) => {
    setMessages(prev => 
      prev.map(m => m.id === messageId ? {
        ...m,
        status: action === 'reject' ? 'rejected' : action === 'edit' ? 'edited' : 'approved',
        finalReply: customReplyText
      } : m)
    );

    const targetMsg = messages.find(m => m.id === messageId);
    if (!targetMsg) return;

    const humanRepliedValue = action === 'reject' ? 'Discarded' : customReplyText;
    const replyUnchanged = customReplyText.trim() === aiPrediction.reply.trim();
    
    const priorityAgreed = true;
    const reviewAgreed = aiPrediction.review === (action === 'reject' || customReplyText.includes('needs a human'));
    const categoryAgreed = true;
    const overallAgreed = action === 'approve' && replyUnchanged;

    const newLog: FeedbackLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      originalMessage: targetMsg.message,
      channel: targetMsg.channel,
      sender: targetMsg.sender,
      aiPrediction,
      humanAction: action,
      humanReply: humanRepliedValue,
      metrics: {
        priorityAgreed,
        leadQualityAgreed: action !== 'reject',
        categoryAgreed,
        reviewAgreed,
        overallAgreed
      }
    };

    setFeedbackLogs(prev => [...prev, newLog]);
    playSfx('success');
  };

  const clearAllMessages = () => {
    setMessages([]);
    localStorage.removeItem('triage_messages');
    playSfx('beep');
  };

  const handleClearLogs = () => {
    setFeedbackLogs([]);
    localStorage.removeItem('triage_feedback_logs');
    playSfx('beep');
  };

  // Stats calculation
  const totalMessagesCount = messages.length;
  const urgentCount = messages.filter(m => m.priority === 'urgent' && m.status === 'pending').length;
  const reviewCount = messages.filter(m => m.review && m.status === 'pending').length;

  const whatsappCount = messages.filter(m => m.channel === 'whatsapp').length;
  const instagramCount = messages.filter(m => m.channel === 'instagram').length;
  const emailCount = messages.filter(m => m.channel === 'email').length;
  const websiteCount = messages.filter(m => m.channel === 'website').length;

  const filteredMessages = messages.filter(m => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'urgent') return m.priority === 'urgent';
    if (activeFilter === 'review') return m.review;
    if (activeFilter === 'whatsapp') return m.channel === 'whatsapp';
    if (activeFilter === 'instagram') return m.channel === 'instagram';
    if (activeFilter === 'email') return m.channel === 'email';
    if (activeFilter === 'website') return m.channel === 'website';
    return true;
  });

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans text-zinc-800 dark:text-zinc-200 transition-colors duration-200">
      
      {/* Header */}
      <header className="border-b border-zinc-200 dark:border-zinc-900 bg-white dark:bg-zinc-900 sticky top-0 z-40 transition-colors">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 rounded-xl text-white shadow-sm flex items-center justify-center">
              <Sparkles className="h-5.5 w-5.5" />
            </div>
            <div>
              <h1 className="text-md sm:text-lg font-black tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
                Inbox Triage Agent
              </h1>
              <p className="text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                Unified messaging dashboard with priority filters and automatic draft generation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 self-stretch md:self-auto justify-between">
            {/* Navigation Tabs */}
            <nav className="flex bg-zinc-100 dark:bg-zinc-800/80 p-1 rounded-xl border border-zinc-200/50 dark:border-zinc-700/50">
              <button
                onClick={() => setActiveTab('inbox')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'inbox'
                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                <Inbox className="h-3.5 w-3.5" />
                Inbox & Triage
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'settings'
                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                <Settings className="h-3.5 w-3.5" />
                Settings & System Config
              </button>
            </nav>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="p-2 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 dark:text-zinc-400 transition-colors cursor-pointer"
                title={soundEnabled ? "Mute sounds" : "Unmute sounds"}
              >
                {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </button>

              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 dark:text-zinc-400 transition-colors cursor-pointer"
                title="Toggle visual style"
              >
                {darkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-zinc-600" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        
        {errorMessage && (
          <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2 animate-fade-in">
            <HelpCircle className="h-5 w-5 text-amber-500 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {activeTab === 'inbox' ? (
          /* ========================================================================= */
          /* ======================== TAB 1: BUSINESS INBOX VIEW ===================== */
          /* ========================================================================= */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Column: Channels & Manual Tester */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Clean Channel Status */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 transition-all">
                <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center justify-between mb-4">
                  <span>Connected Channels</span>
                  <span className="flex items-center gap-1.5">
                    <Activity className="h-3.5 w-3.5 text-emerald-500" />
                    <span className="text-[10px] text-emerald-500 font-bold uppercase">Online & Active</span>
                  </span>
                </h2>

                <div className="grid grid-cols-2 gap-3">
                  {CHANNELS_CONFIG.map(ch => (
                    <div 
                      key={ch.id} 
                      className="flex items-center gap-2 border border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-800/10 p-2.5 rounded-lg text-xs"
                    >
                      <span className={`w-2.5 h-2.5 rounded-full ${ch.color}`} />
                      <span className="font-semibold text-zinc-700 dark:text-zinc-300 capitalize">{ch.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Manual Client Inbound Simulator */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 transition-all space-y-4">
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                    Simulate New Client Message
                  </h2>
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1 leading-normal">
                    Insert a trial client message below to test automatic priority tagging, sentiment analysis, and response drafting.
                  </p>
                </div>

                {/* Pre-made Samples */}
                <div className="space-y-1.5">
                  <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Quick Test Case Templates</span>
                  <div className="flex flex-wrap gap-1.5">
                    {SAMPLE_MESSAGES_DATA.map((s, index) => (
                      <button
                        key={s.id}
                        onClick={() => handleChipClick(s.id)}
                        className="px-2 py-1 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800/80 dark:hover:bg-zinc-700/80 border border-zinc-200 dark:border-zinc-700 rounded text-[10px] text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer"
                      >
                        Sample #{index + 1} ({s.sender})
                      </button>
                    ))}
                  </div>
                </div>

                {/* Form */}
                <form onSubmit={handleManualSubmit} className="space-y-3 pt-2 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500 mb-1">
                        Channel Received
                      </label>
                      <select
                        value={manualChannel}
                        onChange={(e) => setManualChannel(e.target.value as ChannelType)}
                        className="w-full p-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-zinc-800 dark:text-zinc-200 font-medium cursor-pointer"
                      >
                        <option value="whatsapp">WhatsApp</option>
                        <option value="instagram">Instagram DM</option>
                        <option value="email">Email</option>
                        <option value="website">Website Form</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500 mb-1">
                        Sender Identifier
                      </label>
                      <input
                        type="text"
                        required
                        value={manualSender}
                        onChange={(e) => setManualSender(e.target.value)}
                        placeholder="e.g. Priya Nair"
                        className="w-full p-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-zinc-800 dark:text-zinc-200 font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500 mb-1">
                      Inbound Message Content
                    </label>
                    <textarea
                      required
                      value={manualMessage}
                      onChange={(e) => setManualMessage(e.target.value)}
                      rows={4}
                      placeholder="Paste incoming client query..."
                      className="w-full p-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-zinc-800 dark:text-zinc-200 leading-normal"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isManualAnalyzing || !manualSender.trim() || !manualMessage.trim()}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                  >
                    <Send className="h-3.5 w-3.5" />
                    {isManualAnalyzing ? 'Processing Inquiry...' : 'Submit to Inbox'}
                  </button>
                </form>
              </div>

            </div>

            {/* Right Column: Clean Inbox Dashboard */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Business-facing Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-xl transition-all">
                <div className="border-r border-zinc-100 dark:border-zinc-800/80 pr-2 last:border-0">
                  <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase block tracking-wider">Total Inbound</span>
                  <span className="text-2xl font-black text-zinc-900 dark:text-white mt-1 block">{totalMessagesCount}</span>
                  <span className="text-[9px] text-zinc-400">Total processed messages</span>
                </div>
                <div className="border-r border-zinc-100 dark:border-zinc-800/80 pr-2 last:border-0 pl-2">
                  <span className="text-[10px] font-bold text-rose-500 uppercase block tracking-wider">Urgent Active</span>
                  <span className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1 block">{urgentCount}</span>
                  <span className="text-[9px] text-zinc-400">Requires swift response</span>
                </div>
                <div className="border-r border-zinc-100 dark:border-zinc-800/80 pr-2 last:border-0 pl-2">
                  <span className="text-[10px] font-bold text-amber-500 uppercase block tracking-wider">Requires Action</span>
                  <span className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1 block">{reviewCount}</span>
                  <span className="text-[9px] text-zinc-400">Human verification mandatory</span>
                </div>
                <div className="pl-2 last:border-0">
                  <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase block tracking-wider">By Channel</span>
                  <div className="mt-1.5 flex flex-wrap gap-x-2 gap-y-1 text-[10px] text-zinc-500 dark:text-zinc-400">
                    <span>WA: <strong>{whatsappCount}</strong></span>
                    <span>IG: <strong>{instagramCount}</strong></span>
                    <span>Mail: <strong>{emailCount}</strong></span>
                    <span>Web: <strong>{websiteCount}</strong></span>
                  </div>
                </div>
              </div>

              {/* Feed Filters */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-5 py-3 rounded-xl transition-all">
                <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                  <Filter className="h-4 w-4 text-zinc-400" />
                  <span>Filter Feed:</span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: 'all', label: 'All Messages' },
                    { id: 'urgent', label: '🔴 Urgent' },
                    { id: 'review', label: '⚠️ Requires Review' },
                    { id: 'whatsapp', label: 'WhatsApp' },
                    { id: 'instagram', label: 'Instagram' },
                    { id: 'email', label: 'Email' },
                    { id: 'website', label: 'Web Form' }
                  ].map(filter => (
                    <button
                      key={filter.id}
                      onClick={() => setActiveFilter(filter.id)}
                      className={`px-3.5 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                        activeFilter === filter.id
                          ? 'bg-indigo-600 text-white'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700/80 border border-zinc-200/50 dark:border-zinc-800'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clean Message Feed */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-extrabold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                    <Inbox className="h-4 w-4 text-indigo-500" />
                    Unified Inbox Feed ({filteredMessages.length})
                  </h2>
                  {messages.length > 0 && (
                    <button
                      id="clear-feed-btn"
                      onClick={clearAllMessages}
                      className="text-xs text-zinc-400 hover:text-red-500 transition-colors cursor-pointer"
                    >
                      Clear Feed
                    </button>
                  )}
                </div>

                {filteredMessages.length === 0 ? (
                  <div className="border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl p-16 text-center flex flex-col items-center justify-center bg-white dark:bg-zinc-900">
                    <Inbox className="h-10 w-10 text-zinc-300 dark:text-zinc-700 mb-3" />
                    <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Your Inbox Feed is Empty</p>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1.5 max-w-sm leading-relaxed">
                      No inbound queries detected. Switch to the <strong>"Settings & System Config"</strong> tab to start a mock simulation feed, or use the <strong>"Simulate New Client Message"</strong> panel on the left to write a custom case.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[700px] overflow-y-auto pr-1">
                    {filteredMessages.map(msg => (
                      <MessageCard
                        key={msg.id}
                        message={msg}
                        onAction={handleMessageAction}
                        onUpdateReply={(msgId, newReply) => {
                          setMessages(prev => 
                            prev.map(m => m.id === msgId ? { ...m, reply: newReply } : m)
                          );
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>

            </div>

          </div>
        ) : (
          /* ========================================================================= */
          /* ======================== TAB 2: TECHNICAL SETTINGS VIEW ================= */
          /* ========================================================================= */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Side: API Connections & Simulator Controller */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* API settings - Secured & Server-side config */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 transition-all">
                <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-500 flex items-center gap-1.5 mb-3.5">
                  <Key className="h-4 w-4" />
                  Groq Secured Engine Status
                </h2>

                <div className="space-y-4 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase text-zinc-400">Connection Status</span>
                    <div className="flex items-center gap-1.5">
                      <span className={`inline-block w-2.5 h-2.5 rounded-full ${apiStatus === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
                      <span className="font-bold text-[11px] text-zinc-700 dark:text-zinc-300">
                        {apiStatus === 'online' ? 'Secured & Connected' : 'Sandbox (Demo)'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800 pt-3">
                    <span className="text-[10px] font-bold uppercase text-zinc-400">Triage Model</span>
                    <span className="font-mono text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                      {backendModel}
                    </span>
                  </div>

                  <div className="border-t border-zinc-100 dark:border-zinc-800 pt-3.5 mt-1">
                    <span className="text-[9px] font-bold uppercase text-zinc-400 block mb-1">Architecture & Security Note</span>
                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500 leading-normal">
                      Following enterprise security guidelines, the model selection and API key input fields have been completely removed from the client interface. 
                      Your <strong>Groq API Key</strong> is now securely configured as an environment variable (<code>GROQ_API_KEY</code>) on the server side, keeping it hidden from browser code.
                    </p>
                  </div>
                </div>
              </div>

              {/* Simulation Feed controller */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 transition-all">
                <div className="flex items-center justify-between mb-3.5">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-500 flex items-center gap-1.5">
                    <Terminal className="h-4 w-4" />
                    Feed Stream Controller
                  </h2>
                  {simIndex > 0 && (
                    <span className="text-[10px] text-indigo-500 font-extrabold">{simIndex}/7 simulated</span>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <button
                      id="start-sim-btn"
                      onClick={() => {
                        setIsSimulating(!isSimulating);
                        playSfx('beep');
                      }}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs font-bold shadow-sm transition-all cursor-pointer ${
                        isSimulating 
                          ? 'bg-amber-500 hover:bg-amber-600 text-white' 
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                      }`}
                    >
                      {isSimulating ? (
                        <>
                          <Pause className="h-3.5 w-3.5" /> Pause Stream
                        </>
                      ) : (
                        <>
                          <Play className="h-3.5 w-3.5" /> Start Simulated Feed
                        </>
                      )}
                    </button>

                    {simIndex > 0 && (
                      <button
                        id="reset-sim-btn"
                        onClick={() => {
                          setIsSimulating(false);
                          setSimIndex(0);
                          clearAllMessages();
                        }}
                        className="p-2.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 rounded-lg transition-all border border-zinc-200 dark:border-zinc-700/60 cursor-pointer"
                        title="Reset simulation and clear feed"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500 leading-normal">
                    This triggers a streaming playback that injects 7 realistic consumer messages (such as complaints, sales inquiries, spam social comments) into the Inbox at 5.5-second intervals to stress-test your Llama 3 classification settings.
                  </p>
                </div>
              </div>

              {/* Developer / CRM Setup Guide */}
              <div className="bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900 rounded-xl p-5 space-y-3">
                <h3 className="text-xs font-bold text-indigo-950 dark:text-indigo-300 flex items-center gap-1.5">
                  <Database className="h-4 w-4" />
                  Integration Architecture
                </h3>
                <p className="text-[10px] text-zinc-600 dark:text-zinc-300 leading-relaxed">
                  Every decision logged on the main screen records the original message, Llama 3 predictions, and final human adjustments. The collected data is instantly structured into fine-tuning datasets matching standard OpenAI and Groq JSONL specifications.
                </p>
                <div className="text-[10px] text-indigo-700 dark:text-indigo-400 font-semibold flex items-center gap-1.5 pt-1">
                  <Check className="h-3 w-3" /> Fully Persistent in LocalStorage
                </div>
              </div>

            </div>

            {/* Right Side: Feedback Logs & Fine-tuning Dataset Dash */}
            <div className="lg:col-span-8 space-y-6">
              
              <FeedbackDashboard
                logs={feedbackLogs}
                onClearLogs={handleClearLogs}
              />

            </div>

          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-900 py-8 mt-12 bg-white dark:bg-zinc-900 transition-colors text-xs text-zinc-400 dark:text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-bold text-zinc-700 dark:text-zinc-300">AI Inbox Triage & Lead Agent Prototype</p>
            <p className="mt-1">Designed for small business customer-relations management. Uses Llama 3.3 & 3.1 model engines.</p>
          </div>
          <p>© 2026 Corporate AI Solutions. Powered by Groq Cloud.</p>
        </div>
      </footer>
    </div>
  );
}
