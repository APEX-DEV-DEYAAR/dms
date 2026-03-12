import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { ToastContainer } from './components/Toast';
import { ProtectedRoute } from './components/ProtectedRoute';
import { TopNavigation } from './components/TopNavigation';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { UploadPage } from './pages/UploadPage';
import { LetterheadDetailPage } from './pages/LetterheadDetailPage';
import { MonitoringPage } from './pages/MonitoringPage';

function AppLayout() {
  return (
    <div className="min-h-screen bg-[#F8F6F3]">
      <TopNavigation />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          <Route path="/" element={
            <ProtectedRoute><DashboardPage /></ProtectedRoute>
          } />
          <Route path="/upload" element={
            <ProtectedRoute roles={['department_user', 'admin']}><UploadPage /></ProtectedRoute>
          } />
          <Route path="/letterheads/:id" element={
            <ProtectedRoute><LetterheadDetailPage /></ProtectedRoute>
          } />
          <Route path="/monitoring" element={
            <ProtectedRoute roles={['ceo_office', 'compliance', 'admin']}><MonitoringPage /></ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <ToastContainer />
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/*" element={<AppLayout />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
