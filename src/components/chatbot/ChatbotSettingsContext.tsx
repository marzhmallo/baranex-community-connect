
import React, { createContext, useContext, useState, useEffect } from 'react';

interface ChatbotSettings {
  enabled: boolean;
  useOnlineMode: boolean;
}

interface ChatbotSettingsContextType {
  settings: ChatbotSettings;
  updateSettings: (newSettings: Partial<ChatbotSettings>) => void;
}

const ChatbotSettingsContext = createContext<ChatbotSettingsContextType>({
  settings: { enabled: true, useOnlineMode: false },
  updateSettings: () => {},
});

export const ChatbotSettingsProvider = ({ children }: { children: React.ReactNode }) => {
  const [settings, setSettings] = useState<ChatbotSettings>(() => {
    // Load from localStorage or use defaults
    const saved = localStorage.getItem('chatbot-settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return { enabled: true, useOnlineMode: false };
      }
    }
    return { enabled: true, useOnlineMode: false };
  });

  // Save to localStorage whenever settings change
  useEffect(() => {
    localStorage.setItem('chatbot-settings', JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (newSettings: Partial<ChatbotSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  return (
    <ChatbotSettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </ChatbotSettingsContext.Provider>
  );
};

export const useChatbotSettings = () => {
  const context = useContext(ChatbotSettingsContext);
  if (!context) {
    throw new Error('useChatbotSettings must be used within a ChatbotSettingsProvider');
  }
  return context;
};
