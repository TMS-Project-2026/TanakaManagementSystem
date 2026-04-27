import React, { useState } from 'react';
import { Routes, Route, NavLink, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { FileText, PieChart, BarChart2, Activity, DollarSign, ArrowRightLeft, CreditCard, LayoutDashboard, List, Search, Filter, Printer, Download } from 'lucide-react';

// Import sub-reports (we'll create these next)
import LabaRugi from './reports/LabaRugi';
import Neraca from './reports/Neraca';
import PerubahanModal from './reports/PerubahanModal';
import ArusKas from './reports/ArusKas';
import ExpenseReport from './reports/ExpenseReport';
import IncomeExpense from './reports/IncomeExpense';
import HutangReport from './reports/HutangReport';
import PiutangReport from './reports/PiutangReport';
import BukuBesar from './reports/BukuBesar';
import RekapJurnal from './reports/RekapJurnal';
import SemuaTransaksi from './reports/SemuaTransaksi';

const ReportCenter = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const reportMenus = [
        { path: 'semua-transaksi', name: 'Semua Transaksi', icon: <List size={18} /> },
        { path: 'laba-rugi', name: 'Laba Rugi', icon: <BarChart2 size={18} /> },
        { path: 'neraca', name: 'Neraca', icon: <PieChart size={18} /> },
        { path: 'perubahan-modal', name: 'Perubahan Modal', icon: <Activity size={18} /> },
        { path: 'arus-kas', name: 'Arus Kas', icon: <ArrowRightLeft size={18} /> },
        { path: 'expense', name: 'Expense', icon: <DollarSign size={18} /> },
        { path: 'income-expense', name: 'Pendapatan / Pengeluaran', icon: <LayoutDashboard size={18} /> },
        { path: 'hutang', name: 'Hutang', icon: <CreditCard size={18} /> },
        { path: 'piutang', name: 'Piutang', icon: <FileText size={18} /> },
        { path: 'buku-besar', name: 'Buku Besar', icon: <List size={18} /> },
        { path: 'rekap-jurnal', name: 'Rekap Jurnal', icon: <FileText size={18} /> },
    ];

    return (
        <div className="flex bg-[#f3f4f6] min-h-screen font-sans">
            <Sidebar />
            <main className="flex-1 p-6 overflow-y-auto h-screen">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 border-l-4 border-[#990000] pl-4">Report Center Premium</h1>
                        <p className="text-gray-500 mt-2 ml-5">Sistem Laporan Keuangan Profesional Multi-Cabang</p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row min-h-[80vh] overflow-hidden">
                    {/* Inner Sidebar for Sub-menus */}
                    <div className="w-full md:w-64 bg-gray-50 border-r border-gray-100 p-4 shrink-0">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 pl-3">Daftar Laporan</h3>
                        <nav className="space-y-1">
                            {reportMenus.map((menu) => (
                                <NavLink
                                    key={menu.path}
                                    to={`/report/${menu.path}`}
                                    className={({ isActive }) =>
                                        `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                                            isActive
                                                ? 'bg-[#990000] text-white shadow-md'
                                                : 'text-gray-600 hover:bg-red-50 hover:text-[#990000]'
                                        }`
                                    }
                                >
                                    {menu.icon}
                                    {menu.name}
                                </NavLink>
                            ))}
                        </nav>
                    </div>

                    {/* Report Content Area */}
                    <div className="flex-1 bg-white relative">
                        <Routes>
                            <Route path="semua-transaksi" element={<SemuaTransaksi />} />
                            <Route path="laba-rugi" element={<LabaRugi />} />
                            <Route path="neraca" element={<Neraca />} />
                            <Route path="perubahan-modal" element={<PerubahanModal />} />
                            <Route path="arus-kas" element={<ArusKas />} />
                            <Route path="expense" element={<ExpenseReport />} />
                            <Route path="income-expense" element={<IncomeExpense />} />
                            <Route path="hutang" element={<HutangReport />} />
                            <Route path="piutang" element={<PiutangReport />} />
                            <Route path="buku-besar" element={<BukuBesar />} />
                            <Route path="rekap-jurnal" element={<RekapJurnal />} />
                        </Routes>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ReportCenter;
