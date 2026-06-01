import React from 'react';
import Sidebar from '../components/Sidebar';
import { LayoutDashboard, CheckCircle, Shield, Settings } from 'lucide-react';

const AccestretProduksiDashboard = () => {
  return (
    <div className="flex bg-gray-50 h-screen font-sans">
      <Sidebar />
      <div className="flex-1 overflow-y-auto px-4 sm:px-10 pb-10">
        <div className="bg-white p-6 min-h-full rounded-2xl shadow-sm border border-gray-100 mt-6">
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
              Produksi <span className="text-orange-600">Accestret</span>
            </h1>
            <p className="text-gray-500 font-medium mt-1">Kanban & Quality Control</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-orange-50 p-6 rounded-3xl shadow-sm border border-orange-100 flex flex-col">
              <p className="text-sm font-bold text-orange-800 flex items-center gap-2"><LayoutDashboard size={16} /> Antrean Baru</p>
              <h3 className="text-2xl font-black text-orange-900 mt-2">0 <span className="text-sm font-normal text-orange-700">SPK</span></h3>
            </div>
            <div className="bg-blue-50 p-6 rounded-3xl shadow-sm border border-blue-100 flex flex-col">
              <p className="text-sm font-bold text-blue-800 flex items-center gap-2"><Settings size={16} /> Sedang Proses</p>
              <h3 className="text-2xl font-black text-blue-900 mt-2">0 <span className="text-sm font-normal text-blue-700">SPK</span></h3>
            </div>
            <div className="bg-red-50 p-6 rounded-3xl shadow-sm border border-red-100 flex flex-col">
              <p className="text-sm font-bold text-red-800 flex items-center gap-2"><Shield size={16} /> Quality Control</p>
              <h3 className="text-2xl font-black text-red-900 mt-2">0 <span className="text-sm font-normal text-red-700">Check</span></h3>
            </div>
            <div className="bg-green-50 p-6 rounded-3xl shadow-sm border border-green-100 flex flex-col">
              <p className="text-sm font-bold text-green-800 flex items-center gap-2"><CheckCircle size={16} /> Selesai</p>
              <h3 className="text-2xl font-black text-green-900 mt-2">0 <span className="text-sm font-normal text-green-700">SPK</span></h3>
            </div>
          </div>

          <div className="bg-gray-50 rounded-2xl p-8 text-center border-2 border-dashed border-gray-200 mt-10">
            <h3 className="text-lg font-bold text-gray-700 mb-2">Modul Sedang Dalam Pengembangan</h3>
            <p className="text-gray-500 text-sm">Kanban Board untuk tracking proses potong, jahit, dan sablon sedang dirancang.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccestretProduksiDashboard;
