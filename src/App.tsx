import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import VocabularyPage from './pages/VocabularyPage'
import './App.css'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/vocabulary" element={<VocabularyPage />} />
      </Routes>
    </Router>
  )
}

export default App
