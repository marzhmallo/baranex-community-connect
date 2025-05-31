
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const ChatbotFAQSeeder = () => {
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedStatus, setSeedStatus] = useState('');

  const faqData = [
    {
      category: 'General Greeting',
      question_keywords: ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening'],
      answer_text: "Hello! I'm Alex, your friendly Baranex assistant. I can help you with barangay services, document requests, system guidance, and general inquiries. How can I assist you today?"
    },
    {
      category: 'System Help',
      question_keywords: ['help', 'how to use', 'guide', 'tutorial', 'navigation'],
      answer_text: "I'm here to help you navigate the Baranex system! You can use the sidebar to access different sections like Residents, Households, Documents, Events, and more. Is there a specific feature you'd like help with?"
    },
    {
      category: 'Document Services',
      question_keywords: ['document', 'certificate', 'clearance', 'permit', 'id', 'barangay certificate'],
      answer_text: "For document requests like barangay certificates, clearances, or permits, please visit the Documents section in the system. You can request documents there and track their status. For specific requirements, please contact your barangay admin."
    },
    {
      category: 'Contact Information',
      question_keywords: ['contact', 'phone', 'email', 'address', 'office hours'],
      answer_text: "For specific contact information and office hours, please check the Officials section in the system or contact your barangay admin directly. I can help with general system guidance."
    },
    {
      category: 'Services',
      question_keywords: ['services', 'what can I do', 'available services', 'barangay services'],
      answer_text: "The Baranex system offers various services including resident registration, document requests, event information, announcements, and more. You can explore different sections using the navigation menu. What specific service are you looking for?"
    }
  ];

  const seedFAQs = async () => {
    setIsSeeding(true);
    setSeedStatus('Seeding FAQ data...');

    try {
      // Check if FAQs already exist
      const { data: existingFAQs, error: checkError } = await supabase
        .from('chatbot_faq')
        .select('id');

      if (checkError) {
        throw checkError;
      }

      if (existingFAQs && existingFAQs.length > 0) {
        setSeedStatus('FAQ data already exists!');
        setIsSeeding(false);
        return;
      }

      // Insert FAQ data
      const { error: insertError } = await supabase
        .from('chatbot_faq')
        .insert(faqData);

      if (insertError) {
        throw insertError;
      }

      setSeedStatus('FAQ data seeded successfully!');
    } catch (error) {
      console.error('Error seeding FAQ data:', error);
      setSeedStatus(`Error: ${error.message}`);
    } finally {
      setIsSeeding(false);
    }
  };

  useEffect(() => {
    // Auto-seed on component mount if we're in development
    if (process.env.NODE_ENV === 'development') {
      seedFAQs();
    }
  }, []);

  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <h3 className="text-lg font-semibold mb-2">Chatbot FAQ Seeder</h3>
      <p className="text-sm text-gray-600 mb-4">
        This component seeds the chatbot FAQ database with basic responses.
      </p>
      <button
        onClick={seedFAQs}
        disabled={isSeeding}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {isSeeding ? 'Seeding...' : 'Seed FAQ Data'}
      </button>
      {seedStatus && (
        <p className="mt-2 text-sm text-gray-700">{seedStatus}</p>
      )}
    </div>
  );
};

export default ChatbotFAQSeeder;
