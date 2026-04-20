import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Users, Package, Gift, LogOut } from 'lucide-react';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'Order', path: '/order', icon: <ShoppingCart size={20} />, subMenu: ['PO (Purchase Order)', 'Customer Order'] },
    { name: 'Marketing', path: '/marketing', icon: <Users size={20} /> },
    { name: 'Suku Cadang', path: '/gudang', icon: <Package size={20} /> },
    { name: 'Promo', path: '/promo', icon: <Gift size={20} /> },
  ];

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/';
  };

  return (
    <aside className="w-64 bg-white min-h-screen flex flex-col border-r border-gray-200 shadow-sm sticky top-0">
      {/* Logo Tanaka */}
      <div className="p-6 flex items-center gap-3 mb-4">
        <div className="w-8 h-8 bg-red-800 rotate-45 flex-shrink-0"></div>
        <div>
          <h1 className="font-bold text-red-800 leading-none tracking-tighter text-xl">T M S</h1>
          <p className="text-[10px] text-gray-400 font-medium uppercase">Tanaka Management System</p>
        </div>
      </div>

      {/* Menu Navigasi */}
      <nav className="flex-1 px-4 space-y-2">
        {menuItems.map((item) => (
          <div key={item.name}>
            <div 
              onClick={() => navigate(item.path)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all ${
                location.pathname === item.path 
                ? 'bg-red-50 text-red-800 font-bold border-l-4 border-red-800' 
                : 'text-gray-600 hover:bg-gray-50 hover:text-red-800'
              }`}
            >
              {item.icon}
              <span className="text-sm">{item.name}</span>
            </div>
            
            {/* Sub Menu untuk Order (Hanya tampil jika di path /order) */}
            {item.subMenu && location.pathname.includes('/order') && (
              <ul className="ml-12 mt-2 space-y-2">
                {item.subMenu.map(sub => (
                  <li key={sub} className="text-xs text-red-700 font-semibold cursor-pointer py-1">
                    {sub}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-gray-100">
        <button 
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-200 text-red-700 font-bold hover:bg-red-50 transition-all"
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;