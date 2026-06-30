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
        <header className="h-12 bg-white border-b border-gray-200 flex items-center justify-end px-5 gap-4 shrink-0 z-30">
          <div className="flex items-center gap-4">
            {/* FILTER TANGGAL */}
            <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-xl border border-gray-100">
              <div className="flex items-center gap-1">
                <label className="text-[8px] font-black text-gray-400 uppercase tracking-wider pl-2">Mulai:</label>
                <input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="text-[10px] font-bold text-gray-700 bg-transparent outline-none cursor-pointer pr-2 py-0.5"
                />
              </div>
              <div className="w-px h-4 bg-gray-200"></div>
              <div className="flex items-center gap-1">
                <label className="text-[8px] font-black text-gray-400 uppercase tracking-wider pl-1">Sampai:</label>
                <input 
                  type="date" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="text-[10px] font-bold text-gray-700 bg-transparent outline-none cursor-pointer pr-2 py-0.5"
                />
              </div>
              {(startDate || endDate) && (
                <button 
                  onClick={() => { setStartDate(''); setEndDate(''); }}
                  className="text-[9px] bg-red-100 text-red-700 px-2.5 py-1 rounded-lg font-bold hover:bg-red-200 transition-colors mr-0.5"
                >
                  Reset
                </button>
              )}
            </div>
            <div className="relative flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => setShowProfile(!showProfile)}>
              <UserCircle className="text-gray-400" size={20} />
              <ChevronDown size={12} className="text-gray-400" />
              {showProfile && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-150 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  <div className="p-3 bg-red-50/50">
                    <p className="text-xs font-black text-gray-900">{JSON.parse(localStorage.getItem('user'))?.nama || JSON.parse(localStorage.getItem('user'))?.username || 'Admin'}</p>
                    <p className="text-[9px] font-bold text-[#990000] uppercase tracking-wider mt-0.5">{(JSON.parse(localStorage.getItem('user'))?.role || 'Admin').replace('_', ' ')}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4 bg-[#f8fafc]">
          
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-4">
            <div>
              <h1 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight leading-tight flex items-center gap-3">
                <div className="bg-red-50 border border-red-100 p-1.5 rounded-lg shadow-sm">
                  <Activity className="text-[#990000]" size={16} />
                </div>
                Dashboard Pusat
              </h1>
              <p className="text-xs text-gray-500 mt-1 font-medium">Pantau rangkuman seluruh pendapatan dan pesanan dari tim marketing dan sales.</p>
            </div>
          </div>

{/* ================= 1. TOP METRICS (6 Kotak Grid 3x2) - CLEAN RED-WHITE ================= */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-4">
            {[
              { title: 'Sales Revenue', value: formatRupiah(data.summary.totalRevenue), icon: <DollarSign size={14} className="text-white" /> },
              { title: 'Profit Bersih', value: formatRupiah(data.summary.totalProfit), icon: <TrendingUp size={14} className="text-white" /> },
              { title: 'Total HPP', value: formatRupiah(data.summary.totalHPP), icon: <Package size={14} className="text-white" /> },
              { title: 'Qty Terjual', value: `${data.summary.totalQty} Pcs`, icon: <ShoppingBag size={14} className="text-white" /> },
              { title: 'Potongan Admin', value: formatRupiah(data.summary.totalPotongan), icon: <Percent size={14} className="text-white" /> },
              { title: 'Status Terjual', value: `${data.summary.totalQty} Item`, icon: <CheckCircle size={14} className="text-white" /> }
            ].map((card, i) => (
              <div key={i} className="bg-white rounded-[12px] p-3.5 shadow-sm border border-gray-100 border-l-[4px] border-l-[#990000] flex flex-col justify-center transition-all hover:-translate-y-1 hover:shadow-md min-h-[75px]">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-[20px] h-[20px] rounded-full bg-[#990000] flex items-center justify-center shrink-0 shadow-sm shadow-red-900/20">
                    {card.icon}
                  </div>
                  <p className="text-[9px] font-bold text-gray-500 tracking-wider uppercase truncate">{card.title}</p>
                </div>
                <h3 className="text-lg font-black text-gray-900 leading-tight truncate break-words">{card.value}</h3>
              </div>
            ))}
          </div>

          {/* ================= AREA TENGAH ================= */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
            
{/* KIRI: Grid Pendapatan Per Toko */}
            <div className="col-span-1 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 bg-[#990000] rounded-lg flex items-center justify-center">
                  <span className="text-white text-[10px] font-bold">TK</span>
                </div>
                <h3 className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Toko</h3>
              </div>
              
              <div className="flex flex-col gap-2 max-h-[290px] overflow-y-auto pr-1 custom-scrollbar">
                {data.shops.map((toko, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-gray-50 border border-gray-100 hover:border-[#990000] hover:bg-white transition-all duration-300 flex flex-col gap-0.5">
                    <p className="text-[9px] font-bold text-gray-500 uppercase leading-snug break-words">{toko.nama}</p>
                    <p className="text-xs font-black text-gray-900 break-words">{formatRupiah(toko.total)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="col-span-1 lg:col-span-2 flex flex-col gap-4">
              
{/* Sales Trend (Chart) */}
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 w-full">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-[#990000] rounded-lg flex items-center justify-center">
                      <span className="text-white text-[10px] font-bold">TR</span>
                    </div>
                    <h3 className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Sales Trend</h3>
                  </div>
                  <div className="bg-gray-100 text-gray-600 text-[9px] font-bold px-2 py-0.5 rounded-md">30 Hari Terakhir</div>
                </div>
                <div className="h-32 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.trend} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                      <XAxis dataKey="tgl" tick={{fontSize: 8, fill: '#6b7280', fontWeight: 'bold'}} axisLine={false} tickLine={false} dy={5} />
                      <YAxis tick={{fontSize: 8, fill: '#6b7280', fontWeight: 'bold'}} tickFormatter={(val) => `${val/1000}k`} axisLine={false} tickLine={false} dx={-5} width={30} />
                      <Tooltip cursor={{stroke: '#e5e7eb', strokeWidth: 2}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', padding: '8px', fontSize: '11px', fontWeight: 'bold'}} />
                      <Line type="monotone" dataKey="sales" stroke="#990000" strokeWidth={2.5} dot={{r: 2, fill: '#fff', strokeWidth: 1.5, stroke: '#990000'}} activeDot={{r: 4, fill: '#990000', strokeWidth: 0}} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

{/* Top Produk */}
              <div className="bg-gray-900 p-4 rounded-xl shadow-md w-full">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center">
                    <span className="text-gray-900 text-[10px] font-bold">TOP</span>
                  </div>
                  <h3 className="text-[10px] font-black text-white uppercase tracking-widest">Top 5 Products</h3>
                </div>
                <div className="h-32 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.products} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                      <XAxis dataKey="nama" tick={{fontSize: 8}} hide={true} />
                      <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.3)', backgroundColor: '#fff', color: '#000', fontSize: '11px', fontWeight: 'bold'}} />
                      <Bar dataKey="total" fill="#fff" radius={[4, 4, 4, 4]} barSize={24}>
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