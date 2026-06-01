import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Marketing from './pages/Marketing';
import MarketingOnlineBanua from './pages/MarketingOnlineBanua';
import MarketingOfflineBanua from './pages/MarketingOfflineBanua';
import CreateOrderOfflineBanua from './pages/CreateOrderOfflineBanua';

import Promo from './pages/Promo';
import SalesOnline from './pages/SalesOnline';
import Finance from './pages/Finance';
import FinanceDashboard from './pages/FinanceDashboard';
import CashInBank from './pages/CashInBank';
import Journal from './pages/Journal';
import ChartOfAccounts from './pages/ChartOfAccounts';
import ReportCenter from './pages/ReportCenter';
import Invoice from './pages/Invoice';
import InvoiceForm from './pages/InvoiceForm';
import InvoicePreview from './pages/InvoicePreview';
import Quotation from './pages/Quotation';
import QuotationForm from './pages/QuotationForm';
import QuotationPreview from './pages/QuotationPreview';
import Report from './pages/Report';

// Gudang Pages
import GudangDashboard from './pages/GudangDashboard';
import Stok from './pages/Stok';
import StokDetail from './pages/StokDetail';
import Sparepart from './pages/Sparepart';
import BarangMasuk from './pages/BarangMasuk';
import BarangKeluar from './pages/BarangKeluar';
import Mutasi from './pages/Mutasi';
import WarningStok from './pages/WarningStok';
import StokJalan from './pages/StokJalan';

// IT Pages
import ITDashboard from './pages/ITDashboard';
import UserManagement from './pages/UserManagement';
import RolePermission from './pages/RolePermission';
import ActivityLog from './pages/ActivityLog';
import BackupDatabase from './pages/BackupDatabase';
import MonitoringSystem from './pages/MonitoringSystem';
import SystemSettings from './pages/SystemSettings';

import OwnerMonitoring from './pages/OwnerMonitoring';
import ApprovalCenter from './pages/ApprovalCenter';

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
    console.warn('Akses ditolak: Token atau User tidak ditemukan.');
    return <Navigate to='/' replace />;
  }

  const userRole = (user.role || '').toLowerCase();

  if (userRole === 'owner') {
    return children;
  }


  if (allowedRoles && !allowedRoles.some(r => r.toLowerCase() === userRole)) {
    console.warn(`Akses ditolak: Role ${user.role} tidak diizinkan masuk.`);
    if (userRole === 'owner') return <Navigate to='/marketing-online/dashboard' replace />;
      if (userRole === 'finance') return <Navigate to='/finance' replace />;
    if (userRole === 'gudang') return <Navigate to='/gudang' replace />;
    if (userRole === 'produksi') return <Navigate to='/produksi/dashboard' replace />;
    if (userRole === 'admin_it') return <Navigate to='/it/dashboard' replace />;
    if (userRole === 'marketing_online') return <Navigate to='/marketing-online/dashboard' replace />;
    if (userRole === 'marketing_offline') return <Navigate to='/marketing-offline/dashboard' replace />;
    return <Navigate to='/dashboard' replace />;
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
        <Route path="/dashboard" element={
          <ProtectedRoute allowedRoles={['Admin', 'Manager', 'Marketing', 'marketing_offline']}>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/marketing" element={
          <ProtectedRoute allowedRoles={['Admin', 'Manager', 'Marketing', 'marketing_online', 'marketing_offline']}>
            <Marketing />
          </ProtectedRoute>
        } />
        <Route 
          path="/marketing-offline/create-order" 
          element={
            <ProtectedRoute allowedRoles={['owner', 'Admin', 'Manager', 'marketing_offline']}>
              <CreateOrderOfflineBanua />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/marketing-offline/*" 
          element={
            <ProtectedRoute allowedRoles={['owner', 'Admin', 'Manager', 'marketing_offline']}>
              <MarketingOfflineBanua />
            </ProtectedRoute>
          } 
        />
        <Route path="/marketing-online" element={<Navigate to="/marketing-online/dashboard" replace />} />
        <Route path="/marketing-online/:tab/:subtab?" element={
          <ProtectedRoute allowedRoles={['owner', 'Admin', 'Manager', 'marketing_online', 'Marketing']}>
            <MarketingOnlineBanua />
          </ProtectedRoute>
        } />
        <Route path="/gudang" element={
          <ProtectedRoute allowedRoles={['owner', 'Admin', 'Manager', 'Gudang']}>
            <GudangDashboard />
          </ProtectedRoute>
        } />
        <Route path="/gudang/order-marketplace" element={
          <ProtectedRoute allowedRoles={['owner', 'Admin', 'Manager', 'Gudang']}>
            <MarketingOnlineBanua forcedTab="orders" />
          </ProtectedRoute>
        } />
        <Route path="/stok" element={
          <ProtectedRoute allowedRoles={['owner', 'Admin', 'Manager', 'Gudang']}>
            <Stok />
          </ProtectedRoute>
        } />
        <Route path="/stok/detail" element={
          <ProtectedRoute allowedRoles={['owner', 'Admin', 'Manager', 'Gudang']}>
            <StokDetail />
          </ProtectedRoute>
        } />
        <Route path="/stok-jalan" element={
          <ProtectedRoute allowedRoles={['owner', 'Admin', 'Manager', 'Gudang']}>
            <StokJalan />
          </ProtectedRoute>
        } />
        <Route path="/sparepart" element={
          <ProtectedRoute allowedRoles={['owner', 'Admin', 'Manager', 'Gudang']}>
            <Sparepart />
          </ProtectedRoute>
        } />
        <Route path="/barang-masuk" element={
          <ProtectedRoute allowedRoles={['owner', 'Admin', 'Manager', 'Gudang']}>
            <BarangMasuk />
          </ProtectedRoute>
        } />
        <Route path="/barang-keluar" element={
          <ProtectedRoute allowedRoles={['owner', 'Admin', 'Manager', 'Gudang']}>
            <BarangKeluar />
          </ProtectedRoute>
        } />
        <Route path="/mutasi" element={
          <ProtectedRoute allowedRoles={['owner', 'Admin', 'Manager', 'Gudang']}>
            <Mutasi />
          </ProtectedRoute>
        } />
        <Route path="/warning-stok" element={
          <ProtectedRoute allowedRoles={['owner', 'Admin', 'Manager', 'Gudang']}>
            <WarningStok />
          </ProtectedRoute>
        } />
        <Route path="/promo" element={
          <ProtectedRoute allowedRoles={['Admin', 'Manager', 'Marketing', 'marketing_online', 'marketing_offline']}>
            <Promo />
          </ProtectedRoute>
        } />
        <Route path="/sales-online" element={
          <ProtectedRoute allowedRoles={['Admin', 'Manager', 'Marketing', 'marketing_online', 'marketing_offline']}>
            <SalesOnline />
          </ProtectedRoute>
        } />
        <Route path="/finance" element={
          <ProtectedRoute allowedRoles={['owner', 'Admin', 'Manager', 'Finance']}>
            <FinanceDashboard />
          </ProtectedRoute>
        } />
        <Route path="/cash-in-bank" element={
          <ProtectedRoute allowedRoles={['owner', 'Admin', 'Manager', 'Finance']}>
            <CashInBank />
          </ProtectedRoute>
        } />
        <Route path="/journal/:type" element={
          <ProtectedRoute allowedRoles={['owner', 'Admin', 'Manager', 'Finance']}>
            <Journal />
          </ProtectedRoute>
        } />
        <Route path="/journal" element={
          <Navigate to="/journal/sales" replace />
        } />
        <Route path="/chart-of-accounts" element={
          <ProtectedRoute allowedRoles={['owner', 'Admin', 'Manager', 'Finance']}>
            <ChartOfAccounts />
          </ProtectedRoute>
        } />
        <Route path="/invoice" element={
          <ProtectedRoute allowedRoles={['owner', 'Admin', 'Manager', 'Finance']}>
            <Invoice />
          </ProtectedRoute>
        } />
        <Route path="/invoice/create" element={
          <ProtectedRoute allowedRoles={['owner', 'Admin', 'Manager', 'Finance']}>
            <InvoiceForm />
          </ProtectedRoute>
        } />
        <Route path="/invoice/edit/:id" element={
          <ProtectedRoute allowedRoles={['owner', 'Admin', 'Manager', 'Finance']}>
            <InvoiceForm />
          </ProtectedRoute>
        } />
        <Route path="/invoice/preview/:id" element={
          <ProtectedRoute allowedRoles={['owner', 'Admin', 'Manager', 'Finance']}>
            <InvoicePreview />
          </ProtectedRoute>
        } />

        {/* QUOTATION ROUTES */}
        <Route path="/quotation" element={
          <ProtectedRoute allowedRoles={['owner', 'Admin', 'Manager', 'Finance', 'marketing_offline']}>
            <Quotation />
          </ProtectedRoute>
        } />
        <Route path="/quotation/create" element={
          <ProtectedRoute allowedRoles={['owner', 'Admin', 'Manager', 'Finance', 'marketing_offline']}>
            <QuotationForm />
          </ProtectedRoute>
        } />
        <Route path="/quotation/edit/:id" element={
          <ProtectedRoute allowedRoles={['owner', 'Admin', 'Manager', 'Finance', 'marketing_offline']}>
            <QuotationForm />
          </ProtectedRoute>
        } />
        <Route path="/quotation/preview/:id" element={
          <ProtectedRoute allowedRoles={['owner', 'Admin', 'Manager', 'Finance', 'marketing_offline']}>
            <QuotationPreview />
          </ProtectedRoute>
        } />

        <Route path="/report/*" element={
          <ProtectedRoute allowedRoles={['owner', 'Admin', 'Manager', 'Finance']}>
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
        <Route path="/owner/monitoring" element={<ProtectedRoute allowedRoles={['owner']}><OwnerMonitoring /></ProtectedRoute>} />
        <Route path="/owner/monitoring/:section" element={<ProtectedRoute allowedRoles={['owner']}><OwnerMonitoring /></ProtectedRoute>} />
        <Route path="/finance/approval" element={<ProtectedRoute allowedRoles={['owner', 'Admin', 'Manager', 'Finance']}><ApprovalCenter /></ProtectedRoute>} />

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
