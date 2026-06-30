import NotificationBell from '../components/NotificationBell';
import { Bell } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { Search, Eye, DollarSign, XCircle, X, CheckCircle, AlertTriangle, Clock, Upload, FileText, Plus, UserCircle } from 'lucide-react';

const fmt = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n || 0);
const today = () => new Date().toISOString().split('T')[0];

const STATUS_STYLES = {
  Paid: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  Unpaid: 'bg-amber-100 text-amber-700 border border-amber-200',
  'Due Date': 'bg-blue-100 text-blue-700 border border-blue-200',
  'Over Due': 'bg-red-100 text-red-700 border border-red-200',
  Void: 'bg-gray-100 text-gray-500 border border-gray-200',
};

import { getAllPiutang, createPiutang, payPiutang, voidPiutang } from '../api/piutangApi';
import { getInvoices } from '../api/invoiceApi';

const EMPTY_PAY = { nominal:'', tanggal: today(), bank:'', keterangan:'', bukti: null };
const EMPTY_ADD = { no_ref: '', customer: '', invoice_id: '', cabang: 'Banua', nominal: 0, jatuh_tempo: today(), keterangan: '' };

export default function AccountsReceivable() {
  const [data, setData] = useState([]);
  const [dbData, setDbData] = useState([]);
  const [summary, setSummary] = useState({ total:0, lunas:0, belumLunas:0, overdue:0 });
  const [aging, setAging] = useState({ less7:0, over7:0, over14:0, over30:0, over60:0 });
  const [search, setSearch] = useState('');
  const [fStatus, setFStatus] = useState('');
  const [fCabang, setFCabang] = useState('');
  const [fTgl, setFTgl] = useState('');
  const [loading, setLoading] = useState(false);
  const [sel, setSel] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showPay, setShowPay] = useState(false);
  const [showVoid, setShowVoid] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [payForm, setPayForm] = useState(EMPTY_PAY);
  const [addForm, setAddForm] = useState(EMPTY_ADD);
  const [invoices, setInvoices] = useState([]);
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => { loadDb(); loadInvoices(); }, []);
  useEffect(() => { applyFilter(); }, [search, fStatus, fCabang, fTgl, dbData]);

  const loadDb = async () => {
    setLoading(true);
    try {
        const res = await getAllPiutang();
        setDbData(res.data.data || []);
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  const loadInvoices = async () => {
    try {
        const res = await getInvoices();
        setInvoices(res.data.data || []);
    } catch(e) { console.error(e); }
  };

  const handleInvoiceSelect = (no_invoice) => {
    const inv = invoices.find(i => i.no_invoice === no_invoice);
    if (inv) {
        setAddForm(p => ({
            ...p,
            invoice_id: inv.no_invoice,
            customer: inv.nama_pt || '',
            cabang: inv.cabang || 'Banua',
            nominal: inv.grand_total || 0,
            jatuh_tempo: inv.tanggal_jatuh_tempo ? inv.tanggal_jatuh_tempo.split('T')[0] : p.jatuh_tempo,
        }));
    } else {
        setAddForm(p => ({ ...p, invoice_id: no_invoice }));
    }
  };

  const applyFilter = () => {
    const filtered = dbData.filter(r => {
      const ms = !search || r.customer.toLowerCase().includes(search.toLowerCase()) || r.no_ref.toLowerCase().includes(search.toLowerCase());
      const mst = !fStatus || r.status === fStatus;
      const mc = !fCabang || r.cabang === fCabang;
      return ms && mst && mc;
    });
    setData(filtered);
    setSummary({
      total: filtered.reduce((s,r)=>s+Number(r.nominal),0),
      lunas: filtered.filter(r=>r.status==='Paid').reduce((s,r)=>s+Number(r.nominal),0),
      belumLunas: filtered.filter(r=>r.status==='Unpaid' || r.status==='Due Date').reduce((s,r)=>s+Number(r.sisa),0),
      overdue: filtered.filter(r=>r.status==='Over Due').reduce((s,r)=>s+Number(r.sisa),0),
    });
    
    // Calculate aging 
    let less7=0, over7=0, over14=0, over30=0, over60=0;
    const now = new Date();
    filtered.forEach(r => {
        if (r.status === 'Paid' || r.status === 'Void') return;
        const due = new Date(r.jatuh_tempo);
        const diffTime = now - due;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        // if diffDays > 0, it means it's overdue
        if (diffDays < 7) less7 += Number(r.sisa);
        else if (diffDays >= 7 && diffDays < 14) over7 += Number(r.sisa);
        else if (diffDays >= 14 && diffDays < 30) over14 += Number(r.sisa);
        else if (diffDays >= 30 && diffDays < 60) over30 += Number(r.sisa);
        else if (diffDays >= 60) over60 += Number(r.sisa);
    });
    setAging({ less7, over7, over14, over30, over60 });
  };

  const openDetail = (item) => { setSel(item); setShowDetail(true); };
  const openPay   = (item) => { setSel(item); setPayForm(EMPTY_PAY); setShowPay(true); };
  const openVoid  = (item) => { setSel(item); setShowVoid(true); };

  const handlePay = async (e) => {
    e.preventDefault();
    try {
        await payPiutang(sel.id, { nominal_bayar: payForm.nominal });
        alert('Pembayaran berhasil dicatat!');
        setShowPay(false);
        loadDb();
    } catch(e) { console.error(e); }
  };

  const handleVoid = async () => {
    try {
        await voidPiutang(sel.id);
        alert(`AR ${sel.no_ref} berhasil di-void.`);
        setShowVoid(false);
        loadDb();
    } catch(e) { console.error(e); }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
        await createPiutang(addForm);
        alert('Piutang berhasil ditambahkan!');
        setShowAdd(false);
        setAddForm(EMPTY_ADD);
        loadDb();
    } catch(e) { console.error(e); }
  };

  const SUMMARY_CARDS = [
    { label:'Revenue',       value: summary.total, color:'blue', icon:<FileText size={20}/> },
    { label:'Sudah Lunas',   value: summary.lunas, color:'emerald', icon:<CheckCircle size={20}/> },
    { label:'Belum Lunas',   value: summary.belumLunas, color:'amber', icon:<Clock size={20}/> },
    { label:'Over Due',      value: summary.overdue, color:'red', icon:<AlertTriangle size={20}/> },
  ];

  const AGING_CARDS = [
    { label:'Kurang 7 Hari',  val: aging.less7, grad:'from-emerald-500 to-teal-500' },
    { label:'Lebih 7 Hari',   val: aging.over7, grad:'from-blue-500 to-indigo-500' },
    { label:'Lebih 14 Hari',  val: aging.over14, grad:'from-amber-500 to-orange-500' },
    { label:'Lebih 30 Hari',  val: aging.over30, grad:'from-orange-600 to-red-500' },
    { label:'Lebih 60 Hari',  val: aging.over60, grad:'from-red-600 to-rose-600' },
  ];

  return (
    <div className="flex bg-gray-50 min-h-screen font-sans">
      <Sidebar />
      <main className="flex-1 flex flex-col pt-16 md:pt-0 h-screen overflow-hidden">
        {/* TOPBAR */}
        <header className="h-auto flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 sm:px-10 py-4 gap-4 sm:gap-0 mb-4">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Cari customer / No.Ref..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-2.5 bg-white rounded-full border border-gray-200 shadow-sm text-sm focus:outline-none focus:border-[#990000] focus:ring-2 focus:ring-red-100 transition-all"
            />
          </div>
          <div className="flex items-center gap-6">

          <NotificationBell />
            <div className="relative">
              <div className="bg-white p-1.5 rounded-full shadow-sm cursor-pointer hover:shadow-md transition-all border border-gray-100" onClick={() => setShowProfile(!showProfile)}>
                <UserCircle size={32} className="text-gray-400 hover:text-[#990000] transition-colors" />
              </div>
              
              {showProfile && (
                <div className="absolute right-0 mt-3 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                  <div className="p-4 bg-red-50/50">
                    <p className="text-sm font-black text-gray-900">{JSON.parse(localStorage.getItem('user'))?.nama || JSON.parse(localStorage.getItem('user'))?.username || 'Admin'}</p>
                    <p className="text-[10px] font-bold text-[#990000] uppercase tracking-wider mt-0.5">{(JSON.parse(localStorage.getItem('user'))?.role || '').replace('_', ' ')}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-4 sm:px-10 pb-10">
          <div className="bg-white p-6 min-h-full rounded-2xl shadow-sm border border-gray-100 flex flex-col">
          {/* Header */}
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                Accounts Receivable
              </h1>
              <p className="text-gray-500 font-medium mt-1 text-sm">Manajemen piutang usaha pelanggan</p>
            </div>
            <button onClick={() => setShowAdd(true)} className="inline-flex items-center gap-2 bg-[#990000] hover:bg-red-800 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-red-900/20 transition-all hover:scale-105">
              <Plus size={16} /> Tambah AR Baru
            </button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {SUMMARY_CARDS.map(({ label, value, color }) => (
              <div key={label} className={`bg-white rounded-2xl p-5 shadow-sm border border-gray-100 border-l-[6px] border-l-${color}-500 flex flex-col justify-center transition-all hover:-translate-y-0.5 hover:shadow-md`}>
                <p className="text-xs text-gray-500 font-medium mb-1">{label}</p>
                <h3 className="text-lg lg:text-xl font-black text-gray-900 break-words">{fmt(value)}</h3>
              </div>
            ))}
          </div>

          {/* Aging Cards */}
          <div className="mb-6">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Aging Piutang</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { label: 'Kurang 7 Hari', val: aging.less7 },
                { label: 'Lebih 7 Hari', val: aging.over7 },
                { label: 'Lebih 14 Hari', val: aging.over14 },
                { label: 'Lebih 30 Hari', val: aging.over30 },
                { label: 'Lebih 60 Hari', val: aging.over60 },
              ].map(({ label, val }, idx) => (
                <div key={idx} className="bg-white rounded-2xl p-4 xl:p-5 shadow-sm border border-gray-100 border-l-[6px] border-l-[#990000] flex flex-col justify-center transition-all hover:-translate-y-0.5 hover:shadow-md">
                  <p className="text-[11px] text-gray-500 font-medium mb-1 truncate" title={label}>{label}</p>
                  <h3 className="text-sm lg:text-base font-black text-gray-900 truncate" title={fmt(val)}>{fmt(val)}</h3>
                </div>
              ))}
            </div>
          </div>

          {/* Filters + Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex flex-wrap gap-3">
              <select value={fStatus} onChange={e => setFStatus(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-[#990000]">
                <option value="">Semua Status</option>
                <option>Unpaid</option><option>Paid</option><option>Due Date</option><option>Over Due</option><option>Void</option>
              </select>
              <select value={fCabang} onChange={e => setFCabang(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-[#990000]">
                <option value="">Semua Cabang</option>
                <option value="Banua">PT Banua Mitra Lestari</option>
                <option value="Tanaka">PT Tanaka Rizqi Barokah</option>
                <option value="Acestreet">Accestreat</option>
              </select>
              <input type="date" value={fTgl} onChange={e => setFTgl(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#990000]" />
              {(search || fStatus || fCabang || fTgl) && (
                <button onClick={() => { setSearch(''); setFStatus(''); setFCabang(''); setFTgl(''); }}
                  className="px-3 py-2 text-xs text-gray-500 hover:text-red-600 border border-gray-200 rounded-xl transition-colors">Reset</button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gradient-to-r from-[#990000] to-red-800 text-white">
                  <tr>
                    {['No.Ref','Customer','Invoice Terkait','Total Piutang','Terbayar','Sisa','Jatuh Tempo','Aging','Status','Aksi'].map(h => (
                      <th key={h} className="py-3 px-4 text-left font-semibold text-xs whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={10} className="text-center py-12 text-gray-400">Memuat data...</td></tr>
                  ) : data.length === 0 ? (
                    <tr><td colSpan={10} className="text-center py-12 text-gray-400">Tidak ada data AR.</td></tr>
                  ) : data.map((item, idx) => (
                    <tr key={item.id} className={`border-b border-gray-50 hover:bg-red-50/20 transition-colors ${idx%2===0?'bg-white':'bg-gray-50/30'}`}>
                      <td className="py-3 px-4 font-bold text-[#990000] whitespace-nowrap">{item.no_ref}</td>
                      <td className="py-3 px-4 font-medium text-gray-800">{item.customer}</td>
                      <td className="py-3 px-4 text-blue-600 font-medium">{item.invoice_id}</td>
                      <td className="py-3 px-4 text-right font-semibold text-gray-900">{fmt(item.nominal)}</td>
                      <td className="py-3 px-4 text-right text-emerald-700 font-semibold">{fmt(item.terbayar)}</td>
                      <td className="py-3 px-4 text-right font-black text-gray-900">{fmt(item.sisa)}</td>
                      <td className="py-3 px-4 text-gray-600 whitespace-nowrap">{item.jatuh_tempo ? new Date(item.jatuh_tempo).toLocaleDateString('id-ID') : '-'}</td>
                      <td className="py-3 px-4 text-gray-600 whitespace-nowrap">
                        {(() => {
                          if (item.status === 'Paid' || item.status === 'Void') return '-';
                          if (!item.jatuh_tempo) return '-';
                          const due = new Date(item.jatuh_tempo);
                          const diffTime = new Date() - due;
                          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                          if (diffDays > 0) return <span className="text-red-600 font-bold">+{diffDays} Hari</span>;
                          if (diffDays === 0) return <span className="text-amber-600 font-bold">Hari Ini</span>;
                          return <span className="text-green-600 font-bold">{Math.abs(diffDays)} Hari Lagi</span>;
                        })()}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${STATUS_STYLES[item.status]||''}`}>{item.status}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => openDetail(item)} className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors" title="Detail"><Eye size={14}/></button>
                          {item.status !== 'Paid' && item.status !== 'Void' && (
                            <button onClick={() => openPay(item)} className="p-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg transition-colors" title="Catat Pembayaran"><DollarSign size={14}/></button>
                          )}
                          {item.status !== 'Void' && (
                            <button onClick={() => openVoid(item)} className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors" title="Void"><XCircle size={14}/></button>
                          )}
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
      </main>

      {/* DETAIL MODAL */}
      {showDetail && sel && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 bg-[#990000] flex justify-between items-center">
              <h3 className="font-black text-white text-lg">Detail AR — {sel.no_ref}</h3>
              <button onClick={() => setShowDetail(false)} className="text-white/70 hover:text-white"><X size={20}/></button>
            </div>
            <div className="p-6 space-y-1 text-sm">
              {[['Customer',sel.customer],['Invoice Terkait',sel.invoice_id],['Cabang',sel.cabang],
                ['Total Piutang',fmt(sel.nominal)],['Terbayar',fmt(sel.terbayar)],['Sisa Piutang',fmt(sel.sisa)],
                ['Jatuh Tempo',sel.jatuh_tempo],['Status',sel.status],['Keterangan',sel.keterangan]].map(([l,v]) => (
                <div key={l} className="flex gap-3 py-2 border-b border-gray-50">
                  <span className="w-36 text-gray-400 font-semibold shrink-0">{l}</span>
                  <span className="font-bold text-gray-800">{v}</span>
                </div>
              ))}
            </div>
            <div className="px-6 py-3 bg-gray-50 flex justify-end">
              <button onClick={() => setShowDetail(false)} className="px-5 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold text-sm">Tutup</button>
            </div>
          </div>
        </div>
      )}

      {/* PAYMENT MODAL */}
      {showPay && sel && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-emerald-50">
              <div>
                <h3 className="font-black text-gray-900 text-lg">💰 Catat Pembayaran</h3>
                <p className="text-xs text-emerald-600 font-semibold mt-0.5">{sel.no_ref} · Sisa: {fmt(sel.sisa)}</p>
              </div>
              <button onClick={() => setShowPay(false)} className="text-gray-400 hover:text-red-500"><X size={20}/></button>
            </div>
            <form onSubmit={handlePay} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">No.Ref AR</label>
                <input type="text" value={sel.no_ref} readOnly className="w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-sm font-medium text-gray-600" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Nominal Bayar (Rp)</label>
                <input type="number" required min="1" max={sel.sisa} value={payForm.nominal}
                  onChange={e => setPayForm(p=>({...p,nominal:e.target.value}))}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500" placeholder="0" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Tanggal Bayar</label>
                  <input type="date" required value={payForm.tanggal}
                    onChange={e => setPayForm(p=>({...p,tanggal:e.target.value}))}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Bank Penerima</label>
                  <select required value={payForm.bank} onChange={e => setPayForm(p=>({...p,bank:e.target.value}))}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500">
                    <option value="">Pilih Bank...</option>
                    <option>BCA Tanaka</option><option>BRI Tanaka</option><option>Mandiri Tanaka</option><option>BNI Tanaka</option><option>Cash Tanaka</option>
                    <option>BCA Banua</option><option>BRI Banua</option><option>Mandiri Banua</option><option>BNI Banua</option><option>Cash Banua</option>
                    <option>BCA Acestreet</option><option>BRI Acestreet</option><option>Mandiri Acestreet</option><option>BNI Acestreet</option><option>Cash Acestreet</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Keterangan</label>
                <textarea value={payForm.keterangan} onChange={e => setPayForm(p=>({...p,keterangan:e.target.value}))}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 resize-none" rows={2} placeholder="Catatan pembayaran..." />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Upload Bukti Transfer</label>
                <label className="flex items-center gap-3 px-4 py-3 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/50 transition-all">
                  <Upload size={18} className="text-gray-400" />
                  <span className="text-sm text-gray-500">{payForm.bukti ? payForm.bukti.name : 'Klik untuk upload bukti...'}</span>
                  <input type="file" className="hidden" accept="image/*,application/pdf" onChange={e => setPayForm(p=>({...p,bukti:e.target.files[0]}))} />
                </label>
              </div>
              <div className="pt-2 flex justify-end gap-3">
                <button type="button" onClick={() => setShowPay(false)} className="px-5 py-2.5 text-sm font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all">Batal</button>
                <button type="submit" className="px-6 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-lg transition-all">Simpan Pembayaran</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VOID MODAL */}
      {showVoid && sel && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-7 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle size={32} className="text-red-600" />
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2">Void Piutang?</h3>
            <p className="text-sm text-gray-500 mb-1">{sel.customer}</p>
            <p className="text-sm font-bold text-gray-800 mb-6">{sel.no_ref} · {fmt(sel.sisa)}</p>
            <div className="flex gap-3">
              <button onClick={() => setShowVoid(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl font-semibold text-gray-700 hover:bg-gray-50">Batal</button>
              <button onClick={handleVoid} className="flex-1 py-2.5 bg-[#990000] text-white rounded-xl font-bold hover:bg-red-800 transition-colors">Ya, Void</button>
            </div>
          </div>
        </div>
      )}

      {/* ADD MODAL */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-blue-50">
              <h3 className="font-black text-gray-900 text-lg">📝 Tambah Piutang Baru</h3>
              <button onClick={() => setShowAdd(false)} className="text-gray-400 hover:text-red-500"><X size={20}/></button>
            </div>
            <form onSubmit={handleAdd} className="p-6 space-y-4">
              {/* Invoice Selector — auto-fill data */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">🔗 Pilih Invoice (Auto-Fill)</label>
                <select value={addForm.invoice_id} onChange={e => handleInvoiceSelect(e.target.value)} className="w-full px-4 py-2.5 border border-blue-200 bg-blue-50 rounded-xl text-sm focus:border-blue-500 outline-none">
                    <option value="">— Pilih Invoice (opsional) —</option>
                    {invoices.map(inv => (
                        <option key={inv.id} value={inv.no_invoice}>{inv.no_invoice} · {inv.nama_pt} · {inv.cabang}</option>
                    ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">No. Ref AR</label>
                    <input type="text" required value={addForm.no_ref} onChange={e=>setAddForm(p=>({...p,no_ref:e.target.value}))} className="w-full px-4 py-2.5 border rounded-xl text-sm focus:border-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Cabang</label>
                    <select value={addForm.cabang} onChange={e=>setAddForm(p=>({...p,cabang:e.target.value}))} className="w-full px-4 py-2.5 border rounded-xl text-sm focus:border-blue-500 outline-none">
                        <option value="Banua">PT Banua Mitra Lestari</option>
                        <option value="Tanaka">PT Tanaka Rizqi Barokah</option>
                        <option value="Acestreet">Accestreat</option>
                    </select>
                  </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Customer</label>
                <input type="text" required value={addForm.customer} onChange={e=>setAddForm(p=>({...p,customer:e.target.value}))} className="w-full px-4 py-2.5 border rounded-xl text-sm focus:border-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Tanggal Jatuh Tempo</label>
                <input type="date" required value={addForm.jatuh_tempo} onChange={e=>setAddForm(p=>({...p,jatuh_tempo:e.target.value}))} className="w-full px-4 py-2.5 border rounded-xl text-sm focus:border-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Total Nominal (Rp)</label>
                <input type="number" required value={addForm.nominal} onChange={e=>setAddForm(p=>({...p,nominal:e.target.value}))} className="w-full px-4 py-2.5 border rounded-xl text-sm focus:border-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Keterangan</label>
                <textarea value={addForm.keterangan} onChange={e=>setAddForm(p=>({...p,keterangan:e.target.value}))} className="w-full px-4 py-2.5 border rounded-xl text-sm focus:border-blue-500 outline-none resize-none" rows={2} />
              </div>
              <div className="pt-2 flex justify-end gap-3">
                <button type="button" onClick={() => setShowAdd(false)} className="px-5 py-2.5 text-sm font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all">Batal</button>
                <button type="submit" className="px-6 py-2.5 text-sm font-bold text-white bg-[#990000] hover:bg-red-800 rounded-xl shadow-lg transition-all">Simpan AR</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
