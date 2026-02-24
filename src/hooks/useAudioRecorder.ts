import { useState, useRef, useCallback } from 'react';
import { convertWebmToWav } from '../utils/audioConverter';

export const useAudioRecorder = (onStart?: () => void) => {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    try {
      if (onStart) {
        onStart();
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
      throw error;
    }
  }, [onStart]);

  const stopRecording = useCallback((): Promise<Blob> => {
    return new Promise(async (resolve, reject) => {
      if (!mediaRecorderRef.current) {
        reject(new Error('No active recording'));
        return;
      }

      const mediaRecorder = mediaRecorderRef.current;

      mediaRecorder.onstop = async () => {
        try {
          const webmBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const wavBlob = await convertWebmToWav(webmBlob, 16000);
          setIsRecording(false);

          mediaRecorder.stream.getTracks().forEach((track) => track.stop());

          resolve(wavBlob);
        } catch (error) {
          reject(error);
        }
      };

      mediaRecorder.stop();
    });
  }, []);

  return {
    isRecording,
    startRecording,
    stopRecording,
  };
};
