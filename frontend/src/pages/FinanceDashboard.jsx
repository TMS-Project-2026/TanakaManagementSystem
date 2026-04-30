import React, { useEffect, useState } from 'react';
import { getFinanceDashboard } from '../api/financeApi';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import Sidebar from '../components/Sidebar';

const FinanceDashboard = () => {
    const [data, setData] = useState({
        totalRevenue: 0,
        totalExpense: 0,
        profit: 0,
        totalTransaksi: 0,
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
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(number);
    };

    return (
        <div className="flex bg-gray-50 min-h-screen font-sans relative">
            <Sidebar />

            <main className="flex-1 flex flex-col pt-16 md:pt-0 h-screen overflow-hidden">
                <div className="flex-1 overflow-y-auto px-4 sm:px-10 pb-10 pt-8 sm:pt-10">
                    {/* Hero Header */}
                    <div className="mb-6 flex flex-col items-start gap-1">
                      <h1 className="text-xl md:text-2xl lg:text-3xl font-black text-gray-900 tracking-tight leading-tight">
                        Dashboard <span className="text-[#990000]">Finance</span>
                      </h1>
                      <p className="text-gray-500 font-medium mt-1">Ringkasan performa keuangan perusahaan secara real-time.</p>
                    </div>

                    {/* Summary Cards - Matching Marketing */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        
                        <div className="bg-red-50 p-6 rounded-3xl shadow-md border border-red-100 flex items-center justify-between hover:shadow-lg transition-all duration-300">
                          <div>
                            <p className="text-sm font-bold text-red-800">Total Revenue</p>
                            <h3 className="text-lg md:text-xl font-black text-red-900 mt-2 break-words">{formatRupiah(data.totalRevenue)}</h3>
                          </div>
                        </div>

                        <div className="bg-red-100 p-6 rounded-3xl shadow-md border border-red-200 flex items-center justify-between hover:shadow-lg transition-all duration-300">
                          <div>
                            <p className="text-sm font-bold text-red-800">Total Expense</p>
                            <h3 className="text-lg md:text-xl font-black text-red-900 mt-2 break-words">{formatRupiah(data.totalExpense)}</h3>
                          </div>
                        </div>

                        <div className="bg-red-500 p-6 rounded-3xl shadow-md flex items-center justify-between hover:shadow-lg transition-all duration-300">
                          <div>
                            <p className="text-sm font-bold text-white">Profit</p>
                            <h3 className="text-lg md:text-xl font-black text-white mt-2 break-words">{formatRupiah(data.profit)}</h3>
                          </div>
                        </div>

                        <div className="bg-red-200 p-6 rounded-3xl shadow-md border border-red-300 flex items-center justify-between hover:shadow-lg transition-all duration-300">
                          <div>
                            <p className="text-sm font-bold text-red-900">Total Transaksi</p>
                            <h3 className="text-lg md:text-xl font-black text-red-900 mt-2">{data.totalTransaksi}</h3>
                          </div>
                        </div>

                    </div>

                    {/* Chart Section */}
                    <div className="grid grid-cols-1 gap-8 mb-10">
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 w-full">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-[#990000] rounded-lg flex items-center justify-center">
                                        <span className="text-white text-xs font-bold">GF</span>
                                    </div>
                                    <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest">Grafik Keuangan Bulanan</h3>
                                </div>
                            </div>
                            <div className="h-80 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={data.chartData}
                                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                        <XAxis dataKey="name" tick={{fontSize: 9, fill: '#6b7280', fontWeight: 'bold'}} axisLine={false} tickLine={false} dy={5} />
                                        <YAxis tick={{fontSize: 9, fill: '#6b7280', fontWeight: 'bold'}} tickFormatter={(val) => `Rp ${val / 1000}k`} axisLine={false} tickLine={false} dx={-5} />
                                        <Tooltip cursor={{fill: '#fef2f2'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', padding: '8px', fontSize: '12px', fontWeight: 'bold'}} formatter={(value) => formatRupiah(value)} />
                                        <Legend wrapperStyle={{fontSize: '12px', fontWeight: 'bold', color: '#374151', paddingTop: '10px'}} />
                                        <Bar dataKey="revenue" name="Revenue" fill="#990000" radius={[6, 6, 0, 0]} />
                                        <Bar dataKey="expense" name="Expense" fill="#f87171" radius={[6, 6, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default FinanceDashboard;
