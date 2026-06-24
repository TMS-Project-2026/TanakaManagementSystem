import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { UserCircle, Activity, DollarSign, TrendingUp, Package, Percent, ShoppingBag, CheckCircle } from 'lucide-react';

const Dashboard = ({ embedded = false }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showProfile, setShowProfile] = useState(false);
  
  // State untuk Filter Tanggal
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:3000/api/sales-online/dashboard-stats', {
        params: { startDate, endDate }
      });
      setData(res.data);
    } catch (err) {
      console.error("Gagal ambil data dashboard", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [startDate, endDate]);

  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number || 0);
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-4 animate-bounce">
        <div className="w-16 h-16 bg-[#990000] rounded-full animate-ping"></div>
        <p className="font-bold text-gray-900 tracking-widest uppercase">Sedang Memuat...</p>
      </div>
    </div>
  );

  return (
    <div className="flex bg-gray-50 min-h-screen font-sans">
      {!embedded && <Sidebar />}

      <main className="flex-1 flex flex-col pt-16 md:pt-0 h-screen overflow-hidden">
        {/* TOPBAR */}
        <header className="h-auto flex flex-col sm:flex-row items-end justify-end px-4 sm:px-10 py-4 gap-4 sm:gap-0 mb-4">
          <div className="flex items-center gap-6">
            {/* FILTER TANGGAL */}
            <div className="flex items-center gap-2 bg-white p-1.5 rounded-full shadow-sm border border-gray-100">
              <div className="flex flex-col">
                <label className="text-[8px] font-bold text-gray-400 px-3 pt-0.5 uppercase tracking-wider leading-none">Mulai</label>
                <input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="text-xs font-black text-gray-700 bg-transparent outline-none cursor-pointer px-3 leading-none pb-0.5"
                />
              </div>
              <div className="w-px h-6 bg-gray-200"></div>
              <div className="flex flex-col">
                <label className="text-[8px] font-bold text-gray-400 px-3 pt-0.5 uppercase tracking-wider leading-none">Sampai</label>
                <input 
                  type="date" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="text-xs font-black text-gray-700 bg-transparent outline-none cursor-pointer px-3 leading-none pb-0.5"
                />
              </div>
              {(startDate || endDate) && (
                <button 
                  onClick={() => { setStartDate(''); setEndDate(''); }}
                  className="ml-1 text-[10px] bg-red-50 text-red-600 px-4 py-1.5 rounded-full font-bold hover:bg-red-100 transition-colors mr-0.5"
                >
                  Reset
                </button>
              )}
            </div>
            <div className="relative">
              <div className="bg-white p-1.5 rounded-full shadow-sm cursor-pointer hover:shadow-md transition-all border border-gray-100" onClick={() => setShowProfile(!showProfile)}>
                <UserCircle size={32} className="text-gray-400 hover:text-[#990000] transition-colors" />
              </div>
              
              {showProfile && (
                <div className="absolute right-0 mt-3 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                  <div className="p-4 bg-red-50/50">
                    <p className="text-sm font-black text-gray-900">{JSON.parse(localStorage.getItem('user'))?.nama || JSON.parse(localStorage.getItem('user'))?.username || 'Admin'}</p>
                    <p className="text-[10px] font-bold text-[#990000] uppercase tracking-wider mt-0.5">{(JSON.parse(localStorage.getItem('user'))?.role || 'Admin').replace('_', ' ')}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-4 sm:px-10 pb-10">
          
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
            <div>
              <h1 className="text-xl md:text-2xl lg:text-3xl font-black text-gray-900 tracking-tight leading-tight flex items-center gap-3">
                <div className="bg-red-50 border border-red-100 p-2 rounded-lg shadow-sm">
                  <Activity className="text-[#990000]" size={20} />
                </div>
                Dashboard Pusat
              </h1>
              <p className="text-sm text-gray-500 mt-2 font-medium">Pantau rangkuman seluruh pendapatan dan pesanan dari tim marketing dan sales.</p>
            </div>
          </div>

{/* ================= 1. TOP METRICS (6 Kotak Grid 3x2) - CLEAN RED-WHITE ================= */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {[
              { title: 'Sales Revenue', value: formatRupiah(data.summary.totalRevenue), icon: <DollarSign size={16} className="text-white" /> },
              { title: 'Profit Bersih', value: formatRupiah(data.summary.totalProfit), icon: <TrendingUp size={16} className="text-white" /> },
              { title: 'Total HPP', value: formatRupiah(data.summary.totalHPP), icon: <Package size={16} className="text-white" /> },
              { title: 'Qty Terjual', value: `${data.summary.totalQty} Pcs`, icon: <ShoppingBag size={16} className="text-white" /> },
              { title: 'Potongan Admin', value: formatRupiah(data.summary.totalPotongan), icon: <Percent size={16} className="text-white" /> },
              { title: 'Status Terjual', value: `${data.summary.totalQty} Item`, icon: <CheckCircle size={16} className="text-white" /> }
            ].map((card, i) => (
              <div key={i} className="bg-white rounded-[20px] p-6 shadow-sm border border-gray-100 border-l-[6px] border-l-[#990000] flex flex-col justify-center transition-all hover:-translate-y-1 hover:shadow-md min-h-[110px]">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-[30px] h-[30px] rounded-full bg-[#990000] flex items-center justify-center shrink-0 shadow-sm shadow-red-900/20">
                    {card.icon}
                  </div>
                  <p className="text-[12px] font-bold text-gray-500 tracking-wider uppercase truncate">{card.title}</p>
                </div>
                <h3 className="text-2xl font-black text-gray-900 leading-tight truncate break-words">{card.value}</h3>
              </div>
            ))}
          </div>

          {/* ================= AREA TENGAH ================= */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
            
{/* KIRI: Grid Pendapatan Per Toko */}
            <div className="col-span-1 bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-[#990000] rounded-lg flex items-center justify-center">
                  <span className="text-white text-xs font-bold">TK</span>
                </div>
                <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest">Toko</h3>
              </div>
              
              <div className="flex flex-col gap-3">
                {data.shops.map((toko, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-gray-50 border border-gray-100 hover:border-[#990000] hover:bg-white transition-all duration-300 flex flex-col gap-1">
                    <p className="text-[10px] font-bold text-gray-500 uppercase leading-snug break-words">{toko.nama}</p>
                    <p className="text-sm font-black text-gray-900 break-words">{formatRupiah(toko.total)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="col-span-1 lg:col-span-2 flex flex-col gap-8">
              
{/* Sales Trend (Chart) */}
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 w-full">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-[#990000] rounded-lg flex items-center justify-center">
                      <span className="text-white text-xs font-bold">TR</span>
                    </div>
                    <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest">Sales Trend</h3>
                  </div>
                  <div className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-1 rounded-md">30 Hari Terakhir</div>
                </div>
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.trend}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                      <XAxis dataKey="tgl" tick={{fontSize: 9, fill: '#6b7280', fontWeight: 'bold'}} axisLine={false} tickLine={false} dy={5} />
                      <YAxis tick={{fontSize: 9, fill: '#6b7280', fontWeight: 'bold'}} tickFormatter={(val) => `${val/1000}k`} axisLine={false} tickLine={false} dx={-5} width={35} />
                      <Tooltip cursor={{stroke: '#e5e7eb', strokeWidth: 2}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', padding: '8px', fontSize: '12px', fontWeight: 'bold'}} />
                      <Line type="monotone" dataKey="sales" stroke="#990000" strokeWidth={3} dot={{r: 3, fill: '#fff', strokeWidth: 2, stroke: '#990000'}} activeDot={{r: 5, fill: '#990000', strokeWidth: 0}} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

{/* Top Produk */}
              <div className="bg-gray-900 p-5 rounded-2xl shadow-md w-full">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                    <span className="text-gray-900 text-xs font-bold">TOP</span>
                  </div>
                  <h3 className="text-xs font-black text-white uppercase tracking-widest">Top 5 Products</h3>
                </div>
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.products}>
                      <XAxis dataKey="nama" tick={{fontSize: 8}} hide={true} />
                      <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.3)', backgroundColor: '#fff', color: '#000', fontSize: '12px', fontWeight: 'bold'}} />
                      <Bar dataKey="total" fill="#fff" radius={[6, 6, 6, 6]}>
                        {
                          data.products.map((entry, index) => (
                            <cell key={`cell-${index}`} fill={index === 0 ? '#990000' : '#ffffff'} />
                          ))
                        }
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;