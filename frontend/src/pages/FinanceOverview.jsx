import React, { useEffect, useState } from 'react';
import { getFinanceOverview } from '../api/ownerApi';
import { DollarSign, ArrowUpRight, ArrowDownRight, AlertCircle } from 'lucide-react';
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

    return (
        <div className="flex bg-[#f8fafc] min-h-screen font-sans">
            <Sidebar />
            <main className="flex-1 p-6 lg:p-8 overflow-y-auto h-screen">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8 border-l-4 border-green-600 pl-4">
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Finance <span className="text-green-600">Overview</span></h1>
                        <p className="text-gray-500 font-medium mt-1">Laporan arus kas, profit, dan hutang/piutang.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Total Pemasukan</p>
                                <h3 className="text-2xl font-black text-gray-900">{formatRupiah(data.totalIncome)}</h3>
                            </div>
                            <div className="p-4 rounded-xl bg-green-50"><ArrowUpRight className="text-green-600" size={28} /></div>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Total Pengeluaran</p>
                                <h3 className="text-2xl font-black text-gray-900">{formatRupiah(data.totalExpense)}</h3>
                            </div>
                            <div className="p-4 rounded-xl bg-red-50"><ArrowDownRight className="text-red-600" size={28} /></div>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Profit Bersih</p>
                                <h3 className="text-2xl font-black text-blue-600">{formatRupiah(data.netProfit)}</h3>
                            </div>
                            <div className="p-4 rounded-xl bg-blue-50"><DollarSign className="text-blue-600" size={28} /></div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <h3 className="text-lg font-bold text-gray-800 mb-6">Cashflow (Q1)</h3>
                            <div className="space-y-4">
                                {data.cashflow.map((cf, i) => (
                                    <div key={i} className="flex flex-col gap-2 p-4 bg-gray-50 rounded-xl">
                                        <div className="flex justify-between font-bold text-gray-800"><span>Bulan {cf.month}</span></div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-green-600 flex items-center gap-1"><ArrowUpRight size={14}/> {formatRupiah(cf.in)}</span>
                                            <span className="text-red-600 flex items-center gap-1"><ArrowDownRight size={14}/> {formatRupiah(cf.out)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-red-50 p-6 rounded-2xl shadow-sm border border-red-100 flex flex-col items-center justify-center text-center">
                            <AlertCircle size={64} className="text-red-500 mb-4" />
                            <h3 className="text-xl font-bold text-red-900 mb-2">Invoice Belum Dibayar</h3>
                            <p className="text-red-700 mb-6">Ada {data.unpaidInvoiceCount} invoice yang statusnya belum lunas.</p>
                            <button className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-xl transition-colors shadow-lg">Lihat Detail Invoice</button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default FinanceOverview;
