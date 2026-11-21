import { useState } from 'react';

const formatRupiah = (angka) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(Math.round(Number(angka) || 0));

export default function ProjectSummaryView({
  walls = [],
  onSelectWallTab,
  onAddNewWall,
  onRemoveWall,
  onResetAllWalls,
}) {
  const [namaKlien, setNamaKlien] = useState('');
  const [namaProyek, setNamaProyek] = useState('');
  const [copiedWa, setCopiedWa] = useState(false);

  // Agregasi Material berdasarkan Kode Produk untuk Rekap Stok
  const materialMap = {};
  let totalLuasBersih = 0;
  let totalListHBatang = 0;
  let totalListLBatang = 0;
  let totalLemKaleng = 0;
  let totalHargaMaterial = 0;
  let totalHargaAksesoris = 0;
  let grandTotal = 0;

  walls.forEach((w) => {
    totalLuasBersih += Number(w.summary?.luasBersih) || 0;
    totalListHBatang += Number(w.summary?.qtyListH) || 0;
    totalListLBatang += Number(w.summary?.qtyListL) || 0;
    totalLemKaleng += Number(w.summary?.qtyLem) || 0;
    totalHargaMaterial += Number(w.summary?.subtotalMaterial) || 0;
    totalHargaAksesoris += Number(w.summary?.subtotalAksesoris) || 0;
    grandTotal += Number(w.summary?.totalBiaya) || 0;

    (w.summary?.items || []).forEach((item) => {
      if (!item || !item.kode || item.qty <= 0) return;
      if (!materialMap[item.kode]) {
        materialMap[item.kode] = {
          kode: item.kode,
          nama: item.nama,
          kategori: item.kategori || item.tipe || 'Panel',
          motif: item.motif || '',
          gambar2D: item.gambar2D || '',
          satuan: item.satuan || 'lbr',
          hargaSatuan: Number(item.hargaSatuan) || 0,
          qty: 0,
          subtotal: 0,
        };
      }
      materialMap[item.kode].qty += Number(item.qty) || 0;
      materialMap[item.kode].subtotal += Number(item.subtotal) || 0;
    });
  });

  const rekapMaterials = Object.values(materialMap);

  const generateWhatsAppText = () => {
    const tanggal = new Date().toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

    const judulProyek = namaProyek.trim() || 'Ruangan Anda';
    const sapaan = namaKlien.trim()
      ? `Halo *${namaKlien.trim()}*, berikut rincian estimasi pemasangan wallpanel untuk area *${judulProyek}* (${walls.length} sisi dinding · Total luas ${totalLuasBersih.toFixed(
          2
        )} m²):`
      : `Halo, berikut rincian estimasi pemasangan wallpanel untuk area *${judulProyek}* (${walls.length} sisi dinding · Total luas ${totalLuasBersih.toFixed(
          2
        )} m²):`;

    const blokPerDinding = walls.flatMap((w, idx) => {
      const namaTampil = w.name?.trim() || `Dinding ${idx + 1}`;
      const sum = w.summary;
      const desainAwam = w.isMixMode
        ? `Kombinasi ${w.selectedProduct.kategori} (${w.selectedProduct.motif}) + ${w.centerProduct.kategori} (${w.centerProduct.motif})`
        : `${w.selectedProduct.kategori} — Motif ${w.selectedProduct.motif}`;

      const rincianBahan = (sum.items || [])
        .filter((i) => i.qty > 0)
        .map((i) => `${i.qty} ${i.satuan || 'lbr'} ${i.kategori || i.nama}`)
        .join(' + ');

      const aksesorisParts = [];
      if (sum.qtyListH > 0)
        aksesorisParts.push(`List H ${w.listHColor} (${sum.qtyListH} btg)`);
      if (sum.qtyListL > 0) aksesorisParts.push(`List Siku L (${sum.qtyListL} btg)`);
      if (sum.qtyLem > 0) aksesorisParts.push(`Lem Kuning (${sum.qtyLem} klg)`);

      return [
        `*${idx + 1}. ${namaTampil}* — Ukuran ${w.lebar || 0}m × ${w.tinggi || 0}m`,
        `   • Pilihan Desain: ${desainAwam}`,
        `   • Kebutuhan Panel: ${rincianBahan}${
          aksesorisParts.length > 0 ? ` + ${aksesorisParts.join(', ')}` : ''
        }`,
        `   • Estimasi Biaya Dinding Ini: *${formatRupiah(sum.totalBiaya)}*`,
        ``,
      ];
    });

    const lines = [
      `*ESTIMASI PENAWARAN WALLPANEL — PANELIN*`,
      `Tanggal: ${tanggal}`,
      ``,
      sapaan,
      ``,
      ...blokPerDinding,
      `----------------------------------------`,
      `*REKAP TOTAL KEBUTUHAN BAHAN:*`,
      ...rekapMaterials.map(
        (m) =>
          `• ${m.nama}${m.motif ? ` — ${m.motif}` : ''} [Kode: ${m.kode}]: *${
            m.qty
          } ${m.satuan}* = ${formatRupiah(m.subtotal)}`
      ),
      totalListHBatang > 0
        ? `• List Transisi H: *${totalListHBatang} batang*`
        : null,
      totalListLBatang > 0
        ? `• List Siku L (WPC): *${totalListLBatang} batang*`
        : null,
      totalLemKaleng > 0
        ? `• Lem Kuning / Sealant: *${totalLemKaleng} kaleng*`
        : null,
      ``,
      `*RINGKASAN TOTAL BIAYA:*`,
      `• Total Panel Dinding: ${formatRupiah(totalHargaMaterial)}`,
      totalHargaAksesoris > 0
        ? `• Total List & Perekat: ${formatRupiah(totalHargaAksesoris)}`
        : null,
      `*GRAND TOTAL ESTIMASI: ${formatRupiah(grandTotal)}*`,
      ``,
      `_Catatan:_`,
      `_• Jika menggunakan jasa pemasangan dari toko kami, kebutuhan Lem Kuning untuk UV Marble / Vinyl sudah GRATIS._`,
      `_• Rincian di atas adalah estimasi awal dan dapat disesuaikan kembali setelah pengukuran akhir di lokasi._`,
    ];

    return lines.filter((line) => line !== null).join('\n');
  };

  const handleCopyWhatsApp = async () => {
    const text = generateWhatsAppText();
    try {
      await navigator.clipboard.writeText(text);
      setCopiedWa(true);
      setTimeout(() => setCopiedWa(false), 2500);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopiedWa(true);
      setTimeout(() => setCopiedWa(false), 2500);
    }
  };

  return (
    <div className="max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6 flex-1 lg:overflow-y-auto space-y-5">
      {/* Header Ringkasan & Identitas Klien */}
      <div className="bg-white rounded-2xl border border-stone-200/90 p-4 sm:p-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
            Rekap Keseluruhan Ruangan
          </span>
          <h2 className="text-lg sm:text-xl font-bold text-stone-900 mt-0.5">
            Gabungan {walls.length} Sisi Dinding ({totalLuasBersih.toFixed(2)} m²)
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Periksa kembali desain, ukuran, dan pilihan bahan per dinding sebelum menyalin penawaran WhatsApp.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full lg:w-auto lg:min-w-[420px]">
          <div>
            <label className="text-[11px] font-semibold text-stone-600 block mb-1">
              Nama Klien (Opsional)
            </label>
            <input
              type="text"
              value={namaKlien}
              onChange={(e) => setNamaKlien(e.target.value)}
              placeholder="Contoh: Pak Budi"
              className="w-full min-h-[38px] px-3 rounded-xl bg-stone-50 border border-stone-300 text-xs text-stone-900 focus:bg-white focus:border-amber-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-stone-600 block mb-1">
              Nama Ruangan / Proyek
            </label>
            <input
              type="text"
              value={namaProyek}
              onChange={(e) => setNamaProyek(e.target.value)}
              placeholder="Contoh: Ruang Tamu & TV"
              className="w-full min-h-[38px] px-3 rounded-xl bg-stone-50 border border-stone-300 text-xs text-stone-900 focus:bg-white focus:border-amber-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Grid Kartu Per Sisi Dinding (Ukuran, Preview Visual, dan Foto Produk Terpisah Jelas) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {walls.map((w, idx) => {
          const namaTampil = w.name?.trim() || `Dinding ${idx + 1}`;
          const lebarVal = Math.max(Number(w.lebar) || 0, 0);
          const tinggiVal = Math.max(Number(w.tinggi) || 0, 0);
          const ratio = lebarVal > 0 && tinggiVal > 0 ? lebarVal / tinggiVal : 1;

          const centerWidthPct =
            w.isMixMode && lebarVal > 0
              ? Math.min((Number(w.centerWidth) / lebarVal) * 100, 100)
              : 0;
          const centerHeightPct =
            w.isMixMode && tinggiVal > 0
              ? w.mixPattern === 'frame'
                ? Math.min((Number(w.centerHeight) / tinggiVal) * 100, 100)
                : 100
              : 0;

          return (
            <div
              key={w.id}
              className="bg-white rounded-2xl border border-stone-200/90 shadow-xs overflow-hidden flex flex-col justify-between"
            >
              {/* Header Kartu Dinding */}
              <div className="px-4 py-3 bg-stone-900 text-white flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-6 h-6 rounded-full bg-amber-400 text-stone-950 text-xs font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <h3 className="text-sm font-bold truncate">{namaTampil}</h3>
                </div>
                <span className="text-xs font-bold text-amber-300 shrink-0">
                  {formatRupiah(w.summary.totalBiaya)}
                </span>
              </div>

              <div className="p-4 space-y-4">
                {/* Bagian A: Preview Visual Dinding + Info Ukuran */}
                <div className="flex items-center gap-3.5 p-3 rounded-xl bg-stone-50 border border-stone-200/80">
                  <div className="w-28 h-24 rounded-lg bg-stone-200/80 border border-stone-300 flex items-center justify-center p-1.5 shrink-0 overflow-hidden">
                    <div
                      className="relative bg-stone-300 border border-stone-400 shadow-2xs overflow-hidden flex items-center justify-center"
                      style={{
                        aspectRatio: `${ratio}`,
                        width: ratio >= 1 ? '100%' : 'auto',
                        height: ratio < 1 ? '100%' : 'auto',
                        maxHeight: '100%',
                        maxWidth: '100%',
                        backgroundImage: `url(${w.selectedProduct.gambar2D})`,
                        backgroundSize: '36% 100%',
                        backgroundRepeat: 'repeat',
                      }}
                    >
                      {w.isMixMode && w.centerProduct && (
                        <div
                          style={{
                            width: `${centerWidthPct}%`,
                            height: `${centerHeightPct}%`,
                            backgroundImage: `url(${w.centerProduct.gambar2D})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                          }}
                          className={`relative shadow-xs ${
                            w.mixPattern === 'frame'
                              ? 'ring-1 ring-amber-400'
                              : 'border-x border-amber-400'
                          }`}
                        />
                      )}

                      {(w.openings || []).map((op) => {
                        const opW = Number(op.lebar) || 0;
                        const opH = Number(op.tinggi) || 0;
                        if (opW <= 0 || opH <= 0 || lebarVal <= 0 || tinggiVal <= 0)
                          return null;
                        return (
                          <div
                            key={op.id}
                            style={{
                              width: `${Math.min((opW / lebarVal) * 100, 100)}%`,
                              height: `${Math.min((opH / tinggiVal) * 100, 100)}%`,
                              left: `${Math.min(
                                ((Number(op.jarakKiri) || 0) / lebarVal) * 100,
                                100
                              )}%`,
                              bottom: `${Math.min(
                                ((Number(op.jarakBawah) || 0) / tinggiVal) * 100,
                                100
                              )}%`,
                            }}
                            className="absolute bg-stone-100 border border-stone-800"
                          />
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-1 text-xs min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
                      Dimensi Bidang Dinding
                    </span>
                    <p className="font-bold text-stone-900 text-sm">
                      Lebar {lebarVal} m × Tinggi {tinggiVal} m
                    </p>
                    <p className="text-stone-600">
                      Luas bersih pasang: <strong>{w.summary.luasBersih.toFixed(2)} m²</strong>
                    </p>
                    {w.openings.length > 0 && (
                      <p className="text-[11px] text-amber-800">
                        Dikurangi {w.openings.length} bukaan (
                        {w.openings.map((o) => o.nama).join(', ')})
                      </p>
                    )}
                  </div>
                </div>

                {/* Bagian B: Kartu Produk yang Dipilih Lengkap dengan Foto Motif */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
                    Produk & Motif yang Dipilih
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {w.summary.items.map((item) => (
                      <div
                        key={item.kode}
                        className="flex items-center gap-2.5 p-2 rounded-xl border border-stone-200 bg-white"
                      >
                        <img
                          src={item.gambar2D}
                          alt={item.motif || item.nama}
                          className="w-12 h-12 rounded-lg object-cover border border-stone-200 shrink-0"
                        />
                        <div className="min-w-0">
                          <span className="text-[10px] font-bold text-amber-700 block">
                            {item.kategori}
                          </span>
                          <p className="text-xs font-bold text-stone-900 truncate">
                            {item.motif || item.nama}
                          </p>
                          <p className="text-[11px] text-stone-600">
                            <strong>
                              {item.qty} {item.satuan}
                            </strong>{' '}
                            <span className="text-stone-400">({item.kode})</span>
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer Aksi Kartu */}
              <div className="px-4 py-2.5 bg-stone-50 border-t border-stone-200/80 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => onSelectWallTab(w.id)}
                  className="text-xs font-bold text-amber-800 hover:text-amber-950 cursor-pointer"
                >
                  ✎ Edit Dinding Ini
                </button>

                {walls.length > 1 && (
                  <button
                    type="button"
                    onClick={() => onRemoveWall(w.id)}
                    className="text-xs font-semibold text-rose-600 hover:text-rose-800 cursor-pointer"
                  >
                    Hapus Dinding
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {/* Kartu Tambah Dinding Baru */}
        <button
          type="button"
          onClick={onAddNewWall}
          className="min-h-[180px] rounded-2xl border-2 border-dashed border-stone-300 hover:border-amber-500 bg-white/70 hover:bg-amber-50/40 transition cursor-pointer flex flex-col items-center justify-center p-6 text-center gap-2"
        >
          <span className="w-10 h-10 rounded-full bg-stone-900 text-amber-300 text-lg font-bold flex items-center justify-center">
            +
          </span>
          <span className="text-sm font-bold text-stone-900">
            Tambah Sisi Dinding Lainnya
          </span>
          <span className="text-xs text-stone-500 max-w-xs">
            Buka lembar kerja baru yang bersih untuk menghitung sisi dinding berikutnya
          </span>
        </button>
      </div>

      {/* Blok Rekap Total Bahan & Tombol Salin WhatsApp */}
      <div className="bg-stone-900 text-stone-100 rounded-2xl p-4 sm:p-6 shadow-md space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-700 pb-3">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 block">
              Ringkasan Total Bahan & Biaya
            </span>
            <h3 className="text-base sm:text-lg font-bold text-white">
              Total Gabungan {walls.length} Sisi Dinding
            </h3>
          </div>
          {walls.length > 1 && (
            <button
              type="button"
              onClick={onResetAllWalls}
              className="text-xs text-stone-400 hover:text-rose-400 underline cursor-pointer"
            >
              Reset Semua Dinding
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {rekapMaterials.map((m) => (
            <div
              key={m.kode}
              className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-stone-800/90 border border-stone-700"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {m.gambar2D && (
                  <img
                    src={m.gambar2D}
                    alt={m.motif || m.nama}
                    className="w-10 h-10 rounded-lg object-cover shrink-0"
                  />
                )}
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">
                    {m.motif || m.nama}
                  </p>
                  <p className="text-[11px] text-stone-400">
                    {m.kategori} · Kode {m.kode}
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs font-bold text-amber-300">
                  {m.qty} {m.satuan}
                </p>
                <p className="text-[11px] font-mono text-stone-300">
                  {formatRupiah(m.subtotal)}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t border-stone-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs text-stone-400 block">
              Grand Total Estimasi ({walls.length} Dinding)
            </span>
            <span className="text-xl sm:text-2xl font-bold text-amber-300">
              {formatRupiah(grandTotal)}
            </span>
          </div>

          <button
            type="button"
            onClick={handleCopyWhatsApp}
            className={`min-h-[46px] px-5 rounded-xl font-bold text-xs sm:text-sm transition cursor-pointer flex items-center justify-center gap-2 ${
              copiedWa
                ? 'bg-emerald-500 text-stone-950'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
            }`}
          >
            <span>
              {copiedWa
                ? '✓ Penawaran WhatsApp Tersalin!'
                : 'Salin Penawaran WhatsApp Gabungan'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}