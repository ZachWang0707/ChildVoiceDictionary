import { useRef, useCallback, useState } from 'react';

export const useAudioPlayer = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const playAudio = useCallback(async (audioBlob: Blob) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    const url = URL.createObjectURL(audioBlob);
    const audio = new Audio(url);
    audioRef.current = audio;

    return new Promise<void>((resolve) => {
      audio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(url);
        resolve();
      };

      audio.onerror = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(url);
        resolve();
      };

      setIsPlaying(true);
      audio.play().catch((error) => {
        console.error('Failed to play audio:', error);
        setIsPlaying(false);
        resolve();
      });
    });
  }, []);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setIsPlaying(false);
    }
  }, []);

  return {
    isPlaying,
    playAudio,
    stopAudio,
  };
};
