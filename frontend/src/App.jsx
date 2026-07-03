import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import Academics from './pages/AcademicsNew';
import Internship from './pages/Internship';
import Projects from './pages/Projects';
import AboutMe from './pages/AboutMe';
import ZenMode from './pages/ZenMode';
import Login from './pages/Login';
import Register from './pages/Register';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Isolated Zen Mode Route (Protected) */}
        <Route path="/zen-mode" element={
          <ProtectedRoute>
            <ZenMode />
          </ProtectedRoute>
        } />
        
        {/* Main Application with Sidebar Layout (Protected) */}
        <Route path="*" element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/academics" element={<Academics />} />
                <Route path="/internship" element={<Internship />} />
                <Route path="/projects" element={<Projects />} />
                <Route path="/about" element={<AboutMe />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;
