import React, { useState, useEffect } from 'react';
import { getReportBukuBesar } from '../../api/reportApi';
import ReportFilter from '../../components/ReportFilter';
import { BookOpen } from 'lucide-react';

const formatRupiah = (number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number || 0);
const formatDate = (dateString) => new Date(dateString).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' });

const BukuBesar = () => {
    const [filters, setFilters] = useState({ startDate: '', endDate: '', cabang: 'Semua Cabang', akun_id: '' });
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await getReportBukuBesar(filters);
            if (res.data.status === 'success') {
                setData(res.data.data);
            }
        } catch (error) {
            console.error("Gagal load Buku Besar", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const exportColumns = [
        { header: 'Tanggal', key: 'tanggal_fmt' },
        { header: 'Referensi', key: 'referensi' },
        { header: 'Keterangan', key: 'keterangan' },
        { header: 'Debit', key: 'debit' },
        { header: 'Kredit', key: 'kredit' },
        { header: 'Saldo', key: 'saldo' },
        { header: 'Cabang', key: 'cabang' }
    ];

    let runningBalance = 0;
    const exportData = data ? data.transaksi.map(d => {
        runningBalance += (Number(d.debit) - Number(d.kredit));
        return {
            ...d,
            tanggal_fmt: formatDate(d.tanggal),
            saldo: runningBalance
        };
    }) : [];

    // Reset running balance for rendering
    runningBalance = 0;

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2">Buku Besar (General Ledger)</h2>
            
            {/* Custom Filter specifically for Buku Besar because it needs akun_id */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row gap-4 justify-between items-end md:items-center">
                <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Pilih Akun</label>
                        <select 
                            value={filters.akun_id} 
                            onChange={(e) => setFilters({...filters, akun_id: e.target.value})}
                            className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#990000]/20 focus:border-[#990000] outline-none text-sm bg-white w-full md:w-64"
                        >
                            <option value="">-- Semua Akun --</option>
                            {data && data.akunList && data.akunList.map(a => (
                                <option key={a.id} value={a.id}>{a.kode_akun} - {a.nama_akun}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <ReportFilter 
                filters={filters} 
                setFilters={setFilters} 
                onFilter={fetchData} 
                onPrint={() => window.print()}
                dataForExport={exportData}
                exportFileName="Buku_Besar"
                columns={exportColumns}
            />

            {loading ? (
                <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#990000]"></div></div>
            ) : data && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm border-collapse">
                            <thead>
                                <tr className="bg-[#990000] text-white">
                                    <th className="py-3 px-3 border border-[#800000]">Tanggal</th>
                                    <th className="py-3 px-3 border border-[#800000]">Akun</th>
                                    <th className="py-3 px-3 border border-[#800000]">Ref</th>
                                    <th className="py-3 px-3 border border-[#800000] w-64">Keterangan</th>
                                    <th className="py-3 px-3 border border-[#800000] text-right">Debit</th>
                                    <th className="py-3 px-3 border border-[#800000] text-right">Kredit</th>
                                    <th className="py-3 px-3 border border-[#800000] text-right">Saldo</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.transaksi.length > 0 ? data.transaksi.map((item, idx) => {
                                    runningBalance += (Number(item.debit) - Number(item.kredit));
                                    return (
                                        <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                                            <td className="py-2 px-3 text-gray-600 border-x border-gray-200 whitespace-nowrap">{formatDate(item.tanggal)}</td>
                                            <td className="py-2 px-3 text-gray-800 border-x border-gray-200">
                                                <span className="font-semibold text-xs text-gray-500 block">{item.kode_akun}</span>
                                                {item.nama_akun}
                                            </td>
                                            <td className="py-2 px-3 text-gray-500 border-x border-gray-200 text-xs">{item.referensi || '-'}</td>
                                            <td className="py-2 px-3 text-gray-800 border-x border-gray-200">{item.keterangan || '-'}</td>
                                            <td className="py-2 px-3 text-right text-gray-800 border-x border-gray-200">{Number(item.debit) > 0 ? formatRupiah(item.debit) : '-'}</td>
                                            <td className="py-2 px-3 text-right text-gray-800 border-x border-gray-200">{Number(item.kredit) > 0 ? formatRupiah(item.kredit) : '-'}</td>
                                            <td className="py-2 px-3 text-right font-bold text-gray-800 border-x border-gray-200">{formatRupiah(runningBalance)}</td>
                                        </tr>
                                    );
                                }) : (
                                    <tr><td colSpan="7" className="text-center py-8 text-gray-400 flex flex-col items-center justify-center gap-2"><BookOpen size={32} className="text-gray-300"/> Belum ada transaksi di jurnal.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BukuBesar;
