import React from 'react';
import './StatusDisplay.css';

interface StatusDisplayProps {
  status: string;
}

const StatusDisplay: React.FC<StatusDisplayProps> = ({ status }) => {
  return (
    <div className="status-display">
      <p className="status-text">{status}</p>
    </div>
  );
};

export default StatusDisplay;
