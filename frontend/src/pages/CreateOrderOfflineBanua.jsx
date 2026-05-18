import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api/axios';
import { createQuotation, getNextQuotationNumber } from '../api/quotationApi';
import Sidebar from '../components/Sidebar';
import { Save, X, ArrowLeft, ShoppingCart, Users, FileText, Upload, CreditCard, Settings, PenTool } from 'lucide-react';
import { formatPhoneNumber } from '../utils/formatters';

const CreateOrderOfflineBanua = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Check if we are editing an existing order
    const editData = location.state?.orderData || null;
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [activeItemIndex, setActiveItemIndex] = useState(null);

    const [form, setForm] = useState(editData || {
        customer: '',
        alamat_pt: '',
        cp_penagihan: '',
        up_penagihan: '',
        email: '',
        items: [{ rincian: '', ukuran: '', qty: 1, harga_satuan: 0, satuan: 'Pcs', diskon_item: 0, status_approval: '' }],
        subtotal: 0,
        ppn_persen: 0,
        jumlah_ppn: 0,
        diskon: 0, // nominal
        diskon_persen: 0,
        grand_total: 0,
        deadline: '',
        payment_type: 'DP',
        status_produksi: 'Beli Kain',
        lokasi_proses: 'Internal',
        catatan: '',
        status: 'New Order',
        // Quotation fields
        tanggal_quotation: new Date().toISOString().split('T')[0],
        tanggal_berlaku: '',
        deskripsi_pesanan: '',
        jenis_pembayaran: '',
        payment_note: '',
        term_of_payment: '',
        nama_marketing: '',
        nama_client_ttd: '',
    });

    const [createQuo, setCreateQuo] = useState(true);
    const [quoFiles, setQuoFiles] = useState([]);
    const [saving, setSaving] = useState(false);

    const [customers, setCustomers] = useState([]);
    const [filteredCustomers, setFilteredCustomers] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                const res = await api.get('/marketing-offline/customers');
                setCustomers(res.data);
            } catch (error) { console.error("Failed to fetch customers", error); }
        };
        const fetchProducts = async () => {
            try {
                const res = await api.get('/produk');
                if (res.data && res.data.data) {
                    setProducts(res.data.data);
                } else {
                    setProducts([]);
                }
            } catch (error) { console.error("Failed to fetch products", error); }
        };
        fetchCustomers();
        fetchProducts();
    }, []);

    // Auto calculate totals
    useEffect(() => {
        const subtotal = form.items.reduce((acc, item) => acc + (Number(item.qty) * Number(item.harga_satuan) - Number(item.diskon_item || 0)), 0);
        const jumlah_ppn = subtotal * (Number(form.ppn_persen) / 100);
        const diskon_nominal = Number(form.diskon) || 0;
        const grand_total = subtotal + jumlah_ppn - diskon_nominal;

        setForm(prev => ({ ...prev, subtotal, jumlah_ppn, grand_total }));
    }, [form.ppn_persen, form.items, form.diskon]);

    const handleCustomerChange = (e) => {
        const val = e.target.value;
        setForm({ ...form, customer: val });

        if (val.length > 0) {
            const matches = customers.filter(c => c.nama_customer.toLowerCase().includes(val.toLowerCase()));
            setFilteredCustomers(matches);
            setShowSuggestions(true);
        } else {
            setShowSuggestions(false);
        }
    };

    const selectCustomer = (cust) => {
        setForm({
            ...form,
            customer: cust.nama_customer,
            alamat_pt: cust.alamat || '',
            cp_penagihan: cust.no_hp || '',
            email: cust.email || '',
            up_penagihan: cust.up_penagihan || '',
        });
        setShowSuggestions(false);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm({ ...form, [name]: name === 'cp_penagihan' ? formatPhoneNumber(value) : value });
    };

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
        newItems[index].harga_satuan = prod.harga_jual || prod.hpp_satuan || 0;
        newItems[index].diskon_item = 0;
        newItems[index].status_approval = '';
        setForm({ ...form, items: newItems });
        setFilteredProducts([]);
        setActiveItemIndex(null);
    };

    const sendApprove = async (index) => {
        const newItems = [...form.items];
        newItems[index].status_approval = 'Menunggu Owner';
        setForm({ ...form, items: newItems });
        alert(`Request Approval Diskon untuk item "${newItems[index].rincian}" telah dikirim ke Owner!`);
    };

    const addItem = () => {
        setForm({ ...form, items: [...form.items, { rincian: '', ukuran: '', qty: 1, harga_satuan: 0, satuan: 'Pcs', diskon_item: 0, status_approval: '' }] });
    };

    const removeItem = (index) => {
        if (form.items.length > 1) {
            const newItems = form.items.filter((_, i) => i !== index);
            setForm({ ...form, items: newItems });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            let orderId = editData?.id;
            if (editData && editData.id) {
                await api.put(`/marketing-offline/orders/${editData.id}`, form);
            } else {
                const res = await api.post('/marketing-offline/orders', form);
                orderId = res.data?.id;
            }

            // Also create quotation if enabled
            if (createQuo) {
                const noRes = await getNextQuotationNumber('Banua');
                const quoData = {
                    no_quotation: noRes.data.no_quotation,
                    cabang: 'Banua',
                    order_id: orderId || null,
                    tanggal_quotation: form.tanggal_quotation,
                    tanggal_berlaku: form.tanggal_berlaku,
                    nama_pt: form.customer,
                    alamat_pt: form.alamat_pt,
                    up_penagihan: form.up_penagihan,
                    cp_penagihan: form.cp_penagihan,
                    email_customer: form.email,
                    deskripsi_pesanan: form.deskripsi_pesanan,
                    items_detail: form.items,
                    subtotal: form.subtotal,
                    ppn_persen: form.ppn_persen,
                    jumlah_ppn: form.jumlah_ppn,
                    diskon_persen: form.diskon_persen,
                    diskon: form.diskon,
                    grand_total_quo: form.grand_total,
                    payment_type: form.payment_type,
                    jenis_pembayaran: form.jenis_pembayaran,
                    payment_note: form.payment_note,
                    term_of_payment: form.term_of_payment,
                    nama_marketing: form.nama_marketing,
                    nama_client_ttd: form.nama_client_ttd,
                    status: 'Draft'
                };
                const quoRes = await createQuotation(quoData);
                // Upload files if any
                if (quoFiles.length > 0 && quoRes.data?.id) {
                    const fd = new FormData();
                    quoFiles.forEach(f => fd.append('files', f));
                    await api.post(`/quotation/${quoRes.data.id}/upload`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
                }
            }

            alert(editData ? 'Order berhasil diupdate!' : 'Order & Quotation berhasil dibuat!');
            navigate('/marketing-offline/orders');
        } catch (error) {
            console.error('Gagal menyimpan', error);
            alert('Gagal menyimpan: ' + (error.response?.data?.message || error.message));
        } finally { setSaving(false); }
    };

    return (
        <div className="flex bg-[#f8f9fa] min-h-screen font-sans">
            <Sidebar />
            <main className="flex-1 p-8 overflow-y-auto h-screen">
                <div className="max-w-5xl mx-auto">
                    {/* Header */}
                    <div className="flex items-center gap-4 mb-6">
                        <button onClick={() => navigate('/marketing-offline/orders')} className="p-2 bg-white rounded-full shadow-sm hover:bg-gray-50 border border-gray-100 transition-colors">
                            <ArrowLeft className="text-gray-600" size={24} />
                        </button>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                                <ShoppingCart className="text-[#990000]" />
                                {editData ? 'Edit Order' : 'Buat Order Baru'}
                            </h1>
                            <p className="text-gray-500 mt-1">Isi formulir order yang akan terhubung dengan Invoice di Finance.</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* 1. Header Quotation */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <h3 className="text-lg font-bold border-b border-gray-100 pb-3 mb-4 text-[#990000] flex items-center gap-2"><FileText size={20}/> HEADER QUOTATION</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Tanggal Quotation</label>
                                    <input type="date" name="tanggal_quotation" value={form.tanggal_quotation} onChange={handleChange} className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#990000]/20 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Tanggal Berlaku</label>
                                    <input type="date" name="tanggal_berlaku" value={form.tanggal_berlaku} onChange={handleChange} className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#990000]/20 outline-none" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Deskripsi Pesanan Singkat</label>
                                    <input type="text" name="deskripsi_pesanan" value={form.deskripsi_pesanan} onChange={handleChange} placeholder="Contoh: Pembuatan Seragam..." className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#990000]/20 outline-none" />
                                </div>
                            </div>
                        </div>

                        {/* 2. Data Customer */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative">
                            <h3 className="text-lg font-bold border-b border-gray-100 pb-3 mb-4 text-[#990000] flex items-center gap-2"><Users size={20}/> DATA CUSTOMER</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="relative">
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Nama Instansi *</label>
                                    <input type="text" name="customer" value={form.customer} onChange={handleCustomerChange} required placeholder="Ketik nama instansi..." className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#990000]/20 outline-none" autoComplete="off" />
                                    {showSuggestions && filteredCustomers.length > 0 && (
                                        <ul className="absolute z-10 w-full bg-white border border-gray-200 mt-1 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                            {filteredCustomers.map(cust => (
                                                <li key={cust.id} onClick={() => selectCustomer(cust)} className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0">
                                                    <p className="font-bold text-sm text-gray-800">{cust.nama_customer}</p>
                                                    <p className="text-xs text-gray-500 truncate">{cust.alamat}</p>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                                    <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="email@perusahaan.com" className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#990000]/20 outline-none" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Alamat Lengkap *</label>
                                    <textarea name="alamat_pt" value={form.alamat_pt} onChange={handleChange} required rows={2} placeholder="Alamat lengkap..." className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#990000]/20 outline-none resize-none"></textarea>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">UP (Nama Penagihan)</label>
                                    <input type="text" name="up_penagihan" value={form.up_penagihan} onChange={handleChange} placeholder="Bpk/Ibu ..." className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#990000]/20 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Contact Person (No HP) *</label>
                                    <input type="text" name="cp_penagihan" value={form.cp_penagihan} onChange={handleChange} required placeholder="0812..." className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#990000]/20 outline-none" />
                                </div>
                            </div>
                        </div>

                        {/* 3. Detail Order & Items */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <h3 className="text-lg font-bold border-b border-gray-100 pb-3 mb-4 text-[#990000]">DETAIL BARANG</h3>
                            <div className="space-y-4 mb-6">
                                {form.items && form.items.map((item, index) => (
                                    <div key={index} className="grid grid-cols-12 gap-3 bg-gray-50 p-4 rounded-lg border border-gray-200 relative pt-8 md:pt-4">
                                        <div className="col-span-12 md:col-span-3 relative">
                                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Nama Produk</label>
                                            <input 
                                                type="text" 
                                                name="rincian" 
                                                value={item.rincian || item.nama_barang} 
                                                onChange={(e) => handleItemChange(index, e)} 
                                                onFocus={() => filterProducts(index, item.rincian || item.nama_barang)}
                                                onBlur={() => setTimeout(() => setActiveItemIndex(null), 200)}
                                                placeholder="Nama Produk" 
                                                required 
                                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#990000]/20 outline-none text-sm" 
                                                autoComplete="off" 
                                            />
                                            {activeItemIndex === index && filteredProducts.length > 0 && (
                                                <ul className="absolute z-20 w-full bg-white border border-gray-200 mt-1 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                                    {filteredProducts.map(prod => (
                                                        <li key={prod.id} onClick={() => selectProduct(index, prod)} className="p-2 hover:bg-gray-50 cursor-pointer text-sm border-b border-gray-50 last:border-0 flex justify-between items-center">
                                                            <span>{prod.nama_produk}</span>
                                                            <span className="text-xs text-gray-400 font-mono">Rp {Number(prod.harga_jual || prod.hpp_satuan || 0).toLocaleString('id-ID')}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                        <div className="col-span-6 md:col-span-2">
                                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 text-center">Detail</label>
                                            <input type="text" name="ukuran" value={item.ukuran || ''} onChange={(e) => handleItemChange(index, e)} placeholder="Cth: XL" className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#990000]/20 outline-none text-center text-sm" />
                                        </div>
                                        <div className="col-span-3 md:col-span-1">
                                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 text-center">Qty</label>
                                            <input type="number" name="qty" value={item.qty} onChange={(e) => handleItemChange(index, e)} min="1" required className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#990000]/20 outline-none text-center text-sm" />
                                        </div>
                                        <div className="col-span-3 md:col-span-1">
                                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 text-center">Unit</label>
                                            <input type="text" name="satuan" value={item.satuan || 'Pcs'} onChange={(e) => handleItemChange(index, e)} placeholder="Pcs" className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#990000]/20 outline-none text-center text-sm" />
                                        </div>
                                        <div className="col-span-6 md:col-span-2">
                                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 text-right">Harga Satuan</label>
                                            <input type="number" name="harga_satuan" value={item.harga_satuan} onChange={(e) => handleItemChange(index, e)} min="0" required className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#990000]/20 outline-none text-right text-sm font-semibold" />
                                        </div>
                                        <div className="col-span-6 md:col-span-2">
                                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 text-right">Diskon Item</label>
                                            <div className="flex gap-1 items-center">
                                                <input type="number" name="diskon_item" value={item.diskon_item || ''} onChange={(e) => handleItemChange(index, e)} min="0" placeholder="0" className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#990000]/20 outline-none text-right text-sm text-red-600" />
                                                {Number(item.diskon_item) > 0 && (
                                                    <button type="button" onClick={() => sendApprove(index)} className="p-1.5 bg-yellow-100 text-yellow-700 hover:bg-yellow-200 rounded text-[10px] font-bold shrink-0">Approve</button>
                                                )}
                                            </div>
                                            {item.status_approval && <p className="text-[9px] text-yellow-600 font-bold mt-1 text-right">{item.status_approval}</p>}
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
                                        <label className="text-sm font-semibold text-gray-700 w-1/3">Diskon (Rp)</label>
                                        <input type="number" name="diskon" value={form.diskon} onChange={handleChange} min="0" className="w-1/3 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#990000]/20 outline-none text-right" placeholder="0" />
                                        <span className="w-1/3 text-right text-sm text-red-600 font-bold">- Rp {Number(form.diskon || 0).toLocaleString('id-ID')}</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-4 pt-4 border-t-2 border-gray-300">
                                        <label className="text-base font-extrabold text-[#990000] w-1/3">GRAND TOTAL</label>
                                        <span className="w-2/3 text-right text-xl font-black text-[#990000]">Rp {form.grand_total.toLocaleString('id-ID')}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Detail Pembayaran */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <h3 className="text-lg font-bold border-b border-gray-100 pb-3 mb-4 text-[#990000] flex items-center gap-2"><CreditCard size={20}/> DETAIL PEMBAYARAN</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Skema Pembayaran</label>
                                    <select name="payment_type" value={form.payment_type} onChange={handleChange} className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#990000]/20 outline-none bg-white">
                                        <option value="DP">DP (Down Payment)</option>
                                        <option value="Fullpayment">Fullpayment</option>
                                        <option value="Non DP">Non DP</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Metode Pembayaran</label>
                                    <select name="jenis_pembayaran" value={form.jenis_pembayaran} onChange={handleChange} className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#990000]/20 outline-none bg-white">
                                        <option value="">-- Pilih --</option>
                                        <option value="Transfer Bank">Transfer Bank</option>
                                        <option value="Cash">Cash</option>
                                        <option value="DP + Pelunasan">DP + Pelunasan</option>
                                        <option value="Credit">Credit</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Payment Method (Info Rekening)</label>
                                    <textarea name="payment_note" value={form.payment_note} onChange={handleChange} rows={2} placeholder="Contoh: Transfer ke Bank BNI a/n PT Banua Mitra Lestari No Rek 123456789" className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#990000]/20 outline-none resize-none"></textarea>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Term of Payment (Ketentuan Tambahan)</label>
                                    <textarea name="term_of_payment" value={form.term_of_payment} onChange={handleChange} rows={2} placeholder="Contoh: DP 50% sebelum produksi, pelunasan sebelum pengiriman..." className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#990000]/20 outline-none resize-none"></textarea>
                                </div>
                            </div>
                        </div>

                        {/* Pengaturan Proses */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <h3 className="text-lg font-bold border-b border-gray-100 pb-3 mb-4 text-[#990000] flex items-center gap-2"><Settings size={20}/> DEADLINE PRODUKSI</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Deadline Produksi *</label>
                                    <input type="date" name="deadline" value={form.deadline ? form.deadline.split('T')[0] : ''} onChange={handleChange} required className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#990000]/20 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Catatan Tambahan Produksi (Opsional)</label>
                                    <textarea name="catatan" value={form.catatan} onChange={handleChange} rows={2} placeholder="Instruksi khusus produksi atau catatan lainnya..." className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#990000]/20 outline-none resize-none"></textarea>
                                </div>
                            </div>
                        </div>

                        {/* Tanda Tangan & Upload */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <h3 className="text-lg font-bold border-b border-gray-100 pb-3 mb-4 text-[#990000] flex items-center gap-2"><PenTool size={20}/> TANDA TANGAN & DOKUMEN</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Nama Marketing (TTD)</label>
                                        <input type="text" name="nama_marketing" value={form.nama_marketing} onChange={handleChange} list="marketing-options" placeholder="Nama penanggung jawab marketing" className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#990000]/20 outline-none" />
                                        <datalist id="marketing-options">
                                            <option value="Aji Pangestu" />
                                            <option value="M Rangga Maulana" />
                                        </datalist>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Nama Client (TTD)</label>
                                        <input type="text" name="nama_client_ttd" value={form.nama_client_ttd} onChange={handleChange} placeholder="Nama client yang menandatangani" className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#990000]/20 outline-none" />
                                    </div>
                                </div>
                                <div className="border-2 border-dashed border-gray-300 rounded-2xl p-6 flex flex-col items-center justify-center text-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer" onClick={() => document.getElementById('quo_files_upload').click()}>
                                    <Upload className="text-gray-400 mb-3" size={32} />
                                    <h4 className="font-bold text-gray-700">Upload Dokumen Pendukung</h4>
                                    <p className="text-xs text-gray-500 mt-1 mb-4">Klik untuk memilih file PDF, gambar bukti transfer DP, dll.</p>
                                    <input type="file" id="quo_files_upload" multiple onChange={(e) => setQuoFiles(prev => [...prev, ...Array.from(e.target.files)])} className="hidden" />
                                </div>
                                {quoFiles.length > 0 && (
                                    <div className="mt-3 space-y-2">
                                        {quoFiles.map((file, idx) => (
                                            <div key={idx} className="flex items-center justify-between bg-white p-2 rounded border border-gray-100 shadow-sm">
                                                <span className="text-xs text-gray-700 font-medium truncate flex-1 mr-2">{file.name}</span>
                                                <button type="button" onClick={() => setQuoFiles(prev => prev.filter((_, i) => i !== idx))} className="text-red-500 hover:bg-red-50 p-1 rounded">
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-4 pb-10">
                            <button type="button" onClick={() => navigate('/marketing-offline/orders')} className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium flex items-center gap-2">
                                <X size={18} /> Batal
                            </button>
                            <button type="submit" disabled={saving} className="px-8 py-3 bg-[#990000] text-white rounded-xl shadow-lg hover:bg-red-800 transition-transform active:scale-95 font-bold flex items-center gap-2 disabled:opacity-50">
                                <Save size={18} /> {saving ? 'Menyimpan...' : (editData ? 'Simpan Perubahan' : 'Buat Order & Quotation')}
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default CreateOrderOfflineBanua;
