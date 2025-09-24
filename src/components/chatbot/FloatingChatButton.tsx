
import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/components/AuthProvider';
import { useChatbotSettings } from '@/hooks/useChatbotSettings';
import DOMPurify from 'dompurify';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  source?: 'faq' | 'supabase' | 'gemini' | 'gemini_with_data' | 'offline' | 'fallback';
  category?: string;
}

// Secure markdown renderer with DOMPurify sanitization
const renderMarkdown = (text: string) => {
  if (typeof text !== 'string') {
    console.warn('renderMarkdown received non-string input:', text);
    return String(text);
  }
  
  let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
  formatted = formatted.replace(/\n/g, '<br>');
  
  // Sanitize the HTML to prevent XSS attacks
  return DOMPurify.sanitize(formatted, {
    ALLOWED_TAGS: ['strong', 'em', 'br'],
    ALLOWED_ATTR: []
  });
};

const FloatingChatButton = () => {
  const { session, userProfile } = useAuth();
  const { chatbotSettings } = useChatbotSettings();
  
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [hasDragged, setHasDragged] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "Hey there! I'm Alexander Cabalan, but you can call me Alan, short for Automated Live Artificial Neurointelligence. I'm here to help you with all aspects of baranex. I can provide information about residents, households, officials, events, announcements, documents, emergency services, and much more. So how can I help?",
      role: 'assistant',
      timestamp: new Date(),
      source: 'offline',
      category: 'Greeting'
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<Array<{role: string, content: string}>>([]);
  
  const dragRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dragOffset = useRef({ x: 0, y: 0 });

  // Set initial position to bottom right of main content area
  useEffect(() => {
    const updatePosition = () => {
      const mainContentWidth = window.innerWidth - (window.innerWidth >= 768 ? 256 : 0);
      const sidebarOffset = window.innerWidth >= 768 ? 256 : 0;
      setPosition({ 
        x: mainContentWidth - 80 + sidebarOffset, 
        y: window.innerHeight - 100 
      });
    };
    
    updatePosition();
    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (!isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isMinimized]);

  // Update conversation history when messages change
  useEffect(() => {
    const recentMessages = messages.slice(-12);
    const history = recentMessages.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content
    }));
    setConversationHistory(history);
  }, [messages]);

  // Listen for settings changes and re-render component
  useEffect(() => {
    const handleSettingsChange = () => {
      // Force re-render when settings change
      console.log('Chatbot settings changed, re-rendering FloatingChatButton');
    };

    window.addEventListener('chatbot-settings-changed', handleSettingsChange);
    return () => window.removeEventListener('chatbot-settings-changed', handleSettingsChange);
  }, []);

  // Handle mouse down for dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isOpen && !isMinimized) return;
    
    e.preventDefault();
    setIsDragging(true);
    setHasDragged(false);
    
    const rect = dragRef.current?.getBoundingClientRect();
    if (rect) {
      dragOffset.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  };

  // Handle mouse move for dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      e.preventDefault();
      setHasDragged(true);
      
      const sidebarWidth = window.innerWidth >= 768 ? 256 : 0;
      const minX = sidebarWidth + 10;
      const maxX = window.innerWidth - 70;
      const minY = 10;
      const maxY = window.innerHeight - 70;
      
      const newX = Math.max(minX, Math.min(maxX, e.clientX - dragOffset.current.x));
      const newY = Math.max(minY, Math.min(maxY, e.clientY - dragOffset.current.y));
      
      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
    };
  }, [isDragging]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    // Check authentication for both modes (since both need Supabase access)
    if (!session) {
      toast({
        title: "Authentication Required",
        description: "Please log in to use the chatbot.",
        variant: "destructive",
      });
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage.trim(),
      role: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      console.log('Sending message to chatbot:', userMessage.content);
      console.log('Mode:', chatbotSettings.mode === 'online' ? 'Online' : 'Offline');
      console.log('User profile:', userProfile);
      
      const chatMessages = [userMessage].map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const requestData = { 
        messages: chatMessages,
        conversationHistory: conversationHistory,
        isOnlineMode: chatbotSettings.mode === 'online',
        authToken: session.access_token,
        userBrgyId: userProfile?.brgyid
      };

      console.log('Request data:', { ...requestData, authToken: '[PRESENT]' });

      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: requestData
      });

      console.log('Chatbot response:', data, error);

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(`API Error: ${error.message}`);
      }

      if (!data || !data.message) {
        throw new Error('Invalid response from chatbot service');
      }

      let messageContent: string;
      if (Array.isArray(data.message)) {
        messageContent = data.message[Math.floor(Math.random() * data.message.length)];
      } else {
        messageContent = data.message;
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: messageContent,
        role: 'assistant',
        timestamp: new Date(),
        source: data.source,
        category: data.category
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Log response source for debugging
      if (data.source === 'faq') {
        console.log(`FAQ response from category: ${data.category}`);
      } else if (data.source === 'supabase') {
        console.log(`Local data response from category: ${data.category}`);
      } else if (data.source === 'gemini_with_data') {
        console.log(`Gemini response with database data from category: ${data.category}`);
      } else if (data.source === 'gemini') {
        console.log(`Pure Gemini response from category: ${data.category}`);
      }

    } catch (error) {
      console.error('Chat error:', error);
      
      const fallbackMessage: Message = {
        id: (Date.now() + 2).toString(),
        content: "Hmm, I'm not quite sure I can help you with that. I probably can... but something's not right, I decided.",
        role: 'assistant',
        timestamp: new Date(),
        source: 'fallback'
      };
      
      setMessages(prev => [...prev, fallbackMessage]);
      
      toast({
        title: "Connection Error",
        description: "Unable to connect to chat service. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const openChat = () => {
    setIsOpen(true);
    setIsMinimized(false);
  };

  const minimizeChat = () => {
    setIsMinimized(true);
  };

  const closeChat = () => {
    setIsOpen(false);
    setIsMinimized(false);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Don't render if user is not authenticated OR if chatbot is disabled
  if (!session || !chatbotSettings.enabled) {
    console.log('FloatingChatButton not rendering:', { 
      session: !!session, 
      enabled: chatbotSettings.enabled 
    });
    return null;
  }

  console.log('FloatingChatButton rendering:', { 
    session: !!session, 
    enabled: chatbotSettings.enabled 
  });

  return (
    <>
      {/* Floating Robot Button */}
      <div
        ref={dragRef}
        className={cn(
          "fixed z-50 select-none",
          isDragging ? "cursor-grabbing" : "cursor-grab hover:scale-105",
          (isOpen && !isMinimized) && "opacity-0 pointer-events-none"
        )}
        style={{
          left: position.x,
          top: position.y,
          transform: isDragging ? 'none' : 'translateZ(0)',
          transition: isDragging ? 'none' : 'transform 0.2s ease-out'
        }}
        onMouseDown={handleMouseDown}
      >
        <div className="relative">
          <div className="w-16 h-16 rounded-full shadow-xl relative overflow-hidden transition-shadow duration-200 hover:shadow-2xl">
            <img 
              src="/lovable-uploads/43ff519e-4f25-47b8-8652-24d3085861ba.png"
              alt="Alan - Barangay Assistant"
              className="w-full h-full object-cover scale-125"
              draggable={false}
              style={{ objectPosition: 'center' }}
            />
          </div>
          
          <button
            onClick={() => {
              if (!hasDragged) {
                openChat();
              }
            }}
            className="absolute inset-0 w-full h-full rounded-full bg-transparent"
            aria-label="Open Alan - Barangay Assistant"
          />
        </div>
      </div>

      {/* Minimized Chat Indicator */}
      {isOpen && isMinimized && (
        <div 
          className="fixed z-50 bottom-4 right-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3 rounded-lg shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
          onClick={() => setIsMinimized(false)}
        >
          <div className="flex items-center space-x-2">
            <img 
              src="/lovable-uploads/43ff519e-4f25-47b8-8652-24d3085861ba.png"
              alt="Alan"
              className="h-6 w-6 rounded-full object-cover scale-125"
              style={{ objectPosition: 'center' }}
            />
            <span className="text-sm font-medium">Alan</span>
            <div className={cn(
              "w-2 h-2 rounded-full animate-pulse",
              chatbotSettings.mode === 'online' ? "bg-green-400" : "bg-orange-400"
            )} title={chatbotSettings.mode === 'online' ? "Online Mode" : "Offline Mode"} />
          </div>
        </div>
      )}

      {isOpen && !isMinimized && (
        <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4">
          <Card 
            ref={chatRef}
            className="w-full max-w-md h-[600px] flex flex-col shadow-2xl"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg flex-shrink-0">
              <div className="flex items-center space-x-2">
                <img 
                  src="/lovable-uploads/43ff519e-4f25-47b8-8652-24d3085861ba.png"
                  alt="Alan"
                  className="h-8 w-8 rounded-full object-cover scale-125"
                  style={{ objectPosition: 'center' }}
                />
                <div>
                  <CardTitle className="text-lg">Alexander Cabalan</CardTitle>
                   <div className="flex items-center space-x-2 mt-1">
                     <span className="text-xs opacity-80">
                       {chatbotSettings.mode === 'online' ? "Online" : "Offline"}
                     </span>
                    <div className={cn(
                      "w-2 h-2 rounded-full animate-pulse ml-1",
                      chatbotSettings.mode === 'online' ? "bg-green-400" : "bg-orange-400"
                    )} />
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={minimizeChat}
                  className="text-white hover:bg-white/20"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={closeChat}
                  className="text-white hover:bg-white/20"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col p-0 min-h-0">
              <ScrollArea className="flex-1 h-full">
                <div className="p-4 space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "flex",
                        message.role === 'user' ? "justify-end" : "justify-start"
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[80%] rounded-lg p-3 text-sm relative",
                          message.role === 'user'
                            ? "bg-primary text-white"
                            : "bg-muted"
                        )}
                      >
                        <div 
                          className="whitespace-pre-wrap break-words"
                          dangerouslySetInnerHTML={{ 
                            __html: renderMarkdown(message.content) 
                          }}
                        />
                        <div className="flex items-center justify-between mt-2 gap-2">
                          <p className="text-xs opacity-70 flex-shrink-0">
                            {formatTime(message.timestamp)}
                          </p>
                          {message.source === 'faq' && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded flex-shrink-0">
                              FAQ
                            </span>
                          )}
                          {message.source === 'supabase' && (
                            <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded flex-shrink-0">
                              Local Data
                            </span>
                          )}
                          {message.source === 'gemini_with_data' && (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded flex-shrink-0">
                              AI + Data
                            </span>
                          )}
                          {message.source === 'gemini' && (
                            <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded flex-shrink-0">
                              AI
                            </span>
                          )}
                          {message.source === 'Greetings' && (
                            <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded flex-shrink-0">
                              Offline
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-muted rounded-lg p-3 text-sm">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              <div className="p-4 border-t flex-shrink-0">
                <div className="flex space-x-2">
                  <Textarea
                    ref={textareaRef}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={chatbotSettings.mode === 'online' ? "Ask me anything..." : "Ask me anything..."}
                    disabled={isLoading}
                    className="flex-1 min-h-[40px] max-h-[120px] resize-none"
                    rows={1}
                  />
                  <Button 
                    onClick={sendMessage} 
                    disabled={!inputMessage.trim() || isLoading}
                    size="sm"
                    className="self-end flex-shrink-0"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Press Enter to send • Shift+Enter for new line
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
};

export default FloatingChatButton;
