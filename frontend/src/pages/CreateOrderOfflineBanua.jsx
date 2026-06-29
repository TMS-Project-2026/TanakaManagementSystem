import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api/axios';
import { createQuotation, getNextQuotationNumber, updateQuotation, getQuotationById } from '../api/quotationApi';
import Sidebar from '../components/Sidebar';
import { Save, X, ArrowLeft, ShoppingCart, Users, FileText, Upload, CreditCard, Settings, PenTool, Plus } from 'lucide-react';
import { assignDisplayKode } from '../utils/productUtils';


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
        items: [{ groupId: 'group-initial-0', rincian: '', ukuran: '', qty: 1, harga_satuan: 0, satuan: 'Pcs', diskon_item: 0, status_approval: '', harga_spv: 0, harga_jual: 0, base_harga_jual: 0, base_harga_spv: 0, bahan: '', bordir: '', harga_bordir: 0 }],
        subtotal: 0,
        ppn_persen: 0,
        jumlah_ppn: 0,
        // global discount removed; use per-item discounts instead
        ongkos_kirim: 0,
        grand_total: 0,
        deadline: '',
        payment_type: 'DP',
        status_produksi: 'Beli Kain',
        lokasi_proses: 'Internal',
        catatan: '',
        status: 'New Order',
        approval_status: 'Belum Disetujui',
        kategori_pelanggan: 'Pelanggan Baru',
        // Quotation fields
        tanggal_quotation: new Date().toISOString().split('T')[0],
        tanggal_berlaku: '',
        deskripsi_pesanan: '',
        jenis_pembayaran: '',
        payment_note: '',
        term_of_payment: '',
        nama_marketing: '',
        nama_client_ttd: '',
        bahan: '',
        quotation_id: null,
    });

    const isEditingOrder = Boolean(editData?.id);
    const [createQuo, setCreateQuo] = useState(!isEditingOrder);
    const [quoFiles, setQuoFiles] = useState([]);
    const [saving, setSaving] = useState(false);
    const [phoneError, setPhoneError] = useState('');

    const [customers, setCustomers] = useState([]);
    const [filteredCustomers, setFilteredCustomers] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    // size helper modal states removed

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
                    const productsWithCodes = assignDisplayKode(res.data.data);
                    setProducts(productsWithCodes);
                } else {
                    setProducts([]);
                }
            } catch (error) { console.error("Failed to fetch products", error); }
        };
        fetchCustomers();
        fetchProducts();

        if (editData && editData.quotation_id) {
            const fetchQuo = async () => {
                try {
                    const res = await getQuotationById(editData.quotation_id);
                    if (res.data?.status === 'success') {
                        const q = res.data.data;
                        setForm(prev => ({
                            ...prev,
                            tanggal_quotation: q.tanggal_quotation ? q.tanggal_quotation.split('T')[0] : prev.tanggal_quotation,
                            tanggal_berlaku: q.tanggal_berlaku ? q.tanggal_berlaku.split('T')[0] : prev.tanggal_berlaku,
                            deskripsi_pesanan: q.deskripsi_pesanan || prev.deskripsi_pesanan,
                            jenis_pembayaran: q.jenis_pembayaran || prev.jenis_pembayaran,
                            payment_note: q.payment_note || prev.payment_note,
                            term_of_payment: q.term_of_payment || prev.term_of_payment,
                            nama_marketing: q.nama_marketing || prev.nama_marketing,
                            nama_client_ttd: q.nama_client_ttd || prev.nama_client_ttd,
                            ongkos_kirim: q.ongkos_kirim !== undefined ? q.ongkos_kirim : prev.ongkos_kirim,
                            ppn_persen: q.ppn_persen !== undefined ? q.ppn_persen : prev.ppn_persen,
                            alamat_pt: q.alamat_pt || prev.alamat_pt,
                            up_penagihan: q.up_penagihan || prev.up_penagihan,
                            cp_penagihan: q.cp_penagihan || prev.cp_penagihan,
                            email: q.email_customer || prev.email,
                            bahan: q.bahan || prev.bahan
                        }));
                    }
                } catch(e) { console.error("Failed to fetch quotation", e); }
            };
            fetchQuo();
        }
    }, []);

    useEffect(() => {
        if (editData && form.items) {
            const newItems = [];
            const groupMap = new Map();
            form.items.forEach(item => {
                const key = `${item.rincian}-${item.bahan}-${item.bordir}-${item.harga_bordir}`;
                let gId = groupMap.get(key);
                if (!gId) {
                    gId = `group-${Date.now()}-${Math.random()}`;
                    groupMap.set(key, gId);
                }
                newItems.push({
                    ...item,
                    groupId: item.groupId || gId
                });
            });
            const hasChanges = form.items.some((item, idx) => item.groupId !== newItems[idx].groupId);
            if (hasChanges) {
                setForm(prev => ({ ...prev, items: newItems }));
            }
        } else if (!editData && form.items && form.items.length > 0 && !form.items[0].groupId) {
            const newItems = form.items.map((item, idx) => ({
                ...item,
                groupId: item.groupId || `group-initial-${idx}`
            }));
            setForm(prev => ({ ...prev, items: newItems }));
        }
    }, [editData]);

    // Helper: check if item needs approval (harga_satuan < harga_spv)
    const needsApproval = (item) => {
        const hargaSpv = Number(item.harga_spv) || 0;
        if (hargaSpv <= 0) return false;
        return Number(item.harga_satuan) < hargaSpv;
    };

    // Auto calculate totals (no global discount)
    useEffect(() => {
        const subtotal = form.items.reduce((acc, item) => {
            const itemTotal = Number(item.qty) * Number(item.harga_satuan);
            return acc + itemTotal;
        }, 0);
        const jumlah_ppn = subtotal * (Number(form.ppn_persen) / 100);
        const ongkir = Number(form.ongkos_kirim) || 0;
        const grand_total = subtotal + jumlah_ppn + ongkir;

        setForm(prev => ({ ...prev, subtotal, jumlah_ppn, grand_total }));
    }, [form.ppn_persen, form.items, form.ongkos_kirim]);

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
        let finalValue = value;
        
        // Handle comma as decimal for numeric fields
        if (['ppn_persen', 'ongkos_kirim'].includes(name)) {
            finalValue = String(value).replace(/,/g, '.').replace(/[^0-9.]/g, '');
            if (name === 'ppn_persen' && Number(finalValue) > 100) {
                finalValue = '100'; // Maksimal 100%
            }
        }
        
        // Real-time phone number validation
        if (name === 'cp_penagihan') {
            // Only allow digits and leading +
            finalValue = value.replace(/[^0-9+]/g, '');
            // Ensure + only at start
            if (finalValue.includes('+') && !finalValue.startsWith('+')) {
                finalValue = finalValue.replace(/\+/g, '');
            }
            // Validate format
            const phoneRegex = /^(\+?62|0)8[0-9]{7,12}$/;
            if (finalValue.length === 0) {
                setPhoneError('');
            } else if (!phoneRegex.test(finalValue)) {
                setPhoneError('Format salah. Gunakan: 08xxx / +62xxx (10-13 digit)');
            } else {
                setPhoneError('');
            }
        }
        
        if (name === 'payment_type' && finalValue === 'Non DP') {
            alert("Perhatian: Pemilihan metode 'Non DP' akan membuat order ini berstatus 'Menunggu Approval Non DP' setelah disimpan, dan butuh persetujuan atasan sebelum diproses.");
            setForm({ ...form, [name]: finalValue, status: 'Menunggu Approval Non DP' });
            return;
        }
        
        setForm({ ...form, [name]: finalValue });
    };

    const calculateSizeMultiplier = (sizeStr) => {
        if (!sizeStr) return 1;
        const s = sizeStr.toUpperCase().trim();
        
        if (/^X{2,}L$/.test(s)) {
            const xCount = s.length - 1; 
            return 1 + ((xCount - 1) * 0.1);
        }
        
        const match = s.match(/^(\d+)XL$/);
        if (match) {
            const num = parseInt(match[1]);
            if (num >= 2) return 1 + ((num - 1) * 0.1);
        }
        return 1;
    };

    const handleItemChange = (index, e) => {
        const { name, value } = e.target;
        const newItems = [...form.items];
        
        let finalValue = value;
        if (['harga_satuan', 'diskon_item', 'qty', 'harga_bordir'].includes(name)) {
            finalValue = String(value).replace(/,/g, '.').replace(/[^0-9.]/g, '');
        }
        
        if (name === 'diskon_item') {
            const diskon = Number(finalValue) || 0;
            const hjual = Number(newItems[index].harga_jual || 0);
            newItems[index].diskon_item = finalValue;
            if (hjual > 0) {
                newItems[index].harga_satuan = Math.max(0, hjual - diskon);
            }
        } else if (name === 'harga_bordir') {
            // Bordir ditambahkan ke harga_satuan (seperti diskon tapi menambah)
            const bordir = Number(finalValue) || 0;
            const base = Number(newItems[index].harga_satuan_base ?? newItems[index].harga_satuan) || 0;
            newItems[index].harga_bordir = finalValue;
            newItems[index].harga_satuan_base = base;
            newItems[index].harga_satuan = base + bordir; // ← harga satuan langsung bertambah
        } else if (name === 'harga_satuan') {
            const harga = Number(finalValue) || 0;
            const hjual = Number(newItems[index].harga_jual || 0);
            const bordir = Number(newItems[index].harga_bordir || 0);
            newItems[index].harga_satuan = finalValue;
            newItems[index].harga_satuan_base = harga - bordir; // simpan base
            if (hjual > 0 && harga <= hjual) {
                newItems[index].diskon_item = hjual - harga;
            } else {
                newItems[index].diskon_item = 0;
            }
        } else if (name === 'ukuran') {
            newItems[index].ukuran = value;
            if (newItems[index].base_harga_jual) {
                const multiplier = calculateSizeMultiplier(value);
                const newHJual = newItems[index].base_harga_jual * multiplier;
                const newHSpv = newItems[index].base_harga_spv * multiplier;
                
                newItems[index].harga_jual = newHJual;
                newItems[index].harga_spv = newHSpv;
                
                const diskon = Number(newItems[index].diskon_item || 0);
                newItems[index].harga_satuan = Math.max(0, newHJual - diskon);
            }
        } else {
            newItems[index][name] = value;
        }

        if (name === 'rincian') {
            filterProducts(index, value);
        }

        setForm({ ...form, items: newItems });
    };

    const getJenis = (prod) => {
        const k = prod.kategori;
        if (!k || k === 'Lainnya' || k === '') {
            const n = (prod.nama_produk || '').toUpperCase();
            if (n.includes('PDH')) return 'PDH';
            if (n.includes('PDL')) return 'PDL';
            if (n.includes('POLO')) return 'POLO';
            if (n.includes('WEARPACK')) return 'WEARPACK';
            if (n.includes('KEMEJA')) return 'KEMEJA';
            if (n.includes('CELANA')) return 'CELANA';
            if (n.includes('TOPI')) return 'TOPI';
            if (n.includes('APRON')) return 'APRON';
            if (n.includes('SERAGAM RS') || n.includes('OKK')) return 'SERAGAM RS';
        }
        return k || 'Lainnya';
    };

    const filterProducts = (index, value) => {
        setActiveItemIndex(index);
        if (Array.isArray(products)) {
            let pool = products;
            // Filter by item's selected bahan first
            const itemBahan = form.items[index]?.bahan;
            if (itemBahan) {
                pool = products.filter(p => {
                    const productBahan = p.bahan || 'UNIONE';
                    return productBahan.toUpperCase() === itemBahan.toUpperCase();
                });
            }
            if (value && value.length > 0) {
                const q = value.toLowerCase();
                pool = pool.filter(p => {
                    const kd = (p.displayKode || p.kode || '').toLowerCase();
                    const nm = (p.nama_produk || p.nama || '').toLowerCase();
                    const bh = (p.bahan || '').toLowerCase();
                    const jn = (getJenis(p) || '').toLowerCase();
                    return kd.includes(q) || nm.includes(q) || bh.includes(q) || jn.includes(q);
                });
            }
            setFilteredProducts(pool.slice(0, 30));
        } else {
            setFilteredProducts([]);
        }
    };

    const selectProduct = (index, prod) => {
        const targetItem = form.items[index];
        const groupKey = targetItem.groupId;
        const newItems = [...form.items];
        const kodeDisplay = prod.displayKode ? `[${prod.displayKode}] ` : (prod.kode ? `[${prod.kode}] ` : '');
        const rincian = `${kodeDisplay}${prod.nama_produk || prod.nama}`;
        const kode_produk = prod.displayKode || prod.kode || '';
        
        const hJual = Number(prod.harga_jual || prod.hpp_satuan || 0);
        const hSpv = Number(prod.harga_spv || 0);
        
        form.items.forEach((item, idx) => {
            if (item.groupId === groupKey) {
                newItems[idx].rincian = rincian;
                newItems[idx].kode_produk = kode_produk;
                newItems[idx].base_harga_jual = hJual;
                newItems[idx].base_harga_spv = hSpv;
                
                newItems[idx].harga_satuan = hJual;
                newItems[idx].harga_spv = hSpv;
                newItems[idx].harga_jual = hJual;
                newItems[idx].diskon_item = 0;
                newItems[idx].status_approval = '';
                
                if (newItems[idx].ukuran) {
                    const multiplier = calculateSizeMultiplier(newItems[idx].ukuran);
                    newItems[idx].harga_jual = hJual * multiplier;
                    newItems[idx].harga_spv = hSpv * multiplier;
                    newItems[idx].harga_satuan = hJual * multiplier;
                }
            }
        });
        
        setForm({ ...form, items: newItems });
        setFilteredProducts([]);
        setActiveItemIndex(null);
    };

    const sendApprove = async (index) => {
        alert("Silakan lengkapi form dan klik 'Simpan Order'. Pengajuan approval akan otomatis terkirim ke Owner berdasarkan harga yang Anda masukkan.");
        const newItems = [...form.items];
        newItems[index].status_approval = 'Akan diajukan saat disimpan';
        setForm({ ...form, items: newItems });
    };

    const getGroupedItems = () => {
        const groups = [];
        if (!form.items) return groups;
        form.items.forEach((item, index) => {
            const key = item.groupId || `group-fallback-${item.rincian}-${item.bahan}-${item.bordir}-${item.harga_bordir}`;
            let existing = groups.find(g => g.groupId === key);
            if (!existing) {
                existing = {
                    groupId: key,
                    bahan: item.bahan || '',
                    rincian: item.rincian || '',
                    bordir: item.bordir || '',
                    harga_bordir: item.harga_bordir || 0,
                    indices: []
                };
                groups.push(existing);
            }
            existing.indices.push(index);
        });
        return groups;
    };

    const handleGroupFieldChange = (groupIndices, field, value) => {
        const newItems = [...form.items];
        groupIndices.forEach(idx => {
            newItems[idx][field] = value;
            if (field === 'rincian' && idx === groupIndices[0]) {
                filterProducts(idx, value);
            }
        });
        setForm({ ...form, items: newItems });
    };

    const addSizeRow = (groupIndices) => {
        const template = form.items[groupIndices[0]];
        const newItem = {
            ...template,
            ukuran: '',
            qty: 1,
            status_approval: '',
            diskon_item: 0,
        };
        const lastIdx = groupIndices[groupIndices.length - 1];
        const newItems = [...form.items];
        newItems.splice(lastIdx + 1, 0, newItem);
        setForm({ ...form, items: newItems });
    };

    const removeSizeRow = (indexToRemove) => {
        if (form.items.length > 1) {
            const newItems = form.items.filter((_, idx) => idx !== indexToRemove);
            setForm({ ...form, items: newItems });
        }
    };

    const removeProductGroup = (groupIndices) => {
        if (form.items.length > groupIndices.length) {
            const newItems = form.items.filter((_, idx) => !groupIndices.includes(idx));
            setForm({ ...form, items: newItems });
        } else {
            const newGroupId = `group-${Date.now()}`;
            setForm({
                ...form,
                items: [{ groupId: newGroupId, rincian: '', ukuran: '', qty: 1, harga_satuan: 0, satuan: 'Pcs', diskon_item: 0, status_approval: '', harga_spv: 0, harga_jual: 0, base_harga_jual: 0, base_harga_spv: 0, bahan: '', bordir: '', harga_bordir: 0 }]
            });
        }
    };

    const addItem = () => {
        const newGroupId = `group-${Date.now()}-${Math.random()}`;
        setForm({
            ...form,
            items: [...form.items, { groupId: newGroupId, rincian: '', ukuran: '', qty: 1, harga_satuan: 0, satuan: 'Pcs', diskon_item: 0, status_approval: '', harga_spv: 0, harga_jual: 0, base_harga_jual: 0, base_harga_spv: 0, bahan: '', bordir: '', harga_bordir: 0 }]
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        // Enforce HTML5 validations (required, pattern, etc)
        if (!e.target.checkValidity()) {
            e.target.reportValidity();
            return;
        }
        if (phoneError) {
            alert('Nomor telepon tidak valid. Periksa kembali format nomor.');
            return;
        }
        setSaving(true);
        try {
            let orderId = editData?.id;
            const payload = {
                ...form,
                deadline: form.tipe_pesanan === 'Ready' ? null : form.deadline
            };
            if (editData && editData.id) {
                await api.put(`/marketing-offline/orders/${editData.id}`, payload);
            } else {
                const res = await api.post('/marketing-offline/orders', payload);
                orderId = res.data?.id;
            }

            // Also create or update quotation
            const qId = editData?.quotation_id || form.quotation_id;
            const hasExistingQuotation = Boolean(qId);
            
            if (hasExistingQuotation || (createQuo && !isEditingOrder)) {
                const quoData = {
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
                    ongkos_kirim: form.ongkos_kirim,
                    bahan: form.items.map(i => i.bahan).filter(Boolean).join(', ') || '',
                    grand_total_quo: form.grand_total,
                    payment_type: form.payment_type,
                    jenis_pembayaran: form.jenis_pembayaran,
                    payment_note: form.payment_note,
                    term_of_payment: form.term_of_payment,
                    nama_marketing: form.nama_marketing,
                    nama_client_ttd: form.nama_client_ttd,
                    status: 'Draft'
                };

                if (hasExistingQuotation && isEditingOrder) {
                    await updateQuotation(qId, quoData);
                    if (quoFiles.length > 0) {
                        const fd = new FormData();
                        quoFiles.forEach(f => fd.append('files', f));
                        await api.post(`/quotation/${qId}/upload`, fd);
                    }
                } else if (createQuo && !isEditingOrder && !hasExistingQuotation) {
                    const noRes = await getNextQuotationNumber('Banua');
                    quoData.no_quotation = noRes.data.no_quotation;
                    const quoRes = await createQuotation(quoData);
                    // Upload files if any
                    if (quoFiles.length > 0 && quoRes.data?.id) {
                        const fd = new FormData();
                        quoFiles.forEach(f => fd.append('files', f));
                        await api.post(`/quotation/${quoRes.data.id}/upload`, fd);
                    }
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
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Kategori Pelanggan</label>
                                    <select name="kategori_pelanggan" value={form.kategori_pelanggan} onChange={handleChange} className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#990000]/20 outline-none bg-white">
                                        <option value="Pelanggan Baru">Pelanggan Baru</option>
                                        <option value="Prospek">Prospek</option>
                                        <option value="Hot Prospek">Hot Prospek</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">UP (Nama Penagihan)</label>
                                    <input type="text" name="up_penagihan" value={form.up_penagihan} onChange={handleChange} placeholder="Bpk/Ibu ..." className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#990000]/20 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Contact Person (No HP) *</label>
                                    <input
                                        type="text"
                                        name="cp_penagihan"
                                        value={form.cp_penagihan}
                                        onChange={handleChange}
                                        required
                                        placeholder="08123456789 atau +628123456789"
                                        maxLength={15}
                                        className={`w-full p-2.5 border rounded-lg focus:ring-2 outline-none transition-colors ${
                                            phoneError
                                                ? 'border-red-400 focus:ring-red-200 bg-red-50'
                                                : form.cp_penagihan && !phoneError
                                                    ? 'border-green-400 focus:ring-green-200 bg-green-50'
                                                    : 'border-gray-200 focus:ring-[#990000]/20'
                                        }`}
                                    />
                                    {phoneError && (
                                        <p className="text-xs text-red-600 font-semibold mt-1 flex items-center gap-1">
                                            ⚠️ {phoneError}
                                        </p>
                                    )}
                                    {!phoneError && form.cp_penagihan && (
                                        <p className="text-xs text-green-600 font-semibold mt-1">✓ Nomor valid</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* 3. Detail Pemesanan & Items */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <h3 className="text-lg font-bold border-b border-gray-100 pb-3 mb-4 text-[#990000]">DETAIL PEMESANAN</h3>
                            
                            <div className="space-y-6 mb-6">
                                {getGroupedItems().map((group, groupIdx) => {
                                    const firstItem = form.items[group.indices[0]];
                                    return (
                                        <div key={group.groupId} className="bg-gray-55 p-5 rounded-2xl border border-gray-300 space-y-4 shadow-sm relative pt-4">
                                            {/* Header: Product Title & Delete Card Button */}
                                            <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                                                <span className="text-xs font-black text-white bg-[#990000] px-2.5 py-1 rounded-lg">
                                                    PRODUK #{groupIdx + 1}
                                                </span>
                                                <button type="button" onClick={() => removeProductGroup(group.indices)} className="text-red-500 hover:text-red-750 text-xs font-bold flex items-center gap-1 hover:bg-red-50 p-1.5 rounded-lg transition-colors">
                                                    <X size={14} /> Hapus Produk
                                                </button>
                                            </div>

                                            {/* Row 1: Bahan & Nama Produk */}
                                            <div className="grid grid-cols-12 gap-3">
                                                <div className="col-span-12 md:col-span-4 relative">
                                                     <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Jenis Bahan (Filter Produk)</label>
                                                     <select name="bahan" value={firstItem.bahan || ''} onChange={(e) => handleGroupFieldChange(group.indices, 'bahan', e.target.value)} className="w-full p-2 border border-red-200 rounded-lg focus:ring-2 focus:ring-[#990000]/20 outline-none bg-red-50/30 text-sm font-semibold text-[#990000]">
                                                         <option value="">-- Semua Bahan --</option>
                                                         <option value="NAGATA">NAGATA</option>
                                                         <option value="UNIONE">UNIONE</option>
                                                         <option value="MACAN DRILL">MACAN DRILL</option>
                                                         <option value="JAPAN DRILL">JAPAN DRILL</option>
                                                         <option value="ERRO">ERRO</option>
                                                         <option value="OXFORD">OXFORD</option>
                                                         <option value="RISPTOP">RISPTOP</option>
                                                         <option value="RIPSTOP">RIPSTOP</option>
                                                         <option value="KAOS">KAOS</option>
                                                         <option value="LACOSTE">LACOSTE</option>
                                                         <option value="DRY FIT">DRY FIT</option>
                                                         <option value="HIGH TWIST">HIGH TWIST</option>
                                                         <option value="CANVAS">CANVAS</option>
                                                         <option value="JEANS">JEANS</option>
                                                         <option value="PARAGON">PARAGON</option>
                                                         <option value="PARASUT">PARASUT</option>
                                                         <option value="PIQUE">PIQUE</option>
                                                         <option value="SERENA">SERENA</option>
                                                         <option value="TASLAN MILKY">TASLAN MILKY</option>
                                                     </select>
                                                </div>
                                                <div className="col-span-12 md:col-span-8 relative">
                                                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Nama Produk {firstItem.bahan && <span className="text-[#990000] lowercase">(Filter: {firstItem.bahan})</span>}</label>
                                                    <input 
                                                         type="text" 
                                                         name="rincian" 
                                                         value={firstItem.rincian || firstItem.nama_barang || ''} 
                                                         onChange={(e) => handleGroupFieldChange(group.indices, 'rincian', e.target.value)} 
                                                         onFocus={() => filterProducts(group.indices[0], firstItem.rincian || firstItem.nama_barang)}
                                                         onBlur={() => setTimeout(() => setActiveItemIndex(null), 200)}
                                                         placeholder="Nama Produk" 
                                                         required 
                                                         className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#990000]/20 outline-none text-sm font-medium" 
                                                         autoComplete="off" 
                                                    />
                                                    {activeItemIndex === group.indices[0] && filteredProducts.length > 0 && (
                                                         <ul className="absolute z-20 w-72 bg-white border border-gray-250 mt-1 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
                                                             {filteredProducts.map(prod => (
                                                                 <li key={prod.id} onClick={() => selectProduct(group.indices[0], prod)} className="p-2.5 hover:bg-red-50 cursor-pointer border-b border-gray-100 last:border-0">
                                                                     <div className="flex items-center gap-2">
                                                                         {(prod.displayKode || prod.kode) && (
                                                                             <span className="text-[10px] font-black text-white bg-[#990000] px-1.5 py-0.5 rounded font-mono shrink-0">
                                                                                 {prod.displayKode || prod.kode}
                                                                             </span>
                                                                         )}
                                                                         <span className="text-xs font-semibold text-gray-800 truncate">{prod.nama_produk}</span>
                                                                     </div>
                                                                     <div className="flex justify-between mt-1">
                                                                         <span className="text-[10px] text-gray-400">{prod.bahan || '-'} {prod.variasi ? `| ${prod.variasi}` : ''}</span>
                                                                         <span className="text-[10px] font-bold text-[#990000]">Rp {Math.round(Number(prod.harga_jual || prod.hpp_satuan || 0)).toLocaleString('id-ID')}</span>
                                                                     </div>
                                                                 </li>
                                                             ))}
                                                         </ul>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Row 2: Sub-rows (Variations) section */}
                                            <div className="space-y-3 border-t border-b border-gray-150 py-3">
                                                 <div className="hidden md:grid grid-cols-12 gap-2 text-center text-[10px] font-bold text-gray-400 uppercase">
                                                     <div className="col-span-3">Detail (Ukuran)</div>
                                                     <div className="col-span-2">Qty</div>
                                                     <div className="col-span-2">Unit</div>
                                                     <div className="col-span-2">Harga Satuan</div>
                                                     <div className="col-span-2">Diskon Item</div>
                                                     <div className="col-span-1">Aksi</div>
                                                 </div>

                                                 {group.indices.map((idx) => {
                                                     const item = form.items[idx];
                                                     return (
                                                         <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-gray-50/50 p-2 rounded-lg border border-gray-150 relative">
                                                             <div className="col-span-6 md:col-span-3">
                                                                 <label className="block md:hidden text-[9px] font-bold text-gray-400 mb-0.5">Detail (Ukuran)</label>
                                                                 <input type="text" name="ukuran" value={item.ukuran || ''} onChange={(e) => handleItemChange(idx, e)} placeholder="Cth: S" className="w-full p-2 border border-gray-300 rounded-lg text-center text-sm" />
                                                             </div>
                                                             <div className="col-span-6 md:col-span-2">
                                                                 <label className="block md:hidden text-[9px] font-bold text-gray-400 mb-0.5">Qty</label>
                                                                 <input type="text" inputMode="decimal" name="qty" value={item.qty} onChange={(e) => handleItemChange(idx, e)} required className="w-full p-2 border border-gray-300 rounded-lg text-center text-sm" />
                                                             </div>
                                                             <div className="col-span-6 md:col-span-2">
                                                                 <label className="block md:hidden text-[9px] font-bold text-gray-400 mb-0.5">Unit</label>
                                                                 <input type="text" name="satuan" value={item.satuan || 'Pcs'} onChange={(e) => handleItemChange(idx, e)} className="w-full p-2 border border-gray-300 rounded-lg text-center text-sm" />
                                                             </div>
                                                             <div className="col-span-6 md:col-span-2">
                                                                 <label className="block md:hidden text-[9px] font-bold text-gray-400 mb-0.5 text-right">Harga Satuan</label>
                                                                 <input type="text" inputMode="decimal" name="harga_satuan" value={item.harga_satuan} onChange={(e) => handleItemChange(idx, e)} required className="w-full p-2 border border-gray-300 rounded-lg text-right text-sm font-semibold" />
                                                             </div>
                                                             <div className="col-span-12 md:col-span-2">
                                                                 <label className="block md:hidden text-[9px] font-bold text-gray-400 mb-0.5 text-right">Diskon Item</label>
                                                                 <div className="flex gap-1 items-center">
                                                                     <input type="text" inputMode="decimal" name="diskon_item" value={item.diskon_item || ''} onChange={(e) => handleItemChange(idx, e)} placeholder="0" className={`w-full p-2 border rounded-lg text-right text-sm ${needsApproval(item) ? 'border-red-400 bg-red-50 text-red-700' : 'border-gray-300 text-red-600'}`} />
                                                                     {needsApproval(item) && item.status_approval !== 'Menunggu Approval Owner' && (
                                                                         <button type="button" onClick={() => sendApprove(idx)} className="p-1.5 bg-red-100 text-red-700 hover:bg-red-200 rounded text-[10px] font-bold shrink-0 whitespace-nowrap">Approve</button>
                                                                     )}
                                                                 </div>
                                                                 {needsApproval(item) && !item.status_approval && (
                                                                     <p className="text-[9px] text-red-500 font-bold mt-1 text-right">⚠ Harga di bawah SPV (Rp {Math.round(Number(item.harga_spv)).toLocaleString('id-ID')}), butuh approval Owner</p>
                                                                 )}
                                                                 {!needsApproval(item) && Number(item.diskon_item) > 0 && (
                                                                     <p className="text-[9px] text-green-600 font-bold mt-1 text-right">✓ Diskon OK</p>
                                                                 )}
                                                                 {item.status_approval && <p className="text-[9px] text-yellow-600 font-bold mt-1 text-right">⏳ {item.status_approval}</p>}
                                                             </div>
                                                             <div className="col-span-12 md:col-span-1 flex justify-center gap-2 mt-2 md:mt-0">
                                                                 <button type="button" onClick={() => addSizeRow(group.indices)} title="Tambah Ukuran" className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors">
                                                                     <Plus size={16} />
                                                                 </button>
                                                                 {form.items.length > 1 && (
                                                                     <button type="button" onClick={() => removeSizeRow(idx)} title="Hapus Ukuran" className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                                                         <X size={16} />
                                                                     </button>
                                                                 )}
                                                             </div>
                                                         </div>
                                                     );
                                                 })}
                                            </div>

                                            {/* Row 3: Bordir */}
                                            <div className="grid grid-cols-12 gap-3 pt-2">
                                                 <div className="col-span-12 md:col-span-6">
                                                     <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Bordir (Keterangan)</label>
                                                     <input type="text" name="bordir" value={firstItem.bordir || ''} onChange={(e) => handleGroupFieldChange(group.indices, 'bordir', e.target.value)} placeholder="Contoh: Logo dada kiri" className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#990000]/20 outline-none text-sm" />
                                                 </div>
                                                 <div className="col-span-12 md:col-span-6">
                                                     <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Harga Bordir/pcs</label>
                                                     <input type="text" inputMode="decimal" name="harga_bordir" value={firstItem.harga_bordir || ''} onChange={(e) => handleGroupFieldChange(group.indices, 'harga_bordir', e.target.value)} placeholder="0" className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#990000]/20 outline-none text-right text-sm text-orange-600 font-semibold" />
                                                     {Number(firstItem.harga_bordir) > 0 && <p className="text-[9px] text-orange-500 mt-1 text-right">+Rp {Math.round(group.indices.reduce((s, i) => s + (Number(form.items[i].qty || 1) * Number(firstItem.harga_bordir)), 0)).toLocaleString('id-ID')}</p>}
                                                 </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                <button type="button" onClick={addItem} className="text-sm font-bold text-[#990000] bg-red-50 hover:bg-red-100 px-5 py-2.5 rounded-xl border border-red-150 transition-colors flex items-center gap-1.5">
                                    <Plus size={16} /> Tambah Produk
                                </button>
                            </div>

                            <div className="flex justify-end">
                                <div className="w-full md:w-1/2 lg:w-1/3 space-y-4 bg-gray-50 p-5 rounded-xl border border-gray-200">
                                    <div className="flex items-center justify-between gap-4">
                                        <label className="text-sm font-semibold text-gray-700 w-1/3">Subtotal</label>
                                        <span className="w-2/3 text-right font-bold text-gray-800">Rp {Math.round(form.subtotal).toLocaleString('id-ID')}</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-4">
                                        <label className="text-sm font-semibold text-gray-700 w-1/3">
                                            PPN (%)
                                            <span className="block text-[10px] text-gray-400 font-normal mt-0.5">(Jika dibutuhkan)</span>
                                        </label>
                                        <input type="text" inputMode="decimal" name="ppn_persen" value={form.ppn_persen} onChange={handleChange} className="w-1/3 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#990000]/20 outline-none text-right" />
                                        <span className="w-1/3 text-right text-sm text-gray-600">Rp {Math.round(form.jumlah_ppn).toLocaleString('id-ID')}</span>
                                    </div>
                                    {/* Global discount removed; per-item discounts are used instead */}
                                    <div className="flex items-center justify-between gap-4">
                                        <label className="text-sm font-semibold text-gray-700 w-1/3">Ongkos Kirim</label>
                                        <input type="text" inputMode="decimal" name="ongkos_kirim" value={form.ongkos_kirim} onChange={handleChange} className="w-1/3 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#990000]/20 outline-none text-right" placeholder="0" />
                                        <span className="w-1/3 text-right text-sm text-gray-600 font-bold">+ Rp {Math.round(Number(form.ongkos_kirim || 0)).toLocaleString('id-ID')}</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-4 pt-4 border-t-2 border-gray-300">
                                        <label className="text-base font-extrabold text-[#990000] w-1/3">GRAND TOTAL</label>
                                        <span className="w-2/3 text-right text-xl font-black text-[#990000]">Rp {Math.round(form.grand_total).toLocaleString('id-ID')}</span>
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
                                        <option value="Non DP">Non DP (Butuh Approval Atasan)</option>
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
                            <div className={`grid grid-cols-1 md:grid-cols-${form.tipe_pesanan === 'Ready' ? '2' : '3'} gap-4 mb-4`}>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Ketersediaan Produk *</label>
                                    <select name="tipe_pesanan" value={form.tipe_pesanan || 'PO'} onChange={handleChange} className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#990000]/20 outline-none font-medium">
                                        <option value="PO">Pre-Order (Butuh Produksi)</option>
                                        <option value="Ready">Ready Stock (Gudang)</option>
                                    </select>
                                </div>
                                {form.tipe_pesanan !== 'Ready' && (
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Deadline Produksi (Min. 14 Hari) *</label>
                                        <input type="date" name="deadline" value={form.deadline ? form.deadline.split('T')[0] : ''} onChange={handleChange} min={new Date(new Date().setDate(new Date().getDate() + 14)).toISOString().split('T')[0]} required className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#990000]/20 outline-none" />
                                        <div className="flex gap-2 mt-2">
                                            <button type="button" onClick={() => setForm({...form, deadline: new Date(new Date().setDate(new Date().getDate() + 14)).toISOString().split('T')[0]})} className="text-[10px] px-2 py-1 bg-gray-100 border border-gray-200 rounded text-gray-600 hover:bg-gray-200">2 Minggu</button>
                                            <button type="button" onClick={() => setForm({...form, deadline: new Date(new Date().setDate(new Date().getDate() + 21)).toISOString().split('T')[0]})} className="text-[10px] px-2 py-1 bg-gray-100 border border-gray-200 rounded text-gray-600 hover:bg-gray-200">3 Minggu</button>
                                            <button type="button" onClick={() => setForm({...form, deadline: new Date(new Date().setDate(new Date().getDate() + 28)).toISOString().split('T')[0]})} className="text-[10px] px-2 py-1 bg-gray-100 border border-gray-200 rounded text-gray-600 hover:bg-gray-200">4 Minggu</button>
                                        </div>
                                    </div>
                                )}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Catatan Tambahan (Opsional)</label>
                                    <textarea name="catatan" value={form.catatan} onChange={handleChange} rows={1} placeholder="Instruksi khusus produksi..." className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#990000]/20 outline-none resize-none"></textarea>
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
                                        <select name="nama_marketing" value={form.nama_marketing} onChange={handleChange} className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#990000]/20 outline-none bg-white">
                                            <option value="">-- Pilih Marketing --</option>
                                            <option value="Noa">Noa</option>
                                            <option value="Banu">Banu</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Nama Client (TTD)</label>
                                        <input type="text" name="nama_client_ttd" value={form.nama_client_ttd} onChange={handleChange} placeholder="Nama client yang menandatangani" className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#990000]/20 outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Status Persetujuan Order</label>
                                        <select name="approval_status" value={form.approval_status} onChange={handleChange} disabled className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#990000]/20 outline-none bg-gray-100 cursor-not-allowed">
                                            <option value="Belum Disetujui">Belum Disetujui</option>
                                            <option value="Sudah Disetujui">Sudah Disetujui</option>
                                        </select>
                                        <p className="text-[10px] text-gray-500 mt-1">Status ini otomatis berubah ketika disetujui oleh Finance/Owner.</p>
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
