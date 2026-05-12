import React, { useEffect, useState } from 'react';
import { getQuotations, deleteQuotation, submitQuotationToFinance, uploadQuotationFiles } from '../api/quotationApi';
import { PlusCircle, Edit, Trash2, Eye, Search, FileText, UserCircle, Upload, Send } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { useNavigate } from 'react-router-dom';

const Quotation = () => {
    const [quotations, setQuotations] = useState([]);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterCabang, setFilterCabang] = useState('');
    const [loading, setLoading] = useState(true);
    const [uploadModal, setUploadModal] = useState(null);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const navigate = useNavigate();

    useEffect(() => { fetchData(); }, [filterStatus, filterCabang]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await getQuotations({ status: filterStatus, cabang: filterCabang });
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
            'Draft': 'bg-gray-100 text-gray-700',
            'Sent': 'bg-blue-100 text-blue-700',
            'Signed': 'bg-green-100 text-green-700',
            'Submitted': 'bg-orange-100 text-orange-700',
            'Invoice Created': 'bg-purple-100 text-purple-700'
        };
        return <span className={`px-3 py-1 rounded-full text-xs font-bold ${map[status] || map['Draft']}`}>{(status || 'DRAFT').toUpperCase()}</span>;
    };

    return (
        <div className="flex bg-gray-50 min-h-screen font-sans relative">
            <Sidebar />
            <main className="flex-1 flex flex-col pt-16 md:pt-0 h-screen overflow-hidden">
                <header className="h-auto flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 sm:px-10 py-4 gap-4 sm:gap-0 mb-4">
                    <div className="relative w-full sm:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input type="text" placeholder="Cari No. Quotation / Customer..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-12 pr-4 py-2.5 bg-white rounded-full border border-gray-200 shadow-sm text-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" />
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto px-4 sm:px-10 pb-10">
                    <div className="bg-white p-6 min-h-full rounded-2xl shadow-sm border border-gray-100 flex flex-col">
                        <div className="max-w-7xl mx-auto w-full">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                                <div>
                                    <h1 className="text-2xl md:text-3xl font-black text-gray-900">Data <span className="text-blue-700">Quotation</span></h1>
                                    <p className="text-gray-500 font-medium mt-1">Kelola penawaran resmi untuk customer.</p>
                                </div>
                                <button onClick={() => navigate('/quotation/create')} className="bg-blue-700 hover:bg-blue-800 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 font-semibold active:scale-95">
                                    <PlusCircle size={20} /> Buat Quotation
                                </button>
                            </div>

                            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row gap-4">
                                <select value={filterCabang} onChange={(e) => setFilterCabang(e.target.value)} className="px-4 py-2 border border-gray-200 rounded-lg outline-none bg-white">
                                    <option value="">Semua Cabang</option><option value="Banua">Banua</option><option value="Tanaka">Tanaka</option><option value="Acestreet">Acestreet</option>
                                </select>
                                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-4 py-2 border border-gray-200 rounded-lg outline-none bg-white">
                                    <option value="">Semua Status</option><option value="Draft">Draft</option><option value="Sent">Sent</option><option value="Signed">Signed</option><option value="Submitted">Submitted</option><option value="Invoice Created">Invoice Created</option>
                                </select>
                            </div>

                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse whitespace-nowrap">
                                        <thead>
                                            <tr className="bg-gray-900 text-xs text-white uppercase tracking-wider font-semibold">
                                                <th className="p-4">NO QUOTATION</th><th className="p-4">CABANG</th><th className="p-4">CUSTOMER</th><th className="p-4">TANGGAL</th><th className="p-4">GRAND TOTAL</th><th className="p-4 text-center">STATUS</th><th className="p-4 text-center">AKSI</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {loading ? (
                                                <tr><td colSpan="7" className="p-8 text-center text-gray-400">Memuat data...</td></tr>
                                            ) : filteredData.length === 0 ? (
                                                <tr><td colSpan="7" className="p-8 text-center text-gray-400"><FileText size={40} className="mb-2 text-gray-300 mx-auto" />Belum ada quotation</td></tr>
                                            ) : filteredData.map((item) => (
                                                <tr key={item.id} className="border-b border-gray-50 hover:bg-blue-50/30">
                                                    <td className="p-4 font-semibold text-gray-800">{item.no_quotation || '-'}</td>
                                                    <td className="p-4 text-gray-600">{item.cabang}</td>
                                                    <td className="p-4 text-gray-800 font-medium">{item.nama_pt || item.customer_name}</td>
                                                    <td className="p-4 text-gray-600 text-sm">{item.tanggal_quotation ? new Date(item.tanggal_quotation).toLocaleDateString('id-ID') : '-'}</td>
                                                    <td className="p-4 font-bold text-gray-800">{formatRupiah(item.grand_total_quo || item.total)}</td>
                                                    <td className="p-4 text-center">{getStatusBadge(item.status)}</td>
                                                    <td className="p-4">
                                                        <div className="flex items-center justify-center gap-1">
                                                            <button onClick={() => navigate(`/quotation/preview/${item.id}`)} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="Preview"><Eye size={16} /></button>
                                                            <button onClick={() => navigate(`/quotation/edit/${item.id}`)} className="p-2 text-gray-500 hover:text-orange-500 hover:bg-orange-50 rounded-lg" title="Edit"><Edit size={16} /></button>
                                                            <button onClick={() => setUploadModal(item.id)} className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg" title="Upload File"><Upload size={16} /></button>
                                                            {item.status !== 'Submitted' && item.status !== 'Invoice Created' && (
                                                                <button onClick={() => handleSubmit(item.id)} className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg" title="Submit ke Finance"><Send size={16} /></button>
                                                            )}
                                                            <button onClick={() => handleDelete(item.id)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Hapus"><Trash2 size={16} /></button>
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
                    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setUploadModal(null)}>
                        <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
                            <h3 className="text-lg font-bold text-gray-800 mb-4">Upload Dokumen Pendukung</h3>
                            <p className="text-sm text-gray-500 mb-4">Upload file TTD Quotation, bukti DP, atau dokumen lainnya.</p>
                            <input type="file" multiple onChange={(e) => setSelectedFiles(Array.from(e.target.files))} className="w-full p-2 border border-gray-200 rounded-lg mb-4" />
                            {selectedFiles.length > 0 && <p className="text-sm text-green-600 mb-4">{selectedFiles.length} file dipilih</p>}
                            <div className="flex gap-3 justify-end">
                                <button onClick={() => { setUploadModal(null); setSelectedFiles([]); }} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Batal</button>
                                <button onClick={handleUpload} disabled={!selectedFiles.length} className="px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 disabled:opacity-50">Upload</button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Quotation;
