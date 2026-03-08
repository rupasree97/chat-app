import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import NitroCheckout from './pages/NitroCheckout';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { SocketProvider } from './context/SocketContext';

const ProtectedRoute = ({ children }) => {
  const { currentUser } = useAuth();
  if (!currentUser) return <Navigate to="/login" />;
  return children;
};

const App = () => {
  return (
    <Router>
      <Toaster position="top-right" toastOptions={{ style: { background: '#2b2d31', color: '#dbdee1', border: '1px solid #1e1f22' } }} />
      <AuthProvider>
        <SocketProvider>
          <DataProvider>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/dashboard/:serverId" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/dashboard/:serverId/:channelId" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/nitro-checkout" element={<ProtectedRoute><NitroCheckout /></ProtectedRoute>} />
            </Routes>
          </DataProvider>
        </SocketProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;
