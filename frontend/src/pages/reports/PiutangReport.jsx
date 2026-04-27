import React, { useState, useEffect } from 'react';
import { getReportPiutang } from '../../api/reportApi';
import ReportFilter from '../../components/ReportFilter';
import { AlertCircle } from 'lucide-react';

const formatRupiah = (number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number || 0);
const formatDate = (dateString) => new Date(dateString).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });

const PiutangReport = () => {
    const [filters, setFilters] = useState({ startDate: '', endDate: '', cabang: 'Semua Cabang' });
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await getReportPiutang(filters);
            if (res.data.status === 'success') {
                setData(res.data.data);
            }
        } catch (error) {
            console.error("Gagal load Piutang", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const exportColumns = [
        { header: 'Nama Klien', key: 'customer' },
        { header: 'Deskripsi Pemasaran', key: 'deskripsi_pemasaran' },
        { header: 'Jumlah', key: 'nominal_fmt' },
        { header: 'Status', key: 'status_bayar' },
        { header: 'Keterangan', key: 'keterangan_due_date' },
        { header: 'Cabang', key: 'cabang' }
    ];

    const isOverdue = (dateStr) => {
        return new Date(dateStr) < new Date();
    };

    const exportData = data ? data.map(d => {
        const overdue = isOverdue(d.jatuh_tempo);
        return {
            ...d,
            nominal_fmt: formatRupiah(d.nominal),
            status_bayar: d.status === 'Lunas' ? 'Paid' : 'Unpaid',
            keterangan_due_date: d.status === 'Lunas' ? 'Lunas' : (overdue ? 'Overdue' : 'Due Date')
        };
    }) : [];

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2">Laporan Piutang Pelanggan</h2>
            
            <ReportFilter 
                filters={filters} 
                setFilters={setFilters} 
                onFilter={fetchData} 
                onPrint={() => window.print()}
                dataForExport={exportData}
                exportFileName="Piutang_Report"
                columns={exportColumns}
            />

            {loading ? (
                <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#990000]"></div></div>
            ) : data && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="bg-gray-50 text-gray-600 border-b">
                                    <th className="py-3 px-4">No Invoice</th>
                                    <th className="py-3 px-4">Nama Klien</th>
                                    <th className="py-3 px-4">Deskripsi Pemasaran</th>
                                    <th className="py-3 px-4">Jumlah</th>
                                    <th className="py-3 px-4">Jatuh Tempo</th>
                                    <th className="py-3 px-4">Cabang</th>
                                    <th className="py-3 px-4 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.length > 0 ? data.map((item, idx) => {
                                    const overdue = isOverdue(item.jatuh_tempo);
                                    return (
                                        <tr key={idx} className={`border-b border-gray-50 hover:bg-gray-50 ${overdue ? 'bg-red-50/50' : ''}`}>
                                            <td className="py-3 px-4 text-[#990000] font-semibold">{item.no_invoice}</td>
                                            <td className="py-3 px-4 text-gray-800 font-medium">{item.customer}</td>
                                            <td className="py-3 px-4 text-gray-600">{item.deskripsi_pemasaran || '-'}</td>
                                            <td className="py-3 px-4 text-gray-800 font-bold">{formatRupiah(item.nominal)}</td>
                                            <td className="py-3 px-4 text-gray-500">
                                                {formatDate(item.jatuh_tempo)}
                                                {overdue && <span className="ml-2 text-xs text-red-600 font-bold inline-flex items-center gap-1"><AlertCircle size={12}/> Overdue</span>}
                                            </td>
                                            <td className="py-3 px-4 text-gray-600">{item.cabang}</td>
                                            <td className="py-3 px-4 text-center">
                                                <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${item.status === 'Lunas' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                    {item.status === 'Lunas' ? 'Paid' : 'Unpaid'}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                }) : (
                                    <tr><td colSpan="7" className="text-center py-8 text-gray-400">Tidak ada data piutang tertunggak.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PiutangReport;
