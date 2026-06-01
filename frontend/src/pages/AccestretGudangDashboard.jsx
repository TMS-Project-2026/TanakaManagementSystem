import React from 'react';
import Sidebar from '../components/Sidebar';
import { Package, Layers, AlertTriangle, ArrowRightLeft } from 'lucide-react';

const AccestretGudangDashboard = () => {
  return (
    <div className="flex bg-gray-50 h-screen font-sans">
      <Sidebar />
      <div className="flex-1 overflow-y-auto px-4 sm:px-10 pb-10">
        <div className="bg-white p-6 min-h-full rounded-2xl shadow-sm border border-gray-100 mt-6">
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
              Gudang <span className="text-teal-600">Accestret</span>
            </h1>
            <p className="text-gray-500 font-medium mt-1">Inventory Sablon & Apparel</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-teal-50 p-6 rounded-3xl shadow-sm border border-teal-100 flex flex-col">
              <p className="text-sm font-bold text-teal-800 flex items-center gap-2"><Layers size={16} /> Total Bahan Baku</p>
              <h3 className="text-2xl font-black text-teal-900 mt-2">0 <span className="text-sm font-normal text-teal-700">Item</span></h3>
            </div>
            <div className="bg-indigo-50 p-6 rounded-3xl shadow-sm border border-indigo-100 flex flex-col">
              <p className="text-sm font-bold text-indigo-800 flex items-center gap-2"><Package size={16} /> Kaos Polos</p>
              <h3 className="text-2xl font-black text-indigo-900 mt-2">0 <span className="text-sm font-normal text-indigo-700">Pcs</span></h3>
            </div>
            <div className="bg-red-50 p-6 rounded-3xl shadow-sm border border-red-100 flex flex-col">
              <p className="text-sm font-bold text-red-800 flex items-center gap-2"><AlertTriangle size={16} /> Stok Menipis</p>
              <h3 className="text-2xl font-black text-red-900 mt-2">0 <span className="text-sm font-normal text-red-700">Warning</span></h3>
            </div>
            <div className="bg-gray-50 p-6 rounded-3xl shadow-sm border border-gray-200 flex flex-col">
              <p className="text-sm font-bold text-gray-800 flex items-center gap-2"><ArrowRightLeft size={16} /> Mutasi Hari Ini</p>
              <h3 className="text-2xl font-black text-gray-900 mt-2">0 <span className="text-sm font-normal text-gray-600">Trx</span></h3>
            </div>
          </div>

          <div className="bg-gray-50 rounded-2xl p-8 text-center border-2 border-dashed border-gray-200 mt-10">
            <h3 className="text-lg font-bold text-gray-700 mb-2">Modul Sedang Dalam Pengembangan</h3>
            <p className="text-gray-500 text-sm">Sistem tracking bahan baku (kain/tinta) & persediaan kaos sedang disiapkan.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccestretGudangDashboard;
