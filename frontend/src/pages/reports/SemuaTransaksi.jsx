import React, { useState, useEffect } from 'react';
import { getReportSemuaTransaksi } from '../../api/reportApi';
import ReportFilter from '../../components/ReportFilter';

const formatRupiah = (number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number || 0);
const formatDate = (dateString) => new Date(dateString).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });

const SemuaTransaksi = () => {
    const [filters, setFilters] = useState({ startDate: '', endDate: '', cabang: 'Semua Cabang' });
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await getReportSemuaTransaksi(filters);
            if (res.data.status === 'success') {
                setData(res.data.data);
            }
        } catch (error) {
            console.error("Gagal load Semua Transaksi", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const exportColumns = [
        { header: 'Tanggal', key: 'tanggal_fmt' },
        { header: 'Nama Klien', key: 'klien' },
        { header: 'Deskripsi Pemesanan', key: 'deskripsi_pemesanan' },
        { header: 'Jumlah', key: 'jumlah_fmt' },
        { header: 'Status', key: 'status_bayar' },
        { header: 'Keterangan', key: 'keterangan' },
        { header: 'Cabang', key: 'cabang' }
    ];

    const exportData = data ? data.map(d => ({
        ...d,
        tanggal_fmt: formatDate(d.tanggal),
        jumlah_fmt: formatRupiah(d.jumlah)
    })) : [];

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2">Laporan Semua Transaksi</h2>
            
            <ReportFilter 
                filters={filters} 
                setFilters={setFilters} 
                onFilter={fetchData} 
                onPrint={() => window.print()}
                dataForExport={exportData}
                exportFileName="Data_Transaksi"
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
                                    <th className="py-3 px-3">Tanggal</th>
                                    <th className="py-3 px-3">Nama Klien</th>
                                    <th className="py-3 px-3">Deskripsi Pemesanan</th>
                                    <th className="py-3 px-3 text-right">Jumlah</th>
                                    <th className="py-3 px-3 text-center">Status</th>
                                    <th className="py-3 px-3">Keterangan</th>
                                    <th className="py-3 px-3">Cabang</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.length > 0 ? data.map((item, idx) => (
                                    <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50">
                                        <td className="py-3 px-3 text-gray-600 whitespace-nowrap">{formatDate(item.tanggal)}</td>
                                        <td className="py-3 px-3 text-gray-800 font-semibold">{item.klien}</td>
                                        <td className="py-3 px-3 text-gray-600">{item.deskripsi_pemesanan}</td>
                                        <td className="py-3 px-3 text-right text-gray-800 font-bold">{formatRupiah(item.jumlah)}</td>
                                        <td className="py-3 px-3 text-center">
                                            <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${item.status_bayar === 'paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {item.status_bayar}
                                            </span>
                                        </td>
                                        <td className="py-3 px-3">
                                            <span className={`px-2 py-1 rounded text-xs uppercase font-medium ${item.keterangan === 'lunas' ? 'text-green-600' : item.keterangan === 'overdue' ? 'text-red-600 bg-red-50' : 'text-yellow-600'}`}>
                                                {item.keterangan}
                                            </span>
                                        </td>
                                        <td className="py-3 px-3 text-gray-500">{item.cabang}</td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan="7" className="text-center py-6 text-gray-400">Belum ada transaksi.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SemuaTransaksi;
