import NotificationBell from '../components/NotificationBell';
import { Bell } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { getAllPettyCash, getPettyCashSummary, createPettyCash, replenishPettyCash, voidPettyCash } from '../api/pettyCashApi';
import { Plus, Search, Eye, Ban, Download, RefreshCw, X, AlertTriangle, DollarSign, UserCircle } from 'lucide-react';

const fmt = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n || 0);
const today = () => new Date().toISOString().split('T')[0];
const CABANG = ['Banua','Tanaka','Acestreet'];
const CABANG_FULL = { Banua:'PT Banua Mitra Lestari', Tanaka:'PT Tanaka Rizqi Barokah', Acestreet:'Acestreet' };
const KATEGORI = ['ATK','Konsumsi','Transport','Kebersihan','Komunikasi','Lainnya'];
const MAX_NOMINAL = 2000000;

const emptyForm = { tanggal_transaksi: today(), cabang:'Banua', kategori:'ATK', keterangan:'', nominal:0, nama_penerima:'', status:'Pending' };
const emptyReplenish = { cabang:'Banua', nominal:0, tanggal_transaksi: today(), keterangan:'Replenishment Petty Cash' };

export default function PettyCash() {
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search:'', cabang:'', startDate:'', endDate:'' });
  const [showProfile, setShowProfile] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [replenishOpen, setReplenishOpen] = useState(false);
  const [detailItem, setDetailItem] = useState(null);
  const [voidItem, setVoidItem] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [repForm, setRepForm] = useState(emptyReplenish);
  const [formError, setFormError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [r1, r2] = await Promise.all([getAllPettyCash(filters), getPettyCashSummary()]);
      setData(r1.data.data || []);
      setSummary(r2.data.summary);
    } catch(e){ console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filters]);

  const handleSubmit = async (e) => {
    e.preventDefault(); setFormError('');
    if (parseFloat(form.nominal) > MAX_NOMINAL) { setFormError(`Nominal maksimal ${fmt(MAX_NOMINAL)}`); return; }
    try { await createPettyCash(form); setModalOpen(false); load(); }
    catch(e){ setFormError(e.response?.data?.error || 'Gagal menyimpan'); }
  };

  const handleReplenish = async (e) => {
    e.preventDefault();
    try { await replenishPettyCash(repForm); setReplenishOpen(false); load(); }
    catch(e){ alert('Gagal replenishment: ' + (e.response?.data?.error || e.message)); }
  };

  const handleVoid = async () => {
    try { await voidPettyCash(voidItem.id); setVoidItem(null); load(); }
    catch(e){ alert('Gagal void'); }
  };

  const exportCSV = () => {
    const h = ['Tanggal','Cabang','Kategori','Keterangan','Nominal'];
    const rows = data.map(r=>[new Date(r.tanggal_transaksi).toLocaleDateString('id-ID'),r.cabang,r.kategori,r.keterangan,r.nominal]);
    const csv = [h,...rows].map(r=>r.map(v=>`"${v}"`).join(',')).join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv],{type:'text/csv'})); a.download=`PettyCash_${today()}.csv`; a.click();
  };

  const saldoCabang = summary?.saldo_per_cabang || [];

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
              placeholder="Cari transaksi petty cash..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
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
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
            <div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                Petty Cash
              </h1>
              <p className="text-gray-500 mt-2 text-sm font-medium">Pengelolaan kas kecil per cabang</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={exportCSV} className="bg-green-50 border border-green-100 hover:bg-green-100 hover:border-green-200 text-green-700 px-4 py-2 rounded-xl font-semibold flex items-center gap-2 text-sm shadow-sm transition-all"><Download size={16}/> Export</button>
              <button onClick={()=>{ setRepForm(emptyReplenish); setReplenishOpen(true); }} className="bg-blue-50 border border-blue-100 hover:bg-blue-100 hover:border-blue-200 text-blue-700 px-4 py-2 rounded-xl font-semibold flex items-center gap-2 text-sm shadow-sm transition-all"><RefreshCw size={16}/> Isi Ulang</button>
              <button onClick={()=>{ setForm(emptyForm); setFormError(''); setModalOpen(true); }} className="bg-[#990000] hover:bg-red-800 text-white px-4 py-2 rounded-xl font-semibold flex items-center gap-2 text-sm shadow-lg shadow-red-900/20 transition-all hover:scale-105"><Plus size={16}/> Tambah</button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            {CABANG.map((cab, idx) => {
              const sData = saldoCabang.find(s=>s.cabang===cab);
              const saldo = sData ? parseFloat(sData.saldo||0) : 0;
              const isLow = saldo < 500000;
              const borderColors = ['border-l-blue-500', 'border-l-indigo-500', 'border-l-emerald-500'];
              const borderColor = isLow ? 'border-l-red-500 border-red-200' : `${borderColors[idx]} border-gray-100`;
              return (
                <div key={cab} className={`bg-white rounded-2xl p-5 shadow-sm border flex flex-col justify-center transition-all hover:-translate-y-0.5 hover:shadow-md border-l-[6px] ${borderColor}`}>
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-xs text-gray-500 font-medium">Saldo {cab}</p>
                    {isLow && <span className="flex items-center gap-1 text-red-600 text-[10px] font-bold"><AlertTriangle size={12}/> Rendah</span>}
                  </div>
                  <h3 className={`text-lg lg:text-xl font-black break-words ${isLow?'text-red-600':'text-gray-900'}`}>{fmt(saldo)}</h3>
                </div>
              );
            })}
            {summary && (
              <>
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 border-l-[6px] border-l-amber-500 flex flex-col justify-center transition-all hover:-translate-y-0.5 hover:shadow-md">
                  <p className="text-xs text-gray-500 font-medium mb-1">Pengeluaran Bulan Ini</p>
                  <h3 className="text-lg lg:text-xl font-black text-gray-900 break-words">{fmt(summary.total_approved||0)}</h3>
                </div>
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 border-l-[6px] border-l-[#990000] flex flex-col justify-center transition-all hover:-translate-y-0.5 hover:shadow-md">
                  <p className="text-xs text-gray-500 font-medium mb-1">Pengeluaran Hari Ini</p>
                  <h3 className="text-lg lg:text-xl font-black text-gray-900 break-words">{fmt(summary.total_today||0)}</h3>
                </div>
              </>
            )}
          </div>

          {/* Filters */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4">
            <div className="flex flex-wrap gap-2">
              <select className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#990000] bg-white" value={filters.cabang} onChange={e=>setFilters(p=>({...p,cabang:e.target.value}))}>
                <option value="">Semua Cabang</option>{CABANG.map(c=><option key={c} value={c}>{CABANG_FULL[c]||c}</option>)}
              </select>
              <input type="date" className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#990000]" value={filters.startDate} onChange={e=>setFilters(p=>({...p,startDate:e.target.value}))}/>
              <input type="date" className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#990000]" value={filters.endDate} onChange={e=>setFilters(p=>({...p,endDate:e.target.value}))}/>
              <button onClick={()=>setFilters({search:'',cabang:'',startDate:'',endDate:''})} className="px-3 py-2 text-xs text-gray-500 hover:text-red-600 border border-gray-200 rounded-xl">Reset</button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gradient-to-r from-[#990000] to-red-800 text-white">
                  <tr>{['Tanggal','Cabang','Kategori','Keterangan','Nominal','Status','Dibuat Oleh','Aksi'].map(h=><th key={h} className="py-3 px-4 text-left font-semibold text-xs whitespace-nowrap">{h}</th>)}</tr>
                </thead>
                <tbody>
                  {loading ? <tr><td colSpan={8} className="text-center py-12 text-gray-400">Memuat data...</td></tr>
                  : data.length===0 ? <tr><td colSpan={8} className="text-center py-12 text-gray-400">Tidak ada data.</td></tr>
                  : data.map((item,idx)=>(
                    <tr key={item.id} className={`border-b border-gray-50 hover:bg-red-50/20 transition-colors ${item.is_replenishment?'bg-blue-50/30':idx%2===0?'bg-white':'bg-gray-50/30'}`}>
                      <td className="py-3 px-4 text-gray-600 whitespace-nowrap">{new Date(item.tanggal_transaksi).toLocaleDateString('id-ID')}</td>
                      <td className="py-3 px-4"><span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded font-semibold">{item.cabang}</span></td>
                      <td className="py-3 px-4 text-xs text-gray-600">{item.kategori}</td>
                      <td className="py-3 px-4 text-gray-800 max-w-[200px] truncate">{item.keterangan}</td>
                      <td className="py-3 px-4 font-bold text-right whitespace-nowrap text-gray-900">{fmt(item.nominal)}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${item.status==='Approved'||item.status==='Paid'?'bg-green-100 text-green-700':item.status==='Pending'?'bg-yellow-100 text-yellow-700':item.status==='Void'?'bg-gray-100 text-gray-400':'bg-blue-100 text-blue-700'}`}>{item.status}</span>
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-500">{item.nama_penerima||'-'}</td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1.5">
                          <button onClick={()=>setDetailItem(item)} className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg"><Eye size={13}/></button>
                          {item.status!=='Void' && <button onClick={()=>setVoidItem(item)} className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg"><Ban size={13}/></button>}
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

      {/* Detail Modal */}
      {detailItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 bg-[#990000] flex justify-between items-center">
              <h2 className="text-lg font-black text-white">Detail Petty Cash</h2>
              <button onClick={()=>setDetailItem(null)} className="text-white/70 hover:text-white"><X size={20}/></button>
            </div>
            <div className="p-5 space-y-2 text-sm">
              {[['Tanggal',new Date(detailItem.tanggal_transaksi).toLocaleDateString('id-ID')],['Cabang',detailItem.cabang],['Kategori',detailItem.kategori],['Keterangan',detailItem.keterangan],['Nominal',fmt(detailItem.nominal)],['Status',detailItem.status],['Dibuat Oleh',detailItem.nama_penerima||'-']].map(([l,v])=>(
                <div key={l} className="flex gap-3 py-2 border-b border-gray-50">
                  <span className="w-32 text-gray-400 font-semibold shrink-0">{l}</span>
                  <span className="font-bold text-gray-800">{v}</span>
                </div>
              ))}
            </div>
            <div className="px-6 py-3 bg-gray-50 flex justify-end"><button onClick={()=>setDetailItem(null)} className="px-5 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold text-sm">Tutup</button></div>
          </div>
        </div>
      )}

      {/* Void Modal */}
      {voidItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"><Ban size={28} className="text-red-600"/></div>
            <h3 className="text-lg font-black text-gray-900 mb-2">Void Pengeluaran?</h3>
            <p className="text-sm text-gray-500 mb-5">{voidItem.kategori} · {fmt(voidItem.nominal)}</p>
            <div className="flex gap-3">
              <button onClick={()=>setVoidItem(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl font-semibold text-gray-700">Batal</button>
              <button onClick={handleVoid} className="flex-1 py-2.5 bg-[#990000] text-white rounded-xl font-bold">Void</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Form Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-800">Tambah Pengeluaran Petty Cash</h2>
              <button onClick={()=>setModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto px-1">
                <div><label className="block text-xs font-semibold text-gray-600 mb-1">Tanggal</label>
                  <input required type="date" className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-[#990000] outline-none text-sm" value={form.tanggal_transaksi} onChange={e=>setForm(p=>({...p,tanggal_transaksi:e.target.value}))}/></div>
                <div><label className="block text-xs font-semibold text-gray-600 mb-1">Cabang</label>
                  <select className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-[#990000] outline-none text-sm" value={form.cabang} onChange={e=>setForm(p=>({...p,cabang:e.target.value}))}>
                    {CABANG.map(c=><option key={c} value={c}>{CABANG_FULL[c]||c}</option>)}</select></div>
                <div><label className="block text-xs font-semibold text-gray-600 mb-1">Kategori</label>
                  <select className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-[#990000] outline-none text-sm" value={form.kategori} onChange={e=>setForm(p=>({...p,kategori:e.target.value}))}>
                    {KATEGORI.map(k=><option key={k}>{k}</option>)}</select></div>
                <div><label className="block text-xs font-semibold text-gray-600 mb-1">Nominal (max {fmt(MAX_NOMINAL)})</label>
                  <input required type="number" min="0" max={MAX_NOMINAL} className={`w-full px-4 py-2 border rounded-xl focus:border-[#990000] outline-none text-sm ${parseFloat(form.nominal)>MAX_NOMINAL?'border-red-400 bg-red-50':'border-gray-200'}`} value={form.nominal} onChange={e=>setForm(p=>({...p,nominal:e.target.value}))}/>
                  {parseFloat(form.nominal)>MAX_NOMINAL && <p className="text-xs text-red-500 mt-1">⚠️ Melebihi batas maksimal!</p>}
                </div>
                <div className="col-span-2"><label className="block text-xs font-semibold text-gray-600 mb-1">Keterangan</label>
                  <input required type="text" className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-[#990000] outline-none text-sm" value={form.keterangan} onChange={e=>setForm(p=>({...p,keterangan:e.target.value}))}/></div>
                <div><label className="block text-xs font-semibold text-gray-600 mb-1">Dibuat Oleh</label>
                  <input type="text" className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-[#990000] outline-none text-sm" value={form.nama_penerima} onChange={e=>setForm(p=>({...p,nama_penerima:e.target.value}))}/></div>
                <div><label className="block text-xs font-semibold text-gray-600 mb-1">Status</label>
                  <select className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-[#990000] outline-none text-sm" value={form.status} onChange={e=>setForm(p=>({...p,status:e.target.value}))}>
                    <option>Pending</option><option>Approved</option></select></div>
                <div className="col-span-2"><label className="block text-xs font-semibold text-gray-600 mb-1">Upload Nota</label>
                  <input type="file" accept="image/*,application/pdf" className="w-full px-4 py-2 border border-dashed border-gray-300 rounded-xl text-sm text-gray-500 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-red-50 file:text-[#990000] file:font-semibold"/></div>
                {formError && <div className="col-span-2 flex items-center gap-2 bg-red-50 text-red-700 rounded-xl p-3 text-sm"><AlertTriangle size={16}/>{formError}</div>}
              </div>
              <div className="mt-5 pt-4 border-t border-gray-100 flex justify-end gap-3">
                <button type="button" onClick={()=>setModalOpen(false)} className="px-5 py-2.5 text-gray-600 font-semibold hover:bg-gray-100 rounded-xl text-sm">Batal</button>
                <button type="submit" className="px-6 py-2.5 bg-[#990000] hover:bg-red-800 text-white font-bold rounded-xl shadow-lg text-sm">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Replenishment Modal */}
      {replenishOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 bg-blue-600 flex justify-between items-center">
              <div className="flex items-center gap-2"><RefreshCw size={18} className="text-white"/><h2 className="text-lg font-black text-white">Isi Ulang Petty Cash</h2></div>
              <button onClick={()=>setReplenishOpen(false)} className="text-white/70 hover:text-white"><X size={20}/></button>
            </div>
            <form onSubmit={handleReplenish} className="p-6 space-y-4">
              <div><label className="block text-xs font-semibold text-gray-600 mb-1">Tanggal</label>
                <input required type="date" className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-blue-500 outline-none text-sm" value={repForm.tanggal_transaksi} onChange={e=>setRepForm(p=>({...p,tanggal_transaksi:e.target.value}))}/></div>
              <div><label className="block text-xs font-semibold text-gray-600 mb-1">Cabang</label>
                <select className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-blue-500 outline-none text-sm" value={repForm.cabang} onChange={e=>setRepForm(p=>({...p,cabang:e.target.value}))}>
                  {CABANG.map(c=><option key={c}>{c}</option>)}</select></div>
              <div><label className="block text-xs font-semibold text-gray-600 mb-1">Nominal Isi Ulang (Rp)</label>
                <input required type="number" min="1" className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-blue-500 outline-none text-sm" value={repForm.nominal} onChange={e=>setRepForm(p=>({...p,nominal:e.target.value}))}/></div>
              <div><label className="block text-xs font-semibold text-gray-600 mb-1">Keterangan</label>
                <input type="text" className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-blue-500 outline-none text-sm" value={repForm.keterangan} onChange={e=>setRepForm(p=>({...p,keterangan:e.target.value}))}/></div>
              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                <button type="button" onClick={()=>setReplenishOpen(false)} className="px-5 py-2.5 text-gray-600 font-semibold hover:bg-gray-100 rounded-xl text-sm">Batal</button>
                <button type="submit" className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg text-sm">Isi Ulang</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
