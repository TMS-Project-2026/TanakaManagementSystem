import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';

const Finance = () => {
  const [itemCode, setItemCode] = useState('');
  const [bulan, setBulan] = useState('');

  // Data dummy sesuai dengan gambar
  const data = {
    pendapatan: 800000,
    profit: 37157,
    hpp: 0,
    diskon: 0
  };

  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number || 0);
  };

  return (
    <div className="flex bg-[#f3f4f6] min-h-screen font-sans">
      <Sidebar />

      <main className="flex-1 p-6 overflow-y-auto h-screen">
        <div className="mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <h1 className="text-2xl font-bold text-gray-800 uppercase tracking-tight mb-4">Finance Dashboard</h1>
          
          {/* Filter Section */}
          <div className="flex flex-col gap-3 max-w-sm">
            <div className="flex items-center gap-2">
              <label className="w-24 text-sm font-bold bg-[#8cc474] px-2 py-1 uppercase text-black">Item Code</label>
              <select 
                value={itemCode}
                onChange={(e) => setItemCode(e.target.value)}
                className="border border-gray-300 rounded px-2 py-1 text-sm flex-1 bg-white"
              >
                <option value="">SMK ...</option>
                <option value="SMK01">SMK01</option>
                <option value="SMK02">SMK02</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="w-24 text-sm font-bold bg-[#8cc474] px-2 py-1 uppercase text-black">Bulan</label>
              <select 
                value={bulan}
                onChange={(e) => setBulan(e.target.value)}
                className="border border-gray-300 rounded px-2 py-1 text-sm flex-1 bg-white"
              >
                <option value="">Februari</option>
                <option value="1">Januari</option>
                <option value="2">Februari</option>
                <option value="3">Maret</option>
              </select>
            </div>
          </div>
        </div>

        {/* ================= METRICS CARDS (Berdasarkan Gambar) ================= */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-12">
          
          {/* Pendapatan Card */}
          <div className="flex flex-col relative pt-6">
            <div className="absolute top-0 left-0 w-full text-center text-sm font-bold mb-1">Pendapatan (Income)</div>
            {/* Blue Block */}
            <div className="bg-[#3b78d8] text-black h-20 flex items-center justify-center border border-gray-300 z-10 relative">
              <h2 className="text-4xl font-bold">{formatRupiah(data.pendapatan)}</h2>
              {/* Small Red block bottom right */}
              <div className="absolute -bottom-4 right-0 w-1/4 h-4 bg-[#ff0000] border-l border-b border-gray-300 z-20"></div>
            </div>
            {/* Magenta Block */}
            <div className="bg-[#ff00ff] h-8 w-3/4 border-l border-b border-r border-gray-300 relative top-[-1px]"></div>
          </div>

          {/* Profit Card */}
          <div className="flex flex-col relative pt-6">
            <div className="absolute top-0 left-0 w-full text-center text-sm font-bold mb-1">Profit</div>
            {/* Blue Block */}
            <div className="bg-[#3b78d8] text-black h-20 flex items-center justify-center border border-gray-300 z-10 relative">
              <h2 className="text-4xl font-bold">{formatRupiah(data.profit)}</h2>
              {/* Small Red block bottom right */}
              <div className="absolute -bottom-4 right-0 w-1/4 h-4 bg-[#ff0000] border-l border-b border-gray-300 z-20"></div>
            </div>
            {/* Magenta Block */}
            <div className="bg-[#ff00ff] h-8 w-3/4 border-l border-b border-r border-gray-300 relative top-[-1px]"></div>
          </div>

          {/* HPP Product Card */}
          <div className="flex flex-col relative pt-6 mt-4">
            <div className="bg-[#38761d] text-white font-bold h-10 flex items-center justify-center border border-gray-300 relative z-20">
              HPP Product
            </div>
            {/* Light Green Block */}
            <div className="bg-[#6aa84f] h-6 border-l border-r border-gray-300 relative z-10 top-[-1px]"></div>
            {/* Blue Block */}
            <div className="bg-[#3b78d8] h-12 border border-gray-300 relative top-[-2px]"></div>
          </div>

          {/* Diskon Card */}
          <div className="flex flex-col relative pt-6 mt-4">
            <div className="bg-[#38761d] text-white font-bold h-10 flex items-center justify-center border border-gray-300 relative z-20">
              Diskon
            </div>
            {/* Light Green Block */}
            <div className="bg-[#6aa84f] h-6 border-l border-r border-gray-300 relative z-10 top-[-1px]"></div>
            {/* Blue Block */}
            <div className="bg-[#3b78d8] h-12 border border-gray-300 relative top-[-2px]"></div>
          </div>

        </div>

      </main>
    </div>
  );
};

export default Finance;
