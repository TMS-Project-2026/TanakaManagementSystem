import React from 'react';
import Sidebar from '../components/Sidebar';
import { LayoutDashboard, CheckCircle, Shield, Settings } from 'lucide-react';

const AccestretProduksiDashboard = () => {
  return (
    <div className="flex bg-gray-50 h-screen font-sans">
      <Sidebar />
      <div className="flex-1 overflow-y-auto px-5 pb-4">
        <div className="bg-white p-4 min-h-full rounded-xl shadow-sm border border-gray-100 mt-2">
          <div className="mb-4">
            <h1 className="text-lg md:text-xl font-black text-gray-900 tracking-tight">
              Produksi <span className="text-orange-600">Accestret</span>
            </h1>
            <p className="text-xs text-gray-500 font-medium mt-0.5">Kanban & Quality Control</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-orange-50 p-3.5 rounded-xl shadow-sm border border-orange-100 flex flex-col justify-center min-h-[75px]">
              <p className="text-[10px] font-bold text-orange-800 flex items-center gap-2"><LayoutDashboard size={14} /> Antrean Baru</p>
              <h3 className="text-lg font-black text-orange-900 mt-1">0 <span className="text-xs font-normal text-orange-700">SPK</span></h3>
            </div>
            <div className="bg-blue-50 p-3.5 rounded-xl shadow-sm border border-blue-100 flex flex-col justify-center min-h-[75px]">
              <p className="text-[10px] font-bold text-blue-800 flex items-center gap-2"><Settings size={14} /> Sedang Proses</p>
              <h3 className="text-lg font-black text-blue-900 mt-1">0 <span className="text-xs font-normal text-blue-700">SPK</span></h3>
            </div>
            <div className="bg-red-50 p-3.5 rounded-xl shadow-sm border border-red-100 flex flex-col justify-center min-h-[75px]">
              <p className="text-[10px] font-bold text-red-800 flex items-center gap-2"><Shield size={14} /> Quality Control</p>
              <h3 className="text-lg font-black text-red-900 mt-1">0 <span className="text-xs font-normal text-red-700">Check</span></h3>
            </div>
            <div className="bg-green-50 p-3.5 rounded-xl shadow-sm border border-green-100 flex flex-col justify-center min-h-[75px]">
              <p className="text-[10px] font-bold text-green-800 flex items-center gap-2"><CheckCircle size={14} /> Selesai</p>
              <h3 className="text-lg font-black text-green-900 mt-1">0 <span className="text-xs font-normal text-green-700">SPK</span></h3>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 text-center border-2 border-dashed border-gray-200 mt-4">
            <h3 className="text-sm font-bold text-gray-700 mb-1">Modul Sedang Dalam Pengembangan</h3>
            <p className="text-gray-500 text-xs">Kanban Board untuk tracking proses potong, jahit, dan sablon sedang dirancang.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccestretProduksiDashboard;
