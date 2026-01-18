import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { ArchitectureProvider } from './context/ArchitectureContext';
import Navbar from './components/Navbar';
import LiquidEtherBackground from './components/LiquidEtherBackground';

import Home from './pages/Home';
import AnalysisWorkbench from './pages/AnalysisWorkbench';
import Dashboard from './pages/Dashboard';
import Analytics from './pages/Analytics';
import AdvancedAnalytics from './pages/AdvancedAnalytics';
import Contact from './pages/Contact';
import FAQ from './pages/FAQ';
import ChartDemo from './pages/ChartDemo';
import ChatbotPage from './pages/ChatbotPage';

export default function App() {
  return (
    <ThemeProvider>
      <ArchitectureProvider>
        <Router>
        <div className="min-h-screen bg-gradient-to-br from-purple-100 via-blue-100 to-cyan-100 dark:from-gray-950 dark:via-blue-950 dark:to-purple-950 transition-colors relative overflow-hidden">
          {/* Liquid Ether Background */}
          <LiquidEtherBackground />
          
          <div className="relative z-10">
            <Navbar />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/workbench" element={<AnalysisWorkbench />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/advanced-analytics" element={<AdvancedAnalytics />} />
              <Route path="/chatbot" element={<ChatbotPage />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/chart-demo" element={<ChartDemo />} />
            </Routes>
          </div>
        </div>
        </Router>
      </ArchitectureProvider>
    </ThemeProvider>
  );
}
