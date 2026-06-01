const fs = require('fs');
let content = fs.readFileSync('frontend/src/pages/QuotationForm.jsx', 'utf8');

// Add diskon_item to initial state
content = content.replace(/harga_satuan: 0, satuan: 'Pcs'/g, "harga_satuan: 0, diskon_item: 0, satuan: 'Pcs'");

// In prefillFromOrder
content = content.replace(/harga_satuan: i.harga_satuan \|\| i.harga \|\| 0, satuan/g, "harga_satuan: i.harga_satuan || i.harga || 0, diskon_item: i.diskon_item || 0, satuan");
content = content.replace(/harga_satuan: order.harga \|\| 0, satuan/g, "harga_satuan: order.harga || 0, diskon_item: order.diskon_item || 0, satuan");

// Subtotal Calculation -> needs to subtract diskon_item
const subtotalRepl = `
    useEffect(() => {
        const subtotal = form.items_detail.reduce((acc, item) => {
            const qty = Number(item.qty || 0);
            const harga = Number(item.harga_satuan || 0);
            const diskon_item = Number(item.diskon_item || 0);
            return acc + (qty * (harga - diskon_item));
        }, 0);
        const jumlah_ppn = subtotal * (Number(form.ppn_persen) / 100);
        const diskon = subtotal * (Number(form.diskon_persen || 0) / 100);
        const grand_total_quo = subtotal + jumlah_ppn - diskon + Number(form.ongkos_kirim || 0);
        setForm(prev => ({ ...prev, subtotal, jumlah_ppn, diskon, grand_total_quo }));
    }, [form.items_detail, form.ppn_persen, form.diskon_persen, form.ongkos_kirim]);
`;
content = content.replace(/useEffect\(\(\) => \{\n\s*\/\/ Subtotal pakai harga_satuan.*?\n\s*const subtotal[\s\S]*?\}, \[form\.items_detail, form\.ppn_persen, form\.diskon_persen, form\.ongkos_kirim\]\);/g, subtotalRepl.trim());

// Add UI for diskon_item
const uiRepl = `
                                            {/* Harga Satuan + Diskon + Bordir */}
                                            <div className="col-span-12 md:col-span-5">
                                                <div className="grid grid-cols-3 gap-2">
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 text-right">Harga</label>
                                                        <input type="number" name="harga_satuan"
                                                            value={item.harga_satuan}
                                                            onChange={(e) => handleItemChange(index, e)}
                                                            min="0" className="w-full p-2 border border-gray-300 rounded-lg text-right text-sm font-semibold" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 text-right">Diskon Item</label>
                                                        <input type="number" name="diskon_item"
                                                            value={item.diskon_item || 0}
                                                            onChange={(e) => handleItemChange(index, e)}
                                                            min="0" className="w-full p-2 border border-gray-300 rounded-lg text-right text-sm text-red-600" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 text-right">+ Bordir</label>
                                                        <input type="number" name="harga_bordir"
                                                            value={item.harga_bordir || 0}
                                                            onChange={(e) => handleItemChange(index, e)}
                                                            min="0" className="w-full p-2 border border-amber-200 bg-amber-50 rounded-lg text-right text-sm" placeholder="0" />
                                                    </div>
                                                </div>
                                                <div className="flex justify-between items-center mt-1.5 px-1 bg-blue-50 rounded py-1">
                                                    <span className="text-[10px] text-gray-500">
                                                        Harga Akhir: <span className="font-bold text-gray-800">Rp {(Number(item.harga_satuan || 0) - Number(item.diskon_item || 0)).toLocaleString('id-ID')}</span>
                                                    </span>
                                                    <span className="text-[10px] text-gray-500">
                                                        Total: <span className="font-bold text-blue-700">Rp {(Number(item.qty||0) * (Number(item.harga_satuan||0) - Number(item.diskon_item||0))).toLocaleString('id-ID')}</span>
                                                    </span>
                                                </div>
`;
content = content.replace(/\{\/\* Harga Satuan \+ Bordir \*\/\}[\s\S]*?Total: <span className="font-bold text-blue-700">Rp \{\(Number\(item\.qty\|\|0\) \* Number\(item\.harga_satuan\|\|0\)\)\.toLocaleString\('id-ID'\)\}<\/span>\n\s*<\/div>\n\s*<\/div>/g, uiRepl.trim());

// Col span adjustment
content = content.replace(/<div className="col-span-12 md:col-span-4 relative">/g, '<div className="col-span-12 md:col-span-3 relative">');

fs.writeFileSync('frontend/src/pages/QuotationForm.jsx', content);
