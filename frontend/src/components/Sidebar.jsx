import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Package, Gift, LogOut, ShoppingBag, DollarSign, Menu, X, CreditCard, Receipt, FileText, PieChart, Settings, TrendingUp, TrendingDown, ArrowRightLeft, AlertTriangle, Monitor, Shield, Activity, HardDrive, Sliders, MapPin, Layers, Calendar, Clock, CheckCircle } from 'lucide-react';
import LogoTanaka from '../assets/logotanaka.jpeg';

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Dapatkan info user dari localStorage
  const user = JSON.parse(localStorage.getItem('user')) || {};
  const userRole = user.role || '';

  const allMenuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} />, roles: ['Admin', 'Manager', 'Marketing'] },
    // OBJEK KOSONG DI SINI SUDAH DIHAPUS
    { name: 'Order Offline', path: '/marketing', icon: <Users size={20} />, roles: ['Admin', 'Manager', 'Marketing'] },
    { name: 'Order Marketplace', path: '/sales-online', icon: <ShoppingBag size={20} />, roles: ['Admin', 'Manager', 'Marketing'] },
    { name: 'Dashboard Gudang', path: '/gudang', icon: <LayoutDashboard size={20} />, roles: ['Admin', 'Manager', 'Gudang'] },
    { name: 'Stok Barang', path: '/stok', icon: <Package size={20} />, roles: ['Admin', 'Manager', 'Gudang'] },
    { name: 'Suku Cadang', path: '/sparepart', icon: <Settings size={20} />, roles: ['Admin', 'Manager', 'Gudang'] },
    { name: 'Barang Masuk', path: '/barang-masuk', icon: <TrendingUp size={20} />, roles: ['Admin', 'Manager', 'Gudang'] },
    { name: 'Barang Keluar', path: '/barang-keluar', icon: <TrendingDown size={20} />, roles: ['Admin', 'Manager', 'Gudang'] },
    { name: 'Mutasi Barang', path: '/mutasi', icon: <ArrowRightLeft size={20} />, roles: ['Admin', 'Manager', 'Gudang'] },
    { name: 'Warning Stok', path: '/warning-stok', icon: <AlertTriangle size={20} />, roles: ['Admin', 'Manager', 'Gudang'] },
    { name: 'Promo', path: '/promo', icon: <Gift size={20} />, roles: ['Admin', 'Manager', 'Marketing'] },
    { name: 'Dashboard Finance', path: '/finance', icon: <PieChart size={20} />, roles: ['Admin', 'Manager', 'Finance'] },
    { name: 'Cash In Bank', path: '/cash-in-bank', icon: <CreditCard size={20} />, roles: ['Admin', 'Manager', 'Finance'] },
    { name: 'Pengeluaran', path: '/expense', icon: <DollarSign size={20} />, roles: ['Admin', 'Manager', 'Finance'] },
    { name: 'Invoice', path: '/invoice', icon: <Receipt size={20} />, roles: ['Admin', 'Manager', 'Finance'] },
    { name: 'Cashflow', path: '/cashflow', icon: <Activity size={20} />, roles: ['Admin', 'Manager', 'Finance'] },
    { name: 'Report Center', path: '/report/laba-rugi', icon: <FileText size={20} />, roles: ['Admin', 'Manager', 'Finance'] },
    { name: 'Reminder Piutang', path: '/reminder', icon: <AlertTriangle size={20} />, roles: ['Admin', 'Manager', 'Finance'] },
    { name: 'Dashboard IT', path: '/it/dashboard', icon: <Monitor size={20} />, roles: ['admin_it', 'Admin'] },
    { name: 'User Management', path: '/it/users', icon: <Users size={20} />, roles: ['admin_it', 'Admin'] },
    { name: 'Role Permission', path: '/it/permissions', icon: <Shield size={20} />, roles: ['admin_it', 'Admin'] },
    { name: 'Activity Log', path: '/it/logs', icon: <Activity size={20} />, roles: ['admin_it', 'Admin'] },
    { name: 'Backup Database', path: '/it/backup', icon: <HardDrive size={20} />, roles: ['admin_it', 'Admin'] },
    { name: 'Monitoring System', path: '/it/monitoring', icon: <Monitor size={20} />, roles: ['admin_it', 'Admin'] },
    { name: 'Settings Sistem', path: '/it/settings', icon: <Sliders size={20} />, roles: ['owner', 'admin_it', 'Admin'] },
    
    // MENU OWNER EKSKLUSIF
    { name: 'Dashboard Utama', path: '/owner/dashboard', icon: <LayoutDashboard size={20} />, roles: ['owner'] },
    { name: 'Marketing Overview', path: '/owner/marketing', icon: <TrendingUp size={20} />, roles: ['owner'] },
    { name: 'Finance Overview', path: '/owner/finance', icon: <DollarSign size={20} />, roles: ['owner'] },
    { name: 'Gudang Overview', path: '/owner/gudang', icon: <Package size={20} />, roles: ['owner'] },
    { name: 'Produksi Overview', path: '/owner/produksi', icon: <Settings size={20} />, roles: ['owner'] },
    { name: 'Report Center', path: '/owner/report', icon: <FileText size={20} />, roles: ['owner'] },
    { name: 'Approval Center', path: '/owner/approval', icon: <Shield size={20} />, roles: ['owner'] },
    { name: 'Cabang Performance', path: '/owner/cabang', icon: <MapPin size={20} />, roles: ['owner'] },
    { name: 'User Summary', path: '/owner/users', icon: <Users size={20} />, roles: ['owner'] },

    // MENU PRODUKSI
    { name: 'Dashboard Produksi', path: '/produksi/dashboard', icon: <Layers size={20} />, roles: ['produksi', 'owner', 'Manager', 'Admin'] },
    { name: 'Order Masuk', path: '/produksi/order', icon: <ShoppingBag size={20} />, roles: ['produksi', 'owner', 'Manager', 'Admin'] },
    { name: 'Jadwal Produksi', path: '/produksi/jadwal', icon: <Calendar size={20} />, roles: ['produksi', 'owner', 'Manager', 'Admin'] },
    { name: 'Proses Produksi', path: '/produksi/proses', icon: <Settings size={20} />, roles: ['produksi', 'owner', 'Manager', 'Admin'] },
    { name: 'Tim Produksi', path: '/produksi/tim', icon: <Users size={20} />, roles: ['produksi', 'owner', 'Manager', 'Admin'] },
    { name: 'Quality Control', path: '/produksi/qc', icon: <Shield size={20} />, roles: ['produksi', 'owner', 'Manager', 'Admin'] },
    { name: 'Packing', path: '/produksi/packing', icon: <Package size={20} />, roles: ['produksi', 'owner', 'Manager', 'Admin'] },
    { name: 'Produksi Selesai', path: '/produksi/selesai', icon: <CheckCircle size={20} />, roles: ['produksi', 'owner', 'Manager', 'Admin'] },
    { name: 'Deadline', path: '/produksi/deadline', icon: <Clock size={20} />, roles: ['produksi', 'owner', 'Manager', 'Admin'] },
    { name: 'Riwayat Produksi', path: '/produksi/riwayat', icon: <Activity size={20} />, roles: ['produksi', 'owner', 'Manager', 'Admin'] },
  ];

  // Saring menu berdasarkan role (Pastikan item memiliki properti name)
  const menuItems = allMenuItems.filter(item => 
    item.name && item.roles.some(r => r.toLowerCase() === userRole.toLowerCase())
  );

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
        <nav className="flex-1 px-4 space-y-1"> {/* Diubah dari space-y-2 ke space-y-1 agar lebih rapat */}
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;

            return (
              <div key={item.name}>
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
                  <span className="text-sm">{item.name}</span>
                </div>

                {/* Submenu (Hanya jika ada) */}
                {item.subMenu && (location.pathname.includes(item.path) || ['/payment', '/expense', '/invoice', '/report'].includes(location.pathname) && item.name === 'Finance') && (
                  <ul className="ml-12 mt-1 space-y-1 border-l-2 border-red-100 pl-4">
                    {item.subMenu.map(sub => {
                      const isSubActive = location.pathname === (sub.path || '');
                      return (
                        <li 
                          key={sub.title || sub} 
                          onClick={(e) => {
                            e.stopPropagation();
                            if(sub.path) navigate(sub.path);
                          }}
                          className={`text-[11px] font-medium cursor-pointer py-1 transition ${isSubActive ? 'text-red-900 font-bold' : 'text-red-700 hover:text-red-900'}`}
                        >
                          • {sub.title || sub}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
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