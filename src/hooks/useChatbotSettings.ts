
import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';

export const useChatbotSettings = () => {
  const { user } = useAuth();
  const [chatbotSettings, setChatbotSettings] = useState({
    enabled: true, // default to true
    mode: 'offline' // default to offline
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      if (!user?.id) {
        // If no user, use localStorage defaults
        const enabled = localStorage.getItem('chatbot-enabled') !== 'false';
        const mode = localStorage.getItem('chatbot-mode') || 'offline';
        setChatbotSettings({ enabled, mode });
        setIsLoading(false);
        return;
      }

      try {
        // Fetch both settings from the database
        const { data: settings } = await supabase
          .from('settings')
          .select('key, value')
          .eq('userid', user.id)
          .in('key', ['chatbot_enabled', 'chatbot_mode']);

        let enabled = true; // default
        let mode = 'offline'; // default

        if (settings) {
          const enabledSetting = settings.find(s => s.key === 'chatbot_enabled');
          const modeSetting = settings.find(s => s.key === 'chatbot_mode');
          
          if (enabledSetting) enabled = enabledSetting.value === 'true';
          if (modeSetting) mode = modeSetting.value;
        }

        setChatbotSettings({ enabled, mode });
      } catch (error) {
        console.error('Error fetching chatbot settings:', error);
        // Fall back to localStorage on error
        const enabled = localStorage.getItem('chatbot-enabled') !== 'false';
        const mode = localStorage.getItem('chatbot-mode') || 'offline';
        setChatbotSettings({ enabled, mode });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();

    // Set up real-time subscription for settings changes
    let channel;
    if (user?.id) {
      channel = supabase
        .channel(`chatbot-settings-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'settings',
            filter: `userid=eq.${user.id}`
          },
          (payload) => {
            console.log('Settings changed:', payload);
            // Refetch settings when they change
            fetchSettings();
          }
        )
        .subscribe();
    }

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [user?.id]);

  const updateChatbotEnabled = async (enabled: boolean) => {
    console.log('Updating chatbot enabled to:', enabled);
    
    if (!user?.id) {
      // If no user, use localStorage
      localStorage.setItem('chatbot-enabled', enabled.toString());
      setChatbotSettings(prev => ({ ...prev, enabled }));
      return;
    }

    try {
      // Use upsert with proper conflict resolution
      const { error } = await supabase
        .from('settings')
        .upsert({
          userid: user.id,
          key: 'chatbot_enabled',
          value: enabled.toString(),
          description: 'Enable or disable the chatbot',
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'userid,key',
          ignoreDuplicates: false
        });

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      console.log('Chatbot enabled setting updated successfully:', enabled);
      
      // Update local state immediately for responsive UI
      setChatbotSettings(prev => ({ ...prev, enabled }));
      
    } catch (error) {
      console.error('Error updating chatbot enabled setting:', error);
      // Revert local state on error
      setChatbotSettings(prev => ({ ...prev, enabled: !enabled }));
      throw error; // Re-throw so UI can show error toast
    }
  };

  const updateChatbotMode = async (mode: string) => {
    console.log('Updating chatbot mode to:', mode);
    
    if (!user?.id) {
      // If no user, use localStorage
      localStorage.setItem('chatbot-mode', mode);
      setChatbotSettings(prev => ({ ...prev, mode }));
      return;
    }

    try {
      // Use upsert with proper conflict resolution
      const { error } = await supabase
        .from('settings')
        .upsert({
          userid: user.id,
          key: 'chatbot_mode',
          value: mode,
          description: 'Chatbot mode: online or offline',
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'userid,key',
          ignoreDuplicates: false
        });

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      console.log('Chatbot mode setting updated successfully:', mode);
      
      // Update local state immediately for responsive UI
      setChatbotSettings(prev => ({ ...prev, mode }));
      
    } catch (error) {
      console.error('Error updating chatbot mode setting:', error);
      // Revert local state on error
      const previousMode = chatbotSettings.mode;
      setChatbotSettings(prev => ({ ...prev, mode: previousMode }));
      throw error; // Re-throw so UI can show error toast
    }
  };

  return {
    chatbotSettings,
    updateChatbotEnabled,
    updateChatbotMode,
    isLoading
  };
};
