import React, { useCallback } from 'react';
import './RecordButton.css';

type ButtonState = 'idle' | 'preparing' | 'recording' | 'processing' | 'interruptible';

interface RecordButtonProps {
  state: ButtonState;
  onStartRecording: () => void;
  onStopRecording: () => void;
}

const RecordButton: React.FC<RecordButtonProps> = ({ 
  state, 
  onStartRecording, 
  onStopRecording 
}) => {
  const handlePressStart = useCallback(() => {
    if (state === 'processing') return;
    onStartRecording();
  }, [state, onStartRecording]);

  const handlePressEnd = useCallback(() => {
    if (state === 'processing') return;
    onStopRecording();
  }, [state, onStopRecording]);

  const getStateClass = () => {
    switch (state) {
      case 'idle': return 'idle';
      case 'preparing': return 'preparing';
      case 'recording': return 'recording';
      case 'processing': return 'processing';
      case 'interruptible': return 'interruptible';
      default: return 'idle';
    }
  };

  const isDisabled = state === 'processing';

  return (
    <button
      className={`record-button ${getStateClass()}`}
      onMouseDown={handlePressStart}
      onMouseUp={handlePressEnd}
      onMouseLeave={handlePressEnd}
      onTouchStart={handlePressStart}
      onTouchEnd={handlePressEnd}
      disabled={isDisabled}
    >
      <svg className="button-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 14C13.6569 14 15 12.6569 15 11V7C15 5.34315 13.6569 4 12 4C10.3431 4 9 5.34315 9 7V11C9 12.6569 10.3431 14 12 14Z" fill="currentColor"/>
        <path d="M19 11V12C19 15.866 15.866 19 12 19C8.13401 19 5 15.866 5 12V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <path d="M12 19V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <path d="M8 22H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    </button>
  );
};

export default RecordButton;
