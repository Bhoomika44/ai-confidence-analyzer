import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate
} from 'react-router-dom';

import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';

import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import VerifyCode from './pages/VerifyCode';
import ResetPassword from './pages/ResetPassword';

import DashboardPage from './pages/DashboardPage';
import PresentationPage from './pages/PresentationPage';
import UploadPage from './pages/UploadPage';
import ResultsPage from './pages/ResultsPage';
import PracticePage from './pages/PracticePage';
import HistoryPage from './pages/HistoryPage';
import SettingsPage from './pages/SettingsPage';

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">

            <Navbar />

            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4">

              <Routes>

                {/* Public Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route
                  path="/forgot-password"
                  element={<ForgotPasswordPage />}
                />
                <Route
                  path="/verify-code"
                  element={<VerifyCode />}
                />
                <Route
                  path="/reset-password"
                  element={<ResetPassword />}
                />

                {/* Protected App Routes */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <DashboardPage />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/presentation"
                  element={
                    <ProtectedRoute>
                      <PresentationPage />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/upload"
                  element={
                    <ProtectedRoute>
                      <UploadPage />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/results/:id"
                  element={
                    <ProtectedRoute>
                      <ResultsPage />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/practice/:id"
                  element={
                    <ProtectedRoute>
                      <PracticePage />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/history"
                  element={
                    <ProtectedRoute>
                      <HistoryPage />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute>
                      <SettingsPage />
                    </ProtectedRoute>
                  }
                />

                {/* Unknown route */}
                <Route
                  path="*"
                  element={<Navigate to="/" replace />}
                />

              </Routes>

            </main>

            {/* Footer */}
            <footer className="border-t border-slate-900/80 py-6 text-center text-xs text-slate-400">
              <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
                <span>
                  © 2026 ConfidenceAI — AI Presentation Performance & Weakness Repair Engine
                </span>

                <span>
                  SIH / Hackathon Ready • Observable Behavioral Analysis
                </span>
              </div>
            </footer>

          </div>
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;