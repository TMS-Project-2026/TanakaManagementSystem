import React, { useEffect, useState } from 'react';
import { getFinanceOverview } from '../api/ownerApi';
import { DollarSign, ArrowUpRight, ArrowDownRight, AlertCircle, Banknote, CreditCard, BookOpen } from 'lucide-react';
import Sidebar from '../components/Sidebar';

const formatRupiah = (number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number || 0);

const FinanceOverview = () => {
    const [data, setData] = useState(null);

    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await getFinanceOverview();
                if (res.data.status === 'success') setData(res.data.data);
            } catch (error) { console.error(error); }
        };
        fetch();
    }, []);

    if (!data) return <div className="p-10 text-center font-bold">Memuat...</div>;

    const cards = [
        { title: 'Cash Tersedia', value: formatRupiah(data.cashAvailable), icon: <Banknote className="text-green-600" size={28} />, bg: 'bg-green-50' },
        { title: 'Total Income', value: formatRupiah(data.totalIncome), icon: <ArrowUpRight className="text-blue-600" size={28} />, bg: 'bg-blue-50' },
        { title: 'Total Expense', value: formatRupiah(data.totalExpense), icon: <ArrowDownRight className="text-red-600" size={28} />, bg: 'bg-red-50' },
        { title: 'Net Profit', value: formatRupiah(data.netProfit), icon: <DollarSign className="text-purple-600" size={28} />, bg: 'bg-purple-50' }
    ];

    return (
        <div className="flex bg-[#f8fafc] min-h-screen font-sans">
            <Sidebar />
            <main className="flex-1 p-6 lg:p-8 overflow-y-auto h-screen">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8 border-l-4 border-green-600 pl-4">
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Finance <span className="text-green-600">Overview</span></h1>
                        <p className="text-gray-500 font-medium mt-1">Laporan arus kas, profit, dan posisi keuangan multi-cabang.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
                        {cards.map((card, i) => (
                            <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">{card.title}</p>
                                    <h3 className="text-2xl font-black text-gray-900">{card.value}</h3>
                                </div>
                                <div className={`p-4 rounded-xl ${card.bg}`}>{card.icon}</div>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <h3 className="text-lg font-bold text-gray-800 mb-6">Key Financial Metrics</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="rounded-3xl bg-gray-50 p-4 border border-gray-100">
                                    <p className="text-xs text-gray-500 uppercase tracking-wider">Piutang</p>
                                    <p className="text-xl font-black text-gray-900">{formatRupiah(data.receivables)}</p>
                                </div>
                                <div className="rounded-3xl bg-gray-50 p-4 border border-gray-100">
                                    <p className="text-xs text-gray-500 uppercase tracking-wider">Hutang</p>
                                    <p className="text-xl font-black text-gray-900">{formatRupiah(data.payables)}</p>
                                </div>
                                <div className="rounded-3xl bg-gray-50 p-4 border border-gray-100">
                                    <p className="text-xs text-gray-500 uppercase tracking-wider">Invoice Unpaid</p>
                                    <p className="text-xl font-black text-gray-900">{data.unpaidInvoiceCount}</p>
                                </div>
                                <div className="rounded-3xl bg-gray-50 p-4 border border-gray-100">
                                    <p className="text-xs text-gray-500 uppercase tracking-wider">Jurnal</p>
                                    <p className="text-xl font-black text-gray-900">{data.journalCount}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-red-50 p-6 rounded-2xl shadow-sm border border-red-100 overflow-hidden">
                            <div className="flex items-center gap-4 mb-4">
                                <AlertCircle size={40} className="text-red-500" />
                                <div>
                                    <h3 className="text-xl font-bold text-red-900">Perhatian Keuangan</h3>
                                    <p className="text-red-700 text-sm">Terdapat {data.unpaidInvoiceCount} invoice yang belum dibayar.</p>
                                </div>
                            </div>
                            <div className="rounded-3xl bg-white p-5 border border-red-100">
                                <p className="text-sm text-gray-500">Segera koordinasikan dengan tim penagihan dan cabang untuk mempercepat penyelesaian piutang.</p>
                                <button className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition">Lihat Detail</button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default FinanceOverview;
