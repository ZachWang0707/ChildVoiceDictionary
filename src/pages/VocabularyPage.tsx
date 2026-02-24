import React from 'react';
import { Link } from 'react-router-dom';
import './VocabularyPage.css';

const VocabularyPage: React.FC = () => {
  const mockWords = [
    { id: 1, word: 'apple', meaning: '名词，苹果' },
    { id: 2, word: 'banana', meaning: '名词，香蕉' },
    { id: 3, word: 'cat', meaning: '名词，猫' },
  ];

  return (
    <div className="vocabulary-page">
      <div className="header">
        <Link to="/" className="back-button">
          ← 返回
        </Link>
        <h1 className="page-title">生词表</h1>
      </div>

      <div className="word-list">
        {mockWords.length === 0 ? (
          <p className="empty-message">还没有生词哦，快去查词吧！</p>
        ) : (
          mockWords.map((item) => (
            <div key={item.id} className="word-item">
              <div className="word-info">
                <span className="word-text">{item.word}</span>
                <span className="word-meaning">{item.meaning}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default VocabularyPage;
