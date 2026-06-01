import React, { useState, useEffect } from 'react';
import { getAllPiutang } from '../../api/piutangApi';
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
            const res = await getAllPiutang();
            if (res.data.status === 'success') {
                let filteredData = res.data.data || [];
                if (filters.cabang !== 'Semua Cabang') {
                    filteredData = filteredData.filter(d => d.cabang === filters.cabang);
                }
                // Filter by date could also be applied here if needed
                setData(filteredData);
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
        { header: 'No Ref', key: 'no_ref' },
        { header: 'Nama Klien', key: 'nama_klien' },
        { header: 'Total Piutang', key: 'nominal_fmt' },
        { header: 'Sisa Pembayaran', key: 'sisa_fmt' },
        { header: 'Status', key: 'status' },
        { header: 'Jatuh Tempo', key: 'jatuh_tempo_fmt' },
        { header: 'Cabang', key: 'cabang' }
    ];

    const isOverdue = (dateStr) => {
        if (!dateStr) return false;
        return new Date(dateStr) < new Date() && new Date(dateStr).toDateString() !== new Date().toDateString();
    };

    const exportData = data ? data.map(d => {
        const overdue = isOverdue(d.jatuh_tempo);
        return {
            ...d,
            nominal_fmt: formatRupiah(d.nominal),
            sisa_fmt: formatRupiah(d.sisa),
            jatuh_tempo_fmt: d.jatuh_tempo ? formatDate(d.jatuh_tempo) : '-',
            status_keterangan: d.status === 'Paid' ? 'Paid' : (overdue ? 'Overdue' : 'Due Date')
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
                                    <th className="py-3 px-4">No Ref</th>
                                    <th className="py-3 px-4">Nama Klien</th>
                                    <th className="py-3 px-4 text-right">Total Piutang</th>
                                    <th className="py-3 px-4 text-right">Sisa Pembayaran</th>
                                    <th className="py-3 px-4">Jatuh Tempo</th>
                                    <th className="py-3 px-4">Cabang</th>
                                    <th className="py-3 px-4 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.length > 0 ? data.map((item, idx) => {
                                    const overdue = isOverdue(item.jatuh_tempo) && item.status !== 'Paid';
                                    return (
                                        <tr key={idx} className={`border-b border-gray-50 hover:bg-gray-50 ${overdue ? 'bg-red-50/50' : ''}`}>
                                            <td className="py-3 px-4 text-[#990000] font-semibold">{item.no_ref}</td>
                                            <td className="py-3 px-4 text-gray-800 font-medium">{item.nama_klien}</td>
                                            <td className="py-3 px-4 text-right text-gray-600">{formatRupiah(item.nominal)}</td>
                                            <td className="py-3 px-4 text-right text-gray-900 font-bold">{formatRupiah(item.sisa)}</td>
                                            <td className="py-3 px-4 text-gray-500">
                                                {item.jatuh_tempo ? formatDate(item.jatuh_tempo) : '-'}
                                                {overdue && <span className="ml-2 text-xs text-red-600 font-bold inline-flex items-center gap-1"><AlertCircle size={12}/> Overdue</span>}
                                            </td>
                                            <td className="py-3 px-4 text-gray-600">{item.cabang}</td>
                                            <td className="py-3 px-4 text-center">
                                                <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${item.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                    {item.status}
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
