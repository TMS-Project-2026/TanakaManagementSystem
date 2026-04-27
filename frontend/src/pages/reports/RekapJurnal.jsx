import React, { useState, useEffect } from 'react';
import { getReportJurnal } from '../../api/reportApi';
import ReportFilter from '../../components/ReportFilter';

const formatRupiah = (number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number || 0);
const formatDate = (dateString) => new Date(dateString).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' });

const RekapJurnal = () => {
    const [filters, setFilters] = useState({ startDate: '', endDate: '', cabang: 'Semua Cabang' });
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await getReportJurnal(filters);
            if (res.data.status === 'success') {
                setData(res.data.data);
            }
        } catch (error) {
            console.error("Gagal load Jurnal", error);
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
        { header: 'Kode Akun', key: 'kode_akun' },
        { header: 'Nama Akun', key: 'nama_akun' },
        { header: 'Keterangan', key: 'keterangan' },
        { header: 'Debit', key: 'debit' },
        { header: 'Kredit', key: 'kredit' },
        { header: 'Cabang', key: 'cabang' }
    ];

    const exportData = data ? data.map(d => ({
        ...d,
        tanggal_fmt: formatDate(d.tanggal)
    })) : [];

    let totalDebit = 0;
    let totalKredit = 0;
    if (data) {
        data.forEach(d => {
            totalDebit += Number(d.debit);
            totalKredit += Number(d.kredit);
        });
    }

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2">Rekap Jurnal Umum</h2>
            
            <ReportFilter 
                filters={filters} 
                setFilters={setFilters} 
                onFilter={fetchData} 
                onPrint={() => window.print()}
                dataForExport={exportData}
                exportFileName="Rekap_Jurnal"
                columns={exportColumns}
            />

            {loading ? (
                <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#990000]"></div></div>
            ) : data && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm border-collapse">
                            <thead>
                                <tr className="bg-gray-100 text-gray-700">
                                    <th className="py-3 px-3 border border-gray-200">Tanggal</th>
                                    <th className="py-3 px-3 border border-gray-200">Kode</th>
                                    <th className="py-3 px-3 border border-gray-200">Nama Akun</th>
                                    <th className="py-3 px-3 border border-gray-200">Ref</th>
                                    <th className="py-3 px-3 border border-gray-200 w-48">Keterangan</th>
                                    <th className="py-3 px-3 border border-gray-200 text-right">Debit</th>
                                    <th className="py-3 px-3 border border-gray-200 text-right">Kredit</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.length > 0 ? data.map((item, idx) => (
                                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="py-2 px-3 text-gray-600 border-x border-gray-100 whitespace-nowrap">{formatDate(item.tanggal)}</td>
                                        <td className="py-2 px-3 text-gray-500 border-x border-gray-100 text-xs">{item.kode_akun}</td>
                                        <td className={`py-2 px-3 text-gray-800 border-x border-gray-100 font-medium ${Number(item.kredit) > 0 ? 'pl-8' : ''}`}>
                                            {item.nama_akun}
                                        </td>
                                        <td className="py-2 px-3 text-gray-400 border-x border-gray-100 text-xs">{item.referensi || '-'}</td>
                                        <td className="py-2 px-3 text-gray-600 border-x border-gray-100 text-xs">{item.keterangan || '-'}</td>
                                        <td className="py-2 px-3 text-right text-gray-800 border-x border-gray-100">{Number(item.debit) > 0 ? formatRupiah(item.debit) : '-'}</td>
                                        <td className="py-2 px-3 text-right text-gray-800 border-x border-gray-100">{Number(item.kredit) > 0 ? formatRupiah(item.kredit) : '-'}</td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan="7" className="text-center py-8 text-gray-400">Tidak ada data jurnal pada periode ini.</td></tr>
                                )}
                            </tbody>
                            {data.length > 0 && (
                                <tfoot>
                                    <tr className="bg-red-50 text-[#990000] font-bold">
                                        <td colSpan="5" className="py-3 px-3 text-right border border-red-100">TOTAL</td>
                                        <td className="py-3 px-3 text-right border border-red-100">{formatRupiah(totalDebit)}</td>
                                        <td className="py-3 px-3 text-right border border-red-100">{formatRupiah(totalKredit)}</td>
                                    </tr>
                                    {totalDebit !== totalKredit && (
                                        <tr>
                                            <td colSpan="7" className="py-2 px-3 text-center bg-yellow-100 text-yellow-800 text-xs font-bold">
                                                Warning: Debit dan Kredit tidak seimbang! (Selisih: {formatRupiah(Math.abs(totalDebit - totalKredit))})
                                            </td>
                                        </tr>
                                    )}
                                </tfoot>
                            )}
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RekapJurnal;
