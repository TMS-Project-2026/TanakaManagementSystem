import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, TrendingUp, DollarSign, Package, LogOut, Menu, X } from 'lucide-react';
import LogoTanaka from '../assets/logotanaka.jpeg';
import Dashboard from './Dashboard';
import MarketingOfflineBanua from './MarketingOfflineBanua';
import MarketingOnlineBanua from './MarketingOnlineBanua';
import FinanceDashboard from './FinanceDashboard';
import GudangDashboard from './GudangDashboard';

const MENU = [
  { key: 'marketing-online',  label: 'Overview Marketing Online',  icon: <TrendingUp size={20} /> },
  { key: 'marketing-offline', label: 'Overview Marketing Offline', icon: <LayoutDashboard size={20} /> },
  { key: 'finance',           label: 'Overview Finance',           icon: <DollarSign size={20} /> },
  { key: 'gudang',            label: 'Overview Gudang',            icon: <Package size={20} /> },
];

const OwnerMonitoring = () => {
  const [active, setActive] = useState('marketing-online');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    if (window.confirm('Apakah Anda yakin ingin keluar?')) {
      localStorage.clear();
      window.location.href = '/';
    }
  };

  const renderContent = () => {
    if (active === 'marketing-online')  return <MarketingOnlineBanua  embedded={true} />;
    if (active === 'marketing-offline') return <MarketingOfflineBanua embedded={true} />;
    if (active === 'finance')           return <FinanceDashboard       embedded={true} />;
    if (active === 'gudang')            return <GudangDashboard        embedded={true} />;
    return null;
  };

  const Sidebar = () => (
    <aside className={`w-64 bg-white h-screen flex flex-col border-r border-gray-200 shadow-sm fixed md:sticky top-0 z-50 transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
      <button onClick={() => setSidebarOpen(false)} className="md:hidden absolute top-6 right-4 p-2 text-gray-400 hover:text-[#990000] bg-gray-50 rounded-lg">
        <X size={18} />
      </button>

      {/* Logo */}
      <div className="p-6 flex items-center gap-3 mb-2">
        <img src={LogoTanaka} alt="Logo Tanaka" className="w-10 h-10 object-contain drop-shadow-sm" />
        <div>
          <h1 className="font-bold text-red-800 leading-none tracking-tighter text-xl">T M S</h1>
          <p className="text-[10px] text-gray-400 font-medium uppercase">Tanaka Management System</p>
        </div>
      </div>

      {/* Menu */}
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto mt-4">
        <div className="mb-2 px-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-400">Overview</div>
        {MENU.map(item => (
          <button
            key={item.key}
            onClick={() => { setActive(item.key); setSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 text-left
              ${active === item.key
                ? 'bg-red-800 text-white font-bold shadow-md'
                : 'text-gray-600 hover:bg-red-50 hover:text-red-800'}`}
          >
            <span className={active === item.key ? 'text-white' : 'text-gray-400'}>{item.icon}</span>
            <span className="text-sm">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Logout */}
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
  );

  return (
    <div className="flex bg-gray-50 min-h-screen font-sans">
      {/* Mobile hamburger */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="md:hidden fixed top-4 left-4 z-40 p-2.5 bg-white rounded-xl shadow-md text-gray-700 hover:text-[#990000] border border-gray-200"
      >
        <Menu size={20} />
      </button>

      {/* Backdrop */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-40" onClick={() => setSidebarOpen(false)} />
      )}

      <Sidebar />

      {/* Content: remove the inner sidebar from the rendered dashboard */}
      <div className="flex-1 overflow-auto">
        {renderContent()}
      </div>
    </div>
  );
};

export default OwnerMonitoring;
