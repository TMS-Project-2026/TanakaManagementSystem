import React, { useState, useEffect } from 'react';
import { getReportArusKas } from '../../api/reportApi';
import ReportFilter from '../../components/ReportFilter';
import { ArrowDownCircle, ArrowUpCircle, Wallet, ArrowRightLeft } from 'lucide-react';

const formatRupiah = (number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number || 0);

const ArusKas = () => {
    const [filters, setFilters] = useState({ startDate: '', endDate: '', cabang: 'Semua Cabang' });
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await getReportArusKas(filters);
            if (res.data.status === 'success') {
                setData(res.data.data);
            }
        } catch (error) {
            console.error("Gagal load Arus Kas", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const exportColumns = [
        { header: 'Kategori Aktivitas', key: 'kategori' },
        { header: 'Nominal', key: 'nominal' }
    ];

    const exportData = data ? [
        { kategori: 'Kas Masuk Operasional', nominal: data.operasionalMasuk },
        { kategori: 'Kas Keluar Operasional', nominal: data.operasionalKeluar },
        { kategori: 'Arus Kas Investasi', nominal: data.investasi },
        { kategori: 'Arus Kas Pendanaan', nominal: data.pendanaan },
        { kategori: 'Kenaikan/Penurunan Kas Bersih', nominal: data.netCashflow },
    ] : [];

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2">Laporan Arus Kas (Cashflow)</h2>
            
            <ReportFilter 
                filters={filters} 
                setFilters={setFilters} 
                onFilter={fetchData} 
                onPrint={() => window.print()}
                dataForExport={exportData}
                exportFileName="Arus_Kas"
                columns={exportColumns}
            />

            {loading ? (
                <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#990000]"></div></div>
            ) : data && (
                <div className="space-y-6">
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                        <div className="space-y-8">
                            
                            {/* Aktivitas Operasional */}
                            <div>
                                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
                                    <ArrowRightLeft className="text-[#990000]" size={20} />
                                    Arus Kas dari Aktivitas Operasional
                                </h3>
                                <div className="pl-6 space-y-3">
                                    <div className="flex justify-between items-center text-sm">
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <ArrowDownCircle size={16} className="text-green-500" /> Penerimaan Kas (Pelanggan)
                                        </div>
                                        <span className="font-semibold text-green-600">{formatRupiah(data.operasionalMasuk)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <ArrowUpCircle size={16} className="text-red-500" /> Pembayaran Kas (Supplier, Operasional)
                                        </div>
                                        <span className="font-semibold text-red-600">({formatRupiah(data.operasionalKeluar)})</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm font-bold border-t pt-2 mt-2">
                                        <span>Kas Bersih dari Aktivitas Operasional</span>
                                        <span>{formatRupiah(data.operasionalMasuk - data.operasionalKeluar)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Aktivitas Investasi */}
                            <div>
                                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
                                    <ArrowRightLeft className="text-[#990000]" size={20} />
                                    Arus Kas dari Aktivitas Investasi
                                </h3>
                                <div className="pl-6 space-y-3">
                                    <div className="flex justify-between items-center text-sm text-gray-600">
                                        <span>Pembelian/Penjualan Aset Tetap</span>
                                        <span className="font-semibold">{formatRupiah(data.investasi)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm font-bold border-t pt-2 mt-2">
                                        <span>Kas Bersih dari Aktivitas Investasi</span>
                                        <span>{formatRupiah(data.investasi)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Aktivitas Pendanaan */}
                            <div>
                                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
                                    <ArrowRightLeft className="text-[#990000]" size={20} />
                                    Arus Kas dari Aktivitas Pendanaan
                                </h3>
                                <div className="pl-6 space-y-3">
                                    <div className="flex justify-between items-center text-sm text-gray-600">
                                        <span>Penerimaan/Pembayaran Hutang & Modal</span>
                                        <span className="font-semibold">{formatRupiah(data.pendanaan)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm font-bold border-t pt-2 mt-2">
                                        <span>Kas Bersih dari Aktivitas Pendanaan</span>
                                        <span>{formatRupiah(data.pendanaan)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Net Cashflow */}
                            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 mt-6 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${data.netCashflow >= 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                        <Wallet size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-800">Kenaikan (Penurunan) Kas Bersih</h3>
                                        <p className="text-sm text-gray-500">Periode terpilih</p>
                                    </div>
                                </div>
                                <span className={`text-2xl font-bold ${data.netCashflow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {formatRupiah(data.netCashflow)}
                                </span>
                            </div>

                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ArusKas;
