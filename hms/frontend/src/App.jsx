import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';


// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import Pharmacy from './pages/Pharmacy';
import Appointments from './pages/Appointments';
import MySchedule from './pages/MySchedule';
import Inventory from './pages/Inventory';
import Wards from './pages/Wards';
import Billing from './pages/Billing';
import Reports from './pages/Reports';
import Welcome from './pages/Welcome';
import AboutUs from './pages/AboutUs';
import Doctors from './pages/Doctors';


// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// App Content (needs to be inside AuthProvider)
const AppContent = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Welcome />} />
      <Route path="/about" element={<AboutUs />} />
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />

      {/* Protected Routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute><Dashboard /></ProtectedRoute>
      } />
      <Route path="/patients" element={
        <ProtectedRoute><Patients /></ProtectedRoute>
      } />
      <Route path="/doctors" element={
        <ProtectedRoute><Doctors /></ProtectedRoute>
      } />
      <Route path="/pharmacy" element={
        <ProtectedRoute><Pharmacy /></ProtectedRoute>
      } />
      <Route path="/inventory" element={
        <ProtectedRoute><Inventory /></ProtectedRoute>
      } />
      <Route path="/appointments" element={
        <ProtectedRoute><Appointments /></ProtectedRoute>
      } />
      <Route path="/my-schedule" element={
        <ProtectedRoute><MySchedule /></ProtectedRoute>
      } />
      <Route path="/wards" element={
        <ProtectedRoute><Wards /></ProtectedRoute>
      } />
      <Route path="/billing" element={
        <ProtectedRoute><Billing /></ProtectedRoute>
      } />
      <Route path="/reports" element={
        <ProtectedRoute><Reports /></ProtectedRoute>
      } />

      {/* Default redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'var(--glass-bg)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '12px',
              boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.1)'
            },
            success: {
              iconTheme: {
                primary: '#0097A7',
                secondary: 'white'
              }
            },
            error: {
              iconTheme: {
                primary: '#C62828',
                secondary: 'white'
              }
            }
          }}
        />
      </Router>
    </AuthProvider>
  );
}

export default App;
