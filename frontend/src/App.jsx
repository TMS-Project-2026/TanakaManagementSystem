import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Marketing from './pages/Marketing';

import Promo from './pages/Promo';
import SalesOnline from './pages/SalesOnline';
import Finance from './pages/Finance';
import FinanceDashboard from './pages/FinanceDashboard';
import CashInBank from './pages/CashInBank';
import Expense from './pages/Expense';
import ReportCenter from './pages/ReportCenter';
import Invoice from './pages/Invoice';
import InvoiceForm from './pages/InvoiceForm';
import InvoicePreview from './pages/InvoicePreview';
import Report from './pages/Report';

// Gudang Pages
import GudangDashboard from './pages/GudangDashboard';
import Stok from './pages/Stok';
import Sparepart from './pages/Sparepart';
import BarangMasuk from './pages/BarangMasuk';
import BarangKeluar from './pages/BarangKeluar';
import Mutasi from './pages/Mutasi';
import WarningStok from './pages/WarningStok';

// IT Pages
import ITDashboard from './pages/ITDashboard';
import UserManagement from './pages/UserManagement';
import RolePermission from './pages/RolePermission';
import ActivityLog from './pages/ActivityLog';
import BackupDatabase from './pages/BackupDatabase';
import MonitoringSystem from './pages/MonitoringSystem';
import SystemSettings from './pages/SystemSettings';

// Owner Pages
import OwnerDashboard from './pages/OwnerDashboard';
import MarketingOverview from './pages/MarketingOverview';
import FinanceOverview from './pages/FinanceOverview';
import GudangOverview from './pages/GudangOverview';
import ProduksiOverview from './pages/ProduksiOverview';
import ApprovalCenter from './pages/ApprovalCenter';
import CabangPerformance from './pages/CabangPerformance';
import UserSummary from './pages/UserSummary';

// Produksi Pages
import ProduksiDashboard from './pages/ProduksiDashboard';
import OrderMasuk from './pages/OrderMasuk';
import JadwalProduksi from './pages/JadwalProduksi';
import ProsesProduksi from './pages/ProsesProduksi';
import TimProduksi from './pages/TimProduksi';
import QualityControl from './pages/QualityControl';
import Packing from './pages/Packing';
import ProduksiSelesai from './pages/ProduksiSelesai';
import DeadlineProduksi from './pages/DeadlineProduksi';
import RiwayatProduksi from './pages/RiwayatProduksi';

// 🔒 Protected Route (Pengaman Halaman dengan Role Middleware)
const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));

  if (!token || !user) {
    console.warn("Akses ditolak: Token atau User tidak ditemukan.");
    return <Navigate to="/" replace />;
  }

  // Jika allowedRoles didefinisikan dan role user tidak ada di dalamnya
  if (allowedRoles && user.role !== 'owner' && !allowedRoles.some(r => r.toLowerCase() === user.role.toLowerCase())) {
    console.warn(`Akses ditolak: Role ${user.role} tidak diizinkan masuk.`);
    // Arahkan ke dashboard spesifik berdasarkan rolenya agar tidak stuck
    const lowerRole = user.role.toLowerCase();
    if (lowerRole === 'finance') return <Navigate to="/finance" replace />;
    if (lowerRole === 'gudang') return <Navigate to="/gudang" replace />;
    if (lowerRole === 'produksi') return <Navigate to="/produksi/dashboard" replace />;
    if (lowerRole === 'admin_it') return <Navigate to="/it/dashboard" replace />;
    if (lowerRole === 'owner') return <Navigate to="/owner/dashboard" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <Routes>

        {/* LOGIN */}
        <Route path="/" element={<Login />} />

        {/* PROTECTED (Hanya bisa diakses kalau sudah login dan punya akses role) */}
        {/* Dashboard Umum (Admin, Manager, Marketing) */}
        <Route path="/dashboard" element={
          <ProtectedRoute allowedRoles={['Admin', 'Manager', 'Marketing']}>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/marketing" element={
          <ProtectedRoute allowedRoles={['Admin', 'Manager', 'Marketing']}>
            <Marketing />
          </ProtectedRoute>
        } />
        <Route path="/gudang" element={
          <ProtectedRoute allowedRoles={['Admin', 'Manager', 'Gudang']}>
            <GudangDashboard />
          </ProtectedRoute>
        } />
        <Route path="/stok" element={
          <ProtectedRoute allowedRoles={['Admin', 'Manager', 'Gudang']}>
            <Stok />
          </ProtectedRoute>
        } />
        <Route path="/sparepart" element={
          <ProtectedRoute allowedRoles={['Admin', 'Manager', 'Gudang']}>
            <Sparepart />
          </ProtectedRoute>
        } />
        <Route path="/barang-masuk" element={
          <ProtectedRoute allowedRoles={['Admin', 'Manager', 'Gudang']}>
            <BarangMasuk />
          </ProtectedRoute>
        } />
        <Route path="/barang-keluar" element={
          <ProtectedRoute allowedRoles={['Admin', 'Manager', 'Gudang']}>
            <BarangKeluar />
          </ProtectedRoute>
        } />
        <Route path="/mutasi" element={
          <ProtectedRoute allowedRoles={['Admin', 'Manager', 'Gudang']}>
            <Mutasi />
          </ProtectedRoute>
        } />
        <Route path="/warning-stok" element={
          <ProtectedRoute allowedRoles={['Admin', 'Manager', 'Gudang']}>
            <WarningStok />
          </ProtectedRoute>
        } />
        <Route path="/promo" element={
          <ProtectedRoute allowedRoles={['Admin', 'Manager', 'Marketing']}>
            <Promo />
          </ProtectedRoute>
        } />
        <Route path="/sales-online" element={
          <ProtectedRoute allowedRoles={['Admin', 'Manager', 'Marketing']}>
            <SalesOnline />
          </ProtectedRoute>
        } />
        <Route path="/finance" element={
          <ProtectedRoute allowedRoles={['Admin', 'Manager', 'Finance']}>
            <FinanceDashboard />
          </ProtectedRoute>
        } />
        <Route path="/cash-in-bank" element={
          <ProtectedRoute allowedRoles={['Admin', 'Manager', 'Finance']}>
            <CashInBank />
          </ProtectedRoute>
        } />
        <Route path="/expense" element={
          <ProtectedRoute allowedRoles={['Admin', 'Manager', 'Finance']}>
            <Expense />
          </ProtectedRoute>
        } />
        <Route path="/invoice" element={
          <ProtectedRoute allowedRoles={['Admin', 'Manager', 'Finance']}>
            <Invoice />
          </ProtectedRoute>
        } />
        <Route path="/invoice/create" element={
          <ProtectedRoute allowedRoles={['Admin', 'Manager', 'Finance']}>
            <InvoiceForm />
          </ProtectedRoute>
        } />
        <Route path="/invoice/edit/:id" element={
          <ProtectedRoute allowedRoles={['Admin', 'Manager', 'Finance']}>
            <InvoiceForm />
          </ProtectedRoute>
        } />
        <Route path="/invoice/preview/:id" element={
          <ProtectedRoute allowedRoles={['Admin', 'Manager', 'Finance']}>
            <InvoicePreview />
          </ProtectedRoute>
        } />
        <Route path="/report/*" element={
          <ProtectedRoute allowedRoles={['Admin', 'Manager', 'Finance']}>
            <ReportCenter />
          </ProtectedRoute>
        } />

        {/* Production Routes */}
        <Route path="/it/dashboard" element={
          <ProtectedRoute allowedRoles={['Admin', 'Manager', 'owner', 'admin_it']}>
            <ITDashboard />
          </ProtectedRoute>
        } />
        <Route path="/it/users" element={
          <ProtectedRoute allowedRoles={['Admin', 'Manager', 'owner', 'admin_it']}>
            <UserManagement />
          </ProtectedRoute>
        } />
        <Route path="/it/permissions" element={
          <ProtectedRoute allowedRoles={['Admin', 'Manager', 'owner', 'admin_it']}>
            <RolePermission />
          </ProtectedRoute>
        } />
        <Route path="/it/logs" element={
          <ProtectedRoute allowedRoles={['Admin', 'Manager', 'owner', 'admin_it']}>
            <ActivityLog />
          </ProtectedRoute>
        } />
        <Route path="/it/backup" element={
          <ProtectedRoute allowedRoles={['Admin', 'Manager', 'owner', 'admin_it']}>
            <BackupDatabase />
          </ProtectedRoute>
        } />
        <Route path="/it/monitoring" element={
          <ProtectedRoute allowedRoles={['Admin', 'Manager', 'owner', 'admin_it']}>
            <MonitoringSystem />
          </ProtectedRoute>
        } />
        <Route path="/it/settings" element={
          <ProtectedRoute allowedRoles={['Admin', 'Manager', 'owner', 'admin_it']}>
            <SystemSettings />
          </ProtectedRoute>
        } />

        {/* OWNER ROUTES */}
        <Route path="/owner/dashboard" element={<ProtectedRoute allowedRoles={['owner']}><OwnerDashboard /></ProtectedRoute>} />
        <Route path="/owner/marketing" element={<ProtectedRoute allowedRoles={['owner']}><MarketingOverview /></ProtectedRoute>} />
        <Route path="/owner/finance" element={<ProtectedRoute allowedRoles={['owner']}><FinanceOverview /></ProtectedRoute>} />
        <Route path="/owner/gudang" element={<ProtectedRoute allowedRoles={['owner']}><GudangOverview /></ProtectedRoute>} />
        <Route path="/owner/produksi" element={<ProtectedRoute allowedRoles={['owner']}><ProduksiOverview /></ProtectedRoute>} />
        <Route path="/owner/report" element={<ProtectedRoute allowedRoles={['owner']}><ReportCenter /></ProtectedRoute>} />
        <Route path="/owner/approval" element={<ProtectedRoute allowedRoles={['owner']}><ApprovalCenter /></ProtectedRoute>} />
        <Route path="/owner/cabang" element={<ProtectedRoute allowedRoles={['owner']}><CabangPerformance /></ProtectedRoute>} />
        <Route path="/owner/users" element={<ProtectedRoute allowedRoles={['owner']}><UserSummary /></ProtectedRoute>} />

        {/* PRODUKSI ROUTES */}
        <Route path="/produksi/dashboard" element={<ProtectedRoute allowedRoles={['produksi', 'owner', 'Manager', 'Admin']}><ProduksiDashboard /></ProtectedRoute>} />
        <Route path="/produksi/order" element={<ProtectedRoute allowedRoles={['produksi', 'owner', 'Manager', 'Admin']}><OrderMasuk /></ProtectedRoute>} />
        <Route path="/produksi/jadwal" element={<ProtectedRoute allowedRoles={['produksi', 'owner', 'Manager', 'Admin']}><JadwalProduksi /></ProtectedRoute>} />
        <Route path="/produksi/proses" element={<ProtectedRoute allowedRoles={['produksi', 'owner', 'Manager', 'Admin']}><ProsesProduksi /></ProtectedRoute>} />
        <Route path="/produksi/tim" element={<ProtectedRoute allowedRoles={['produksi', 'owner', 'Manager', 'Admin']}><TimProduksi /></ProtectedRoute>} />
        <Route path="/produksi/qc" element={<ProtectedRoute allowedRoles={['produksi', 'owner', 'Manager', 'Admin']}><QualityControl /></ProtectedRoute>} />
        <Route path="/produksi/packing" element={<ProtectedRoute allowedRoles={['produksi', 'owner', 'Manager', 'Admin']}><Packing /></ProtectedRoute>} />
        <Route path="/produksi/selesai" element={<ProtectedRoute allowedRoles={['produksi', 'owner', 'Manager', 'Admin']}><ProduksiSelesai /></ProtectedRoute>} />
        <Route path="/produksi/deadline" element={<ProtectedRoute allowedRoles={['produksi', 'owner', 'Manager', 'Admin']}><DeadlineProduksi /></ProtectedRoute>} />
        <Route path="/produksi/riwayat" element={<ProtectedRoute allowedRoles={['produksi', 'owner', 'Manager', 'Admin']}><RiwayatProduksi /></ProtectedRoute>} />

        {/* DEFAULT */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </Router>
  );
}

export default App;