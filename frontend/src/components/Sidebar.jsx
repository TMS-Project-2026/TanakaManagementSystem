import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { LayoutDashboard, Users, Package, Gift, LogOut, ShoppingBag, DollarSign, Menu, X, CreditCard, Receipt, FileText, PieChart, Settings, TrendingUp, TrendingDown, ArrowRightLeft, AlertTriangle, Monitor, Shield, Activity, HardDrive, Sliders, MapPin, Layers, Calendar, Clock, CheckCircle, ChevronDown, ShoppingCart, Briefcase, Download, Upload, BarChart2, Tag, Bell } from 'lucide-react';
import LogoTanaka from '../assets/logotanaka.jpeg';

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState({});
  const navigate = useNavigate();
  const location = useLocation();

  // Dapatkan info user dari localStorage
  const user = JSON.parse(localStorage.getItem('user')) || {};
  const userRole = user.role || '';

  const [pendingApprovals, setPendingApprovals] = useState(0);
  const [pendingPermintaanStok, setPendingPermintaanStok] = useState(0);

  useEffect(() => {
    if (['finance', 'admin', 'manager', 'owner', 'gudang'].includes(userRole.toLowerCase())) {
      const fetchPendingCount = async () => {
        try {
          const res = await axios.get('http://localhost:3000/api/owner/approval/pending/count', {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          });
          setPendingApprovals(res.data.count);
        } catch (err) {
          console.error('Error fetching pending approvals:', err);
        }
      };

      const fetchPermintaanStokCount = async () => {
        try {
          const res = await axios.get('http://localhost:3000/api/permintaan-stok/pending/count', {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          });
          setPendingPermintaanStok(res.data.count);
        } catch (err) {
          console.error('Error fetching pending permintaan stok:', err);
        }
      };

      fetchPendingCount();
      fetchPermintaanStokCount();

      const intervalId = setInterval(() => {
        fetchPendingCount();
        fetchPermintaanStokCount();
      }, 30000);
      return () => clearInterval(intervalId);
    }
  }, [userRole]);

  const allMenuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} />, roles: ['Admin', 'Manager', 'Marketing'], group: 'Sales' },
    { name: 'Order Offline', path: '/marketing', icon: <Users size={20} />, roles: ['Admin', 'Manager', 'Marketing'], group: 'Sales' },
    { name: 'Order Marketplace', path: '/sales-online', icon: <ShoppingBag size={20} />, roles: ['Admin', 'Manager', 'Marketing'], group: 'Sales' },
    { name: 'Dashboard Offline', path: '/marketing-offline/dashboard', icon: <TrendingUp size={20} />, roles: ['owner', 'Admin', 'Manager', 'marketing_offline'], group: 'Offline Banua' },
    { name: 'Order Offline', path: '/marketing-offline/orders', icon: <ShoppingBag size={20} />, roles: ['owner', 'Admin', 'Manager', 'marketing_offline'], group: 'Offline Banua' },
    { name: 'Stok Inventory', path: '/marketing-offline/inventory', icon: <Package size={20} />, roles: ['owner', 'Admin', 'Manager', 'marketing_offline'], group: 'Offline Banua' },
    { name: 'Customer', path: '/marketing-offline/customers', icon: <Users size={20} />, roles: ['owner', 'Admin', 'Manager', 'marketing_offline'], group: 'Offline Banua' },
    { name: 'Promo', path: '/marketing-offline/promo', icon: <Gift size={20} />, roles: ['owner', 'Admin', 'Manager', 'marketing_offline'], group: 'Offline Banua' },
    {
      name: 'Report',
      path: '/marketing-offline/reports',
      icon: <FileText size={20} />,
      roles: ['owner', 'Admin', 'Manager', 'marketing_offline'],
      group: 'Offline Banua',
      subMenu: [
        { title: 'Laporan Harian', path: '/marketing-offline/reports/harian' },
        { title: 'Laporan Harian Berjalan', path: '/marketing-offline/reports/bulanan' },
        { title: 'Laporan Bulanan', path: '/marketing-offline/reports/bulanan-monthly' },
        { title: 'Laporan Bulan Berjalan', path: '/marketing-offline/reports/berjalan-monthly' },
        { title: 'Laporan Tahunan', path: '/marketing-offline/reports/tahunan' },
        { title: 'Laporan Tahun Berjalan', path: '/marketing-offline/reports/berjalan-tahunan' }
      ]
    },
    // ===== OFFLINE TANAKA =====
    { name: 'Dashboard Offline', path: '/marketing-offline-tanaka/dashboard', icon: <TrendingUp size={20} />, roles: ['owner', 'Admin', 'Manager', 'marketing_offline_tanaka'], group: 'Offline Tanaka' },
    { name: 'Order Offline', path: '/marketing-offline-tanaka/orders', icon: <ShoppingBag size={20} />, roles: ['owner', 'Admin', 'Manager', 'marketing_offline_tanaka'], group: 'Offline Tanaka' },
    { name: 'Stok Inventory', path: '/marketing-offline-tanaka/inventory', icon: <Package size={20} />, roles: ['owner', 'Admin', 'Manager', 'marketing_offline_tanaka'], group: 'Offline Tanaka' },
    { name: 'Customer', path: '/marketing-offline-tanaka/customers', icon: <Users size={20} />, roles: ['owner', 'Admin', 'Manager', 'marketing_offline_tanaka'], group: 'Offline Tanaka' },
    { name: 'Promo', path: '/marketing-offline-tanaka/promo', icon: <Gift size={20} />, roles: ['owner', 'Admin', 'Manager', 'marketing_offline_tanaka'], group: 'Offline Tanaka' },
    {
      name: 'Report',
      path: '/marketing-offline-tanaka/reports',
      icon: <FileText size={20} />,
      roles: ['owner', 'Admin', 'Manager', 'marketing_offline_tanaka'],
      group: 'Offline Tanaka',
      subMenu: [
        { title: 'Laporan Harian', path: '/marketing-offline-tanaka/reports/harian' },
        { title: 'Laporan Harian Berjalan', path: '/marketing-offline-tanaka/reports/bulanan' },
        { title: 'Laporan Bulanan', path: '/marketing-offline-tanaka/reports/bulanan-monthly' },
        { title: 'Laporan Bulan Berjalan', path: '/marketing-offline-tanaka/reports/berjalan-monthly' },
        { title: 'Laporan Tahunan', path: '/marketing-offline-tanaka/reports/tahunan' },
        { title: 'Laporan Tahun Berjalan', path: '/marketing-offline-tanaka/reports/berjalan-tahunan' }
      ]
    },
    { name: 'Dashboard Online', path: '/marketing-online/dashboard', icon: <LayoutDashboard size={20} />, roles: ['marketing_online', 'Admin', 'Manager', 'Marketing'], group: 'MARKETPLACE BANUA' },
    { name: 'Order Marketplace', path: '/marketing-online/orders', icon: <ShoppingBag size={20} />, roles: ['marketing_online', 'Admin', 'Manager', 'Marketing'], group: 'MARKETPLACE BANUA' },
    { name: 'Stok Inventory', path: '/marketing-online/inventory', icon: <Package size={20} />, roles: ['marketing_online', 'Admin', 'Manager', 'Marketing'], group: 'MARKETPLACE BANUA' },
    { name: 'Promo Online', path: '/marketing-online/promo', icon: <Gift size={20} />, roles: ['marketing_online', 'Admin', 'Manager', 'Marketing'], group: 'MARKETPLACE BANUA' },
    { name: 'Pricelist Harga', path: '/pricelist-online', icon: <Tag size={20} />, roles: ['marketing_online', 'Admin', 'Manager', 'Marketing'], group: 'MARKETPLACE BANUA' },
    {
      name: 'Report',
      path: '/marketing-online/reports',
      icon: <FileText size={20} />,
      roles: ['marketing_online', 'Admin', 'Manager', 'Marketing'],
      group: 'MARKETPLACE BANUA',
      subMenu: [
        { title: 'Laporan Harian', path: '/marketing-online/reports/harian' },
        { title: 'Laporan Harian Berjalan', path: '/marketing-online/reports/bulanan' },
        { title: 'Laporan Bulanan', path: '/marketing-online/reports/bulanan-monthly' },
        { title: 'Laporan Bulan Berjalan', path: '/marketing-online/reports/berjalan-monthly' },
        { title: 'Laporan Tahunan', path: '/marketing-online/reports/tahunan' },
        { title: 'Laporan Tahun Berjalan', path: '/marketing-online/reports/berjalan-tahunan' }
      ]
    },
    { name: 'Dashboard Online', path: '/marketing-online-tanaka/dashboard', icon: <LayoutDashboard size={20} />, roles: ['marketing_online_tanaka', 'Admin', 'Manager', 'Marketing'], group: 'MARKETPLACE TANAKA' },
    { name: 'Order Marketplace', path: '/marketing-online-tanaka/orders', icon: <ShoppingBag size={20} />, roles: ['marketing_online_tanaka', 'Admin', 'Manager', 'Marketing'], group: 'MARKETPLACE TANAKA' },
    { name: 'Stok Inventory', path: '/marketing-online-tanaka/inventory', icon: <Package size={20} />, roles: ['marketing_online_tanaka', 'Admin', 'Manager', 'Marketing'], group: 'MARKETPLACE TANAKA' },
    { name: 'Promo Online', path: '/marketing-online-tanaka/promo', icon: <Gift size={20} />, roles: ['marketing_online_tanaka', 'Admin', 'Manager', 'Marketing'], group: 'MARKETPLACE TANAKA' },
    { name: 'Pricelist Harga', path: '/pricelist-online', icon: <Tag size={20} />, roles: ['marketing_online_tanaka', 'Admin', 'Manager', 'Marketing'], group: 'MARKETPLACE TANAKA' },
    {
      name: 'Report',
      path: '/marketing-online-tanaka/reports',
      icon: <FileText size={20} />,
      roles: ['marketing_online_tanaka', 'Admin', 'Manager', 'Marketing'],
      group: 'MARKETPLACE TANAKA',
      subMenu: [
        { title: 'Laporan Harian', path: '/marketing-online-tanaka/reports/harian' },
        { title: 'Laporan Harian Berjalan', path: '/marketing-online-tanaka/reports/bulanan' },
        { title: 'Laporan Bulanan', path: '/marketing-online-tanaka/reports/bulanan-monthly' },
        { title: 'Laporan Bulan Berjalan', path: '/marketing-online-tanaka/reports/berjalan-monthly' },
        { title: 'Laporan Tahunan', path: '/marketing-online-tanaka/reports/tahunan' },
        { title: 'Laporan Tahun Berjalan', path: '/marketing-online-tanaka/reports/berjalan-tahunan' }
      ]
    },
    { name: 'Dashboard Gudang', path: '/gudang', icon: <LayoutDashboard size={20} />, roles: ['Admin', 'Manager', 'Gudang'], group: 'Warehouse' },
    { name: 'Order Marketplace', path: '/gudang/order-marketplace', icon: <ShoppingBag size={20} />, roles: ['Admin', 'Manager', 'Gudang'], group: 'Warehouse' },
    { name: 'Approval Permintaan', path: '/permintaan-stok', icon: <Bell size={20} />, roles: ['Admin', 'Manager', 'Gudang'], group: 'Warehouse', hasPermintaanBadge: true },
    { name: 'Barang Masuk', path: '/barang-masuk', icon: <TrendingUp size={20} />, roles: ['Admin', 'Manager', 'Gudang'], group: 'Warehouse' },
    { name: 'Barang Keluar', path: '/barang-keluar', icon: <TrendingDown size={20} />, roles: ['Admin', 'Manager', 'Gudang'], group: 'Warehouse' },
    { name: 'Mutasi Barang', path: '/mutasi', icon: <ArrowRightLeft size={20} />, roles: ['Admin', 'Manager', 'Gudang'], group: 'Warehouse' },
    { name: 'Stok Barang', path: '/stok', icon: <Package size={20} />, roles: ['Admin', 'Manager', 'Gudang'], group: 'Warehouse' },
    { name: 'Stok Jalan', path: '/stok-jalan', icon: <Layers size={20} />, roles: ['Admin', 'Manager', 'Gudang'], group: 'Warehouse' },
    { name: 'Suku Cadang', path: '/sparepart', icon: <Settings size={20} />, roles: ['Admin', 'Manager'], group: 'Warehouse' },
    { name: 'Warning Stok', path: '/warning-stok', icon: <AlertTriangle size={20} />, roles: ['Admin', 'Manager', 'Gudang'], group: 'Warehouse' },
    { name: 'Promo', path: '/promo', icon: <Gift size={20} />, roles: ['Admin', 'Manager', 'Marketing'], group: 'Sales' },
    { name: 'Pricelist Harga', path: '/pricelist', icon: <Tag size={20} />, roles: ['Admin', 'Manager', 'owner', 'marketing_offline', 'marketing_offline_tanaka', 'Marketing'], group: 'Sales' },
    { name: 'Finance Dashboard', path: '/finance', icon: <PieChart size={20} />, roles: ['Admin', 'Manager', 'Finance'], group: 'Finance' },

    // CASH & BANK
    { name: 'Cash & Bank', path: '/cash-bank', icon: <CreditCard size={20} />, roles: ['Admin', 'Manager', 'Finance'], group: 'Cash & Bank' },

    { name: 'Petty Cash', path: '/petty-cash', icon: <Briefcase size={20} />, roles: ['Admin', 'Manager', 'Finance'], group: 'Cash & Bank' },

    // TAGIHAN
    { name: 'Invoice', path: '/invoice', icon: <Receipt size={20} />, roles: ['Admin', 'Manager', 'Finance'], group: 'Tagihan' },
    { name: 'Accounts Receivable', path: '/piutang', icon: <Download size={20} />, roles: ['Admin', 'Manager', 'Finance'], group: 'Tagihan' },
    { name: 'Accounts Payable', path: '/hutang', icon: <Upload size={20} />, roles: ['Admin', 'Manager', 'Finance'], group: 'Tagihan' },

    // JURNAL
    { name: 'Jurnal Penjualan', path: '/journal/sales', icon: <TrendingUp size={20} />, roles: ['Admin', 'Manager', 'Finance'], group: 'Jurnal' },
    { name: 'Jurnal Pembelian', path: '/journal/purchase', icon: <TrendingDown size={20} />, roles: ['Admin', 'Manager', 'Finance'], group: 'Jurnal' },
    { name: 'Jurnal Umum', path: '/journal/general', icon: <FileText size={20} />, roles: ['Admin', 'Manager', 'Finance'], group: 'Jurnal' },
    { name: 'Jurnal Biaya', path: '/journal/expense', icon: <DollarSign size={20} />, roles: ['Admin', 'Manager', 'Finance'], group: 'Jurnal' },

    // AKUNTANSI
    { name: 'Chart of Accounts', path: '/chart-of-accounts', icon: <Activity size={20} />, roles: ['Admin', 'Manager', 'Finance'], group: 'Akuntansi' },

    // MANAJEMEN
    { name: 'Approval Center', path: '/finance/approval', icon: <Shield size={20} />, roles: ['owner', 'Admin', 'Manager', 'Finance'], group: 'Manajemen', hasBadge: true },
    { name: 'Report Center', path: '/report/laba-rugi', icon: <BarChart2 size={20} />, roles: ['Admin', 'Manager', 'Finance'], group: 'Manajemen' },
    { name: 'Pengaturan Keuangan', path: '/finance/settings', icon: <Settings size={20} />, roles: ['Admin', 'Manager', 'Finance'], group: 'Manajemen' },

    // REFERENSI (KHUSUS FINANCE - POSISI BAWAH)
    { name: 'Pricelist Harga', path: '/pricelist', icon: <Tag size={20} />, roles: ['Finance'], group: 'Referensi' },

    { name: 'Dashboard IT', path: '/it/dashboard', icon: <Monitor size={20} />, roles: ['admin_it', 'Admin'], group: 'System' },
    { name: 'User Management', path: '/it/users', icon: <Users size={20} />, roles: ['admin_it', 'Admin'], group: 'System' },
    { name: 'Role Permission', path: '/it/permissions', icon: <Shield size={20} />, roles: ['admin_it', 'Admin'], group: 'System' },
    { name: 'Activity Log', path: '/it/logs', icon: <Activity size={20} />, roles: ['admin_it', 'Admin'], group: 'System' },
    { name: 'Backup Database', path: '/it/backup', icon: <HardDrive size={20} />, roles: ['admin_it', 'Admin'], group: 'System' },
    { name: 'Monitoring System', path: '/it/monitoring', icon: <Monitor size={20} />, roles: ['admin_it', 'Admin'], group: 'System' },
    { name: 'Settings Sistem', path: '/it/settings', icon: <Sliders size={20} />, roles: ['admin_it', 'Admin'], group: 'System' },

    // MENU OWNER — Breakdown per Departemen
    {
      name: 'Marketing Online',
      icon: <TrendingUp size={20} />,
      roles: ['owner'],
      group: 'Owner Dashboard',
      subMenu: [
        { title: 'Dashboard Online', path: '/marketing-online/dashboard' },
        { title: 'Order Marketplace', path: '/marketing-online/orders' },
        { title: 'Stok Inventory', path: '/marketing-online/inventory' },
        { title: 'Promo Online', path: '/marketing-online/promo' },
        {
          title: 'Report',
          path: '/marketing-online/reports',
          subMenu: [
            { title: 'Laporan Harian', path: '/marketing-online/reports/harian' },
            { title: 'Laporan Harian Berjalan', path: '/marketing-online/reports/bulanan' },
            { title: 'Laporan Bulanan', path: '/marketing-online/reports/bulanan-monthly' },
            { title: 'Laporan Bulan Berjalan', path: '/marketing-online/reports/berjalan-monthly' },
            { title: 'Laporan Tahunan', path: '/marketing-online/reports/tahunan' },
            { title: 'Laporan Tahun Berjalan', path: '/marketing-online/reports/berjalan-tahunan' }
          ]
        }
      ]
    },
    {
      name: 'Marketing Offline',
      icon: <Users size={20} />,
      roles: ['owner'],
      group: 'Owner Dashboard',
      subMenu: [
        { title: 'Dashboard Offline', path: '/marketing-offline/dashboard' },
        { title: 'Order Offline', path: '/marketing-offline/orders' },
        { title: 'Stok Inventory', path: '/marketing-offline/inventory' },
        { title: 'Customer', path: '/marketing-offline/customers' },
        { title: 'Promo', path: '/marketing-offline/promo' },
        { title: 'Pricelist Harga', path: '/pricelist' },
        {
          title: 'Report',
          path: '/marketing-offline/reports',
          subMenu: [
            { title: 'Laporan Harian', path: '/marketing-offline/reports/harian' },
            { title: 'Laporan Harian Berjalan', path: '/marketing-offline/reports/bulanan' },
            { title: 'Laporan Bulanan', path: '/marketing-offline/reports/bulanan-monthly' },
            { title: 'Laporan Bulan Berjalan', path: '/marketing-offline/reports/berjalan-monthly' },
            { title: 'Laporan Tahunan', path: '/marketing-offline/reports/tahunan' },
            { title: 'Laporan Tahun Berjalan', path: '/marketing-offline/reports/berjalan-tahunan' }
          ]
        }
      ]
    },
    {
      name: 'Gudang',
      icon: <Package size={20} />,
      roles: ['owner'],
      group: 'Owner Dashboard',
      subMenu: [
        { title: 'Dashboard Gudang', path: '/gudang' },
        { title: 'Order Marketplace', path: '/gudang/order-marketplace' },
        { title: 'Approval Permintaan', path: '/permintaan-stok', hasPermintaanBadge: true },
        { title: 'Barang Masuk', path: '/barang-masuk' },
        { title: 'Barang Keluar', path: '/barang-keluar' },
        { title: 'Mutasi Barang', path: '/mutasi' },
        { title: 'Stok Barang', path: '/stok' },
        { title: 'Stok Jalan', path: '/stok-jalan' },
        { title: 'Suku Cadang', path: '/sparepart' },
        { title: 'Warning Stok', path: '/warning-stok' }
      ]
    },
    {
      name: 'Finance',
      icon: <DollarSign size={20} />,
      roles: ['owner'],
      group: 'Owner Dashboard',
      subMenu: [
        { title: 'Finance Dashboard', path: '/finance' },
        { title: 'Cash In Bank', path: '/cash-bank' },
        { title: 'Petty Cash', path: '/petty-cash' },
        { title: 'Accounts Receivable', path: '/piutang' },
        { title: 'Accounts Payable', path: '/hutang' },
        {
          title: 'Journal',
          path: '/journal',
          subMenu: [
            { title: 'Jurnal Penjualan', path: '/journal/sales' },
            { title: 'Jurnal Pembelian', path: '/journal/purchase' },
            { title: 'Jurnal Umum', path: '/journal/general' },
            { title: 'Jurnal Biaya', path: '/journal/expense' }
          ]
        },
        { title: 'Chart of Accounts', path: '/chart-of-accounts' },
        { title: 'Invoice', path: '/invoice' },
        { title: 'Approval Center', path: '/finance/approval' },
        { title: 'Report Center', path: '/report/laba-rugi' }
      ]
    },

    // MENU PRODUKSI
    { name: 'Dashboard Produksi', path: '/produksi/dashboard', icon: <Layers size={20} />, roles: ['produksi', 'owner', 'Manager', 'Admin'], group: 'Produksi' },
    { name: 'Order Masuk', path: '/produksi/order', icon: <ShoppingBag size={20} />, roles: ['produksi', 'owner', 'Manager', 'Admin'], group: 'Produksi' },
    { name: 'Jadwal Produksi', path: '/produksi/jadwal', icon: <Calendar size={20} />, roles: ['produksi', 'owner', 'Manager', 'Admin'], group: 'Produksi' },
    { name: 'Proses Produksi', path: '/produksi/proses', icon: <Settings size={20} />, roles: ['produksi', 'owner', 'Manager', 'Admin'], group: 'Produksi' },
    { name: 'Tim Produksi', path: '/produksi/tim', icon: <Users size={20} />, roles: ['produksi', 'owner', 'Manager', 'Admin'], group: 'Produksi' },
    { name: 'Quality Control', path: '/produksi/qc', icon: <Shield size={20} />, roles: ['produksi', 'owner', 'Manager', 'Admin'], group: 'Produksi' },
    { name: 'Packing', path: '/produksi/packing', icon: <Package size={20} />, roles: ['produksi', 'owner', 'Manager', 'Admin'], group: 'Produksi' },
    { name: 'Produksi Selesai', path: '/produksi/selesai', icon: <CheckCircle size={20} />, roles: ['produksi', 'owner', 'Manager', 'Admin'], group: 'Produksi' },
    { name: 'Deadline', path: '/produksi/deadline', icon: <Clock size={20} />, roles: ['produksi', 'owner', 'Manager', 'Admin'], group: 'Produksi' },
    { name: 'Riwayat Produksi', path: '/produksi/riwayat', icon: <Activity size={20} />, roles: ['produksi', 'owner', 'Manager', 'Admin'], group: 'Produksi' },

    // MENU ACCESTRET - MARKETING MARKETPLACE
    { name: 'Dashboard Online', path: '/accestret/marketing/dashboard', icon: <LayoutDashboard size={20} />, roles: ['marketing_accestret', 'owner', 'Manager', 'Admin'], group: 'Marketing Accestret' },
    { name: 'Order Marketplace', path: '/accestret/marketing/orders', icon: <ShoppingBag size={20} />, roles: ['marketing_accestret', 'owner', 'Manager', 'Admin'], group: 'Marketing Accestret' },
    { name: 'Stok Inventory', path: '/accestret/marketing/inventory', icon: <Package size={20} />, roles: ['marketing_accestret', 'owner', 'Manager', 'Admin'], group: 'Marketing Accestret' },
    { name: 'Promo Online', path: '/accestret/marketing/promo', icon: <Gift size={20} />, roles: ['marketing_accestret', 'owner', 'Manager', 'Admin'], group: 'Marketing Accestret' },
    {
      name: 'Report',
      path: '/accestret/marketing/reports',
      icon: <FileText size={20} />,
      roles: ['marketing_accestret', 'owner', 'Manager', 'Admin'],
      group: 'Marketing Accestret',
      subMenu: [
        { title: 'Laporan Harian', path: '/accestret/marketing/reports/harian' },
        { title: 'Laporan Harian Berjalan', path: '/accestret/marketing/reports/bulanan' },
        { title: 'Laporan Bulanan', path: '/accestret/marketing/reports/bulanan-monthly' },
        { title: 'Laporan Bulan Berjalan', path: '/accestret/marketing/reports/berjalan-monthly' },
        { title: 'Laporan Tahunan', path: '/accestret/marketing/reports/tahunan' },
        { title: 'Laporan Tahun Berjalan', path: '/accestret/marketing/reports/berjalan-tahunan' }
      ]
    },

    // MENU ACCESTRET - GUDANG (identik dengan role Gudang standar)
    { name: 'Dashboard Gudang',    path: '/accestret/gudang/dashboard', icon: <LayoutDashboard size={20} />, roles: ['gudang_accestret', 'owner', 'Manager', 'Admin'], group: 'Gudang Accestret' },
    { name: 'Approval Permintaan', path: '/permintaan-stok',            icon: <Bell size={20} />,            roles: ['gudang_accestret', 'owner', 'Manager', 'Admin'], group: 'Gudang Accestret', hasPermintaanBadge: true },
    { name: 'Barang Masuk',        path: '/barang-masuk',               icon: <TrendingUp size={20} />,      roles: ['gudang_accestret', 'owner', 'Manager', 'Admin'], group: 'Gudang Accestret' },
    { name: 'Barang Keluar',       path: '/barang-keluar',              icon: <TrendingDown size={20} />,    roles: ['gudang_accestret', 'owner', 'Manager', 'Admin'], group: 'Gudang Accestret' },
    { name: 'Mutasi Barang',       path: '/mutasi',                     icon: <ArrowRightLeft size={20} />,  roles: ['gudang_accestret', 'owner', 'Manager', 'Admin'], group: 'Gudang Accestret' },
    { name: 'Stok Barang',         path: '/stok',                       icon: <Package size={20} />,         roles: ['gudang_accestret', 'owner', 'Manager', 'Admin'], group: 'Gudang Accestret' },
    { name: 'Stok Jalan',          path: '/stok-jalan',                 icon: <Layers size={20} />,          roles: ['gudang_accestret', 'owner', 'Manager', 'Admin'], group: 'Gudang Accestret' },
    { name: 'Warning Stok',        path: '/warning-stok',               icon: <AlertTriangle size={20} />,   roles: ['gudang_accestret', 'owner', 'Manager', 'Admin'], group: 'Gudang Accestret' },

    // MENU ACCESTRET - PRODUKSI
    { name: 'Dashboard Produksi', path: '/accestret/produksi/dashboard', icon: <LayoutDashboard size={20} />, roles: ['produksi_accestret', 'owner', 'Manager', 'Admin'], group: 'Produksi Accestret' },
    { name: 'Antrean SPK', path: '/accestret/produksi/spk', icon: <Layers size={20} />, roles: ['produksi_accestret', 'owner', 'Manager', 'Admin'], group: 'Produksi Accestret' },
    { name: 'Jadwal Produksi', path: '/accestret/produksi/jadwal', icon: <Calendar size={20} />, roles: ['produksi_accestret', 'owner', 'Manager', 'Admin'], group: 'Produksi Accestret' },
    { name: 'Request Bahan', path: '/accestret/produksi/request', icon: <ShoppingCart size={20} />, roles: ['produksi_accestret', 'owner', 'Manager', 'Admin'], group: 'Produksi Accestret' },
    { name: 'QC & Reject', path: '/accestret/produksi/qc', icon: <Shield size={20} />, roles: ['produksi_accestret', 'owner', 'Manager', 'Admin'], group: 'Produksi Accestret' },
  ];

  // Saring menu berdasarkan role (Pastikan item memiliki properti name)
  let menuItems = allMenuItems.filter(item => {
    if (!item.name) return false;
    const hasRole = item.roles.some(r => r.toLowerCase() === userRole.trim().toLowerCase());

    // Owner hanya melihat grup 'Owner Dashboard' di sidebar
    if (userRole.trim().toLowerCase() === 'owner' && item.group !== 'Owner Dashboard') {
      return false;
    }

    return hasRole;
  });
  // Debug fallback: if no menu items match, show all to ensure visibility
  if (menuItems.length === 0) {
    console.warn('Sidebar: No menu items matched role, showing all items for debugging.');
    menuItems = allMenuItems;
  }

  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/';
  };

  return (
    <>
      {/* Hamburger Button untuk Mobile */}
      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden fixed top-4 left-4 z-40 p-2.5 bg-white rounded-xl shadow-md text-gray-700 hover:text-[#990000] border border-gray-200 transition-all active:scale-95"
      >
        <Menu size={20} />
      </button>

      {/* Backdrop Hitam Transparan saat Sidebar terbuka di Mobile */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={`w-64 bg-white h-screen flex flex-col border-r border-gray-200 shadow-sm fixed md:sticky top-0 z-50 transition-transform duration-300 ease-in-out overflow-hidden ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>

        {/* Tombol Tutup (X) di Mobile */}
        <button
          onClick={() => setIsOpen(false)}
          className="md:hidden absolute top-6 right-4 p-2 text-gray-400 hover:text-[#990000] bg-gray-50 rounded-lg transition-colors"
        >
          <X size={18} />
        </button>

        {/* --- LOGO & NOTIFICATION SECTION --- */}
        <div className="p-5 flex items-center justify-between mb-2">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/dashboard')}>
            <img
              src={LogoTanaka}
              alt="Logo Tanaka"
              className="w-10 h-10 object-contain drop-shadow-sm"
            />
            <div>
              <h1 className="font-bold text-red-800 leading-none tracking-tighter text-xl">T M S</h1>
              <p className="text-[10px] text-gray-400 font-medium uppercase">Tanaka System</p>
            </div>
          </div>
        </div>

        {/* Menu Navigasi */}
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent pb-4">
          {(() => {
            let currentGroup = '';
            return menuItems.map((item) => {
              const hasActiveChild = item.subMenu && item.subMenu.some(sub => location.pathname === sub.path || (sub.path && sub.path !== '/' && location.pathname.startsWith(sub.path + '/')));
              const isActive = location.pathname === item.path || (item.path && item.path !== '/' && item.path !== '/gudang' && item.path !== '/finance' && location.pathname.startsWith(item.path + '/')) || hasActiveChild;
              const autoExpand = userRole.toLowerCase() !== 'owner';
              const isExpanded = expandedMenus[item.name] || (autoExpand && (hasActiveChild || (item.path && location.pathname.startsWith(item.path) && item.path !== '/finance')));
              const showGroupLabel = item.group && item.group !== currentGroup;
              if (showGroupLabel) currentGroup = item.group;

              return (
                <div key={item.name}>
                  {showGroupLabel && (
                    <div className="mt-4 mb-2 px-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-500">
                      {item.group}
                    </div>
                  )}

                  <div
                    onClick={() => {
                      if (item.subMenu) {
                        setExpandedMenus(prev => ({ ...prev, [item.name]: !prev[item.name] }));
                      } else if (item.path) {
                        navigate(item.path);
                      }
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-300
                      ${isActive
                        ? 'bg-red-800 text-white font-bold shadow-md'
                        : 'text-gray-600 hover:bg-red-50 hover:text-red-800'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={isActive ? 'text-white' : 'text-gray-400'}>
                        {item.icon}
                      </div>
                      <span className="text-sm flex-1">{item.name}</span>
                    </div>
                    {item.hasBadge && pendingApprovals > 0 && (
                      <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm">
                        {pendingApprovals}
                      </span>
                    )}
                    {item.hasPermintaanBadge && pendingPermintaanStok > 0 && (
                      <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm">
                        {pendingPermintaanStok}
                      </span>
                    )}
                    {item.subMenu && (
                      <ChevronDown
                        size={14}
                        className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                      />
                    )}
                  </div>

                  {/* Submenu (Hanya jika ada) */}
                  {item.subMenu && isExpanded && (
                    <ul className="ml-12 mt-2 space-y-2 border-l-2 border-red-200 pl-4 mb-3">
                      {item.subMenu.map(sub => {
                        const hasNestedActiveChild = sub.subMenu && sub.subMenu.some(nested => location.pathname === nested.path || location.pathname.startsWith(nested.path + '/'));
                        const isSubActive = location.pathname === (sub.path || '') || hasNestedActiveChild || (sub.path && sub.path !== '/' && sub.path !== '/finance' && sub.path !== '/gudang' && location.pathname.startsWith(sub.path + '/'));
                        const expandedKey = item.name + '_' + sub.title;
                        const autoExpandSub = userRole.toLowerCase() !== 'owner';
                        const isSubExpanded = expandedMenus[expandedKey] || (autoExpandSub && (hasNestedActiveChild || (sub.path && location.pathname.startsWith(sub.path) && !sub.path.endsWith('/reports'))));

                        return (
                          <div key={sub.title || sub}>
                            <li
                              onClick={(e) => {
                                e.stopPropagation();
                                if (sub.subMenu) {
                                  setExpandedMenus(prev => ({ ...prev, [expandedKey]: !prev[expandedKey] }));
                                } else if (sub.path) {
                                  navigate(sub.path);
                                }
                              }}
                              className={`text-[13px] cursor-pointer py-2 px-4 rounded-xl transition-all duration-200 flex items-center justify-between ${isSubActive && !sub.subMenu
                                ? 'bg-red-800 text-white font-black shadow-sm'
                                : 'text-gray-600 font-bold hover:bg-red-50 hover:text-red-800'
                                }`}
                            >
                              <span className="flex items-center gap-2">{sub.title || sub}</span>
                              <div className="flex items-center gap-2">
                                {sub.hasPermintaanBadge && pendingPermintaanStok > 0 && (
                                  <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm">
                                    {pendingPermintaanStok}
                                  </span>
                                )}
                                {sub.subMenu && (
                                  <ChevronDown
                                    size={14}
                                    className={`transition-transform duration-200 ${isSubExpanded ? 'rotate-180' : ''}`}
                                  />
                                )}
                              </div>
                            </li>

                            {/* Nested Submenu */}
                            {sub.subMenu && isSubExpanded && (
                              <ul className="ml-6 mt-1 space-y-1 border-l-2 border-red-100 pl-3 mb-2">
                                {sub.subMenu.map(nested => {
                                  const isNestedActive = location.pathname === (nested.path || '');
                                  return (
                                    <li
                                      key={nested.title || nested}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (nested.path) navigate(nested.path);
                                      }}
                                      className={`text-[12px] cursor-pointer py-1.5 px-3 rounded-lg transition-all duration-200 flex items-center justify-between ${isNestedActive
                                        ? 'bg-red-800 text-white font-bold shadow-sm'
                                        : 'text-gray-500 font-semibold hover:bg-red-50 hover:text-red-800'
                                        }`}
                                    >
                                      <span className="flex items-center gap-2">{nested.title || nested}</span>
                                    </li>
                                  );
                                })}
                              </ul>
                            )}
                          </div>
                        );
                      })}
                    </ul>
                  )}
                </div>
              );
            });
          })()}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-gray-100">
          <button
            onClick={() => setShowLogoutModal(true)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-200 text-red-700 font-bold hover:bg-red-700 hover:text-white transition-all duration-300"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[340px] animate-in zoom-in-95 duration-200 flex flex-col relative border-t-[8px] border-t-[#990000]">

            <div className="p-8 pb-6 text-center">
              <h3 className="text-xl font-black text-gray-900 m-0 tracking-wide">Yakin ingin logout?</h3>
            </div>

            <div className="px-8 pb-8 flex justify-center gap-4">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 py-3 text-sm text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 hover:text-gray-900 rounded-xl font-bold transition-all shadow-sm"
              >
                No
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 py-3 text-sm text-white bg-[#990000] hover:bg-red-800 rounded-xl font-black shadow-md hover:shadow-lg transition-all"
              >
                Yes
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;