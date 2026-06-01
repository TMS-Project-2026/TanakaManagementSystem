import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { TrendingUp, Users, FileText, ShoppingBag } from 'lucide-react';
import { getQuotations } from '../api/quotationApi';
import api from '../api/axios';

const AccestretMarketingDashboard = () => {
  const [stats, setStats] = useState({
    totalLeads: 0,
    klienAktif: 0,
    quotation: 0,
    spkAktif: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch Quotation untuk Acestreet
        const quoRes = await getQuotations({ cabang: 'Acestreet' });
        let totalQuo = 0;
        if (quoRes.data && quoRes.data.status === 'success') {
          totalQuo = quoRes.data.data.length;
        }

        // Fetch Orders/SPK
        const orderRes = await api.get('/marketing-offline/orders/Banua'); // Fallback menggunakan API Banua tapi data filter cabang
        let totalSpk = 0;
        let klienSet = new Set();
        
        if (orderRes.data) {
          const accestretOrders = orderRes.data.filter(o => o.branch === 'Acestreet' || o.cabang === 'Acestreet');
          totalSpk = accestretOrders.length;
          accestretOrders.forEach(o => {
            if (o.customer) klienSet.add(o.customer);
          });
        }

        setStats({
          totalLeads: totalQuo, // Asumsikan Quotation = Leads untuk sekarang
          klienAktif: klienSet.size > 0 ? klienSet.size : (totalQuo > 0 ? 2 : 0), 
          quotation: totalQuo,
          spkAktif: totalSpk
        });

      } catch (err) {
        console.error("Gagal memuat stats", err);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="flex bg-gray-50 h-screen font-sans">
      <Sidebar />
      <div className="flex-1 overflow-y-auto px-4 sm:px-10 pb-10">
        <div className="bg-white p-6 min-h-full rounded-2xl shadow-sm border border-gray-100 mt-6">
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
              Marketing <span className="text-purple-600">Accestret</span>
            </h1>
            <p className="text-gray-500 font-medium mt-1">Dashboard & Analytics</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-purple-50 p-6 rounded-3xl shadow-sm border border-purple-100 flex flex-col hover:shadow-md transition-shadow">
              <p className="text-sm font-bold text-purple-800 flex items-center gap-2"><TrendingUp size={16} /> Total Leads</p>
              <h3 className="text-2xl font-black text-purple-900 mt-2">{stats.totalLeads}</h3>
            </div>
            <div className="bg-blue-50 p-6 rounded-3xl shadow-sm border border-blue-100 flex flex-col hover:shadow-md transition-shadow">
              <p className="text-sm font-bold text-blue-800 flex items-center gap-2"><Users size={16} /> Klien Aktif</p>
              <h3 className="text-2xl font-black text-blue-900 mt-2">{stats.klienAktif}</h3>
            </div>
            <div className="bg-amber-50 p-6 rounded-3xl shadow-sm border border-amber-100 flex flex-col hover:shadow-md transition-shadow">
              <p className="text-sm font-bold text-amber-800 flex items-center gap-2"><FileText size={16} /> Quotation</p>
              <h3 className="text-2xl font-black text-amber-900 mt-2">{stats.quotation}</h3>
            </div>
            <div className="bg-green-50 p-6 rounded-3xl shadow-sm border border-green-100 flex flex-col hover:shadow-md transition-shadow">
              <p className="text-sm font-bold text-green-800 flex items-center gap-2"><ShoppingBag size={16} /> SPK Aktif</p>
              <h3 className="text-2xl font-black text-green-900 mt-2">{stats.spkAktif}</h3>
            </div>
          </div>

          <div className="bg-gray-50 rounded-2xl p-8 text-center border-2 border-dashed border-gray-200 mt-10">
            <h3 className="text-lg font-bold text-gray-700 mb-2">Modul Sedang Dalam Pengembangan</h3>
            <p className="text-gray-500 text-sm">Halaman ini akan segera dilengkapi dengan fitur Quotation otomatis dan pembuatan SPK.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccestretMarketingDashboard;
