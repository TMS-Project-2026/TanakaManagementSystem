import React, { useEffect, useState } from 'react';
import { getQuotations, deleteQuotation, submitQuotationToFinance, uploadQuotationFiles } from '../api/quotationApi';
import { PlusCircle, Edit, Trash2, Eye, Search, FileText, Upload, Send } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { useNavigate } from 'react-router-dom';

const AccestretQuotation = () => {
    const [quotations, setQuotations] = useState([]);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [loading, setLoading] = useState(true);
    const [uploadModal, setUploadModal] = useState(null);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const navigate = useNavigate();

    useEffect(() => { fetchData(); }, [filterStatus]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Hardcode filter for Acestreet branch
            const res = await getQuotations({ status: filterStatus, cabang: 'Acestreet' });
            if (res.data.status === 'success') setQuotations(res.data.data);
        } catch (err) { console.error("Gagal memuat quotation", err); }
        finally { setLoading(false); }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Hapus quotation ini?")) {
            try { await deleteQuotation(id); fetchData(); } catch (err) { alert("Gagal menghapus"); }
        }
    };

    const handleSubmit = async (id) => {
        if (window.confirm("Ajukan quotation ini ke Finance?")) {
            try { await submitQuotationToFinance(id); alert("Berhasil diajukan ke Finance!"); fetchData(); } catch (err) { alert("Gagal mengajukan"); }
        }
    };

    const handleUpload = async () => {
        if (!selectedFiles.length || !uploadModal) return;
        try {
            await uploadQuotationFiles(uploadModal, selectedFiles);
            alert("File berhasil diupload!"); setUploadModal(null); setSelectedFiles([]); fetchData();
        } catch (err) { alert("Gagal upload file"); }
    };

    const formatRupiah = (n) => 'Rp ' + Number(n || 0).toLocaleString('id-ID');

    const filteredData = quotations.filter(q => {
        const s = search.toLowerCase();
        return (q.no_quotation?.toLowerCase().includes(s) || q.nama_pt?.toLowerCase().includes(s) || q.customer_name?.toLowerCase().includes(s));
    });

    const getStatusBadge = (status) => {
        const map = {
            'Draft': 'bg-gray-100 text-gray-700 border border-gray-200',
            'Sent': 'bg-blue-100 text-blue-700 border border-blue-200',
            'Signed': 'bg-green-100 text-green-700 border border-green-200',
            'Submitted': 'bg-orange-100 text-orange-700 border border-orange-200',
            'Invoice Created': 'bg-purple-100 text-purple-700 border border-purple-200'
        };
        return <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase ${map[status] || map['Draft']}`}>{(status || 'DRAFT')}</span>;
    };

    return (
        <div className="flex bg-gray-50 min-h-screen font-sans relative">
            <Sidebar />
            <main className="flex-1 flex flex-col pt-16 md:pt-0 h-screen overflow-hidden">
                <header className="h-auto flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 sm:px-10 py-4 gap-4 sm:gap-0 mb-4">
                    <div className="relative w-full sm:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input type="text" placeholder="Cari Quotation / Klien..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-12 pr-4 py-2.5 bg-white rounded-xl border border-gray-200 shadow-sm text-sm focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100" />
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto px-4 sm:px-10 pb-10">
                    <div className="bg-white p-6 min-h-full rounded-2xl shadow-sm border border-gray-100 flex flex-col">
                        <div className="max-w-7xl mx-auto w-full">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                                <div>
                                    <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
                                        Data <span className="text-purple-700">Quotation</span>
                                    </h1>
                                    <p className="text-gray-500 font-medium mt-1">Kelola penawaran harga pembuatan kaos & apparel untuk klien.</p>
                                </div>
                                <button onClick={() => navigate('/accestret/marketing/quotation/create')} className="bg-purple-700 hover:bg-purple-800 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 font-semibold active:scale-95 transition-all">
                                    <PlusCircle size={20} /> Buat Quotation
                                </button>
                            </div>

                            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row gap-4">
                                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-4 py-2.5 border border-gray-200 rounded-xl outline-none bg-white font-medium text-gray-700 focus:ring-2 focus:ring-purple-100 focus:border-purple-400">
                                    <option value="">Semua Status</option>
                                    <option value="Draft">Draft</option>
                                    <option value="Sent">Dikirim (Sent)</option>
                                    <option value="Signed">Disetujui (Signed)</option>
                                    <option value="Submitted">Diajukan ke Finance</option>
                                    <option value="Invoice Created">Invoice Terbit</option>
                                </select>
                            </div>

                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse whitespace-nowrap">
                                        <thead>
                                            <tr className="bg-purple-50 text-[11px] text-purple-900 uppercase tracking-widest font-black border-b border-purple-100">
                                                <th className="px-6 py-4">No Quotation</th>
                                                <th className="px-6 py-4">Klien / Customer</th>
                                                <th className="px-6 py-4">Tanggal</th>
                                                <th className="px-6 py-4">Grand Total</th>
                                                <th className="px-6 py-4 text-center">Status</th>
                                                <th className="px-6 py-4 text-center">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {loading ? (
                                                <tr><td colSpan="6" className="p-10 text-center">
                                                    <div className="animate-spin w-8 h-8 border-4 rounded-full border-t-transparent border-purple-500 mx-auto mb-2"></div>
                                                    <span className="text-gray-500 font-medium text-sm">Memuat data quotation...</span>
                                                </td></tr>
                                            ) : filteredData.length === 0 ? (
                                                <tr><td colSpan="6" className="p-10 text-center">
                                                    <FileText size={48} className="mb-3 text-gray-200 mx-auto" />
                                                    <p className="text-gray-500 font-bold">Belum ada quotation</p>
                                                    <p className="text-gray-400 text-sm mt-1">Buat quotation baru untuk menawarkan harga ke klien.</p>
                                                </td></tr>
                                            ) : filteredData.map((item) => (
                                                <tr key={item.id} className="hover:bg-purple-50/30 transition-colors group">
                                                    <td className="px-6 py-4 font-bold text-gray-900">{item.no_quotation || '-'}</td>
                                                    <td className="px-6 py-4">
                                                        <p className="font-bold text-gray-800">{item.nama_pt || item.customer_name}</p>
                                                        {item.cp_penagihan && <p className="text-xs text-gray-500 mt-0.5">{item.cp_penagihan}</p>}
                                                    </td>
                                                    <td className="px-6 py-4 text-gray-600 font-medium">{item.tanggal_quotation ? new Date(item.tanggal_quotation).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}</td>
                                                    <td className="px-6 py-4 font-black text-gray-900">{formatRupiah(item.grand_total_quo || item.total)}</td>
                                                    <td className="px-6 py-4 text-center">{getStatusBadge(item.status)}</td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center justify-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                                                            <button onClick={() => navigate(`/quotation/preview/${item.id}`)} className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg border border-transparent hover:border-indigo-100 transition-colors" title="Preview Dokumen"><Eye size={18} /></button>
                                                            <button onClick={() => navigate(`/accestret/marketing/quotation/edit/${item.id}`)} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg border border-transparent hover:border-blue-100 transition-colors" title="Edit Quotation"><Edit size={18} /></button>
                                                            <button onClick={() => setUploadModal(item.id)} className="p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg border border-transparent hover:border-emerald-100 transition-colors" title="Upload Bukti ACC/DP"><Upload size={18} /></button>
                                                            {item.status !== 'Submitted' && item.status !== 'Invoice Created' && (
                                                                <button onClick={() => handleSubmit(item.id)} className="p-2 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg border border-transparent hover:border-orange-100 transition-colors" title="Ajukan Jadi SPK/Invoice ke Finance"><Send size={18} /></button>
                                                            )}
                                                            <button onClick={() => handleDelete(item.id)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg border border-transparent hover:border-red-100 transition-colors" title="Hapus"><Trash2 size={18} /></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Upload Modal */}
                {uploadModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setUploadModal(null)}>
                        <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl transform transition-all" onClick={e => e.stopPropagation()}>
                            <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6">
                                <Upload className="text-emerald-600" size={28} />
                            </div>
                            <h3 className="text-xl font-black text-gray-900 mb-2">Upload Dokumen ACC</h3>
                            <p className="text-sm text-gray-500 mb-6 font-medium leading-relaxed">Upload file bukti transfer DP, desain ACC, atau dokumen persetujuan dari klien.</p>
                            
                            <div className="border-2 border-dashed border-gray-300 rounded-2xl p-6 text-center hover:bg-gray-50 transition-colors cursor-pointer relative">
                                <input type="file" multiple onChange={(e) => setSelectedFiles(Array.from(e.target.files))} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                <Upload size={24} className="mx-auto text-gray-400 mb-2" />
                                <p className="text-sm font-bold text-gray-700">Pilih File atau Tarik ke sini</p>
                                <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG (Max 10MB)</p>
                            </div>

                            {selectedFiles.length > 0 && (
                                <div className="mt-4 bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                                    <p className="text-sm font-bold text-emerald-800">{selectedFiles.length} file siap diupload</p>
                                    <ul className="text-xs text-emerald-600 mt-1 space-y-1">
                                        {selectedFiles.map((f, i) => <li key={i} className="truncate">• {f.name}</li>)}
                                    </ul>
                                </div>
                            )}

                            <div className="flex gap-3 justify-end mt-8">
                                <button onClick={() => { setUploadModal(null); setSelectedFiles([]); }} className="px-5 py-2.5 rounded-xl text-gray-600 font-bold hover:bg-gray-100 transition-colors">Batal</button>
                                <button onClick={handleUpload} disabled={!selectedFiles.length} className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-bold shadow-md hover:bg-emerald-700 hover:shadow-lg disabled:opacity-50 disabled:shadow-none transition-all">Upload Sekarang</button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default AccestretQuotation;
