import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { createQuotation, getQuotationById, updateQuotation, getNextQuotationNumber } from '../api/quotationApi';
import { Save, X, ArrowLeft, FileText } from 'lucide-react';
import api from '../api/axios';
import { formatPhoneNumber } from '../utils/formatters';

const QuotationForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const isEdit = Boolean(id);
    const orderData = location.state?.orderData || null;

    const [customers, setCustomers] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [activeItemIndex, setActiveItemIndex] = useState(null);

    const [form, setForm] = useState({
        no_quotation: '', cabang: 'Banua',
        tanggal_quotation: new Date().toISOString().split('T')[0],
        tanggal_berlaku: '', order_id: null,
        nama_pt: '', alamat_pt: '', up_penagihan: '', cp_penagihan: '', email_customer: '',
        deskripsi_pesanan: '',
        items_detail: [{ rincian: '', ukuran: '', qty: 1, harga_satuan: 0, satuan: 'Pcs' }],
        subtotal: 0, ppn_persen: 0, jumlah_ppn: 0, diskon_persen: 0, diskon: 0, grand_total_quo: 0,
        jenis_pembayaran: '', term_of_payment: '', payment_note: '',
        nama_marketing: '', nama_client_ttd: '', status: 'Draft'
    });

    useEffect(() => {
        if (isEdit) {
            fetchQuotation();
        } else if (orderData) {
            prefillFromOrder(orderData);
            fetchNextNo(orderData.cabang || 'Banua');
        } else {
            fetchNextNo(form.cabang);
        }
    }, [id]);

    useEffect(() => {
        if (!isEdit && !orderData) fetchNextNo(form.cabang);
    }, [form.cabang]);

    const prefillFromOrder = (order) => {
        const items = order.items ? (typeof order.items === 'string' ? JSON.parse(order.items) : order.items) : [];
        const mappedItems = items.length > 0 ? items.map(i => ({
            rincian: i.nama_produk || i.rincian || '', ukuran: i.ukuran || '',
            qty: i.qty || 1, harga_satuan: i.harga_satuan || i.harga || 0, satuan: i.satuan || 'Pcs'
        })) : [{ rincian: order.nama_produk || '', ukuran: order.ukuran || '', qty: order.qty || 1, harga_satuan: order.harga || 0, satuan: 'Pcs' }];
        setForm(prev => ({
            ...prev, cabang: order.cabang || 'Banua', order_id: order.id,
            nama_pt: order.nama_customer || order.nama_pt || '',
            alamat_pt: order.alamat || order.alamat_pt || '',
            cp_penagihan: order.no_hp || order.cp_penagihan || '',
            email_customer: order.email || '',
            items_detail: mappedItems
        }));
    };

    const fetchNextNo = async (cabang) => {
        try {
            const res = await getNextQuotationNumber(cabang);
            if (res.data.status === 'success') setForm(prev => ({ ...prev, no_quotation: res.data.no_quotation }));
        } catch (err) { console.error('Gagal fetch nomor quotation', err); }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [custRes, prodRes] = await Promise.all([api.get('/marketing-offline/customers'), api.get('/produk')]);
                setCustomers(custRes.data || []);
                setProducts(prodRes.data?.data || []);
            } catch (err) { console.error('Gagal fetch data', err); }
        };
        fetchData();
    }, []);

    useEffect(() => {
        let subtotal = form.items_detail.reduce((acc, item) => acc + (Number(item.qty) * Number(item.harga_satuan)), 0);
        const jumlah_ppn = subtotal * (Number(form.ppn_persen) / 100);
        const diskon = subtotal * (Number(form.diskon_persen || 0) / 100);
        const grand_total_quo = subtotal + jumlah_ppn - diskon;
        setForm(prev => ({ ...prev, subtotal, jumlah_ppn, diskon, grand_total_quo }));
    }, [form.items_detail, form.ppn_persen, form.diskon_persen]);

    useEffect(() => {
        let note = '';
        if (form.cabang === 'Banua') note = `PAYMENT METHOD :\nBank: BRI\nCabang: Yogyakarta\nNo. Rekening: 2099 0100 0545 304\nAtas Nama: PT BANUA MITRA LESTARI`;
        else if (form.cabang === 'Tanaka') note = `PAYMENT METHOD :\nBank: BRI\nCabang: Yogyakarta\nNo. Rekening: 2099 0100 0495 305\nAtas Nama: PT TANAKA RIZQI BAROKAH`;
        else if (form.cabang === 'Acestreet') note = `PAYMENT METHOD :\nBank: BRI\nCabang: Yogyakarta\nNo. Rekening: 2099 0100 0545 304\nAtas Nama: ACESTREET`;
        setForm(prev => ({ ...prev, payment_note: note }));
    }, [form.cabang]);

    const handleItemChange = (index, e) => {
        const { name, value } = e.target;
        const newItems = [...form.items_detail];
        newItems[index][name] = value;
        if (name === 'rincian') { setActiveItemIndex(index); const matches = Array.isArray(products) ? products.filter(p => p.nama_produk.toLowerCase().includes(value.toLowerCase())) : []; setFilteredProducts(matches); }
        setForm({ ...form, items_detail: newItems });
    };
    const selectProduct = (index, prod) => { const newItems = [...form.items_detail]; newItems[index].rincian = prod.nama_produk; setForm({ ...form, items_detail: newItems }); setFilteredProducts([]); setActiveItemIndex(null); };
    const addItem = () => setForm({ ...form, items_detail: [...form.items_detail, { rincian: '', ukuran: '', qty: 1, harga_satuan: 0, satuan: 'Pcs' }] });
    const removeItem = (index) => { if (form.items_detail.length > 1) setForm({ ...form, items_detail: form.items_detail.filter((_, i) => i !== index) }); };

    const fetchQuotation = async () => {
        try {
            const res = await getQuotationById(id);
            if (res.data.status === 'success') {
                const d = res.data.data;
                setForm({ ...d, tanggal_quotation: d.tanggal_quotation?.split('T')[0] || '', tanggal_berlaku: d.tanggal_berlaku?.split('T')[0] || '', items_detail: typeof d.items_detail === 'string' ? JSON.parse(d.items_detail) : (d.items_detail || [{ rincian: '', ukuran: '', qty: 1, harga_satuan: 0, satuan: 'Pcs' }]) });
            }
        } catch (err) { console.error('Gagal memuat quotation', err); }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm({ ...form, [name]: name === 'cp_penagihan' ? formatPhoneNumber(value) : value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEdit) { await updateQuotation(id, form); alert("Quotation berhasil diperbarui!"); }
            else { await createQuotation(form); alert("Quotation berhasil dibuat!"); }
            navigate('/quotation');
        } catch (err) { console.error("Gagal menyimpan quotation", err); alert("Gagal menyimpan quotation"); }
    };

    const inputClass = "w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm";
    const labelClass = "block text-sm font-semibold text-gray-700 mb-1";

    return (
        <div className="flex bg-[#f8f9fa] min-h-screen font-sans">
            <Sidebar />
            <main className="flex-1 p-8 overflow-y-auto h-screen">
                <div className="max-w-5xl mx-auto">
                    <div className="flex items-center gap-4 mb-6">
                        <button onClick={() => navigate(-1)} className="p-2 bg-white rounded-full shadow-sm hover:bg-gray-50 border border-gray-100"><ArrowLeft className="text-gray-600" size={24} /></button>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3"><FileText className="text-blue-700" />{isEdit ? 'Edit Quotation' : 'Buat Quotation Baru'}</h1>
                            <p className="text-gray-500 mt-1">Lengkapi form untuk membuat penawaran resmi kepada customer.</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* 1. Header */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <h3 className="text-lg font-bold border-b border-gray-100 pb-3 mb-4 text-blue-700">HEADER QUOTATION</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div><label className={labelClass}>No Quotation</label><input type="text" name="no_quotation" value={form.no_quotation} disabled className={`${inputClass} bg-gray-50`} /></div>
                                <div><label className={labelClass}>Cabang Asal *</label>
                                    <select name="cabang" value={form.cabang} onChange={handleChange} required className={`${inputClass} bg-white`}>
                                        <option value="Banua">PT Banua Mitra Lestari</option>
                                        <option value="Tanaka">PT Tanaka Rizqi Barokah</option>
                                        <option value="Acestreet">Accestreet</option>
                                    </select>
                                </div>
                                <div><label className={labelClass}>Tanggal Quotation *</label><input type="date" name="tanggal_quotation" value={form.tanggal_quotation} onChange={handleChange} required className={inputClass} /></div>
                                <div><label className={labelClass}>Berlaku Sampai *</label><input type="date" name="tanggal_berlaku" value={form.tanggal_berlaku} onChange={handleChange} required className={inputClass} /></div>
                                <div><label className={labelClass}>Jenis Pembayaran</label>
                                    <select name="jenis_pembayaran" value={form.jenis_pembayaran} onChange={handleChange} className={`${inputClass} bg-white`}>
                                        <option value="">- Pilih -</option>
                                        <option value="Cash">Cash</option><option value="Transfer">Transfer</option><option value="COD">COD</option><option value="Tempo">Tempo</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* 2. Customer */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <h3 className="text-lg font-bold border-b border-gray-100 pb-3 mb-4 text-blue-700">DATA CUSTOMER</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="relative md:col-span-2"><label className={labelClass}>Nama PT / Perusahaan *</label>
                                    <input type="text" name="nama_pt" value={form.nama_pt} onChange={(e) => { handleChange(e); setShowSuggestions(true); }} onFocus={() => setShowSuggestions(true)} onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} required placeholder="Contoh: PT. ABC" className={inputClass} />
                                    {showSuggestions && form.nama_pt && (
                                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                            {customers.filter(c => c.nama_customer?.toLowerCase().includes(form.nama_pt.toLowerCase())).map(c => (
                                                <div key={c.id} className="p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-50" onClick={() => { setForm(prev => ({ ...prev, nama_pt: c.nama_customer, alamat_pt: c.alamat || '', cp_penagihan: c.no_hp || '', email_customer: c.email || '', up_penagihan: c.up_penagihan || '' })); setShowSuggestions(false); }}>
                                                    <p className="font-bold text-sm">{c.nama_customer}</p><p className="text-xs text-gray-500">{c.alamat}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="md:col-span-2"><label className={labelClass}>Alamat Lengkap *</label><textarea name="alamat_pt" value={form.alamat_pt} onChange={handleChange} required rows={2} className={`${inputClass} resize-none`}></textarea></div>
                                <div><label className={labelClass}>UP (Nama) Penagihan</label><input type="text" name="up_penagihan" value={form.up_penagihan} onChange={handleChange} className={inputClass} /></div>
                                <div><label className={labelClass}>Contact Person</label><input type="text" name="cp_penagihan" value={form.cp_penagihan} onChange={handleChange} className={inputClass} /></div>
                                <div><label className={labelClass}>Email</label><input type="email" name="email_customer" value={form.email_customer} onChange={handleChange} className={inputClass} /></div>
                            </div>
                        </div>

                        {/* 3. Detail Pesanan */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <h3 className="text-lg font-bold border-b border-gray-100 pb-3 mb-4 text-blue-700">DETAIL PESANAN</h3>
                            <div className="mb-4"><label className={labelClass}>Deskripsi Pesanan</label><textarea name="deskripsi_pesanan" value={form.deskripsi_pesanan} onChange={handleChange} rows={2} placeholder="Deskripsi umum pesanan..." className={`${inputClass} resize-none`}></textarea></div>
                            <div className="space-y-4 mb-6">
                                {form.items_detail.map((item, index) => (
                                    <div key={index} className="grid grid-cols-12 gap-3 bg-gray-50 p-4 rounded-lg border border-gray-200 relative pt-8 md:pt-4">
                                        <div className="col-span-12 md:col-span-4 relative">
                                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Nama Produk</label>
                                            <input type="text" name="rincian" value={item.rincian} onChange={(e) => handleItemChange(index, e)} onFocus={() => { setActiveItemIndex(index); const m = Array.isArray(products) ? products.filter(p => p.nama_produk.toLowerCase().includes(item.rincian.toLowerCase())) : []; setFilteredProducts(m); }} onBlur={() => setTimeout(() => setActiveItemIndex(null), 200)} placeholder="Nama Produk" className="w-full p-2 border border-gray-300 rounded-lg text-sm" autoComplete="off" />
                                            {activeItemIndex === index && filteredProducts.length > 0 && (
                                                <ul className="absolute z-20 w-full bg-white border border-gray-200 mt-1 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                                    {filteredProducts.map(prod => (<li key={prod.id} onClick={() => selectProduct(index, prod)} className="p-2 hover:bg-gray-50 cursor-pointer text-sm">{prod.nama_produk}</li>))}
                                                </ul>
                                            )}
                                        </div>
                                        <div className="col-span-6 md:col-span-2"><label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Ukuran</label>
                                            <select name="ukuran" value={item.ukuran || ''} onChange={(e) => handleItemChange(index, e)} className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-white">
                                                <option value="">- Ukuran -</option>{['XS','S','M','L','XL','XXL','XXXL','XXXXL','XXXXXL'].map(sz => <option key={sz} value={sz}>{sz}</option>)}
                                            </select>
                                        </div>
                                        <div className="col-span-3 md:col-span-1"><label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 text-center">Qty</label><input type="number" name="qty" value={item.qty} onChange={(e) => handleItemChange(index, e)} min="1" className="w-full p-2 border border-gray-300 rounded-lg text-center text-sm" /></div>
                                        <div className="col-span-3 md:col-span-1"><label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 text-center">Unit</label><input type="text" name="satuan" value={item.satuan} onChange={(e) => handleItemChange(index, e)} className="w-full p-2 border border-gray-300 rounded-lg text-center text-sm" /></div>
                                        <div className="col-span-12 md:col-span-3"><label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 text-right">Harga Satuan</label><input type="number" name="harga_satuan" value={item.harga_satuan} onChange={(e) => handleItemChange(index, e)} min="0" className="w-full p-2 border border-gray-300 rounded-lg text-right text-sm font-semibold" /></div>
                                        <div className="absolute top-2 right-2 md:static md:col-span-1 flex items-end justify-center"><button type="button" onClick={() => removeItem(index)} className="text-red-400 hover:text-red-600 p-2"><X size={18} /></button></div>
                                    </div>
                                ))}
                                <button type="button" onClick={addItem} className="text-sm font-semibold text-blue-700 bg-blue-50 px-4 py-2 rounded-lg border border-blue-100 hover:bg-blue-100">+ Tambah Item</button>
                            </div>
                            <div className="flex justify-end">
                                <div className="w-full md:w-1/2 lg:w-1/3 space-y-4 bg-gray-50 p-5 rounded-xl border border-gray-200">
                                    <div className="flex items-center justify-between gap-4"><label className="text-sm font-semibold text-gray-700 w-1/3">Subtotal</label><span className="w-2/3 text-right font-bold text-gray-800">Rp {form.subtotal.toLocaleString('id-ID')}</span></div>
                                    <div className="flex items-center justify-between gap-4"><label className="text-sm font-semibold text-gray-700 w-1/3">PPN (%)</label><input type="number" name="ppn_persen" value={form.ppn_persen} onChange={handleChange} min="0" max="100" className="w-1/3 p-2 border border-gray-300 rounded-lg text-right" /><span className="w-1/3 text-right text-sm text-gray-600">Rp {form.jumlah_ppn.toLocaleString('id-ID')}</span></div>
                                    <div className="flex items-center justify-between gap-4"><label className="text-sm font-semibold text-gray-700 w-1/3">Diskon (%)</label><input type="number" name="diskon_persen" value={form.diskon_persen} onChange={handleChange} min="0" max="100" className="w-1/3 p-2 border border-gray-300 rounded-lg text-right" /><span className="w-1/3 text-right text-sm text-red-600 font-bold">- Rp {form.diskon.toLocaleString('id-ID')}</span></div>
                                    <div className="flex items-center justify-between gap-4 pt-4 border-t-2 border-gray-300"><label className="text-base font-extrabold text-blue-700 w-1/3">GRAND TOTAL</label><span className="w-2/3 text-right text-xl font-black text-blue-700">Rp {form.grand_total_quo.toLocaleString('id-ID')}</span></div>
                                </div>
                            </div>
                        </div>

                        {/* 4. Pembayaran & TTD */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <h3 className="text-lg font-bold border-b border-gray-100 pb-3 mb-4 text-blue-700">KETENTUAN & TANDA TANGAN</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className={labelClass}>Term of Payment</label>
                                    <textarea name="term_of_payment" value={form.term_of_payment} onChange={handleChange} rows={3} placeholder="Contoh: DP 50% sebelum produksi, pelunasan H-1 pengiriman" className={`${inputClass} resize-none`}></textarea>
                                </div>
                                <div>
                                    <label className={labelClass}>Payment Note (Info Rekening)</label>
                                    <textarea name="payment_note" value={form.payment_note} onChange={handleChange} rows={3} className={`${inputClass} resize-none bg-gray-50`}></textarea>
                                </div>
                                <div><label className={labelClass}>Nama Marketing (TTD Kiri)</label><input type="text" name="nama_marketing" value={form.nama_marketing} onChange={handleChange} className={inputClass} /></div>
                                <div><label className={labelClass}>Nama Client (TTD Kanan)</label><input type="text" name="nama_client_ttd" value={form.nama_client_ttd} onChange={handleChange} className={inputClass} /></div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-4 pb-10">
                            <button type="button" onClick={() => navigate(-1)} className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium flex items-center gap-2"><X size={18} /> Batal</button>
                            <button type="submit" className="px-8 py-3 bg-blue-700 text-white rounded-xl shadow-lg hover:bg-blue-800 active:scale-95 font-bold flex items-center gap-2"><Save size={18} /> {isEdit ? 'Simpan Perubahan' : 'Simpan Quotation'}</button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default QuotationForm;
