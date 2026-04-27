import React, { useState, useEffect } from 'react';
import { getReportNeraca } from '../../api/reportApi';
import ReportFilter from '../../components/ReportFilter';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6'];
const formatRupiah = (number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number || 0);

const Neraca = () => {
    const [filters, setFilters] = useState({ startDate: '', endDate: '', cabang: 'Semua Cabang' });
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await getReportNeraca(filters);
            if (res.data.status === 'success') {
                setData(res.data.data);
            }
        } catch (error) {
            console.error("Gagal load Neraca", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const exportColumns = [
        { header: 'Kategori', key: 'kategori' },
        { header: 'Kode Akun', key: 'kode_akun' },
        { header: 'Nama Akun', key: 'nama_akun' },
        { header: 'Saldo', key: 'saldo' }
    ];

    const exportData = data ? [
        ...data.aktiva.map(a => ({ kategori: 'Aktiva', kode_akun: a.kode_akun, nama_akun: a.nama_akun, saldo: a.saldo })),
        { kategori: 'TOTAL AKTIVA', kode_akun: '', nama_akun: '', saldo: data.totalAktiva },
        ...data.pasiva.map(a => ({ kategori: a.kategori, kode_akun: a.kode_akun, nama_akun: a.nama_akun, saldo: a.saldo })),
        { kategori: 'TOTAL PASIVA & EKUITAS', kode_akun: '', nama_akun: '', saldo: data.totalPasiva }
    ] : [];

    // Filter out zero balances for Pie Chart
    const pieData = data ? data.aktiva.filter(a => a.saldo > 0).map(a => ({ name: a.nama_akun, value: a.saldo })) : [];

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2">Neraca (Balance Sheet)</h2>
            
            <ReportFilter 
                filters={filters} 
                setFilters={setFilters} 
                onFilter={fetchData} 
                onPrint={() => window.print()}
                dataForExport={exportData}
                exportFileName="Neraca"
                columns={exportColumns}
            />

            {loading ? (
                <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#990000]"></div></div>
            ) : data && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        {/* AKTIVA */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">AKTIVA (Aset)</h3>
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="bg-gray-50 text-gray-600">
                                        <th className="py-2 px-3">Kode Akun</th>
                                        <th className="py-2 px-3">Nama Akun</th>
                                        <th className="py-2 px-3 text-right">Saldo</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.aktiva.map((item, idx) => (
                                        <tr key={idx} className="border-b border-gray-50">
                                            <td className="py-2 px-3 text-gray-500">{item.kode_akun}</td>
                                            <td className="py-2 px-3 text-gray-800">{item.nama_akun}</td>
                                            <td className="py-2 px-3 text-right text-gray-800">{formatRupiah(item.saldo)}</td>
                                        </tr>
                                    ))}
                                    <tr className="bg-green-50 font-bold">
                                        <td colSpan="2" className="py-3 px-3 text-green-800">TOTAL AKTIVA</td>
                                        <td className="py-3 px-3 text-right text-green-800">{formatRupiah(data.totalAktiva)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* PASIVA & EKUITAS */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">PASIVA & EKUITAS (Kewajiban & Modal)</h3>
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="bg-gray-50 text-gray-600">
                                        <th className="py-2 px-3">Kode Akun</th>
                                        <th className="py-2 px-3">Nama Akun</th>
                                        <th className="py-2 px-3 text-right">Saldo</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.pasiva.map((item, idx) => (
                                        <tr key={idx} className="border-b border-gray-50">
                                            <td className="py-2 px-3 text-gray-500">{item.kode_akun}</td>
                                            <td className="py-2 px-3 text-gray-800">{item.nama_akun}</td>
                                            <td className="py-2 px-3 text-right text-gray-800">{formatRupiah(item.saldo)}</td>
                                        </tr>
                                    ))}
                                    <tr className="bg-red-50 font-bold">
                                        <td colSpan="2" className="py-3 px-3 text-red-800">TOTAL PASIVA & EKUITAS</td>
                                        <td className="py-3 px-3 text-right text-red-800">{formatRupiah(data.totalPasiva)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Chart */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-96 sticky top-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Komposisi Aktiva</h3>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" label>
                                    {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                </Pie>
                                <RechartsTooltip formatter={(val) => formatRupiah(val)} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Neraca;
