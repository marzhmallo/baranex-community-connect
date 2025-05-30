
import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send } from 'lucide-react';
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
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const dragRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const dragStartMousePos = useRef({ x: 0, y: 0 });

  // Set initial position to bottom right of main content area
  useEffect(() => {
    const updatePosition = () => {
      const mainContentWidth = window.innerWidth - (window.innerWidth >= 768 ? 256 : 0); // Account for sidebar
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

  // Handle dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isOpen) return; // Don't drag when chat is open
    
    setIsDragging(true);
    dragStartPos.current = position;
    dragStartMousePos.current = { x: e.clientX, y: e.clientY };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    e.preventDefault();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - dragStartMousePos.current.x;
    const deltaY = e.clientY - dragStartMousePos.current.y;
    
    // Calculate bounds considering sidebar
    const sidebarWidth = window.innerWidth >= 768 ? 256 : 0;
    const mainContentWidth = window.innerWidth - sidebarWidth;
    
    const minX = sidebarWidth + 10;
    const maxX = window.innerWidth - 70;
    const minY = 10;
    const maxY = window.innerHeight - 70;
    
    const newX = Math.max(minX, Math.min(maxX, dragStartPos.current.x + deltaX));
    const newY = Math.max(minY, Math.min(maxY, dragStartPos.current.y + deltaY));
    
    setPosition({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

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
      const chatMessages = [...messages, userMessage].map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: { messages: chatMessages }
      });

      if (error) throw error;

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.message,
        role: 'assistant',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      toast({
        title: "Chat Error",
        description: "Failed to get response. Please try again.",
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
          "fixed z-50 transition-all duration-200",
          isDragging ? "cursor-grabbing scale-110" : "cursor-grab hover:scale-105",
          isOpen && "opacity-0 pointer-events-none"
        )}
        style={{
          left: position.x,
          top: position.y,
        }}
        onMouseDown={handleMouseDown}
      >
        <div className="relative">
          {/* Robot body */}
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-2xl shadow-xl border-2 border-white relative overflow-hidden transition-all duration-200">
            {/* Robot face */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                {/* Eyes */}
                <div className="flex space-x-2 mb-1">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                </div>
                {/* Mouth */}
                <div className="w-6 h-1 bg-white rounded-full opacity-80"></div>
              </div>
            </div>
            {/* Robot antenna */}
            <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1 h-2 bg-white rounded-full"></div>
            <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
          </div>
          
          {/* Click area */}
          <button
            onClick={() => setIsOpen(true)}
            className="absolute inset-0 w-full h-full rounded-2xl bg-transparent"
            aria-label="Open BaranexBot"
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
                <Bot className="h-5 w-5" />
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
                          "max-w-[80%] rounded-lg p-3 text-sm",
                          message.role === 'user'
                            ? "bg-primary text-white"
                            : "bg-muted"
                        )}
                      >
                        <p className="whitespace-pre-wrap">{message.content}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {message.timestamp.toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
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
