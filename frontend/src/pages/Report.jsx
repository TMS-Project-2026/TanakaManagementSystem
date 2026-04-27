import React, { useState } from 'react';
import { getFinanceReport } from '../api/financeApi';
import { FileText, Filter, Printer } from 'lucide-react';
import Sidebar from '../components/Sidebar';

const Report = () => {
    const [filter, setFilter] = useState({ startDate: '', endDate: '' });
    const [report, setReport] = useState(null);

    const handleFilter = async (e) => {
        e.preventDefault();
        try {
            const res = await getFinanceReport(filter.startDate, filter.endDate);
            if (res.data.status === 'success') {
                setReport(res.data.data);
            }
        } catch (error) {
            console.error("Gagal memuat report", error);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const formatRupiah = (number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(number || 0);

    return (
        <div className="flex bg-[#f3f4f6] min-h-screen font-sans print:bg-white print:block">
            <div className="print:hidden"><Sidebar /></div>
            <main className="flex-1 p-6 overflow-y-auto h-screen print:p-0 print:overflow-visible">
                <div className="bg-white p-6 min-h-full rounded-2xl shadow-sm border border-gray-100 print:shadow-none print:border-none print:p-0">
                    <h1 className="text-3xl font-bold text-gray-800 mb-6 border-l-4 border-red-600 pl-4 print:hidden">Laporan Keuangan</h1>

            {/* Filter Section */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-red-100 mb-8 print:hidden">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2"><Filter className="text-red-600" /> Filter Laporan</h3>
                <form onSubmit={handleFilter} className="flex flex-col md:flex-row items-end gap-4">
                    <div className="w-full md:w-auto">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Dari Tanggal</label>
                        <input type="date" value={filter.startDate} onChange={e => setFilter({...filter, startDate: e.target.value})} className="w-full md:w-48 border border-gray-300 rounded-lg p-2 focus:ring-red-500 focus:border-red-500" />
                    </div>
                    <div className="w-full md:w-auto">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Sampai Tanggal</label>
                        <input type="date" value={filter.endDate} onChange={e => setFilter({...filter, endDate: e.target.value})} className="w-full md:w-48 border border-gray-300 rounded-lg p-2 focus:ring-red-500 focus:border-red-500" />
                    </div>
                    <button type="submit" className="w-full md:w-auto bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-6 rounded-lg transition-colors flex items-center justify-center gap-2">
                        Tampilkan Data
                    </button>
                </form>
            </div>

            {/* Report Display */}
            {report && (
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-red-100 print:shadow-none print:border-none print:p-0">
                    <div className="flex justify-between items-start mb-8 border-b pb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                                <FileText className="text-red-600 w-8 h-8" />
                                Ringkasan Keuangan
                            </h2>
                            <p className="text-gray-500 mt-1">Periode: {report.periode}</p>
                        </div>
                        <button onClick={handlePrint} className="print:hidden bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg flex items-center gap-2">
                            <Printer className="w-5 h-5" /> Cetak
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-red-50 p-6 rounded-xl border border-red-100">
                            <p className="text-gray-500 text-sm font-medium mb-1">Total Pemasukan (Revenue)</p>
                            <h3 className="text-3xl font-bold text-green-600">{formatRupiah(report.totalRevenue)}</h3>
                        </div>
                        <div className="bg-red-50 p-6 rounded-xl border border-red-100">
                            <p className="text-gray-500 text-sm font-medium mb-1">Total Pengeluaran (Expense)</p>
                            <h3 className="text-3xl font-bold text-red-600">{formatRupiah(report.totalExpense)}</h3>
                        </div>
                        <div className={`p-6 rounded-xl border ${report.profit >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                            <p className="text-gray-500 text-sm font-medium mb-1">Keuntungan (Profit)</p>
                            <h3 className={`text-3xl font-bold ${report.profit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                                {formatRupiah(report.profit)}
                            </h3>
                        </div>
                    </div>
                </div>
            )}

            {!report && (
                <div className="text-center py-12 text-gray-500 bg-white rounded-2xl shadow-sm border border-red-100 print:hidden">
                    Silakan atur filter tanggal dan klik "Tampilkan Data" untuk melihat laporan.
                </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Report;
