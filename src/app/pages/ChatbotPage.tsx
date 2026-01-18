import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, AlertCircle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { standaloneChatService, AnalysisContext } from '../../utils/standalone-chat';
import { getRecentAnalyses } from '../../utils/supabase';
import { getLatestLocalAnalysis } from '../../utils/local-storage-analysis';

// TypeScript interfaces
interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  isLoading?: boolean;
  error?: string;
}

interface PreRecommendedQuestion {
  id: string;
  text: string;
  category: 'analysis' | 'technical' | 'guidance' | 'general' | 'agents';
  icon?: string;
  requiresAnalysis: boolean;
  agentSpecific?: boolean;
}

const ChatbotPage = () => {
  const { theme } = useTheme();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showRecommendedQuestions, setShowRecommendedQuestions] = useState(true);
  const [analysisContext, setAnalysisContext] = useState<AnalysisContext | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'error'>('connected');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change (but not on initial load)
  useEffect(() => {
    // Only scroll if there are more than 1 message (avoid scrolling on initial welcome message)
    if (messages.length > 1) {
      scrollToBottom();
    }
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  const recommendedQuestions: PreRecommendedQuestion[] = [
    {
      id: '1',
      text: 'What does my analysis result mean?',
      category: 'analysis',
      requiresAnalysis: true,
      agentSpecific: false
    },
    {
      id: '2',
      text: 'What did the OnDemand agents discover?',
      category: 'agents',
      requiresAnalysis: true,
      agentSpecific: true
    },
    {
      id: '3',
      text: 'How was the video quality assessed?',
      category: 'agents',
      requiresAnalysis: true,
      agentSpecific: true
    },
    {
      id: '4',
      text: 'What metadata patterns were found?',
      category: 'agents',
      requiresAnalysis: true,
      agentSpecific: true
    },
    {
      id: '5',
      text: 'How does the agentic workflow work?',
      category: 'technical',
      requiresAnalysis: false,
      agentSpecific: true
    },
    {
      id: '6',
      text: 'What should I do with these results?',
      category: 'guidance',
      requiresAnalysis: true,
      agentSpecific: false
    }
  ];

  // Initialize with welcome message and load analysis context
  useEffect(() => {
    const initializeChat = async () => {
      console.log('🔍 Initializing chat and loading analysis context...');
      
      // Test standalone chat service (always connected)
      const isConnected = await standaloneChatService.testConnection();
      setConnectionStatus(isConnected ? 'connected' : 'error');

      // Try to load recent analysis
      try {
        console.log('📊 Attempting to load recent analysis...');
        const recentData = await getRecentAnalyses(1, 0, 'all');
        console.log('📊 Recent analysis data:', recentData);
        
        let latestAnalysis = null;
        
        if (recentData.data && recentData.data.length > 0) {
          latestAnalysis = recentData.data[0];
          console.log('✅ Found latest analysis from Supabase:', latestAnalysis.filename);
        } else {
          // Fallback to local storage
          console.log('⚠️ No Supabase data, checking local storage...');
          const localAnalysis = getLatestLocalAnalysis();
          if (localAnalysis) {
            latestAnalysis = localAnalysis;
            console.log('✅ Found latest analysis from local storage:', latestAnalysis.filename);
          } else {
            console.log('⚠️ No analysis found in local storage either');
          }
        }
        
        if (latestAnalysis) {
          const contextData = {
            id: latestAnalysis.id,
            filename: latestAnalysis.filename,
            prediction: latestAnalysis.prediction,
            confidence: latestAnalysis.confidence,
            models_used: latestAnalysis.models_used || [],
            processing_time: latestAnalysis.processing_time || 0,
            created_at: latestAnalysis.created_at,
            enhanced_by_agents: latestAnalysis.enhanced_by_agents || false,
            ondemand_analysis: latestAnalysis.ondemand_analysis
          };
          
          setAnalysisContext(contextData);
          console.log('✅ Analysis context set:', contextData);
        }
      } catch (error) {
        console.error('❌ Error loading recent analysis:', error);
        // Try local storage as final fallback
        console.log('💾 Trying local storage as fallback...');
        const localAnalysis = getLatestLocalAnalysis();
        if (localAnalysis) {
          const contextData = {
            id: localAnalysis.id,
            filename: localAnalysis.filename,
            prediction: localAnalysis.prediction,
            confidence: localAnalysis.confidence,
            models_used: localAnalysis.models_used || [],
            processing_time: localAnalysis.processing_time || 0,
            created_at: localAnalysis.created_at,
            enhanced_by_agents: localAnalysis.enhanced_by_agents || false,
            ondemand_analysis: localAnalysis.ondemand_analysis
          };
          
          setAnalysisContext(contextData);
          console.log('✅ Analysis context set from local storage:', contextData);
        }
      }

      // Create welcome message
      const welcomeMessage: ChatMessage = {
        id: 'welcome',
        content: `Hello! I'm your Interceptor AI assistant. I can help you understand your video analysis results, explain how our agentic deepfake detection system works, and answer questions about the technology. ${
          analysisContext 
            ? `I can see you have a recent analysis of "${analysisContext.filename}" - feel free to ask me about it!` 
            : `Upload a video for analysis first to get personalized insights about your results.`
        } What would you like to know?`,
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
      console.log('✅ Chat initialized');
    };

    initializeChat();
  }, []);

  const handleSendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: messageText,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setShowRecommendedQuestions(false);
    setIsLoading(true);

    try {
      console.log('🤖 Sending message:', messageText);
      console.log('📊 Analysis context available:', !!analysisContext);
      if (analysisContext) {
        console.log('📊 Analysis context details:', {
          filename: analysisContext.filename,
          prediction: analysisContext.prediction,
          confidence: analysisContext.confidence
        });
      }
      
      // Send message to standalone chat service
      const response = await standaloneChatService.sendMessage(messageText, analysisContext || undefined);
      console.log('✅ Chat response received:', response.success);
      
      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: response.message,
        sender: 'bot',
        timestamp: new Date(),
        error: response.success ? undefined : response.error
      };

      setMessages(prev => [...prev, botMessage]);
      
    } catch (error) {
      console.error('Chat error:', error);
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: 'I apologize, but I encountered an error processing your message. Please try again or ask a different question.',
        sender: 'bot',
        timestamp: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuestionClick = (question: PreRecommendedQuestion) => {
    handleSendMessage(question.text);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputMessage);
    }
  };

  return (
    <div className="min-h-screen pt-32 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <h1 className="text-3xl sm:text-4xl lg:text-4xl font-bold text-gray-900 dark:text-white">
              AI Assistant
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            Intelligent AI assistant for deepfake detection insights
          </p>
          
          {/* Analysis Context Indicator */}
          {analysisContext && (
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-full text-sm text-blue-700 dark:text-blue-300">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              Latest analysis: {analysisContext.filename} ({analysisContext.prediction})
            </div>
          )}
        </div>

        {/* Chat Container */}
        <div className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-md border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl">
          {/* Messages Area */}
          <div className="min-h-[200px] max-h-96 overflow-y-auto p-6 space-y-2">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start gap-3 ${
                  message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.sender === 'user'
                      ? 'bg-blue-600 dark:bg-blue-500'
                      : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                >
                  {message.sender === 'user' ? (
                    <User className="w-4 h-4 text-white" />
                  ) : (
                    <Bot className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                  )}
                </div>

                {/* Message Bubble */}
                <div
                  className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                    message.sender === 'user'
                      ? 'bg-blue-600 dark:bg-blue-500 text-white'
                      : message.error
                      ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                  }`}
                >
                  {message.error && (
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-xs font-medium">Error occurred</span>
                    </div>
                  )}
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {message.content}
                  </p>
                  <p
                    className={`text-xs mt-2 ${
                      message.sender === 'user'
                        ? 'text-blue-100'
                        : message.error
                        ? 'text-red-500 dark:text-red-400'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {message.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                </div>
                <div className="bg-gray-100 dark:bg-gray-800 px-4 py-3 rounded-2xl">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Scroll anchor */}
            <div ref={messagesEndRef} />
          </div>

          {/* Recommended Questions */}
          {showRecommendedQuestions && (
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Suggested questions:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {recommendedQuestions.slice(0, 4).map((question) => (
                  <button
                    key={question.id}
                    onClick={() => handleQuestionClick(question)}
                    className="text-left p-3 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                  >
                    {question.text}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="p-6 border-t border-gray-200 dark:border-gray-800">
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Ask me about your video analysis results..."
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  rows={1}
                  style={{ minHeight: '48px', maxHeight: '120px' }}
                />
              </div>
              <button
                onClick={() => handleSendMessage(inputMessage)}
                disabled={!inputMessage.trim() || isLoading}
                className="px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white rounded-xl transition-colors flex items-center justify-center"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatbotPage;