import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Order from './pages/Order';
import Gudang from './pages/Gudang';

// Komponen Guard (Hanya yang sudah login yang bisa masuk)
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/" />;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Pintu Masuk */}
        <Route path="/" element={<Login />} />

        {/* Halaman-Halaman Utama (Diproteksi) */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/order" element={<ProtectedRoute><Order /></ProtectedRoute>} />
        <Route path="/gudang" element={<ProtectedRoute><Gudang /></ProtectedRoute>} />
        
        {/* Kalau nyasar, balikkan ke login */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;