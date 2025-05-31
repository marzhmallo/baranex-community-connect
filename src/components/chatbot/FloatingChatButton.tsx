
import React, { useState, useRef, useEffect } from 'react';
import { X, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  source?: 'faq' | 'ai' | 'fallback';
  category?: string;
}

const FloatingChatButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "Hello! I'm Alex, your barangay assistant. I can help you with barangay services, document requests, system guidance, and general inquiries. How can I assist you today?",
      role: 'assistant',
      timestamp: new Date(),
      source: 'ai',
      category: 'Greeting'
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<Array<{role: string, content: string}>>([]);
  
  const dragRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
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
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Update conversation history when messages change
  useEffect(() => {
    const recentMessages = messages.slice(-12); // Keep last 12 messages for context
    const history = recentMessages.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content
    }));
    setConversationHistory(history);
  }, [messages]);

  // Handle mouse down for dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isOpen) return;
    
    e.preventDefault();
    setIsDragging(true);
    
    const rect = dragRef.current?.getBoundingClientRect();
    if (rect) {
      dragOffset.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  };

  // Handle mouse move for dragging with immediate cursor speed
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      e.preventDefault();
      
      // Calculate bounds considering sidebar
      const sidebarWidth = window.innerWidth >= 768 ? 256 : 0;
      const minX = sidebarWidth + 10;
      const maxX = window.innerWidth - 70;
      const minY = 10;
      const maxY = window.innerHeight - 70;
      
      const newX = Math.max(minX, Math.min(maxX, e.clientX - dragOffset.current.x));
      const newY = Math.max(minY, Math.min(maxY, e.clientY - dragOffset.current.y));
      
      // Immediate position update for cursor-speed movement
      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      // Prevent text selection while dragging
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
      const chatMessages = [userMessage].map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: { 
          messages: chatMessages,
          conversationHistory: conversationHistory 
        }
      });

      if (error) throw error;

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.message,
        role: 'assistant',
        timestamp: new Date(),
        source: data.source,
        category: data.category
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Show different toast based on source
      if (data.source === 'faq') {
        console.log(`FAQ response from category: ${data.category}`);
      } else if (data.source === 'fallback') {
        toast({
          title: "Service Notice",
          description: "I'm using a fallback response. Some features may be limited.",
          variant: "default",
        });
      }

    } catch (error) {
      console.error('Chat error:', error);
      
      // Add fallback message to chat
      const fallbackMessage: Message = {
        id: (Date.now() + 2).toString(),
        content: "I apologize, but I'm having trouble connecting right now. Please try again later or contact the barangay office directly for assistance.",
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Floating Robot Button */}
      <div
        ref={dragRef}
        className={cn(
          "fixed z-50 select-none",
          isDragging ? "cursor-grabbing" : "cursor-grab hover:scale-105",
          isOpen && "opacity-0 pointer-events-none"
        )}
        style={{
          left: position.x,
          top: position.y,
          transform: isDragging ? 'none' : 'translateZ(0)', // Remove transitions when dragging
          transition: isDragging ? 'none' : 'transform 0.2s ease-out'
        }}
        onMouseDown={handleMouseDown}
      >
        <div className="relative">
          {/* Robot Icon - zoomed in and no white border */}
          <div className="w-16 h-16 rounded-full shadow-xl relative overflow-hidden transition-shadow duration-200 hover:shadow-2xl">
            <img 
              src="/lovable-uploads/43ff519e-4f25-47b8-8652-24d3085861ba.png"
              alt="Alex - Barangay Assistant"
              className="w-full h-full object-cover scale-125"
              draggable={false}
              style={{ objectPosition: 'center' }}
            />
          </div>
          
          {/* Click area */}
          <button
            onClick={() => setIsOpen(true)}
            className="absolute inset-0 w-full h-full rounded-full bg-transparent"
            aria-label="Open Alex - Barangay Assistant"
          />
        </div>
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4">
          <Card 
            ref={chatRef}
            className="w-full max-w-md h-[500px] flex flex-col shadow-2xl"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
              <div className="flex items-center space-x-2">
                <img 
                  src="/lovable-uploads/43ff519e-4f25-47b8-8652-24d3085861ba.png"
                  alt="Alex"
                  className="h-8 w-8 rounded-full object-cover scale-125"
                  style={{ objectPosition: 'center' }}
                />
                <CardTitle className="text-lg">Alex</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col p-0">
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
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
                        <p className="whitespace-pre-wrap">{message.content}</p>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-xs opacity-70">
                            {message.timestamp.toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </p>
                          {message.source === 'faq' && (
                            <span className="text-xs bg-green-100 text-green-800 px-1 rounded ml-2">
                              FAQ
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

              <div className="p-4 border-t">
                <div className="flex space-x-2">
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask me about barangay services..."
                    disabled={isLoading}
                    className="flex-1"
                  />
                  <Button 
                    onClick={sendMessage} 
                    disabled={!inputMessage.trim() || isLoading}
                    size="sm"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Ask about documents, services, or system help
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
