import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Package, Gift, LogOut, ShoppingBag, DollarSign, Menu, X, CreditCard, Receipt, FileText, PieChart, Settings, TrendingUp, TrendingDown, ArrowRightLeft, AlertTriangle, Monitor, Shield, Activity, HardDrive, Sliders, MapPin, Layers, Calendar, Clock, CheckCircle, ChevronDown } from 'lucide-react';
import LogoTanaka from '../assets/logotanaka.jpeg';

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Dapatkan info user dari localStorage
  const user = JSON.parse(localStorage.getItem('user')) || {};
  const userRole = user.role || '';
  console.log('Sidebar userRole:', userRole);

  const allMenuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} />, roles: ['Admin', 'Manager', 'Marketing'], group: 'Sales' },
    { name: 'Order Offline', path: '/marketing', icon: <Users size={20} />, roles: ['Admin', 'Manager', 'Marketing', 'marketing_offline'], group: 'Sales' },
    { name: 'Order Marketplace', path: '/sales-online', icon: <ShoppingBag size={20} />, roles: ['Admin', 'Manager', 'Marketing'], group: 'Sales' },
    { name: 'Dashboard Online', path: '/marketing-online/dashboard', icon: <LayoutDashboard size={20} />, roles: ['marketing_online', 'Admin', 'Manager', 'Marketing'], group: 'MARKETPLACE BANUA' },
    { name: 'Order Marketplace', path: '/marketing-online/orders', icon: <ShoppingBag size={20} />, roles: ['marketing_online', 'Admin', 'Manager', 'Marketing'], group: 'MARKETPLACE BANUA' },
    { name: 'Stok Inventori', path: '/marketing-online/inventory', icon: <Package size={20} />, roles: ['marketing_online', 'Admin', 'Manager', 'Marketing'], group: 'MARKETPLACE BANUA' },
    { name: 'Promo Online', path: '/marketing-online/promo', icon: <Gift size={20} />, roles: ['marketing_online', 'Admin', 'Manager', 'Marketing'], group: 'MARKETPLACE BANUA' },
    { 
      name: 'Laporan Online', 
      path: '/marketing-online/reports', 
      icon: <FileText size={20} />, 
      roles: ['marketing_online', 'Admin', 'Manager', 'Marketing'], 
      group: 'MARKETPLACE BANUA',
      subMenu: [
        { title: 'Laporan Harian', path: '/marketing-online/reports/harian' },
        { title: 'Laporan Bulanan', path: '/marketing-online/reports/bulanan' }
      ]
    },
    { name: 'Dashboard Gudang', path: '/gudang', icon: <LayoutDashboard size={20} />, roles: ['Admin', 'Manager', 'Gudang'], group: 'Warehouse' },
    { name: 'Barang Masuk', path: '/barang-masuk', icon: <TrendingUp size={20} />, roles: ['Admin', 'Manager', 'Gudang'], group: 'Warehouse' },
    { name: 'Barang Keluar', path: '/barang-keluar', icon: <TrendingDown size={20} />, roles: ['Admin', 'Manager', 'Gudang'], group: 'Warehouse' },
    { name: 'Mutasi Barang', path: '/mutasi', icon: <ArrowRightLeft size={20} />, roles: ['Admin', 'Manager', 'Gudang'], group: 'Warehouse' },
    { name: 'Stok Barang', path: '/stok', icon: <Package size={20} />, roles: ['Admin', 'Manager', 'Gudang'], group: 'Warehouse' },
    { name: 'Suku Cadang', path: '/sparepart', icon: <Settings size={20} />, roles: ['Admin', 'Manager'], group: 'Warehouse' },
    { name: 'Warning Stok', path: '/warning-stok', icon: <AlertTriangle size={20} />, roles: ['Admin', 'Manager', 'Gudang'], group: 'Warehouse' },
    { name: 'Promo', path: '/promo', icon: <Gift size={20} />, roles: ['Admin', 'Manager', 'Marketing'], group: 'Sales' },
    { name: 'Finance Dashboard', path: '/finance', icon: <PieChart size={20} />, roles: ['Admin', 'Manager', 'Finance'], group: 'Finance' },
    { name: 'Cash In Bank', path: '/cash-in-bank', icon: <CreditCard size={20} />, roles: ['Admin', 'Manager', 'Finance'], group: 'Finance' },
    { name: 'Journal', path: '/journal', icon: <FileText size={20} />, roles: ['Admin', 'Manager', 'Finance'], group: 'Finance' },
    { name: 'Chart of Accounts', path: '/chart-of-accounts', icon: <Activity size={20} />, roles: ['Admin', 'Manager', 'Finance'], group: 'Finance' },
    { name: 'Invoice', path: '/invoice', icon: <Receipt size={20} />, roles: ['Admin', 'Manager', 'Finance'], group: 'Finance' },
    { name: 'Report Center', path: '/report/laba-rugi', icon: <FileText size={20} />, roles: ['Admin', 'Manager', 'Finance'], group: 'Finance' },

    { name: 'Dashboard IT', path: '/it/dashboard', icon: <Monitor size={20} />, roles: ['admin_it', 'Admin'], group: 'System' },
    { name: 'User Management', path: '/it/users', icon: <Users size={20} />, roles: ['admin_it', 'Admin'], group: 'System' },
    { name: 'Role Permission', path: '/it/permissions', icon: <Shield size={20} />, roles: ['admin_it', 'Admin'], group: 'System' },
    { name: 'Activity Log', path: '/it/logs', icon: <Activity size={20} />, roles: ['admin_it', 'Admin'], group: 'System' },
    { name: 'Backup Database', path: '/it/backup', icon: <HardDrive size={20} />, roles: ['admin_it', 'Admin'], group: 'System' },
    { name: 'Monitoring System', path: '/it/monitoring', icon: <Monitor size={20} />, roles: ['admin_it', 'Admin'], group: 'System' },
    { name: 'Settings Sistem', path: '/it/settings', icon: <Sliders size={20} />, roles: ['admin_it', 'Admin'], group: 'System' },

    // MENU OWNER EKSKLUSIF
    { name: 'Owner Dashboard', path: '/owner/dashboard', icon: <LayoutDashboard size={20} />, roles: ['owner'], group: 'Owner' },
    { name: 'Finance Overview', path: '/owner/finance', icon: <DollarSign size={20} />, roles: ['owner'], group: 'Owner' },
    { name: 'Operations Overview', path: '/owner/produksi', icon: <Settings size={20} />, roles: ['owner'], group: 'Owner' },
    { name: 'Warehouse Overview', path: '/owner/gudang', icon: <Package size={20} />, roles: ['owner'], group: 'Owner' },
    { name: 'Branch Performance', path: '/owner/cabang', icon: <MapPin size={20} />, roles: ['owner'], group: 'Owner' },
    { name: 'Reports & Analytics', path: '/owner/report', icon: <FileText size={20} />, roles: ['owner'], group: 'Owner' },
    { name: 'Approval Center', path: '/owner/approval', icon: <Shield size={20} />, roles: ['owner'], group: 'Owner' },
    { name: 'User Summary', path: '/owner/users', icon: <Users size={20} />, roles: ['owner'], group: 'Owner' },

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
  ];

  // Saring menu berdasarkan role (Pastikan item memiliki properti name)
  let menuItems = allMenuItems.filter(item => {
    if (!item.name) return false;
    const hasRole = item.roles.some(r => r.toLowerCase() === userRole.toLowerCase());
    // Owner tidak melihat daftar Produksi pada sidebar
    if (userRole.toLowerCase() === 'owner' && item.group === 'Produksi') return false;
    return hasRole;
  });
  // Debug fallback: if no menu items match, show all to ensure visibility
  if (menuItems.length === 0) {
    console.warn('Sidebar: No menu items matched role, showing all items for debugging.');
    menuItems = allMenuItems;
  }

  const handleLogout = () => {
    if (window.confirm("Apakah Anda yakin ingin keluar?")) {
      localStorage.clear();
      window.location.href = '/';
    }
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

      <aside className={`w-64 bg-white h-screen flex flex-col border-r border-gray-200 shadow-sm fixed md:sticky top-0 z-50 transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>

        {/* Tombol Tutup (X) di Mobile */}
        <button
          onClick={() => setIsOpen(false)}
          className="md:hidden absolute top-6 right-4 p-2 text-gray-400 hover:text-[#990000] bg-gray-50 rounded-lg transition-colors"
        >
          <X size={18} />
        </button>

        {/* --- LOGO SECTION --- */}
        <div className="p-6 flex items-center gap-3 mb-4 cursor-pointer" onClick={() => navigate('/dashboard')}>
          <img
            src={LogoTanaka}
            alt="Logo Tanaka"
            className="w-10 h-10 object-contain drop-shadow-sm"
          />
          <div>
            <h1 className="font-bold text-red-800 leading-none tracking-tighter text-xl">T M S</h1>
            <p className="text-[10px] text-gray-400 font-medium uppercase">Tanaka Management System</p>
          </div>
        </div>

        {/* Menu Navigasi */}
        <nav className="flex-1 px-4 space-y-1">
          {(() => {
            let currentGroup = '';
            return menuItems.map((item) => {
              const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path + '/'));
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
                    onClick={() => navigate(item.path)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all duration-200 ${isActive
                      ? 'bg-red-800 text-white font-bold shadow-md'
                      : 'text-gray-600 hover:bg-red-50 hover:text-red-800'
                      }`}
                  >
                    <div className={isActive ? 'text-white' : 'text-gray-400'}>
                      {item.icon}
                    </div>
                    <span className="text-sm flex-1">{item.name}</span>
                    {item.subMenu && (
                      <ChevronDown 
                        size={14} 
                        className={`transition-transform duration-200 ${isActive ? 'rotate-180' : ''}`} 
                      />
                    )}
                  </div>

                  {/* Submenu (Hanya jika ada) */}
                  {item.subMenu && (location.pathname.startsWith(item.path) || ['/payment', '/expense', '/invoice', '/report'].includes(location.pathname) && item.name === 'Finance') && (
                    <ul className="ml-12 mt-2 space-y-2 border-l-2 border-red-200 pl-4 mb-3">
                      {item.subMenu.map(sub => {
                        const isSubActive = location.pathname === (sub.path || '');
                        return (
                          <li
                            key={sub.title || sub}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (sub.path) navigate(sub.path);
                            }}
                            className={`text-[13px] cursor-pointer py-2 px-4 rounded-xl transition-all duration-200 flex items-center gap-2 ${
                              isSubActive 
                                ? 'bg-red-800 text-white font-black shadow-sm' 
                                : 'text-gray-600 font-bold hover:bg-red-50 hover:text-red-800'
                            }`}
                          >
                            {sub.title || sub}
                          </li>
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
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-200 text-red-700 font-bold hover:bg-red-700 hover:text-white transition-all duration-300"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;