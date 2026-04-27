import React, { useState, useEffect } from 'react';
import { getReportPerubahanModal } from '../../api/reportApi';
import ReportFilter from '../../components/ReportFilter';

const formatRupiah = (number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number || 0);

const PerubahanModal = () => {
    const [filters, setFilters] = useState({ startDate: '', endDate: '', cabang: 'Semua Cabang' });
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await getReportPerubahanModal(filters);
            if (res.data.status === 'success') {
                setData(res.data.data);
            }
        } catch (error) {
            console.error("Gagal load Perubahan Modal", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const exportColumns = [
        { header: 'Keterangan', key: 'keterangan' },
        { header: 'Nominal', key: 'nominal' }
    ];

    const exportData = data ? [
        { keterangan: 'Modal Awal', nominal: data.modalAwal },
        { keterangan: 'Tambahan Modal', nominal: data.tambahanModal },
        { keterangan: 'Laba Ditahan', nominal: data.labaDitahan },
        { keterangan: 'Modal Akhir', nominal: data.modalAkhir }
    ] : [];

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2">Laporan Perubahan Modal</h2>
            
            <ReportFilter 
                filters={filters} 
                setFilters={setFilters} 
                onFilter={fetchData} 
                onPrint={() => window.print()}
                dataForExport={exportData}
                exportFileName="Perubahan_Modal"
                columns={exportColumns}
            />

            {loading ? (
                <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#990000]"></div></div>
            ) : data && (
                <div className="max-w-3xl">
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                        <table className="w-full text-left text-sm">
                            <tbody>
                                <tr>
                                    <td className="py-4 font-semibold text-gray-800">Modal Awal</td>
                                    <td className="py-4 text-right font-medium text-gray-800">{formatRupiah(data.modalAwal)}</td>
                                </tr>
                                <tr className="border-b border-gray-100">
                                    <td className="py-4 text-gray-600 pl-4">+ Tambahan Modal / Investasi</td>
                                    <td className="py-4 text-right text-gray-600">{formatRupiah(data.tambahanModal)}</td>
                                </tr>
                                <tr className="border-b border-gray-100">
                                    <td className="py-4 text-gray-600 pl-4">+ Laba (Rugi) Bersih Ditahan</td>
                                    <td className="py-4 text-right text-gray-600">{formatRupiah(data.labaDitahan)}</td>
                                </tr>
                                <tr className="bg-gray-50 border-t-2 border-gray-200">
                                    <td className="py-4 px-4 font-bold text-gray-800 text-lg">Modal Akhir</td>
                                    <td className="py-4 px-4 text-right font-bold text-[#990000] text-xl">{formatRupiah(data.modalAkhir)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PerubahanModal;
