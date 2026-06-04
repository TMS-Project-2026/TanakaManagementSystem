import React, { useState, useEffect } from 'react';
import { journalApi } from '../../api/journalApi';
import ReportFilter from '../../components/ReportFilter';

const formatRupiah = (number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number || 0);
const formatDate = (dateString) => new Date(dateString).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });

const SemuaTransaksi = () => {
    const [filters, setFilters] = useState({ startDate: '', endDate: '', cabang: 'Semua Cabang' });
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await journalApi.getAllJournals();
            let journals = [];
            if (Array.isArray(res)) {
                journals = res;
            } else if (res && Array.isArray(res.data)) {
                journals = res.data;
            }

            // Filter hanya Jurnal Penjualan
            journals = journals.filter(j => 
                j.category === 'Jurnal Penjualan' || 
                j.category === 'Revenue' ||
                j.journal_type === 'Sales' ||
                (j.credit_account && j.credit_account.startsWith('4-'))
            );

                if (filters.cabang !== 'Semua Cabang') {
                    journals = journals.filter(j => j.branch === filters.cabang || j.cabang === filters.cabang);
                }
                if (filters.startDate && filters.endDate) {
                    const start = new Date(filters.startDate);
                    start.setHours(0,0,0,0);
                    const end = new Date(filters.endDate);
                    end.setHours(23,59,59,999);
                    journals = journals.filter(j => {
                        const d = new Date(j.transaction_date || j.tanggal);
                        return d >= start && d <= end;
                    });
                }
                setData(journals);
        } catch (error) {
            console.error("Gagal load Jurnal Penjualan", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const exportColumns = [
        { header: 'Tanggal', key: 'tanggal_fmt' },
        { header: 'No Ref', key: 'invoice_ref' },
        { header: 'Keterangan', key: 'description' },
        { header: 'Akun Debit', key: 'debit_account' },
        { header: 'Akun Kredit', key: 'credit_account' },
        { header: 'Nominal', key: 'amount_fmt' },
        { header: 'Cabang', key: 'cabang' }
    ];

    const exportData = data.map(d => ({
        ...d,
        tanggal_fmt: formatDate(d.transaction_date || d.tanggal),
        amount_fmt: formatRupiah(d.amount),
        invoice_ref: d.transaction_id || d.id,
        cabang: d.branch || d.cabang
    }));

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2">Semua Transaksi Penjualan (Jurnal)</h2>
            
            <ReportFilter 
                filters={filters} 
                setFilters={setFilters} 
                onFilter={fetchData} 
                onPrint={() => window.print()}
                dataForExport={exportData}
                exportFileName="Data_Transaksi_Penjualan"
                columns={exportColumns}
            />

            {loading ? (
                <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#990000]"></div></div>
            ) : (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="bg-gray-50 text-gray-600 border-b">
                                    <th className="py-3 px-3">Tanggal</th>
                                    <th className="py-3 px-3">No Ref</th>
                                    <th className="py-3 px-3">Deskripsi / Keterangan</th>
                                    <th className="py-3 px-3">Akun Debit</th>
                                    <th className="py-3 px-3">Akun Kredit</th>
                                    <th className="py-3 px-3 text-right">Nominal</th>
                                    <th className="py-3 px-3">Cabang</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.length > 0 ? data.map((item, idx) => (
                                    <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50">
                                        <td className="py-3 px-3 text-gray-600 whitespace-nowrap">{formatDate(item.transaction_date || item.tanggal)}</td>
                                        <td className="py-3 px-3 font-mono text-xs text-[#990000]">{item.transaction_id || item.id}</td>
                                        <td className="py-3 px-3 text-gray-800 font-semibold">{item.description}</td>
                                        <td className="py-3 px-3 text-gray-600 text-xs">{item.debit_account}</td>
                                        <td className="py-3 px-3 text-gray-600 text-xs">{item.credit_account}</td>
                                        <td className="py-3 px-3 text-right text-green-700 font-bold">{formatRupiah(item.amount)}</td>
                                        <td className="py-3 px-3 text-gray-500">{item.branch || item.cabang}</td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan="7" className="text-center py-6 text-gray-400">Belum ada transaksi penjualan di Jurnal.</td></tr>
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
