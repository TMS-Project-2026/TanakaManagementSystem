import React, { useEffect, useState } from 'react';
import { getFinanceDashboard } from '../api/financeApi';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { DollarSign, Banknote, CreditCard, ArrowUpRight, AlertCircle, FileText, ArrowRight } from 'lucide-react';
import Sidebar from '../components/Sidebar';

const FinanceDashboard = () => {
    const [data, setData] = useState({
        totalRevenue: 0,
        totalExpense: 0,
        profit: 0,
        totalTransaksi: 0,
        cashAvailable: 0,
        totalPiutang: 0,
        unpaidInvoiceCount: 0,
        recentJournals: [],
        unpaidInvoicesList: [],
        chartData: []
    });

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const res = await getFinanceDashboard();
            if (res.data.status === 'success') {
                setData(res.data.data);
            }
        } catch (error) {
            console.error("Gagal memuat data dashboard", error);
        }
    };

    const formatRupiah = (number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number || 0);
    };

    return (
        <div className="flex bg-[#f8fafc] min-h-screen font-sans relative">
            <Sidebar />

            <main className="flex-1 flex flex-col pt-16 md:pt-0 h-screen overflow-hidden">
                <div className="flex-1 overflow-y-auto px-4 sm:px-10 pb-10 pt-8 sm:pt-10">
                    {/* Hero Header */}
                    <div className="mb-6 flex flex-col items-start gap-1">
                      <h1 className="text-xl md:text-2xl lg:text-3xl font-black text-gray-900 tracking-tight leading-tight">
                        Dashboard <span className="text-[#990000]">Finance</span>
                      </h1>
                      <p className="text-gray-500 font-medium mt-1">Ringkasan kas, piutang, dan performa keuangan perusahaan secara komprehensif.</p>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        
                        <div className="bg-green-50 p-6 rounded-3xl shadow-sm border border-green-100 flex items-center justify-between hover:shadow-md transition-all duration-300">
                          <div>
                            <p className="text-sm font-bold text-green-800">Total Kas & Bank</p>
                            <h3 className="text-lg md:text-xl font-black text-green-900 mt-2 break-words">{formatRupiah(data.cashAvailable)}</h3>
                          </div>
                          <div className="p-3 bg-green-200 rounded-2xl">
                             <Banknote className="text-green-700" size={24} />
                          </div>
                        </div>

                        <div className="bg-orange-50 p-6 rounded-3xl shadow-sm border border-orange-100 flex items-center justify-between hover:shadow-md transition-all duration-300">
                          <div>
                            <p className="text-sm font-bold text-orange-800">Total Piutang</p>
                            <h3 className="text-lg md:text-xl font-black text-orange-900 mt-2 break-words">{formatRupiah(data.totalPiutang)}</h3>
                          </div>
                          <div className="p-3 bg-orange-200 rounded-2xl">
                             <CreditCard className="text-orange-700" size={24} />
                          </div>
                        </div>

                        <div className="bg-blue-50 p-6 rounded-3xl shadow-sm border border-blue-100 flex items-center justify-between hover:shadow-md transition-all duration-300">
                          <div>
                            <p className="text-sm font-bold text-blue-800">Total Pendapatan</p>
                            <h3 className="text-lg md:text-xl font-black text-blue-900 mt-2 break-words">{formatRupiah(data.totalRevenue)}</h3>
                          </div>
                          <div className="p-3 bg-blue-200 rounded-2xl">
                             <ArrowUpRight className="text-blue-700" size={24} />
                          </div>
                        </div>

                        <div className="bg-[#990000] p-6 rounded-3xl shadow-md flex items-center justify-between hover:shadow-lg transition-all duration-300">
                          <div>
                            <p className="text-sm font-bold text-white">Laba Bersih</p>
                            <h3 className="text-lg md:text-xl font-black text-white mt-2 break-words">{formatRupiah(data.profit)}</h3>
                          </div>
                          <div className="p-3 bg-red-900/50 rounded-2xl">
                             <DollarSign className="text-white" size={24} />
                          </div>
                        </div>

                    </div>

                    {/* Chart Section */}
                    <div className="grid grid-cols-1 gap-8 mb-8">
                        <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 w-full">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3 px-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-[#990000] rounded-lg flex items-center justify-center">
                                        <span className="text-white text-xs font-bold">GF</span>
                                    </div>
                                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Grafik Arus Kas Bulanan</h3>
                                </div>
                            </div>
                            <div className="h-80 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={data.chartData}
                                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                        <XAxis dataKey="name" tick={{fontSize: 10, fill: '#6b7280', fontWeight: 'bold'}} axisLine={false} tickLine={false} dy={10} />
                                        <YAxis tick={{fontSize: 10, fill: '#6b7280', fontWeight: 'bold'}} tickFormatter={(val) => `Rp ${val / 1000000}M`} axisLine={false} tickLine={false} dx={-10} />
                                        <Tooltip cursor={{fill: '#fef2f2'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px', fontSize: '12px', fontWeight: 'bold'}} formatter={(value) => formatRupiah(value)} />
                                        <Legend wrapperStyle={{fontSize: '12px', fontWeight: 'bold', color: '#374151', paddingTop: '20px'}} />
                                        <Bar dataKey="revenue" name="Pendapatan" fill="#10b981" radius={[6, 6, 0, 0]} barSize={30} />
                                        <Bar dataKey="expense" name="Pengeluaran" fill="#ef4444" radius={[6, 6, 0, 0]} barSize={30} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Recent Activities Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
                        {/* Jurnal Terbaru */}
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                                    <FileText size={20} className="text-[#990000]" />
                                    Jurnal Terbaru
                                </h3>
                            </div>
                            <div className="space-y-3">
                                {data.recentJournals && data.recentJournals.length > 0 ? (
                                    data.recentJournals.map((journal, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-2xl transition-colors border border-gray-50">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${journal.category === 'Income' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                                    <DollarSign size={18} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900">{journal.description || 'Transaksi Jurnal'}</p>
                                                    <p className="text-xs text-gray-500 font-medium">{new Date(journal.transaction_date).toLocaleDateString('id-ID')} • {journal.account_name}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className={`text-sm font-black ${journal.category === 'Income' ? 'text-green-600' : 'text-red-600'}`}>
                                                    {journal.category === 'Income' ? '+' : '-'}{formatRupiah(journal.amount)}
                                                </p>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{journal.transaction_id}</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-gray-400 text-sm font-medium">Belum ada transaksi jurnal</div>
                                )}
                            </div>
                        </div>

                        {/* Invoice Belum Lunas */}
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                                    <AlertCircle size={20} className="text-orange-500" />
                                    Invoice Tertunda ({data.unpaidInvoiceCount})
                                </h3>
                            </div>
                            <div className="space-y-3">
                                {data.unpaidInvoicesList && data.unpaidInvoicesList.length > 0 ? (
                                    data.unpaidInvoicesList.map((inv, idx) => {
                                        const isOverdue = inv.status === 'Overdue' || new Date(inv.tanggal_jatuh_tempo) < new Date();
                                        return (
                                            <div key={idx} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-2xl transition-colors border border-gray-50">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-2 h-10 rounded-full ${isOverdue ? 'bg-red-500' : 'bg-orange-400'}`}></div>
                                                    <div>
                                                        <p className="text-sm font-bold text-gray-900">{inv.klien}</p>
                                                        <p className="text-xs text-gray-500 font-medium">{inv.no_invoice}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right flex flex-col items-end">
                                                    <p className="text-sm font-black text-gray-900 mb-1">{formatRupiah(inv.grand_total)}</p>
                                                    <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${isOverdue ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                                                        {isOverdue ? 'Overdue' : 'Unpaid'}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="text-center py-8 text-gray-400 text-sm font-medium">Semua invoice sudah lunas 🎉</div>
                                )}
                            </div>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
};

export default FinanceDashboard;
