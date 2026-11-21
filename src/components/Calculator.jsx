import { useState, useEffect } from 'react';

export default function Calculator({
  activeProduct,
  lebar,
  tinggi,
  onLebarChange,
  onTinggiChange,
  openings = [],
  onAddOpening,
  onUpdateOpening,
  onRemoveOpening,
  isMixMode,
  onToggleMixMode,
  mixPattern,
  onMixPatternChange,
  activeMixSlot,
  onActiveMixSlotChange,
  centerProduct,
  onSwapMixProducts,
  centerWidth,
  onCenterWidthChange,
  centerHeight,
  onCenterHeightChange,
  useListH,
  onToggleListH,
  listHColor,
  onListHColorChange,
  listHQty,
  onListHQtyChange,
  useListLWpc,
  onToggleListLWpc,
  listLWpcQty,
  onListLWpcQtyChange,
}) {
  if (!activeProduct) return null;

  const [includeInstall, setIncludeInstall] = useState(false);

  const lebarValid = Number(lebar) > 0 ? Number(lebar) : 0;
  const tinggiValid = Number(tinggi) > 0 ? Number(tinggi) : 0;
  const luasKotor = lebarValid * tinggiValid;

  const luasBukaan = openings.reduce((acc, item) => {
    const w = Math.max(Number(item.lebar) || 0, 0);
    const h = Math.max(Number(item.tinggi) || 0, 0);
    return acc + w * h;
  }, 0);

  const luasBersih = Math.max(luasKotor - luasBukaan, 0);

  const formatRupiah = (angka) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(angka);

  const getTarifPasang = (tipe) => {
    if (tipe === 'WPC') return 25000;
    if (tipe === 'Wallboard' || tipe === 'RFP') return 30000;
    if (tipe === 'UVMarble' || tipe === 'UVMarbleGold') return 125000;
    return 0;
  };

  // Rumus Kebutuhan Panel dengan Efisiensi Potongan Sisa Vertikal
  const hitungKebutuhan = (produk, targetLebarM, targetTinggiM, areaPengurangM2 = 0) => {
    if (!produk || targetLebarM <= 0 || targetTinggiM <= 0) {
      return { jumlah: 0, totalHarga: 0, totalPasang: 0 };
    }
    const lebarPanelM = produk.dimensi.lebar_cm / 100;
    const tinggiPanelM = produk.dimensi.tinggi_cm / 100;
    const luasPerUnit = lebarPanelM * tinggiPanelM;

    const lajurHorizontal = Math.ceil(targetLebarM / lebarPanelM);

    // Hitung lembar utuh vertikal + efisiensi potongan sisa atas
    const TOLERANSI = 0.001;
    const utuhPerLajur = Math.floor((targetTinggiM + TOLERANSI) / tinggiPanelM);
    const sisaTinggi = Math.max(targetTinggiM - utuhPerLajur * tinggiPanelM, 0);

    let lembarSambunganAtas = 0;
    if (sisaTinggi > TOLERANSI) {
      const potonganPerLembar = Math.max(
        Math.floor((tinggiPanelM + TOLERANSI) / sisaTinggi),
        1
      );
      lembarSambunganAtas = Math.ceil(lajurHorizontal / potonganPerLembar);
    }

    const jumlahKotor = lajurHorizontal * utuhPerLajur + lembarSambunganAtas;

    const penguranganUnit =
      areaPengurangM2 > 0 && luasPerUnit > 0
        ? Math.floor(areaPengurangM2 / luasPerUnit)
        : 0;

    const jumlah = Math.max(jumlahKotor - penguranganUnit, 0);
    const totalHarga = jumlah * produk.harga;
    const totalPasang = jumlah * getTarifPasang(produk.tipe);

    return { jumlah, totalHarga, totalPasang };
  };

  const activeMix = isMixMode && centerProduct && lebarValid > 0 && tinggiValid > 0;
  const isFrameMode = activeMix && mixPattern === 'frame';

  const effectiveCenterW = activeMix
    ? Math.min(Math.max(Number(centerWidth) || 0, 0.1), lebarValid)
    : 0;
  const effectiveCenterH = isFrameMode
    ? Math.min(Math.max(Number(centerHeight) || 0, 0.1), tinggiValid)
    : tinggiValid;

  const sideWidth = activeMix ? Math.max((lebarValid - effectiveCenterW) / 2, 0) : 0;
  const topBottomHeight = isFrameMode
    ? Math.max((tinggiValid - effectiveCenterH) / 2, 0)
    : 0;

  const hasilTunggal = hitungKebutuhan(activeProduct, lebarValid, tinggiValid, luasBukaan);

  const hasilCenter = activeMix
    ? hitungKebutuhan(centerProduct, effectiveCenterW, effectiveCenterH, 0)
    : { jumlah: 0, totalHarga: 0, totalPasang: 0 };

  const hasilOuter = (() => {
    if (!activeMix) return { jumlah: 0, totalHarga: 0, totalPasang: 0 };
    if (!isFrameMode) {
      const kiri = hitungKebutuhan(activeProduct, sideWidth, tinggiValid, 0);
      const kanan = hitungKebutuhan(activeProduct, sideWidth, tinggiValid, 0);
      const totalKotor = kiri.jumlah + kanan.jumlah;
      const luasPerUnit =
        (activeProduct.dimensi.lebar_cm / 100) * (activeProduct.dimensi.tinggi_cm / 100);
      const pengurangan =
        luasBukaan > 0 && luasPerUnit > 0 ? Math.floor(luasBukaan / luasPerUnit) : 0;
      const jumlah = Math.max(totalKotor - pengurangan, 0);
      return {
        jumlah,
        totalHarga: jumlah * activeProduct.harga,
        totalPasang: jumlah * getTarifPasang(activeProduct.tipe),
      };
    } else {
      const kiri = hitungKebutuhan(activeProduct, sideWidth, tinggiValid, 0);
      const kanan = hitungKebutuhan(activeProduct, sideWidth, tinggiValid, 0);
      const atas = hitungKebutuhan(activeProduct, effectiveCenterW, topBottomHeight, 0);
      const bawah = hitungKebutuhan(activeProduct, effectiveCenterW, topBottomHeight, 0);
      const totalKotor = kiri.jumlah + kanan.jumlah + atas.jumlah + bawah.jumlah;
      const luasPerUnit =
        (activeProduct.dimensi.lebar_cm / 100) * (activeProduct.dimensi.tinggi_cm / 100);
      const pengurangan =
        luasBukaan > 0 && luasPerUnit > 0 ? Math.floor(luasBukaan / luasPerUnit) : 0;
      const jumlah = Math.max(totalKotor - pengurangan, 0);
      return {
        jumlah,
        totalHarga: jumlah * activeProduct.harga,
        totalPasang: jumlah * getTarifPasang(activeProduct.tipe),
      };
    }
  })();

  const hasWpc =
    activeProduct.tipe === 'WPC' || (activeMix && centerProduct?.tipe === 'WPC');
  const hasNonWpc =
    activeProduct.tipe !== 'WPC' || (activeMix && centerProduct?.tipe !== 'WPC');

  const totalLembarUvMarble = (() => {
    let total = 0;
    const isUv = (p) => p?.tipe === 'UVMarble' || p?.tipe === 'UVMarbleGold';
    if (!activeMix) {
      if (isUv(activeProduct)) total += hasilTunggal.jumlah;
    } else {
      if (isUv(activeProduct)) total += hasilOuter.jumlah;
      if (isUv(centerProduct)) total += hasilCenter.jumlah;
    }
    return total;
  })();

  const butuhSambunganAtas = tinggiValid > 2.901;
  const saranQtyListH = (() => {
    let panjangMeter = 0;
    if (butuhSambunganAtas) panjangMeter += lebarValid;
    if (activeMix) {
      panjangMeter += isFrameMode
        ? 2 * (effectiveCenterW + effectiveCenterH)
        : 2 * tinggiValid;
    }
    if (panjangMeter === 0) panjangMeter = tinggiValid;
    return Math.max(Math.ceil(panjangMeter / 2.9), 1);
  })();

  const saranQtyListLWpc = Math.max(Math.ceil((tinggiValid * 2) / 2.9), 1);

  useEffect(() => {
    onListHQtyChange(saranQtyListH);
  }, [saranQtyListH]);

  useEffect(() => {
    onListLWpcQtyChange(saranQtyListLWpc);
  }, [saranQtyListLWpc]);

  useEffect(() => {
    if (!hasWpc) onToggleListLWpc(false);
    if (!hasNonWpc) onToggleListH(false);
  }, [hasWpc, hasNonWpc]);

  const totalBahanPanel = activeMix
    ? hasilOuter.totalHarga + hasilCenter.totalHarga
    : hasilTunggal.totalHarga;

  const totalListH = hasNonWpc && useListH ? listHQty * 50000 : 0;
  const totalListLWpc = hasWpc && useListLWpc ? listLWpcQty * 40000 : 0;
  const totalAksesoris = totalListH + totalListLWpc;

  const totalJasaPasang = includeInstall
    ? activeMix
      ? hasilOuter.totalPasang + hasilCenter.totalPasang
      : hasilTunggal.totalPasang
    : 0;

  const grandTotal = totalBahanPanel + totalAksesoris + totalJasaPasang;

  const handleShareWhatsApp = () => {
    const infoBukaan =
      openings.length > 0
        ? `• Bukaan (${openings
            .map((o) => `${o.nama} ${o.lebar}×${o.tinggi}m`)
            .join(', ')}): -${luasBukaan.toFixed(2)} m²\n` +
          `• Luas Bersih Dinding: ${luasBersih.toFixed(2)} m²\n`
        : '';

    let detailMaterial = '';
    if (activeMix) {
      detailMaterial =
        `• Pola Desain: ${
          isFrameMode ? 'Bingkai 4 Sisi (Frame)' : 'Sayap Kiri-Kanan'
        }\n` +
        `• Bingkai Luar: ${activeProduct.nama} — ${hasilOuter.jumlah} ${activeProduct.satuan} (${formatRupiah(
          hasilOuter.totalHarga
        )})\n` +
        `• Fokus Tengah (${effectiveCenterW}m${
          isFrameMode ? ` × ${effectiveCenterH}m` : ''
        }): ${centerProduct.nama} — ${hasilCenter.jumlah} ${
          centerProduct.satuan
        } (${formatRupiah(hasilCenter.totalHarga)})\n`;
    } else {
      detailMaterial =
        `• Material: ${activeProduct.nama} (${activeProduct.dimensi.lebar_cm}×${activeProduct.dimensi.tinggi_cm} cm)\n` +
        `• Kebutuhan: ${hasilTunggal.jumlah} ${activeProduct.satuan} (${formatRupiah(
          hasilTunggal.totalHarga
        )})\n`;
    }

    let detailAksesoris = '';
    if (totalListH > 0 || totalListLWpc > 0) {
      detailAksesoris += `\n*Aksesoris List (Panjang 290 cm):*\n`;
      if (totalListH > 0) {
        detailAksesoris += `• List Transisi / H (${listHColor}): ${listHQty} batang (${formatRupiah(
          totalListH
        )})\n`;
      }
      if (totalListLWpc > 0) {
        detailAksesoris += `• List L / Siku WPC (Senada): ${listLWpcQty} batang (${formatRupiah(
          totalListLWpc
        )})\n`;
      }
    }

    let detailLayanan = '';
    if (includeInstall) {
      detailLayanan =
        `\n*Layanan Pemasangan Toko:*\n` +
        `• Ongkos Pasang: ${formatRupiah(totalJasaPasang)}\n` +
        `• Lem Kuning & Sealant: *GRATIS (Fasilitas Jasa Pasang Toko)*\n`;
    } else if (totalLembarUvMarble > 0) {
      const estimasiLem = totalLembarUvMarble * 90000;
      detailLayanan =
        `\n*Catatan Rekomendasi Perekat (Beli Bahan Saja):*\n` +
        `• Pemasangan UV Marble membutuhkan *Lem Kuning* (estimasi ${totalLembarUvMarble} botol @ Rp 90.000 = ${formatRupiah(
          estimasiLem
        )}).\n` +
        `• _Tips: Lem Kuning & Sealant GRATIS jika menggunakan jasa pasang toko._\n`;
    } else {
      detailLayanan = `\n_(Pembelian bahan saja — belum termasuk ongkos pasang)_\n`;
    }

    const pesan =
      `*ESTIMASI KEBUTUHAN PANEL — PANELIN*\n` +
      `Ukuran Dinding: ${lebarValid}m (L) × ${tinggiValid}m (T) [${luasKotor.toFixed(
        2
      )} m²]\n` +
      infoBukaan +
      `\n*Rincian Material Utama:*\n` +
      detailMaterial +
      detailAksesoris +
      detailLayanan +
      `\n*ESTIMASI TOTAL: ${formatRupiah(grandTotal)}*`;

    window.open(`https://wa.me/?text=${encodeURIComponent(pesan)}`, '_blank');
  };

  return (
    <div className="bg-white rounded-2xl border border-stone-200/90 shadow-xs overflow-hidden">
      <div className="p-4 sm:p-5 border-b border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-50/70">
        <div>
          <h2 className="text-base font-bold text-stone-900">Estimasi & RAB</h2>
          <p className="text-xs text-stone-500">
            Atur desain, ukuran dinding, list, & opsi pasang
          </p>
        </div>

        <div className="grid grid-cols-2 rounded-xl bg-stone-200/90 p-1 w-full sm:w-auto gap-1">
          <button
            type="button"
            onClick={() => onToggleMixMode(false)}
            className={`min-h-[44px] px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
              !isMixMode
                ? 'bg-stone-900 text-amber-300 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <svg
              className="w-4 h-4 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="4" y="4" width="16" height="16" rx="2" />
            </svg>
            <span>1 Produk</span>
          </button>

          <button
            type="button"
            onClick={() => onToggleMixMode(true)}
            className={`min-h-[44px] px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
              isMixMode
                ? 'bg-amber-500 text-stone-950 shadow-xs'
                : 'text-stone-700 hover:text-stone-950'
            }`}
          >
            <svg
              className="w-4 h-4 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="4" width="18" height="16" rx="2" />
              <path d="M9 4v16" />
              <path d="M15 4v16" />
            </svg>
            <span>Mix 2 Produk</span>
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-5 flex flex-col gap-6">
        {/* ── BAGIAN 1: PILIHAN MATERIAL ── */}
        {!isMixMode ? (
          <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-stone-50 border border-stone-200">
            <img
              src={activeProduct.gambar2D}
              alt={activeProduct.nama}
              className="w-16 h-16 rounded-lg object-cover border border-stone-300 shrink-0"
            />
            <div className="min-w-0 flex-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
                {activeProduct.kategori}
              </span>
              <h3 className="text-sm font-bold text-stone-900 truncate">
                {activeProduct.nama}
              </h3>
              <p className="text-xs font-medium text-stone-600 mt-0.5">
                {formatRupiah(activeProduct.harga)}{' '}
                <span className="text-stone-400">/ {activeProduct.satuan}</span>
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-stone-800">
                1. Pilih Slot lalu Klik Motif di Katalog:
              </span>
              <button
                type="button"
                onClick={onSwapMixProducts}
                title="Tukar Posisi Bingkai & Tengah"
                className="min-h-[40px] px-3 py-1.5 text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-xl transition cursor-pointer shrink-0 flex items-center gap-1.5"
              >
                <svg
                  className="w-3.5 h-3.5 shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M7 16V4m0 0L3 8m4-4l4 4" />
                  <path d="M17 8v12m0 0l4-4m-4 4l-4-4" />
                </svg>
                <span>Tukar Posisi</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => onActiveMixSlotChange('outer')}
                className={`min-h-[76px] text-left p-3 rounded-xl border-2 transition cursor-pointer relative ${
                  activeMixSlot === 'outer'
                    ? 'border-amber-500 bg-amber-50/60 shadow-xs'
                    : 'border-stone-200 bg-stone-50/60 hover:border-stone-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wide text-stone-600">
                    Bingkai Luar
                  </span>
                  {activeMixSlot === 'outer' && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500 text-stone-950">
                      Aktif
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2.5">
                  <img
                    src={activeProduct.gambar2D}
                    alt={activeProduct.kode}
                    className="w-11 h-11 rounded-lg object-cover border border-stone-300 shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-stone-900 truncate">
                      {activeProduct.kode}
                    </p>
                    <p className="text-[11px] text-stone-500 truncate">
                      {activeProduct.kategori}
                    </p>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => onActiveMixSlotChange('center')}
                className={`min-h-[76px] text-left p-3 rounded-xl border-2 transition cursor-pointer relative ${
                  activeMixSlot === 'center'
                    ? 'border-amber-500 bg-amber-50/60 shadow-xs'
                    : 'border-stone-200 bg-stone-50/60 hover:border-stone-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wide text-amber-800">
                    Fokus Tengah
                  </span>
                  {activeMixSlot === 'center' && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500 text-stone-950">
                      Aktif
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2.5">
                  <img
                    src={centerProduct?.gambar2D}
                    alt={centerProduct?.kode}
                    className="w-11 h-11 rounded-lg object-cover border border-stone-300 shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-stone-900 truncate">
                      {centerProduct?.kode}
                    </p>
                    <p className="text-[11px] text-stone-500 truncate">
                      {centerProduct?.kategori}
                    </p>
                  </div>
                </div>
              </button>
            </div>

            <div className="pt-1">
              <span className="text-xs font-bold text-stone-800 block mb-2">
                2. Pilih Bentuk Pola Kombinasi:
              </span>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => onMixPatternChange('wings')}
                  className={`min-h-[58px] flex items-center gap-2.5 p-3 rounded-xl border text-left transition cursor-pointer ${
                    mixPattern === 'wings'
                      ? 'border-stone-900 bg-stone-900 text-white shadow-xs'
                      : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  <div className="w-8 h-7 rounded border border-current/30 flex overflow-hidden shrink-0">
                    <div className="w-1/4 h-full bg-current opacity-35" />
                    <div className="w-2/4 h-full bg-amber-400" />
                    <div className="w-1/4 h-full bg-current opacity-35" />
                  </div>
                  <div>
                    <p className="text-xs font-bold leading-tight">Sayap Kiri-Kanan</p>
                    <p className="text-[10px] opacity-75 mt-0.5">Tengah penuh atas-bawah</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => onMixPatternChange('frame')}
                  className={`min-h-[58px] flex items-center gap-2.5 p-3 rounded-xl border text-left transition cursor-pointer ${
                    mixPattern === 'frame'
                      ? 'border-stone-900 bg-stone-900 text-white shadow-xs'
                      : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  <div className="w-8 h-7 rounded border border-current/30 p-1 flex items-center justify-center bg-current/15 shrink-0">
                    <div className="w-full h-full bg-amber-400 rounded-[2px]" />
                  </div>
                  <div>
                    <p className="text-xs font-bold leading-tight">Bingkai 4 Sisi</p>
                    <p className="text-[10px] opacity-75 mt-0.5">Panel tengah melayang</p>
                  </div>
                </button>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200/90 flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <label className="text-xs font-bold text-stone-800">
                  Lebar Panel Tengah (m)
                </label>
                <div className="flex items-center gap-2">
                  {[1.2, 2.4].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => onCenterWidthChange(preset)}
                      className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer transition ${
                        Number(centerWidth) === preset
                          ? 'bg-amber-500 text-stone-950 border-amber-500'
                          : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                      }`}
                    >
                      {preset}m
                    </button>
                  ))}
                </div>
              </div>

              <input
                type="number"
                step="0.1"
                min="0.2"
                max={lebarValid || 20}
                value={centerWidth}
                onChange={(e) => onCenterWidthChange(e.target.value)}
                className="w-full min-h-[44px] text-sm font-bold bg-white border border-stone-300 rounded-xl px-3.5 py-2 focus:outline-none focus:border-amber-500"
              />

              {isFrameMode && (
                <div className="pt-1">
                  <label className="text-xs font-bold text-stone-800 block mb-1.5">
                    Tinggi Panel Tengah (m)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.2"
                    max={tinggiValid || 10}
                    value={centerHeight}
                    onChange={(e) => onCenterHeightChange(e.target.value)}
                    className="w-full min-h-[44px] text-sm font-bold bg-white border border-stone-300 rounded-xl px-3.5 py-2 focus:outline-none focus:border-amber-500"
                  />
                </div>
              )}

              <p className="text-xs text-stone-600">
                Sisa Bingkai Kiri & Kanan:{' '}
                <strong className="text-stone-900">{sideWidth.toFixed(2)} m</strong> per sisi
              </p>
            </div>
          </div>
        )}

        {/* ── BAGIAN 2: INPUT DIMENSI DINDING UTAMA ── */}
        <div>
          <span className="text-xs font-bold text-stone-800 block mb-2.5">
            Ukuran Bidang Dinding Utama (Meter)
          </span>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-stone-600 block mb-1.5">
                Lebar Dinding (m)
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={lebar}
                onChange={(e) => onLebarChange(e.target.value)}
                className="w-full min-h-[46px] text-sm font-bold bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2 focus:outline-none focus:border-amber-500 focus:bg-white transition"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-stone-600 block mb-1.5">
                Tinggi Dinding (m)
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={tinggi}
                onChange={(e) => onTinggiChange(e.target.value)}
                className="w-full min-h-[46px] text-sm font-bold bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2 focus:outline-none focus:border-amber-500 focus:bg-white transition"
              />
            </div>
          </div>
        </div>

        {/* ── BAGIAN 3: BUKAAN DINDING (PINTU / JENDELA) ── */}
        <div className="border-t border-stone-200 pt-5">
          <div className="flex flex-col gap-2.5 mb-3">
            <div>
              <span className="text-xs font-bold text-stone-800 block">
                Bukaan Dinding — Pintu atau Jendela (Opsional)
              </span>
              <span className="text-xs text-stone-500">
                Tambahkan jika dinding memiliki area kosong agar estimasi bahan tidak berlebih
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => onAddOpening('Pintu')}
                className="min-h-[44px] px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 active:bg-amber-200 text-amber-950 text-xs font-bold border border-amber-300 transition cursor-pointer flex items-center justify-center gap-2 shadow-2xs"
              >
                <svg
                  className="w-4 h-4 text-amber-700 shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16" />
                  <path d="M3 21h18" />
                  <circle cx="15" cy="12" r="1" fill="currentColor" />
                </svg>
                <span>+ Tambah Pintu</span>
              </button>

              <button
                type="button"
                onClick={() => onAddOpening('Jendela')}
                className="min-h-[44px] px-3.5 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 active:bg-sky-200 text-sky-950 text-xs font-bold border border-sky-200 transition cursor-pointer flex items-center justify-center gap-2 shadow-2xs"
              >
                <svg
                  className="w-4 h-4 text-sky-700 shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="4" y="4" width="16" height="16" rx="2" />
                  <path d="M12 4v16" />
                  <path d="M4 12h16" />
                </svg>
                <span>+ Tambah Jendela</span>
              </button>
            </div>
          </div>

          {openings.length > 0 && (
            <div className="flex flex-col gap-3 mt-3">
              {openings.map((item, idx) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 flex flex-col gap-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-stone-900 text-amber-300">
                        #{idx + 1}
                      </span>
                      <input
                        type="text"
                        value={item.nama}
                        onChange={(e) =>
                          onUpdateOpening(item.id, 'nama', e.target.value)
                        }
                        aria-label="Nama bukaan"
                        className="text-sm font-bold text-stone-900 bg-white border border-stone-300 rounded-lg px-2.5 py-1 focus:border-amber-500 focus:outline-none w-32"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemoveOpening(item.id)}
                      className="min-h-[38px] px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-bold cursor-pointer transition flex items-center gap-1.5"
                    >
                      <svg
                        className="w-3.5 h-3.5 shrink-0"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M3 6h18" />
                        <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                      </svg>
                      <span>Hapus</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="text-xs font-medium text-stone-600 block mb-1">
                        Lebar Bukaan (m)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        value={item.lebar}
                        onChange={(e) =>
                          onUpdateOpening(item.id, 'lebar', e.target.value)
                        }
                        className="w-full min-h-[42px] bg-white border border-stone-300 rounded-xl px-3 py-1.5 font-bold text-stone-900"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-stone-600 block mb-1">
                        Tinggi Bukaan (m)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        value={item.tinggi}
                        onChange={(e) =>
                          onUpdateOpening(item.id, 'tinggi', e.target.value)
                        }
                        className="w-full min-h-[42px] bg-white border border-stone-300 rounded-xl px-3 py-1.5 font-bold text-stone-900"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-stone-600 block mb-1">
                        Jarak dari Tepi Kiri (m)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={item.jarakKiri}
                        onChange={(e) =>
                          onUpdateOpening(item.id, 'jarakKiri', e.target.value)
                        }
                        className="w-full min-h-[42px] bg-white border border-stone-300 rounded-xl px-3 py-1.5 font-bold text-stone-900"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-stone-600 block mb-1">
                        Tinggi dari Lantai (m)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={item.jarakBawah}
                        onChange={(e) =>
                          onUpdateOpening(item.id, 'jarakBawah', e.target.value)
                        }
                        className="w-full min-h-[42px] bg-white border border-stone-300 rounded-xl px-3 py-1.5 font-bold text-stone-900"
                      />
                      <span className="text-[10px] text-stone-400 mt-0.5 block">
                        Isi 0 jika menempel lantai
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── BAGIAN 4: AKSESORIS LIST PENUTUP SAMBUNGAN / SUDUT ── */}
        <div className="border-t border-stone-200 pt-5 flex flex-col gap-3">
          <div>
            <span className="text-xs font-bold text-stone-800 block">
              Aksesoris List — Penutup Sambungan / Siku (Opsional)
            </span>
            <span className="text-xs text-stone-500">
              {butuhSambunganAtas
                ? 'Disarankan: Tinggi dinding > 2,9m membutuhkan list sambungan'
                : 'Aktifkan untuk melihat simulasi garis list langsung pada dinding'}
            </span>
          </div>

          {hasNonWpc && (
            <div
              className={`p-3.5 rounded-xl border transition-all duration-300 ${
                useListH
                  ? 'border-amber-400 bg-amber-50/40 shadow-2xs'
                  : 'border-stone-200 bg-stone-50/70'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-bold text-stone-900">
                    List Transisi / List H (290 cm)
                  </p>
                  <p className="text-[11px] text-stone-500">
                    Untuk Wallboard & RFP · Rp 50.000 / batang
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onToggleListH((prev) => !prev)}
                  className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                    useListH
                      ? 'bg-stone-900 text-amber-300 border-stone-900'
                      : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                  }`}
                >
                  {useListH ? '✓ Dipakai' : '+ Tambahkan'}
                </button>
              </div>

              {useListH && (
                <div className="mt-3 pt-3 border-t border-amber-200/70 flex flex-col gap-3">
                  <div>
                    <span className="text-[11px] font-semibold text-stone-700 block mb-1.5">
                      Pilih Warna List (Langsung Tampil di Preview):
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { nama: 'Gold', dot: 'bg-amber-400 border-amber-600' },
                        { nama: 'Rosegold', dot: 'bg-rose-300 border-rose-500' },
                        { nama: 'Hitam', dot: 'bg-stone-900 border-stone-950' },
                      ].map((warna) => (
                        <button
                          key={warna.nama}
                          type="button"
                          onClick={() => onListHColorChange(warna.nama)}
                          className={`min-h-[40px] px-2.5 py-1.5 rounded-lg text-xs font-bold border flex items-center justify-center gap-1.5 cursor-pointer transition ${
                            listHColor === warna.nama
                              ? 'bg-stone-900 text-white border-stone-900 shadow-2xs'
                              : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                          }`}
                        >
                          <span
                            className={`w-3 h-3 rounded-full border ${warna.dot}`}
                          />
                          <span>{warna.nama}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-stone-700">
                      Jumlah (Saran: {saranQtyListH} btg)
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onListHQtyChange((q) => Math.max(q - 1, 1))}
                        className="w-10 h-10 rounded-lg bg-white border border-stone-300 font-bold text-stone-800 hover:bg-stone-100 cursor-pointer"
                      >
                        −
                      </button>
                      <span className="w-8 text-center text-sm font-bold text-stone-900">
                        {listHQty}
                      </span>
                      <button
                        type="button"
                        onClick={() => onListHQtyChange((q) => q + 1)}
                        className="w-10 h-10 rounded-lg bg-white border border-stone-300 font-bold text-stone-800 hover:bg-stone-100 cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {hasWpc && (
            <div
              className={`p-3.5 rounded-xl border transition-all duration-300 ${
                useListLWpc
                  ? 'border-amber-400 bg-amber-50/40 shadow-2xs'
                  : 'border-stone-200 bg-stone-50/70'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-bold text-stone-900">
                    List L / Siku WPC (290 cm)
                  </p>
                  <p className="text-[11px] text-stone-500">
                    Warna senada motif WPC · Rp 40.000 / batang
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onToggleListLWpc((prev) => !prev)}
                  className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                    useListLWpc
                      ? 'bg-stone-900 text-amber-300 border-stone-900'
                      : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                  }`}
                >
                  {useListLWpc ? '✓ Dipakai' : '+ Tambahkan'}
                </button>
              </div>

              {useListLWpc && (
                <div className="mt-3 pt-3 border-t border-amber-200/70 flex items-center justify-between">
                  <span className="text-xs font-medium text-stone-700">
                    Jumlah (Saran tepi: {saranQtyListLWpc} btg)
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onListLWpcQtyChange((q) => Math.max(q - 1, 1))}
                      className="w-10 h-10 rounded-lg bg-white border border-stone-300 font-bold text-stone-800 hover:bg-stone-100 cursor-pointer"
                    >
                      −
                    </button>
                    <span className="w-8 text-center text-sm font-bold text-stone-900">
                      {listLWpcQty}
                    </span>
                    <button
                      type="button"
                      onClick={() => onListLWpcQtyChange((q) => q + 1)}
                      className="w-10 h-10 rounded-lg bg-white border border-stone-300 font-bold text-stone-800 hover:bg-stone-100 cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── BAGIAN 5: OPSI PEMBELIAN ── */}
        <div className="border-t border-stone-200 pt-5">
          <span className="text-xs font-bold text-stone-800 block mb-2.5">
            Opsi Layanan Pemasangan
          </span>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setIncludeInstall(false)}
              className={`min-h-[54px] p-3 rounded-xl border text-left transition cursor-pointer ${
                !includeInstall
                  ? 'border-stone-900 bg-stone-900 text-white shadow-xs'
                  : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
              }`}
            >
              <p className="text-xs font-bold">Beli Bahan Saja</p>
              <p className="text-[10px] opacity-75 mt-0.5">Tanpa ongkos tukang</p>
            </button>

            <button
              type="button"
              onClick={() => setIncludeInstall(true)}
              className={`min-h-[54px] p-3 rounded-xl border text-left transition cursor-pointer ${
                includeInstall
                  ? 'border-amber-500 bg-amber-500 text-stone-950 shadow-xs'
                  : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
              }`}
            >
              <p className="text-xs font-bold">+ Jasa Pasang Toko</p>
              <p className="text-[10px] opacity-85 mt-0.5">
                Gratis lem kuning & sealant
              </p>
            </button>
          </div>
        </div>

        {/* ── BAGIAN 6: KARTU RINGKASAN RAB ── */}
        <div className="rounded-2xl bg-stone-950 text-stone-100 p-4 sm:p-5 flex flex-col gap-3 shadow-inner">
          <div className="flex items-center justify-between text-xs text-stone-400">
            <span>Luas Dinding {openings.length > 0 ? 'Bersih' : 'Total'}</span>
            <span className="font-mono text-stone-200">
              {luasBersih.toFixed(2)} m²
              {openings.length > 0 && (
                <span className="text-stone-500"> (kotor {luasKotor.toFixed(2)} m²)</span>
              )}
            </span>
          </div>

          {activeMix ? (
            <div className="flex flex-col gap-2 text-xs pt-1">
              <div className="flex items-center justify-between">
                <span className="text-stone-300">
                  Bingkai ({activeProduct.kode}) · {hasilOuter.jumlah}{' '}
                  {activeProduct.satuan}
                </span>
                <span className="font-semibold text-amber-300">
                  {formatRupiah(hasilOuter.totalHarga)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-300">
                  Tengah ({centerProduct.kode}) · {hasilCenter.jumlah}{' '}
                  {centerProduct.satuan}
                </span>
                <span className="font-semibold text-amber-300">
                  {formatRupiah(hasilCenter.totalHarga)}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-stone-300">
                Bahan ({hasilTunggal.jumlah} {activeProduct.satuan})
              </span>
              <span className="font-semibold text-white">
                {formatRupiah(hasilTunggal.totalHarga)}
              </span>
            </div>
          )}

          {totalListH > 0 && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-stone-300">
                List H {listHColor} ({listHQty} btg)
              </span>
              <span className="font-semibold text-amber-300">
                {formatRupiah(totalListH)}
              </span>
            </div>
          )}
          {totalListLWpc > 0 && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-stone-300">
                List L WPC Senada ({listLWpcQty} btg)
              </span>
              <span className="font-semibold text-amber-300">
                {formatRupiah(totalListLWpc)}
              </span>
            </div>
          )}

          {includeInstall ? (
            <div className="pt-2 border-t border-stone-800 flex flex-col gap-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-stone-300">Jasa Pemasangan Toko</span>
                <span className="font-semibold text-amber-300">
                  {formatRupiah(totalJasaPasang)}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-emerald-400">
                <span>Lem Kuning & Sealant</span>
                <span className="font-bold">GRATIS (Fasilitas Pasang)</span>
              </div>
            </div>
          ) : (
            totalLembarUvMarble > 0 && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-400/30 text-[11px] text-amber-200 leading-relaxed">
                <strong className="text-amber-300 block mb-0.5">
                  Rekomendasi Perekat UV Marble:
                </strong>
                Untuk pemasangan mandiri tanpa jasa tukang toko, disarankan memakai{' '}
                <strong>Lem Kuning</strong> (±{totalLembarUvMarble} botol @ Rp 90.000 ={' '}
                <strong>{formatRupiah(totalLembarUvMarble * 90000)}</strong>).{' '}
                <span className="text-emerald-300">
                  Gratis jika menggunakan jasa pasang toko.
                </span>
              </div>
            )
          )}

          <div className="pt-2.5 border-t border-stone-800 flex items-baseline justify-between">
            <span className="text-xs text-stone-400">
              {includeInstall ? 'Total Terima Beres' : 'Estimasi Total Bahan'}
            </span>
            <span className="text-lg sm:text-xl font-extrabold text-amber-400">
              {formatRupiah(grandTotal)}
            </span>
          </div>

          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="mt-1 w-full min-h-[48px] py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-sm transition cursor-pointer flex items-center justify-center gap-2.5 shadow-sm"
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.031 2c-5.516 0-9.969 4.453-9.969 9.969 0 1.758.458 3.475 1.328 4.988L2 22l5.188-1.359a9.927 9.927 0 0 0 4.843 1.258h.004c5.515 0 9.969-4.453 9.969-9.969A9.928 9.928 0 0 0 19.08 4.92 9.914 9.914 0 0 0 12.031 2zm5.814 14.253c-.246.693-1.434 1.324-1.992 1.406-.512.076-1.158.108-1.87-.118-.432-.137-.986-.32-1.696-.627-2.984-1.289-4.933-4.294-5.082-4.492-.149-.198-1.215-1.617-1.215-3.084 0-1.467.768-2.188 1.041-2.487.273-.299.596-.374.794-.374.199 0 .397.002.571.01.183.009.429-.07.671.512.248.596.844 2.062.918 2.212.075.149.124.323.025.522-.099.199-.149.323-.298.497-.149.174-.313.389-.447.522-.149.149-.304.31-.131.608.174.298.772 1.274 1.658 2.064 1.139 1.016 2.099 1.331 2.397 1.48.298.149.472.124.646-.075.174-.199.745-.869.944-1.167.199-.298.397-.249.671-.149.273.099 1.739.82 2.037.969.298.149.497.224.571.348.075.124.075.72-.171 1.413z" />
            </svg>
            <span>Bagikan Estimasi ke WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  );
}