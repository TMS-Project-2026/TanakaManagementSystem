import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Marketing from './pages/Marketing';
import MarketingOnlineBanua from './pages/MarketingOnlineBanua';
import MarketingOnlineTanaka from './pages/MarketingOnlineTanaka';
import MarketingOfflineBanua from './pages/MarketingOfflineBanua';
import MarketingOfflineTanaka from './pages/MarketingOfflineTanaka';
import CreateOrderOfflineBanua from './pages/CreateOrderOfflineBanua';
import CreateOrderOfflineTanaka from './pages/CreateOrderOfflineTanaka';

import Promo from './pages/Promo';
import SalesOnline from './pages/SalesOnline';

import FinanceDashboard from './pages/FinanceDashboard';
import CashBank from './pages/CashBank';

import PettyCash from './pages/PettyCash';
import AccountsReceivable from './pages/AccountsReceivable';
import AccountsPayable from './pages/AccountsPayable';
import Journal from './pages/Journal';
import ChartOfAccounts from './pages/ChartOfAccounts';
import ReportCenter from './pages/ReportCenter';
import Invoice from './pages/Invoice';
import PengaturanKeuangan from './pages/PengaturanKeuangan';
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
import PermintaanStok from './pages/PermintaanStok';

// IT Pages
import ITDashboard from './pages/ITDashboard';
import UserManagement from './pages/UserManagement';
import RolePermission from './pages/RolePermission';
import ActivityLog from './pages/ActivityLog';
import BackupDatabase from './pages/BackupDatabase';
import MonitoringSystem from './pages/MonitoringSystem';
import SystemSettings from './pages/SystemSettings';

import OwnerMonitoring from './pages/OwnerMonitoring';
import OwnerDashboard from './pages/OwnerDashboard';
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

// Accestret Pages
import AccestretMarketingDashboard from './pages/AccestretMarketingDashboard';
import AccestretGudangDashboard from './pages/AccestretGudangDashboard';
import AccestretProduksiDashboard from './pages/AccestretProduksiDashboard';
import AccestretQuotation from './pages/AccestretQuotation';
import AccestretQuotationForm from './pages/AccestretQuotationForm';

import Pricelist from './pages/Pricelist';
import PricelistOnline from './pages/PricelistOnline';

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
      if (userRole === 'finance') return <Navigate to='/finance' replace />;
      if (userRole === 'gudang') return <Navigate to='/gudang' replace />;
      if (userRole === 'produksi') return <Navigate to='/produksi/dashboard' replace />;
      if (userRole === 'admin_it') return <Navigate to='/it/dashboard' replace />;
      if (userRole === 'marketing_online') return <Navigate to='/marketing-online/dashboard' replace />;
      if (userRole === 'marketing_online_tanaka') return <Navigate to='/marketing-online-tanaka/dashboard' replace />;
      if (userRole === 'marketing_offline') return <Navigate to='/marketing-offline/dashboard' replace />;
      if (userRole === 'marketing_offline_tanaka') return <Navigate to='/marketing-offline-tanaka/dashboard' replace />;
      if (userRole === 'marketing_accestret') return <Navigate to='/accestret/marketing/dashboard' replace />;
      if (userRole === 'gudang_accestret') return <Navigate to='/accestret/gudang/dashboard' replace />;
      if (userRole === 'produksi_accestret') return <Navigate to='/accestret/produksi/dashboard' replace />;
      return <Navigate to='/dashboard' replace />;
    }

  return children;
};
function App() {
  // Jalankan pengecekan sesi baru saat aplikasi pertama kali dimuat
  if (!sessionStorage.getItem('session_active')) {
    if (localStorage.getItem('remember_me') !== 'true') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    sessionStorage.setItem('session_active', 'true');
  }

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
        <Route 
          path="/marketing-offline-tanaka/create-order" 
          element={
            <ProtectedRoute allowedRoles={['owner', 'Admin', 'Manager', 'marketing_offline_tanaka']}>
              <CreateOrderOfflineTanaka />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/marketing-offline-tanaka/*" 
          element={
            <ProtectedRoute allowedRoles={['owner', 'Admin', 'Manager', 'marketing_offline_tanaka']}>
              <MarketingOfflineTanaka />
            </ProtectedRoute>
          } 
        />
        <Route path="/marketing-online" element={<Navigate to="/marketing-online/dashboard" replace />} />
        <Route path="/marketing-online/:tab/:subtab?" element={
          <ProtectedRoute allowedRoles={['owner', 'Admin', 'Manager', 'marketing_online', 'Marketing']}>
            <MarketingOnlineBanua />
          </ProtectedRoute>
        } />
        <Route path="/marketing-online-tanaka" element={<Navigate to="/marketing-online-tanaka/dashboard" replace />} />
        <Route path="/marketing-online-tanaka/:tab/:subtab?" element={
          <ProtectedRoute allowedRoles={['owner', 'Admin', 'Manager', 'marketing_online_tanaka']}>
            <MarketingOnlineTanaka />
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
          <ProtectedRoute allowedRoles={['owner', 'Admin', 'Manager', 'Gudang', 'gudang_accestret']}>
            <Stok />
          </ProtectedRoute>
        } />
        <Route path="/stok/detail" element={
          <ProtectedRoute allowedRoles={['owner', 'Admin', 'Manager', 'Gudang', 'gudang_accestret']}>
            <StokDetail />
          </ProtectedRoute>
        } />
        <Route path="/stok-jalan" element={
          <ProtectedRoute allowedRoles={['owner', 'Admin', 'Manager', 'Gudang', 'gudang_accestret']}>
            <StokJalan />
          </ProtectedRoute>
        } />
        <Route path="/permintaan-stok" element={
          <ProtectedRoute allowedRoles={['owner', 'Admin', 'Manager', 'Gudang', 'gudang_accestret']}>
            <PermintaanStok />
          </ProtectedRoute>
        } />
        <Route path="/sparepart" element={
          <ProtectedRoute allowedRoles={['owner', 'Admin', 'Manager', 'Gudang']}>
            <Sparepart />
          </ProtectedRoute>
        } />
        <Route path="/barang-masuk" element={
          <ProtectedRoute allowedRoles={['owner', 'Admin', 'Manager', 'Gudang', 'gudang_accestret']}>
            <BarangMasuk />
          </ProtectedRoute>
        } />
        <Route path="/barang-keluar" element={
          <ProtectedRoute allowedRoles={['owner', 'Admin', 'Manager', 'Gudang', 'gudang_accestret']}>
            <BarangKeluar />
          </ProtectedRoute>
        } />
        <Route path="/mutasi" element={
          <ProtectedRoute allowedRoles={['owner', 'Admin', 'Manager', 'Gudang', 'gudang_accestret']}>
            <Mutasi />
          </ProtectedRoute>
        } />
        <Route path="/warning-stok" element={
          <ProtectedRoute allowedRoles={['owner', 'Admin', 'Manager', 'Gudang', 'gudang_accestret']}>
            <WarningStok />
          </ProtectedRoute>
        } />
        <Route path="/promo" element={
          <ProtectedRoute allowedRoles={['Admin', 'Manager', 'Marketing', 'marketing_online', 'marketing_offline', 'marketing_offline_tanaka']}>
            <Promo />
          </ProtectedRoute>
        } />
        <Route path="/pricelist" element={
          <ProtectedRoute allowedRoles={['Admin', 'Manager', 'owner', 'Finance', 'marketing_offline', 'marketing_offline_tanaka']}>
            <Pricelist />
          </ProtectedRoute>
        } />
        <Route path="/pricelist-online" element={
          <ProtectedRoute allowedRoles={['Admin', 'Manager', 'owner', 'marketing_online', 'marketing_online_tanaka', 'Marketing']}>
            <PricelistOnline />
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
        <Route path="/cash-bank" element={
          <ProtectedRoute allowedRoles={['Admin', 'Manager', 'Finance']}>
            <CashBank />
          </ProtectedRoute>
        } />
        <Route path="/petty-cash" element={
          <ProtectedRoute allowedRoles={['Admin', 'Manager', 'Finance']}>
            <PettyCash />
          </ProtectedRoute>
        } />
        <Route path="/piutang" element={
          <ProtectedRoute allowedRoles={['Admin', 'Manager', 'Finance']}>
            <AccountsReceivable />
          </ProtectedRoute>
        } />
        <Route path="/hutang" element={
          <ProtectedRoute allowedRoles={['Admin', 'Manager', 'Finance']}>
            <AccountsPayable />
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
        <Route path="/finance/settings" element={
          <ProtectedRoute allowedRoles={['Admin', 'Manager', 'Finance']}>
            <PengaturanKeuangan />
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
          <ProtectedRoute allowedRoles={['owner', 'Admin', 'Manager', 'Finance', 'marketing_offline', 'marketing_offline_tanaka', 'marketing_accestret', 'marketing_online']}>
            <InvoicePreview />
          </ProtectedRoute>
        } />

        {/* QUOTATION ROUTES */}
        <Route path="/quotation" element={
          <ProtectedRoute allowedRoles={['owner', 'Admin', 'Manager', 'Finance', 'marketing_offline', 'marketing_offline_tanaka']}>
            <Quotation />
          </ProtectedRoute>
        } />
        <Route path="/quotation/create" element={
          <ProtectedRoute allowedRoles={['owner', 'Admin', 'Manager', 'Finance', 'marketing_offline', 'marketing_offline_tanaka']}>
            <QuotationForm />
          </ProtectedRoute>
        } />
        <Route path="/quotation/edit/:id" element={
          <ProtectedRoute allowedRoles={['owner', 'Admin', 'Manager', 'Finance', 'marketing_offline', 'marketing_offline_tanaka']}>
            <QuotationForm />
          </ProtectedRoute>
        } />
        <Route path="/quotation/preview/:id" element={
          <ProtectedRoute allowedRoles={['owner', 'Admin', 'Manager', 'Finance', 'marketing_offline', 'marketing_offline_tanaka']}>
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
        <Route path="/owner/dashboard" element={<ProtectedRoute allowedRoles={['owner']}><OwnerDashboard /></ProtectedRoute>} />
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

        {/* ACCESTRET ROUTES */}
        <Route path="/accestret/marketing" element={<Navigate to="/accestret/marketing/dashboard" replace />} />
        <Route path="/accestret/marketing/dashboard" element={<ProtectedRoute allowedRoles={['marketing_accestret', 'owner', 'Manager', 'Admin']}><AccestretMarketingDashboard /></ProtectedRoute>} />
        <Route path="/accestret/marketing/:tab/:subtab?" element={<ProtectedRoute allowedRoles={['marketing_accestret', 'owner', 'Manager', 'Admin']}><AccestretMarketingDashboard /></ProtectedRoute>} />
        
        {/* Accestret Quotation */}
        <Route path="/accestret/marketing/quotation" element={<ProtectedRoute allowedRoles={['marketing_accestret', 'owner', 'Manager', 'Admin']}><AccestretQuotation /></ProtectedRoute>} />
        <Route path="/accestret/marketing/quotation/create" element={<ProtectedRoute allowedRoles={['marketing_accestret', 'owner', 'Manager', 'Admin']}><AccestretQuotationForm /></ProtectedRoute>} />
        <Route path="/accestret/marketing/quotation/edit/:id" element={<ProtectedRoute allowedRoles={['marketing_accestret', 'owner', 'Manager', 'Admin']}><AccestretQuotationForm /></ProtectedRoute>} />
        <Route path="/accestret/gudang/*" element={<ProtectedRoute allowedRoles={['gudang_accestret', 'owner', 'Manager', 'Admin']}><AccestretGudangDashboard /></ProtectedRoute>} />
        <Route path="/accestret/produksi/*" element={<ProtectedRoute allowedRoles={['produksi_accestret', 'owner', 'Manager', 'Admin']}><AccestretProduksiDashboard /></ProtectedRoute>} />

        {/* DEFAULT */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </Router>
  );
}

export default App;
