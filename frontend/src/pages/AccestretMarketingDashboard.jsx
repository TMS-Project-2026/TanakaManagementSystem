import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { Package, Truck, CheckCircle, DollarSign, ShoppingCart, TrendingUp } from 'lucide-react';
import api from '../api/axios';

const AccestretMarketingDashboard = () => {
  const [stats, setStats] = useState({
    pesananBaru: 0,
    perluDikirim: 0,
    dalamPengiriman: 0,
    totalOmset: 0
  });

  // Placeholder data statis untuk prototype UI
  useEffect(() => {
    // Nantinya akan difetch dari API pesanan marketplace
    setStats({
      pesananBaru: 15,
      perluDikirim: 8,
      dalamPengiriman: 24,
      totalOmset: 15450000
    });
  }, []);

  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(number);
  };

  return (
    <div className="flex bg-gray-50 h-screen font-sans">
      <Sidebar />
      <div className="flex-1 overflow-y-auto px-4 sm:px-10 pb-10">
        <div className="bg-white p-6 min-h-full rounded-2xl shadow-sm border border-gray-100 mt-6">
          <div className="mb-8 flex justify-between items-end">
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
                Accestret <span className="text-orange-500">Marketplace</span>
              </h1>
              <p className="text-gray-500 font-medium mt-1">Pusat Manajemen Pesanan & Integrasi E-Commerce</p>
            </div>
            <button className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl font-semibold shadow-sm shadow-orange-200 transition-all flex items-center gap-2">
              <ShoppingCart size={18} />
              Tarik Data Pesanan
            </button>
          </div>

          {/* E-Commerce Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-blue-50 p-6 rounded-3xl shadow-sm border border-blue-100 flex flex-col hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 opacity-10 group-hover:scale-110 transition-transform"><ShoppingCart size={80} /></div>
              <p className="text-sm font-bold text-blue-800 flex items-center gap-2 relative z-10"><Package size={16} /> Pesanan Baru</p>
              <h3 className="text-3xl font-black text-blue-900 mt-2 relative z-10">{stats.pesananBaru}</h3>
              <p className="text-xs text-blue-600 mt-2 font-medium relative z-10">Menunggu diproses</p>
            </div>
            
            <div className="bg-amber-50 p-6 rounded-3xl shadow-sm border border-amber-100 flex flex-col hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 opacity-10 group-hover:scale-110 transition-transform"><Package size={80} /></div>
              <p className="text-sm font-bold text-amber-800 flex items-center gap-2 relative z-10"><Package size={16} /> Perlu Dikirim</p>
              <h3 className="text-3xl font-black text-amber-900 mt-2 relative z-10">{stats.perluDikirim}</h3>
              <p className="text-xs text-amber-600 mt-2 font-medium relative z-10">Siap di-pickup kurir</p>
            </div>
            
            <div className="bg-purple-50 p-6 rounded-3xl shadow-sm border border-purple-100 flex flex-col hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 opacity-10 group-hover:scale-110 transition-transform"><Truck size={80} /></div>
              <p className="text-sm font-bold text-purple-800 flex items-center gap-2 relative z-10"><Truck size={16} /> Dikirim</p>
              <h3 className="text-3xl font-black text-purple-900 mt-2 relative z-10">{stats.dalamPengiriman}</h3>
              <p className="text-xs text-purple-600 mt-2 font-medium relative z-10">Sedang dalam perjalanan</p>
            </div>
            
            <div className="bg-emerald-50 p-6 rounded-3xl shadow-sm border border-emerald-100 flex flex-col hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 opacity-10 group-hover:scale-110 transition-transform"><DollarSign size={80} /></div>
              <p className="text-sm font-bold text-emerald-800 flex items-center gap-2 relative z-10"><TrendingUp size={16} /> Omset Bulan Ini</p>
              <h3 className="text-2xl font-black text-emerald-900 mt-2 relative z-10">{formatRupiah(stats.totalOmset)}</h3>
              <p className="text-xs text-emerald-600 mt-2 font-medium relative z-10">+12.5% dari bulan lalu</p>
            </div>
          </div>

          {/* Prototype Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-800">Pesanan Terbaru Masuk</h3>
                <a href="#" className="text-orange-500 text-sm font-semibold hover:underline">Lihat Semua</a>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-100">
                    <tr>
                      <th className="py-3 px-4 rounded-tl-lg">ID Pesanan</th>
                      <th className="py-3 px-4">Marketplace</th>
                      <th className="py-3 px-4">Pelanggan</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 rounded-tr-lg text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-gray-700">
                    {[
                      { id: 'SHP-99281', mp: 'Shopee', name: 'Budi Santoso', status: 'Baru', amount: 250000 },
                      { id: 'TOK-11203', mp: 'Tokopedia', name: 'Siti Aminah', status: 'Perlu Dikirim', amount: 850000 },
                      { id: 'TIK-55421', mp: 'TikTok Shop', name: 'Ahmad Fauzi', status: 'Baru', amount: 125000 },
                    ].map((order, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-3 px-4 font-medium text-gray-900">{order.id}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 text-xs font-bold rounded-md ${
                            order.mp === 'Shopee' ? 'bg-orange-100 text-orange-700' : 
                            order.mp === 'Tokopedia' ? 'bg-green-100 text-green-700' : 'bg-black text-white'
                          }`}>{order.mp}</span>
                        </td>
                        <td className="py-3 px-4">{order.name}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 text-xs font-bold rounded-full flex items-center gap-1 w-max ${
                            order.status === 'Baru' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {order.status === 'Baru' ? <Package size={12}/> : <CheckCircle size={12}/>}
                            {order.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-semibold">{formatRupiah(order.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-sm p-6 text-white relative overflow-hidden">
              <div className="absolute -right-10 -bottom-10 opacity-20"><Package size={150}/></div>
              <h3 className="text-lg font-bold mb-2 relative z-10">Integrasi Sinkronisasi</h3>
              <p className="text-gray-300 text-sm mb-6 relative z-10">Sistem sedang disiapkan untuk menarik data otomatis dari API Shopee & Tokopedia.</p>
              
              <div className="space-y-4 relative z-10">
                <div className="bg-white/10 p-4 rounded-xl border border-white/10 backdrop-blur-sm">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-sm text-white">Sinkronisasi Stok</span>
                    <span className="text-xs bg-green-500/20 text-green-300 px-2 py-0.5 rounded-full font-bold">Aktif</span>
                  </div>
                  <p className="text-xs text-gray-400">Stok langsung terpotong saat pesanan masuk.</p>
                </div>
                <div className="bg-white/10 p-4 rounded-xl border border-white/10 backdrop-blur-sm">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-sm text-white">API Shopee</span>
                    <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-bold">Pending</span>
                  </div>
                  <p className="text-xs text-gray-400">Menunggu verifikasi developer app.</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AccestretMarketingDashboard;
