import React, { useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import './HomePage.css';
import RecordButton from '../components/RecordButton';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { useChatHistory } from '../hooks/useChatHistory';
import { useVocabulary } from '../hooks/useVocabulary';
import { asrService, ttsService, llmService, HistoryMessage, LLMChatResponse } from '../services/api';

type ButtonState = 'idle' | 'preparing' | 'recording' | 'processing' | 'interruptible';

const HomePage: React.FC = () => {
  const [buttonState, setButtonState] = useState<ButtonState>('idle');
  const [status, setStatus] = useState('按住说话');
  const [recognizedText, setRecognizedText] = useState<string>('');
  const [debugMode, setDebugMode] = useState<boolean>(false);

  const preparingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const interruptibleTimerRef = useRef<NodeJS.Timeout | null>(null);

  const { addWord } = useVocabulary();
  const { history, addUserMessage, addAssistantMessage, getHistory } = useChatHistory();
  const audioPlayer = useAudioPlayer();
  const audioRecorder = useAudioRecorder(() => {
    stopSpeaking();
  });

  const clearAllTimers = useCallback(() => {
    if (preparingTimerRef.current) {
      clearTimeout(preparingTimerRef.current);
      preparingTimerRef.current = null;
    }
    if (interruptibleTimerRef.current) {
      clearTimeout(interruptibleTimerRef.current);
      interruptibleTimerRef.current = null;
    }
  }, []);

  const stopSpeaking = useCallback(() => {
    audioPlayer.stopAudio();
    clearAllTimers();
    setButtonState('idle');
    setStatus('按住说话');
  }, [audioPlayer, clearAllTimers]);

  const handleStartRecording = useCallback(async () => {
    if (buttonState === 'processing') return;

    clearAllTimers();

    if (buttonState === 'interruptible') {
      audioPlayer.stopAudio();
    }

    setButtonState('preparing');
    setStatus('准备中...');

    try {
      await audioRecorder.startRecording();
      
      preparingTimerRef.current = setTimeout(() => {
        setButtonState('recording');
        setStatus('正在录音...');
      }, 500);
    } catch (error) {
      console.error('Failed to start recording:', error);
      setStatus('录音失败，请重试');
      setButtonState('idle');
    }
  }, [buttonState, audioRecorder, clearAllTimers, audioPlayer]);

  const handleStopRecording = useCallback(async () => {
    if (buttonState !== 'preparing' && buttonState !== 'recording') return;

    clearAllTimers();

    try {
      const audioBlob = await audioRecorder.stopRecording();
      setButtonState('processing');
      setStatus('正在识别...');

      const text = await asrService.recognize(audioBlob);
      setRecognizedText(text);
      console.log('[HomePage] Recognized text:', text);

      if (!text.trim()) {
        await speakAndSetIdle('没听清，请再说一遍');
        return;
      }

      await processUserInput(text);
    } catch (error) {
      console.error('Failed to process recording:', error);
      await speakAndSetIdle('出错了，请重试');
    }
  }, [buttonState, audioRecorder, clearAllTimers]);

  const processUserInput = useCallback(async (text: string) => {
    try {
      setStatus('正在理解...');
      
      const historyMsgs = getHistory();
      const response: LLMChatResponse = await llmService.chat(historyMsgs as HistoryMessage[], text);
      console.log('[HomePage] LLM response:', response);

      addUserMessage(text);

      if (response.action === 'save_word' && response.word) {
        addWord(response.word);
      }

      addAssistantMessage(response.speech);

      await speakWithInterruptible(response.speech);
    } catch (error) {
      console.error('Failed to process user input:', error);
      await speakAndSetIdle('出错了，请重试');
    }
  }, [getHistory, addUserMessage, addAssistantMessage, addWord]);

  const speakAndSetIdle = useCallback(async (text: string) => {
    try {
      setButtonState('processing');
      setStatus('正在播报...');
      const audioBlob = await ttsService.synthesize(text);
      await audioPlayer.playAudio(audioBlob);
    } catch (error) {
      console.error('TTS failed:', error);
    } finally {
      setButtonState('idle');
      setStatus('按住说话');
    }
  }, [audioPlayer]);

  const speakWithInterruptible = useCallback(async (text: string) => {
    try {
      setButtonState('processing');
      setStatus('正在播报...');
      
      const audioBlob = await ttsService.synthesize(text);
      
      audioPlayer.playAudio(audioBlob);

      interruptibleTimerRef.current = setTimeout(() => {
        setButtonState('interruptible');
        setStatus('按住说话');
      }, 500);
    } catch (error) {
      console.error('TTS failed:', error);
      setButtonState('idle');
      setStatus('按住说话');
    }
  }, [audioPlayer]);

  return (
    <div className="home-page">
      <div className="header">
        <Link to="/vocabulary" className="vocabulary-link">
          <svg className="vocabulary-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 19.5C4 18.837 4.26339 18.2011 4.75736 17.7574C5.25134 17.3136 5.90213 17.0625 6.5625 17.0625H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M6.5625 4H20V17.0625H6.5625C5.90213 17.0625 5.25134 17.3136 4.75736 17.7574C4.26339 18.2011 4 18.837 4 19.5V6.4375C4 5.77713 4.25134 5.12634 4.75736 4.67258C5.25134 4.21882 5.90213 3.96752 6.5625 4H6.5625Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          生词表
        </Link>
      </div>
      
      <div className="content">
        <h1 className="title">语音英汉词典</h1>
        
        <RecordButton 
          state={buttonState}
          onStartRecording={handleStartRecording}
          onStopRecording={handleStopRecording}
        />

        <div className="status-text">{status}</div>

        {debugMode && (
          <div className="debug-info">
            {recognizedText && <div>识别文字: {recognizedText}</div>}
            {history.length > 0 && (
              <div className="history-preview">
                对话历史 ({history.length}条):
                <ul>
                  {history.slice(-5).map((msg, i) => (
                    <li key={i}>
                      {msg.role === 'user' ? '👤' : '🤖'}: {msg.content.substring(0, 50)}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
      
      <button 
        className={`debug-toggle ${debugMode ? 'active' : ''}`}
        onClick={() => setDebugMode(!debugMode)}
      >
        <svg className="debug-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
          <path d="M12 7V17M7 12H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </button>
    </div>
  );
};

export default HomePage;
