import { useState, useEffect } from 'react';

const STORAGE_KEY = 'child_voice_dictionary_chat_history';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

const loadHistoryFromStorage = (): ChatMessage[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load chat history from storage:', e);
  }
  return [];
};

const saveHistoryToStorage = (history: ChatMessage[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch (e) {
    console.error('Failed to save chat history to storage:', e);
  }
};

export const useChatHistory = () => {
  const [history, setHistory] = useState<ChatMessage[]>(() => loadHistoryFromStorage());

  useEffect(() => {
    saveHistoryToStorage(history);
  }, [history]);

  const addUserMessage = (content: string) => {
    setHistory(prev => [
      ...prev,
      {
        role: 'user' as const,
        content,
        timestamp: Date.now(),
      },
    ].slice(-20));
  };

  const addAssistantMessage = (content: string) => {
    setHistory(prev => [
      ...prev,
      {
        role: 'assistant' as const,
        content,
        timestamp: Date.now(),
      },
    ].slice(-20));
  };

  const getHistory = () => history.map(msg => ({
    role: msg.role,
    content: msg.content,
  }));

  const clearHistory = () => {
    setHistory([]);
  };

  return {
    history,
    addUserMessage,
    addAssistantMessage,
    getHistory,
    clearHistory,
  };
};
