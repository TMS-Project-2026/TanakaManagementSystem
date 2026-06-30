import NotificationBell from '../components/NotificationBell';
import { Bell } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { FileText, PieChart, BarChart2, Activity, DollarSign, ArrowRightLeft, CreditCard, LayoutDashboard, Upload, MapPin, UserCircle, Search, ArrowLeft, TrendingUp, Layers, BookOpen, Receipt, Wallet, ChevronRight } from 'lucide-react';
import { getCabangPerformance } from '../api/ownerApi';

// Import sub-reports
import LabaRugi from './reports/LabaRugi';
import Neraca from './reports/Neraca';
import PerubahanModal from './reports/PerubahanModal';
import ArusKas from './reports/ArusKas';
import ExpenseReport from './reports/ExpenseReport';
import IncomeExpense from './reports/IncomeExpense';
import NeracaSaldo from './reports/NeracaSaldo';
import HutangReport from './reports/HutangReport';
import PiutangReport from './reports/PiutangReport';
import BukuBesar from './reports/BukuBesar';
import RekapJurnal from './reports/RekapJurnal';
import SemuaTransaksi from './reports/SemuaTransaksi';
import SemuaPembelian from './reports/SemuaPembelian';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';

const BranchReport = () => {
    const [branches, setBranches] = useState([]);

    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await getCabangPerformance();
                if (res.data.status === 'success') setBranches(res.data.data);
            } catch (error) {
                console.error(error);
            }
        };
        fetch();
    }, []);

    const CHART_COLORS = ['#990000', '#1f2937', '#4b5563', '#d97706'];

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Branch Performance Report</h2>
                    <p className="text-sm text-gray-500">Laporan komparatif revenue, profit, dan best seller untuk setiap cabang.</p>
                </div>
                <button className="inline-flex items-center gap-2 rounded-xl bg-[#990000] px-4 py-2 text-white font-bold hover:bg-[#7a0000] transition">
                    <Upload size={16} /> Download PDF
                </button>
            </div>

            {branches.length > 0 && (
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm mb-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Grafik Revenue & Profit per Cabang</h3>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={branches} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} />
                                <YAxis tickFormatter={(val) => `${(val / 1e6).toFixed(0)}Jt`} tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                                <RechartsTooltip 
                                    formatter={(value) => formatRupiah(value)}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="revenue" name="Revenue" fill="#1f2937" radius={[6, 6, 0, 0]} barSize={40} />
                                <Bar dataKey="profit" name="Profit" fill="#990000" radius={[6, 6, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {branches.length ? branches.map((item, idx) => (
                    <div key={idx} className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-lg font-black text-gray-900">{item.name}</h3>
                            <span className="px-3 py-1 bg-gray-50 text-gray-500 rounded-full text-xs font-bold border border-gray-100">Cabang</span>
                        </div>
                        <p className="text-xs uppercase font-bold text-[#990000] tracking-wider mb-4 border-b border-gray-50 pb-3">Best Seller: {item.bestSeller}</p>
                        <div className="space-y-3 text-sm text-gray-600">
                            <div className="flex justify-between items-center">
                                <span>Revenue</span>
                                <span className="font-black text-gray-900">{formatRupiah(item.revenue)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span>Profit</span>
                                <span className="font-black text-green-700">{formatRupiah(item.profit)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span>Total Order</span>
                                <span className="font-bold text-gray-900">{item.orders}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span>Growth</span>
                                <span className={`font-bold ${item.growthPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {item.growthPercent > 0 ? '+' : ''}{item.growthPercent}%
                                </span>
                            </div>
                        </div>
                    </div>
                )) : (
                    <div className="col-span-full p-10 text-center text-gray-500 bg-white rounded-3xl border border-gray-100">Data cabang belum tersedia.</div>
                )}
            </div>
        </div>
    );
};

const formatRupiah = (number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number || 0);

// ===== REPORT CARD DEFINITIONS =====
const reportTabs = [
  { key: 'siklus', label: 'Siklus Bisnis' },
  { key: 'penjualan', label: 'Penjualan' },
  { key: 'pembelian', label: 'Pembelian' },
  { key: 'biaya', label: 'Biaya' },
  { key: 'aset', label: 'Aset' },
  { key: 'bank', label: 'Bank' },
];

const reportCards = {
  siklus: [
    {
      title: 'Neraca',
      desc: 'Menampilkan posisi keuangan perusahaan (aset, liabilitas, dan ekuitas) pada tanggal tertentu.',
      path: 'neraca',
      icon: <PieChart size={22} className="text-[#990000]" />,
    },
    {
      title: 'Buku Besar',
      desc: 'Menampilkan semua transaksi berdasarkan akun dalam periode tertentu, termasuk kronologi pergerakan transaksinya selama periode berlangsung.',
      path: 'buku-besar',
      icon: <BookOpen size={22} className="text-[#990000]" />,
    },
    {
      title: 'Laba Rugi',
      desc: 'Menampilkan semua pendapatan yang diperoleh dan biaya yang dikeluarkan dalam periode tertentu. Laporan utama untuk menilai kinerja keuangan.',
      path: 'laba-rugi-detail',
      icon: <BarChart2 size={22} className="text-[#990000]" />,
    },
    {
      title: 'Rekap Jurnal',
      desc: 'Menampilkan semua journal entry per transaksi dalam periode tertentu. Anda dapat melacak transaksi yang masuk ke masing-masing akun.',
      path: 'rekap-jurnal',
      icon: <FileText size={22} className="text-[#990000]" />,
    },
    {
      title: 'Arus Kas',
      desc: 'Menampilkan pergerakan uang masuk dan keluar dari transaksi dalam periode tertentu. Penting untuk mengetahui likuiditas perusahaan.',
      path: 'arus-kas',
      icon: <ArrowRightLeft size={22} className="text-[#990000]" />,
    },
    {
      title: 'Neraca Saldo',
      desc: 'Menampilkan saldo dari setiap akun, termasuk saldo awal, pergerakan, dan saldo akhir dalam periode tertentu.',
      path: 'neraca-saldo',
      icon: <Layers size={22} className="text-[#990000]" />,
    },
    {
      title: 'Perubahan Modal',
      desc: 'Menampilkan perubahan atau pergerakan ekuitas pemilik dalam periode tertentu, termasuk laba ditahan dan penyertaan modal.',
      path: 'perubahan-modal',
      icon: <TrendingUp size={22} className="text-[#990000]" />,
    }
  ],
  penjualan: [
    {
      title: 'Semua Transaksi Penjualan',
      desc: 'Melihat ringkasan seluruh transaksi penjualan yang tercatat, termasuk invoice, status pembayaran, dan total revenue.',
      path: 'sales-report',
      icon: <Receipt size={22} className="text-blue-600" />,
    },
    {
      title: 'Piutang Usaha',
      desc: 'Menampilkan daftar piutang yang belum dilunasi oleh pelanggan, termasuk aging analysis dan status jatuh tempo.',
      path: 'piutang',
      icon: <TrendingUp size={22} className="text-blue-600" />,
    },
    {
      title: 'Kinerja Cabang',
      desc: 'Perbandingan performa penjualan antar cabang, termasuk revenue, profit, dan produk terlaris per lokasi.',
      path: 'branch-report',
      icon: <MapPin size={22} className="text-blue-600" />,
    },
  ],
  pembelian: [
    {
      title: 'Semua Transaksi Pembelian',
      desc: 'Melihat ringkasan seluruh transaksi pembelian yang tercatat di jurnal pembelian.',
      path: 'purchase-report',
      icon: <Receipt size={22} className="text-orange-600" />,
    },
    {
      title: 'Hutang Usaha',
      desc: 'Menampilkan daftar hutang yang belum dibayarkan kepada supplier, termasuk aging analysis dan status pembayaran.',
      path: 'hutang',
      icon: <CreditCard size={22} className="text-orange-600" />,
    },
    {
      title: 'Rekap Jurnal Pembelian',
      desc: 'Menampilkan seluruh jurnal entry terkait pembelian dan pengeluaran procurement dalam periode tertentu.',
      path: 'rekap-jurnal',
      icon: <FileText size={22} className="text-orange-600" />,
    },
  ],
  biaya: [
    {
      title: 'Laporan Biaya & Pengeluaran',
      desc: 'Menampilkan semua pengeluaran operasional perusahaan dalam periode tertentu, dikelompokkan berdasarkan kategori beban.',
      path: 'expense',
      icon: <DollarSign size={22} className="text-amber-600" />,
    },
    {
      title: 'Pendapatan vs Pengeluaran',
      desc: 'Membandingkan total pendapatan dan total pengeluaran dalam periode tertentu untuk menilai efisiensi keuangan.',
      path: 'income-expense',
      icon: <BarChart2 size={22} className="text-amber-600" />,
    },
  ],
  aset: [
    {
      title: 'Neraca (Posisi Aset)',
      desc: 'Menampilkan rincian aset yang dimiliki perusahaan, baik aset lancar maupun aset tetap, beserta nilainya pada tanggal tertentu.',
      path: 'neraca',
      icon: <Layers size={22} className="text-emerald-600" />,
    },
  ],
  bank: [
    {
      title: 'Arus Kas & Bank',
      desc: 'Menampilkan pergerakan kas masuk dan keluar melalui rekening bank perusahaan dalam periode tertentu.',
      path: 'arus-kas',
      icon: <Wallet size={22} className="text-indigo-600" />,
    },
    {
      title: 'Buku Besar Bank',
      desc: 'Menampilkan seluruh transaksi yang terjadi pada akun bank dalam periode tertentu secara kronologis.',
      path: 'buku-besar',
      icon: <BookOpen size={22} className="text-indigo-600" />,
    },
  ],
};

// ===== LANDING PAGE COMPONENT =====
const ReportLanding = () => {
  const [activeReportTab, setActiveReportTab] = useState('siklus');
  const navigate = useNavigate();
  const cards = reportCards[activeReportTab] || [];

  return (
    <div className="space-y-6">
      {/* Tab navigation */}
      <div className="flex flex-wrap gap-1 border-b border-gray-200 pb-0">
        {reportTabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveReportTab(tab.key)}
            className={`px-5 py-2.5 text-sm font-semibold border-b-2 transition-all duration-200 -mb-[1px] ${
              activeReportTab === tab.key
                ? 'border-[#990000] text-[#990000]'
                : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Report cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {cards.map((card) => (
          <div
            key={card.path + card.title}
            className="bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-md hover:border-gray-200 transition-all duration-300 group"
          >
            <div className="flex items-start gap-4">
              <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100 group-hover:bg-red-50/50 transition-colors">
                {card.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-gray-900 group-hover:text-[#990000] transition-colors">
                  {card.title}
                </h3>
                <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                  {card.desc}
                </p>
                <button
                  onClick={() => navigate(`/report/${card.path}`)}
                  className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[#990000] border border-[#990000]/30 px-4 py-1.5 rounded-lg hover:bg-[#990000] hover:text-white transition-all duration-200"
                >
                  Lihat laporan
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {cards.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <FileText size={40} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium">Belum ada laporan untuk kategori ini.</p>
        </div>
      )}
    </div>
  );
};

// ===== SUB REPORT WRAPPER =====
const SubReportWrapper = ({ children, title }) => {
  const navigate = useNavigate();
  return (
    <div>
      <button
        onClick={() => navigate('/report/laba-rugi')}
        className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-[#990000] transition-colors"
      >
        <ArrowLeft size={16} /> Kembali ke Laporan
      </button>
      {children}
    </div>
  );
};

// ===== MAIN REPORT CENTER =====
const ReportCenter = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [showProfile, setShowProfile] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');


    return (
        <div className="flex bg-gray-50 min-h-screen font-sans relative">
            <Sidebar />
            <main className="flex-1 flex flex-col pt-16 md:pt-0 h-screen overflow-hidden">
                {/* TOPBAR */}
                <header className="h-auto flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 sm:px-10 py-4 gap-4 sm:gap-0 mb-4">
                  <div className="relative w-full sm:w-72">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      placeholder="Cari laporan..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-11 pr-4 py-2 bg-white rounded-full border border-gray-200 shadow-sm text-sm focus:outline-none focus:border-[#990000] focus:ring-2 focus:ring-red-100 transition-all"
                    />
                  </div>
                  <div className="flex items-center gap-6">

          <NotificationBell />
                    <div className="relative">
                      <div className="bg-white p-1.5 rounded-full shadow-sm cursor-pointer hover:shadow-md transition-all border border-gray-100" onClick={() => setShowProfile(!showProfile)}>
                        <UserCircle size={32} className="text-gray-400 hover:text-[#990000] transition-colors" />
                      </div>
                      
                      {showProfile && (
                        <div className="absolute right-0 mt-3 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                          <div className="p-4 bg-red-50/50">
                            <p className="text-sm font-black text-gray-900">{JSON.parse(localStorage.getItem('user'))?.nama || JSON.parse(localStorage.getItem('user'))?.username || 'Admin'}</p>
                    <p className="text-[10px] font-bold text-[#990000] uppercase tracking-wider mt-0.5">{(JSON.parse(localStorage.getItem('user'))?.role || '').replace('_', ' ')}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </header>

                <div className="flex-1 overflow-y-auto px-4 sm:px-10 pb-10">
                  <div className="max-w-7xl mx-auto w-full">

                    {/* Page Title */}
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex flex-col items-start gap-1">
                            <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                                Laporan Keuangan
                            </h1>
                            <p className="text-gray-500 font-medium mt-1">Laporan keuangan dan analisis bisnis Tanaka Management System.</p>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 min-h-[70vh]">
                      <Routes>
                        <Route index element={<ReportLanding />} />
                        <Route path="laba-rugi" element={<ReportLanding />} />
                        <Route path="laba-rugi-detail" element={<SubReportWrapper><LabaRugi /></SubReportWrapper>} />
                        <Route path="sales-report" element={<SubReportWrapper><SemuaTransaksi /></SubReportWrapper>} />
                        <Route path="purchase-report" element={<SubReportWrapper><SemuaPembelian /></SubReportWrapper>} />
                        <Route path="branch-report" element={<SubReportWrapper><BranchReport /></SubReportWrapper>} />
                        <Route path="neraca" element={<SubReportWrapper><Neraca /></SubReportWrapper>} />
                        <Route path="neraca-saldo" element={<SubReportWrapper><NeracaSaldo /></SubReportWrapper>} />
                        <Route path="perubahan-modal" element={<SubReportWrapper><PerubahanModal /></SubReportWrapper>} />
                        <Route path="arus-kas" element={<SubReportWrapper><ArusKas /></SubReportWrapper>} />
                        <Route path="expense" element={<SubReportWrapper><ExpenseReport /></SubReportWrapper>} />
                        <Route path="income-expense" element={<SubReportWrapper><IncomeExpense /></SubReportWrapper>} />
                        <Route path="hutang" element={<SubReportWrapper><HutangReport /></SubReportWrapper>} />
                        <Route path="piutang" element={<SubReportWrapper><PiutangReport /></SubReportWrapper>} />
                        <Route path="buku-besar" element={<SubReportWrapper><BukuBesar /></SubReportWrapper>} />
                        <Route path="rekap-jurnal" element={<SubReportWrapper><RekapJurnal /></SubReportWrapper>} />
                      </Routes>
                    </div>

                  </div>
                </div>
            </main>
        </div>
    );
};

export default ReportCenter;
