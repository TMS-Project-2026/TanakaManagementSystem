import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { createInvoice, getInvoiceById, updateInvoice } from '../api/invoiceApi';
import { Save, X, ArrowLeft, Receipt, CreditCard, PenTool, Upload } from 'lucide-react';
import api from '../api/axios';
import { formatPhoneNumber } from '../utils/formatters';
import { getNextInvoiceNumber } from '../api/invoiceApi';

const InvoiceForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = Boolean(id);

    const [customers, setCustomers] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [activeItemIndex, setActiveItemIndex] = useState(null);
    const [invoiceFiles, setInvoiceFiles] = useState([]);

    const [form, setForm] = useState({
        no_invoice: '',
        cabang: 'Banua',
        tanggal_transaksi: new Date().toISOString().split('T')[0],
        tanggal_terbit: new Date().toISOString().split('T')[0],
        tanggal_jatuh_tempo: '',
        nama_pt: '',
        alamat_pt: '',
        cp_penagihan: '',
        email: '',
        up_penagihan: '',
        deskripsi: '',
        detail_pekerjaan: '',
        no_po_kontrak: '',
        deskripsi_pesanan: '',
        items: [{ rincian: '', ukuran: '', qty: 1, harga_satuan: 0, satuan: 'Pcs' }],
        qty: 1,
        harga_satuan: 0,
        subtotal: 0,
        ppn_persen: 0,
        Diskon: 0,
        diskon: 0, // nominal
        diskon_persen: 0,
        jumlah_ppn: 0,
        grand_total: 0,
        keterangan: '',
        note: '',
        term_of_payment: '',
        materai: false,
        ttd: true,
        nama_accounting: '',
        penanggung_jawab: '',
        jabatan: '',
        status: 'Draft'
    });

    useEffect(() => {
        if (isEdit) {
            fetchInvoice();
        } else {
            fetchNextNo(form.cabang);
        }
    }, [id, form.cabang]);

    const fetchNextNo = async (cabang) => {
        try {
            const res = await getNextInvoiceNumber(cabang);
            if (res.data.status === 'success') {
                setForm(prev => ({ ...prev, no_invoice: res.data.no_invoice }));
            }
        } catch (err) { console.error('Gagal fetch nomor invoice', err); }
    };

    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                const res = await api.get('/marketing-offline/customers');
                setCustomers(res.data);
            } catch (err) { console.error('Gagal fetch customer', err); }
        };
        const fetchProducts = async () => {
            try {
                const res = await api.get('/produk');
                if (res.data && res.data.data) {
                    setProducts(res.data.data);
                } else {
                    setProducts([]);
                }
            } catch (err) { console.error('Gagal fetch produk', err); }
        };
        fetchCustomers();
        fetchProducts();
    }, []);

    // Auto calculate totals
    useEffect(() => {
        let subtotal = 0;
        if (form.items && form.items.length > 0) {
            subtotal = form.items.reduce((acc, item) => acc + (Number(item.qty) * Number(item.harga_satuan)), 0);
        } else {
            subtotal = Number(form.qty) * Number(form.harga_satuan);
        }

        const jumlah_ppn = subtotal * (Number(form.ppn_persen) / 100);
        const diskon_nominal = subtotal * (Number(form.diskon_persen || 0) / 100);
        const grand_total = subtotal + jumlah_ppn - diskon_nominal;

        setForm(prev => ({
            ...prev,
            subtotal,
            jumlah_ppn,
            diskon: diskon_nominal,
            grand_total
        }));
    }, [form.qty, form.harga_satuan, form.ppn_persen, form.items, form.diskon_persen]);

    // Auto update note based on cabang
    useEffect(() => {
        let defaultNote = '';
        if (form.cabang === 'Banua') {
            defaultNote = `PAYMENT METHOD :
Bank                      : BANK RAKYAT INDONESIA (BRI)
Cabang                    : Yogyakarta
No. Rekening              : 2099 0100 0545 304
Atas Nama                 : PT BANUA MITRA LESTARI`;
        } else if (form.cabang === 'Tanaka') {
            defaultNote = `PAYMENT METHOD :
Bank                      : BANK RAKYAT INDONESIA (BRI)
Cabang                    : Yogyakarta
No. Rekening              : 2099 0100 0495 305
Atas Nama                 : PT TANAKA RIZQI BAROKAH`;
        } else if (form.cabang === 'Acestreet') {
            defaultNote = `PAYMENT METHOD :
Bank                      : BANK RAKYAT INDONESIA (BRI)
Cabang                    : Yogyakarta
No. Rekening              : 2099 0100 0545 304
Atas Nama                 : ACESTREET`;
        }

        setForm(prev => ({
            ...prev,
            note: defaultNote
        }));
    }, [form.cabang]);

    // Auto-check TTD if names or position are filled
    useEffect(() => {
        if (form.nama_accounting || form.penanggung_jawab || form.jabatan) {
            if (!form.ttd) {
                setForm(prev => ({ ...prev, ttd: true }));
            }
        }
    }, [form.nama_accounting, form.penanggung_jawab, form.jabatan]);

    const handleItemChange = (index, e) => {
        const { name, value } = e.target;
        const newItems = [...form.items];
        newItems[index][name] = value;

        if (name === 'rincian') {
            filterProducts(index, value);
        }

        setForm({ ...form, items: newItems });
    };

    const filterProducts = (index, value) => {
        setActiveItemIndex(index);
        if (value && value.length > 0 && Array.isArray(products)) {
            const matches = products.filter(p =>
                p.nama_produk.toLowerCase().includes(value.toLowerCase())
            );
            setFilteredProducts(matches);
        } else {
            setFilteredProducts([]);
        }
    };

    const selectProduct = (index, prod) => {
        const newItems = [...form.items];
        newItems[index].rincian = prod.nama_produk;
        // Optionally set price if product has hpp_satuan
        // newItems[index].harga_satuan = prod.hpp_satuan; 
        setForm({ ...form, items: newItems });
        setFilteredProducts([]);
        setActiveItemIndex(null);
    };

    const addItem = () => {
        setForm({ ...form, items: [...form.items, { rincian: '', ukuran: '', qty: 1, harga_satuan: 0, satuan: 'Pcs' }] });
    };

    const removeItem = (index) => {
        if (form.items.length > 1) {
            const newItems = form.items.filter((_, i) => i !== index);
            setForm({ ...form, items: newItems });
        }
    };

    const fetchInvoice = async () => {
        try {
            const res = await getInvoiceById(id);
            if (res.data.status === 'success') {
                const data = res.data.data;
                setForm({
                    ...data,
                    tanggal_transaksi: data.tanggal_transaksi ? data.tanggal_transaksi.split('T')[0] : '',
                    tanggal_terbit: data.tanggal_terbit ? data.tanggal_terbit.split('T')[0] : '',
                    tanggal_jatuh_tempo: data.tanggal_jatuh_tempo ? data.tanggal_jatuh_tempo.split('T')[0] : '',
                    items: typeof data.items === 'string' ? JSON.parse(data.items) : (data.items || [{ rincian: '', qty: data.qty || 1, harga_satuan: data.harga_satuan || 0, satuan: 'Pcs' }]),
                    materai: Boolean(data.materai),
                    ttd: Boolean(data.ttd)
                });
            }
        } catch (error) {
            console.error('Gagal memuat data invoice', error);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm({
            ...form,
            [name]: type === 'checkbox' ? checked : (name === 'cp_penagihan' ? formatPhoneNumber(value) : value)
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEdit) {
                await updateInvoice(id, form);
                alert("Invoice berhasil diperbarui!");
            } else {
                await createInvoice(form);
                alert("Invoice berhasil dibuat!");
            }
            navigate('/invoice');
        } catch (error) {
            console.error("Gagal menyimpan invoice", error);
            alert("Gagal menyimpan invoice");
        }
    };

    return (
        <div className="flex bg-[#f8f9fa] min-h-screen font-sans">
            <Sidebar />
            <main className="flex-1 p-8 overflow-y-auto h-screen">
                <div className="max-w-5xl mx-auto">
                    {/* Header */}
                    <div className="flex items-center gap-4 mb-6">
                        <button onClick={() => navigate(-1)} className="p-2 bg-white rounded-full shadow-sm hover:bg-gray-50 border border-gray-100 transition-colors">
                            <ArrowLeft className="text-gray-600" size={24} />
                        </button>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                                <Receipt className="text-[#990000]" />
                                {isEdit ? 'Edit Invoice' : 'Buat Invoice Baru'}
                            </h1>
                            <p className="text-gray-500 mt-1">Lengkapi form di bawah ini dengan benar untuk membuat tagihan resmi.</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* 1. Header Invoice */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <h3 className="text-lg font-bold border-b border-gray-100 pb-3 mb-4 text-[#990000]">HEADER INVOICE</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">No Invoice</label>
                                    <input type="text" name="no_invoice" value={form.no_invoice} onChange={handleChange} disabled={isEdit} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#990000]/20 focus:border-[#990000] outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Cabang Asal *</label>
                                    <select name="cabang" value={form.cabang} onChange={handleChange} required className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#990000]/20 focus:border-[#990000] outline-none bg-white">
                                        <option value="Banua">PT Banua Mitra Lestari</option>
                                        <option value="Tanaka">PT Tanaka Rizqi Barokah</option>
                                        <option value="Acestreet">Accestreet</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Tanggal Transaksi *</label>
                                    <input type="date" name="tanggal_transaksi" value={form.tanggal_transaksi} onChange={handleChange} required className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#990000]/20 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Tanggal Terbit Invoice *</label>
                                    <input type="date" name="tanggal_terbit" value={form.tanggal_terbit} onChange={handleChange} required className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#990000]/20 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Tanggal Jatuh Tempo *</label>
                                    <input type="date" name="tanggal_jatuh_tempo" value={form.tanggal_jatuh_tempo} onChange={handleChange} required className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#990000]/20 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">No PO / Kontrak</label>
                                    <input type="text" name="no_po_kontrak" value={form.no_po_kontrak || ''} onChange={handleChange} placeholder="No. PO atau Kontrak" className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#990000]/20 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Status Invoice</label>
                                    <select name="status" value={form.status} onChange={handleChange} className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#990000]/20 outline-none bg-white">
                                        <option value="Draft">Draft</option>
                                        <option value="Terbit">Terbit</option>
                                        <option value="Lunas">Lunas</option>
                                        <option value="Overdue">Overdue</option>
                                        <option value="Duedate">Duedate</option>
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Deskripsi Pesanan Singkat</label>
                                    <input type="text" name="deskripsi_pesanan" value={form.deskripsi_pesanan || ''} onChange={handleChange} placeholder="Contoh: Pembuatan Seragam..." className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#990000]/20 outline-none" />
                                </div>
                            </div>
                        </div>

                        {/* 2. Data Customer */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <h3 className="text-lg font-bold border-b border-gray-100 pb-3 mb-4 text-[#990000]">DATA CUSTOMER</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="relative md:col-span-2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Nama PT / Perusahaan *</label>
                                    <input
                                        type="text"
                                        name="nama_pt"
                                        value={form.nama_pt}
                                        onChange={(e) => {
                                            handleChange(e);
                                            setShowSuggestions(true);
                                        }}
                                        onFocus={() => setShowSuggestions(true)}
                                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                        required
                                        placeholder="Contoh: PT. ABC Kaltim"
                                        className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#990000]/20 outline-none"
                                    />
                                    {showSuggestions && form.nama_pt && (
                                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                            {customers.filter(c => c.nama_customer.toLowerCase().includes(form.nama_pt.toLowerCase())).length > 0 ? (
                                                customers.filter(c => c.nama_customer.toLowerCase().includes(form.nama_pt.toLowerCase())).map(c => (
                                                    <div
                                                        key={c.id}
                                                        className="p-3 hover:bg-red-50 cursor-pointer border-b border-gray-50 last:border-0"
                                                        onClick={() => {
                                                            setForm(prev => ({
                                                                ...prev,
                                                                nama_pt: c.nama_customer,
                                                                alamat_pt: c.alamat || '',
                                                                cp_penagihan: c.no_hp || '',
                                                                email: c.email || '',
                                                                up_penagihan: c.up_penagihan || ''
                                                            }));
                                                            setShowSuggestions(false);
                                                        }}
                                                    >
                                                        <p className="font-bold text-sm text-gray-800">{c.nama_customer}</p>
                                                        <p className="text-xs text-gray-500 line-clamp-1">{c.alamat}</p>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="p-3 text-sm text-gray-500 italic">Customer belum ada, akan disimpan manual nanti.</div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Alamat Lengkap Perusahaan *</label>
                                    <textarea name="alamat_pt" value={form.alamat_pt} onChange={handleChange} required rows={2} placeholder="Alamat lengkap pengiriman invoice..." className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#990000]/20 outline-none resize-none"></textarea>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">UP (Nama) Penagihan</label>
                                    <input type="text" name="up_penagihan" value={form.up_penagihan} onChange={handleChange} placeholder="Bpk. Budi" className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#990000]/20 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Contact Person (CP) Penagihan</label>
                                    <input type="text" name="cp_penagihan" value={form.cp_penagihan} onChange={handleChange} placeholder="0812..." className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#990000]/20 outline-none" />
                                </div>
                            </div>
                        </div>

                        {/* 3. Detail Barang */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <h3 className="text-lg font-bold border-b border-gray-100 pb-3 mb-4 text-[#990000]">DETAIL BARANG</h3>

                            <div className="space-y-4 mb-6">
                                {form.items && form.items.map((item, index) => (
                                    <div key={index} className="grid grid-cols-12 gap-3 bg-gray-50 p-4 rounded-lg border border-gray-200 relative pt-8 md:pt-4">
                                        <div className="col-span-12 md:col-span-4 relative">
                                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Nama Produk</label>
                                            <input
                                                type="text"
                                                name="rincian"
                                                value={item.rincian}
                                                onChange={(e) => handleItemChange(index, e)}
                                                onFocus={() => filterProducts(index, item.rincian)}
                                                onBlur={() => setTimeout(() => setActiveItemIndex(null), 200)}
                                                placeholder="Nama Produk"
                                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#990000]/20 outline-none text-sm"
                                                autoComplete="off"
                                            />
                                            {activeItemIndex === index && filteredProducts.length > 0 && (
                                                <ul className="absolute z-20 w-full bg-white border border-gray-200 mt-1 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                                    {filteredProducts.map(prod => (
                                                        <li key={prod.id} onClick={() => selectProduct(index, prod)} className="p-2 hover:bg-gray-50 cursor-pointer text-sm border-b border-gray-50 last:border-0">
                                                            {prod.nama_produk}
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                        <div className="col-span-6 md:col-span-2">
                                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 text-center">Detail</label>
                                            <input type="text" name="ukuran" value={item.ukuran || ''} onChange={(e) => handleItemChange(index, e)} placeholder="Cth: XL / Custom" className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#990000]/20 outline-none text-center text-sm" />
                                        </div>
                                        <div className="col-span-3 md:col-span-1">
                                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 text-center">Qty</label>
                                            <input type="number" name="qty" value={item.qty} onChange={(e) => handleItemChange(index, e)} min="1" className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#990000]/20 outline-none text-center text-sm" />
                                        </div>
                                        <div className="col-span-3 md:col-span-1">
                                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 text-center">Unit</label>
                                            <input type="text" name="satuan" value={item.satuan} onChange={(e) => handleItemChange(index, e)} placeholder="Pcs" className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#990000]/20 outline-none text-center text-sm" />
                                        </div>
                                        <div className="col-span-12 md:col-span-3">
                                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 text-right">Harga Satuan</label>
                                            <input type="number" name="harga_satuan" value={item.harga_satuan} onChange={(e) => handleItemChange(index, e)} min="0" className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#990000]/20 outline-none text-right text-sm font-semibold" />
                                        </div>
                                        <div className="absolute top-2 right-2 md:static md:col-span-1 flex items-end justify-center">
                                            <button type="button" onClick={() => removeItem(index)} className="text-red-400 hover:text-red-600 transition-colors p-2">
                                                <X size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                <button type="button" onClick={addItem} className="text-sm font-semibold text-[#990000] bg-red-50 px-4 py-2 rounded-lg border border-red-100 hover:bg-red-100 transition-colors">+ Tambah Item</button>
                            </div>

                            <div className="flex justify-end">
                                <div className="w-full md:w-1/2 lg:w-1/3 space-y-4 bg-gray-50 p-5 rounded-xl border border-gray-200">
                                    <div className="flex items-center justify-between gap-4">
                                        <label className="text-sm font-semibold text-gray-700 w-1/3">Subtotal</label>
                                        <span className="w-2/3 text-right font-bold text-gray-800">Rp {form.subtotal.toLocaleString('id-ID')}</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-4">
                                        <label className="text-sm font-semibold text-gray-700 w-1/3">PPN (%)</label>
                                        <input type="number" name="ppn_persen" value={form.ppn_persen} onChange={handleChange} min="0" max="100" className="w-1/3 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#990000]/20 outline-none text-right" />
                                        <span className="w-1/3 text-right text-sm text-gray-600">Rp {form.jumlah_ppn.toLocaleString('id-ID')}</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-4">
                                        <label className="text-sm font-semibold text-gray-700 w-1/3">Diskon (%)</label>
                                        <input type="number" name="diskon_persen" value={form.diskon_persen} onChange={handleChange} min="0" max="100" className="w-1/3 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#990000]/20 outline-none text-right" />
                                        <span className="w-1/3 text-right text-sm text-red-600 font-bold">- Rp {form.diskon.toLocaleString('id-ID')}</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-4 pt-4 border-t-2 border-gray-300">
                                        <label className="text-base font-extrabold text-[#990000] w-1/3">GRAND TOTAL</label>
                                        <span className="w-2/3 text-right text-xl font-black text-[#990000]">Rp {form.grand_total.toLocaleString('id-ID')}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 4. Detail Pembayaran */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <h3 className="text-lg font-bold border-b border-gray-100 pb-3 mb-4 text-[#990000] flex items-center gap-2"><CreditCard size={20}/> DETAIL PEMBAYARAN</h3>
                            <div className="space-y-4">
                                {/* Payment Method — read-only info box */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Payment Method</label>
                                    <div className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-700 font-mono whitespace-pre-line">
                                        {form.note || '—'}
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1">Info rekening terisi otomatis sesuai cabang. Kosongkan di form jika ingin menggantinya.</p>
                                </div>
                                {/* Keterangan tambahan */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Keterangan Tambahan <span className="text-gray-400 font-normal">(opsional)</span></label>
                                    <textarea name="keterangan" value={form.keterangan} onChange={handleChange} rows={2} placeholder="Misal: Sudah termasuk biaya ongkos kirim" className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#990000]/20 outline-none resize-none"></textarea>
                                </div>
                                {/* Term of Payment */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Term of Payment <span className="text-gray-400 font-normal">(opsional)</span></label>
                                    <textarea name="term_of_payment" value={form.term_of_payment || ''} onChange={handleChange} rows={3} placeholder="Contoh: DP 50% sebelum produksi, pelunasan sebelum pengiriman barang..." className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#990000]/20 outline-none resize-none"></textarea>
                                </div>
                            </div>
                        </div>

                        {/* 5. Tanda Tangan & Dokumen */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <h3 className="text-lg font-bold border-b border-gray-100 pb-3 mb-4 text-[#990000] flex items-center gap-2"><PenTool size={20}/> TANDA TANGAN & DOKUMEN</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div className="flex gap-4">
                                        <label className="flex items-center gap-2 cursor-pointer bg-gray-50 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
                                            <input type="checkbox" name="ttd" checked={form.ttd} onChange={handleChange} className="w-4 h-4 text-[#990000] focus:ring-[#990000] rounded" />
                                            <span className="text-sm font-medium text-gray-700">Tempat Tanda Tangan</span>
                                        </label>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Nama Pembuat (Prepared by - Kiri)</label>
                                        <input type="text" name="nama_accounting" value={form.nama_accounting} onChange={handleChange} placeholder="Nama Staf Marketing" className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#990000]/20 outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Nama Penyetuju (Approved by - Kanan)</label>
                                        <input type="text" name="penanggung_jawab" value={form.penanggung_jawab} onChange={handleChange} placeholder="Nama Accounting" className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#990000]/20 outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Jabatan Penyetuju (Kanan)</label>
                                        <input type="text" name="jabatan" value={form.jabatan} onChange={handleChange} placeholder="Accounting" className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#990000]/20 outline-none" />
                                    </div>
                                </div>
                                <div>
                                    <div className="border-2 border-dashed border-gray-300 rounded-2xl p-6 flex flex-col items-center justify-center text-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer" onClick={() => document.getElementById('inv_files_upload').click()}>
                                        <Upload className="text-gray-400 mb-3" size={32} />
                                        <h4 className="font-bold text-gray-700">Upload Dokumen Pendukung</h4>
                                        <p className="text-xs text-gray-500 mt-1 mb-4">Klik untuk memilih file PDF, gambar bukti transfer, dll.</p>
                                        <input type="file" id="inv_files_upload" multiple onChange={(e) => setInvoiceFiles(prev => [...prev, ...Array.from(e.target.files)])} className="hidden" />
                                    </div>
                                    {invoiceFiles.length > 0 && (
                                        <div className="mt-3 space-y-2">
                                            {invoiceFiles.map((file, idx) => (
                                                <div key={idx} className="flex items-center justify-between bg-white p-2 rounded border border-gray-100 shadow-sm">
                                                    <span className="text-xs text-gray-700 font-medium truncate flex-1 mr-2">{file.name}</span>
                                                    <button type="button" onClick={() => setInvoiceFiles(prev => prev.filter((_, i) => i !== idx))} className="text-red-500 hover:bg-red-50 p-1 rounded">
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-4 pb-10">
                            <button type="button" onClick={() => navigate('/invoice')} className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium flex items-center gap-2">
                                <X size={18} /> Batal
                            </button>
                            <button type="submit" className="px-8 py-3 bg-[#990000] text-white rounded-xl shadow-lg hover:bg-red-800 transition-transform active:scale-95 font-bold flex items-center gap-2">
                                <Save size={18} /> {isEdit ? 'Simpan Perubahan' : 'Terbitkan Invoice'}
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default InvoiceForm;
