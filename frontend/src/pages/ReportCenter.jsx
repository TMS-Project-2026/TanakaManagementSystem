import React, { useState, useEffect } from 'react';
import { Routes, Route, NavLink, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { FileText, PieChart, BarChart2, Activity, DollarSign, ArrowRightLeft, CreditCard, LayoutDashboard, List, Download, MapPin } from 'lucide-react';
import { getCabangPerformance } from '../api/ownerApi';

// Import sub-reports
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

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Branch Performance Report</h2>
                    <p className="text-sm text-gray-500">Laporan komparatif revenue, profit, dan best seller untuk setiap cabang.</p>
                </div>
                <button className="inline-flex items-center gap-2 rounded-xl bg-[#990000] px-4 py-2 text-white font-bold hover:bg-[#7a0000] transition">
                    <Download size={16} /> Download PDF
                </button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {branches.length ? branches.map((item, idx) => (
                    <div key={idx} className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">{item.name}</h3>
                        <p className="text-xs uppercase text-gray-400 tracking-wider mb-4">Best Seller: {item.bestSeller}</p>
                        <div className="space-y-3 text-sm text-gray-600">
                            <div className="flex justify-between">
                                <span>Revenue</span>
                                <span className="font-bold text-gray-900">{formatRupiah(item.revenue)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Profit</span>
                                <span className="font-bold text-gray-900">{formatRupiah(item.profit)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Order</span>
                                <span className="font-bold text-gray-900">{item.orders}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Growth</span>
                                <span className="font-bold text-gray-900">{item.growthPercent}%</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Target</span>
                                <span className="font-bold text-gray-900">{formatRupiah(item.targetRevenue)}</span>
                            </div>
                        </div>
                    </div>
                )) : (
                    <div className="col-span-full p-10 text-center text-gray-500">Data cabang belum tersedia.</div>
                )}
            </div>
        </div>
    );
};

const formatRupiah = (number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number || 0);

const ReportCenter = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const reportMenus = [
        { path: 'sales-report', name: 'Sales Report', icon: <List size={18} /> },
        { path: 'branch-report', name: 'Branch Report', icon: <MapPin size={18} /> },
        { path: 'laba-rugi', name: 'Profit Loss', icon: <BarChart2 size={18} /> },
        { path: 'neraca', name: 'Balance Sheet', icon: <PieChart size={18} /> },
        { path: 'arus-kas', name: 'Cashflow', icon: <ArrowRightLeft size={18} /> },
        { path: 'expense', name: 'Expense', icon: <DollarSign size={18} /> },
        { path: 'income-expense', name: 'Income vs Expense', icon: <LayoutDashboard size={18} /> },
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
                        <h1 className="text-3xl font-bold text-gray-800 border-l-4 border-[#990000] pl-4">Reports & Analytics</h1>
                        <p className="text-gray-500 mt-2 ml-5">Laporan keuangan dan kinerja cabang untuk Owner.</p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row min-h-[80vh] overflow-hidden">
                    {/* Inner Sidebar for Sub-menus */}
                    <div className="w-full md:w-64 bg-gray-50 border-r border-gray-100 p-4 shrink-0">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 pl-3">Laporan Utama</h3>
                        <nav className="space-y-1">
                            {reportMenus.map((menu) => (
                                <NavLink
                                    key={menu.path}
                                    to={menu.path}
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
                    <div className="flex-1 bg-white relative p-4 md:p-6">
                        <Routes>
                            <Route index element={<SemuaTransaksi />} />
                            <Route path="sales-report" element={<SemuaTransaksi />} />
                            <Route path="branch-report" element={<BranchReport />} />
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
