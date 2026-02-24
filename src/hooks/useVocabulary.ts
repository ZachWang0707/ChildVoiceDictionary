import { useState, useEffect } from 'react';

interface VocabularyWord {
  id: string;
  word: string;
  meaning: string;
  addedAt: number;
}

const STORAGE_KEY = 'child-voice-dictionary-vocabulary';

export const useVocabulary = () => {
  const [words, setWords] = useState<VocabularyWord[]>([]);

  useEffect(() => {
    loadWords();
  }, []);

  const loadWords = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setWords(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load vocabulary:', error);
    }
  };

  const addWord = (word: string, meaning: string = '') => {
    try {
      const newWord: VocabularyWord = {
        id: Date.now().toString(),
        word,
        meaning,
        addedAt: Date.now(),
      };

      const updatedWords = [newWord, ...words];
      setWords(updatedWords);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedWords));
    } catch (error) {
      console.error('Failed to add word:', error);
    }
  };

  const removeWord = (id: string) => {
    try {
      const updatedWords = words.filter((w) => w.id !== id);
      setWords(updatedWords);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedWords));
    } catch (error) {
      console.error('Failed to remove word:', error);
    }
  };

  return {
    words,
    addWord,
    removeWord,
  };
};
