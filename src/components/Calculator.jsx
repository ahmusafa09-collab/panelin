export default function Calculator({
  activeProduct,
  lebar,
  tinggi,
  onLebarChange,
  onTinggiChange,
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
}) {
  if (!activeProduct) return null;

  const lebarValid = Number(lebar) > 0 ? Number(lebar) : 0;
  const tinggiValid = Number(tinggi) > 0 ? Number(tinggi) : 0;
  const luasDinding = lebarValid * tinggiValid;

  const formatRupiah = (angka) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(angka);

  // ─── Fungsi Hitung Kebutuhan per Satu Jenis Produk ─────────────────────────
  const hitungKebutuhan = (produk, targetLebarM, targetTinggiM) => {
    if (!produk || targetLebarM <= 0 || targetTinggiM <= 0) {
      return { jumlah: 0, totalHarga: 0, tumpukVertikal: 1 };
    }
    const lebarPanelM = produk.dimensi.lebar_cm / 100;
    const tinggiPanelM = produk.dimensi.tinggi_cm / 100;

    const lajurHorizontal = Math.ceil(targetLebarM / lebarPanelM);
    const tumpukVertikal = Math.ceil(targetTinggiM / tinggiPanelM);
    const jumlah = lajurHorizontal * tumpukVertikal;
    const totalHarga = jumlah * produk.harga;

    return { jumlah, totalHarga, tumpukVertikal };
  };

  // ─── Kalkulasi Mode Tunggal vs Mode Mix ───────────────────────────────────
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

  // Hitung kebutuhan masing-masing
  const hasilTunggal = hitungKebutuhan(activeProduct, lebarValid, tinggiValid);

  const hasilCenter = activeMix
    ? hitungKebutuhan(centerProduct, effectiveCenterW, effectiveCenterH)
    : { jumlah: 0, totalHarga: 0 };

  // Untuk Bingkai (Sisi Luar) pada Mode Mix:
  const hasilOuter = (() => {
    if (!activeMix) return { jumlah: 0, totalHarga: 0 };
    if (!isFrameMode) {
      // Sayap Kiri + Sayap Kanan
      const kiri = hitungKebutuhan(activeProduct, sideWidth, tinggiValid);
      const kanan = hitungKebutuhan(activeProduct, sideWidth, tinggiValid);
      return {
        jumlah: kiri.jumlah + kanan.jumlah,
        totalHarga: kiri.totalHarga + kanan.totalHarga,
      };
    } else {
      // Bingkai 4 Sisi: Sisi kiri-kanan penuh + bagian atas-bawah area tengah
      const kiri = hitungKebutuhan(activeProduct, sideWidth, tinggiValid);
      const kanan = hitungKebutuhan(activeProduct, sideWidth, tinggiValid);
      const atas = hitungKebutuhan(activeProduct, effectiveCenterW, topBottomHeight);
      const bawah = hitungKebutuhan(activeProduct, effectiveCenterW, topBottomHeight);
      return {
        jumlah: kiri.jumlah + kanan.jumlah + atas.jumlah + bawah.jumlah,
        totalHarga:
          kiri.totalHarga + kanan.totalHarga + atas.totalHarga + bawah.totalHarga,
      };
    }
  })();

  const grandTotal = activeMix
    ? hasilOuter.totalHarga + hasilCenter.totalHarga
    : hasilTunggal.totalHarga;

  // ─── Buat Pesan Ringkasan WhatsApp ─────────────────────────────────────────
  const handleShareWhatsApp = () => {
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
      detailMaterial = `• Material: ${activeProduct.nama} (${activeProduct.dimensi.lebar_cm}×${activeProduct.dimensi.tinggi_cm} cm)\n` +
        `• Kebutuhan: ${hasilTunggal.jumlah} ${activeProduct.satuan}\n`;
    }

    const pesan =
      `*ESTIMASI KEBUTUHAN PANEL — PANELIN*\n` +
      `Ukuran Dinding: ${lebarValid}m (L) × ${tinggiValid}m (T) [${luasDinding.toFixed(
        2
      )} m²]\n\n` +
      `*Rincian Material:*\n` +
      detailMaterial +
      `\n*Estimasi Total Bahan: ${formatRupiah(grandTotal)}*\n` +
      `_(Belum termasuk jasa pasang & aksesoris list/sealant)_`;

    window.open(`https://wa.me/?text=${encodeURIComponent(pesan)}`, '_blank');
  };

  return (
    <div className="bg-white rounded-2xl border border-stone-200/90 shadow-xs overflow-hidden">
      {/* ── Header Kalkulator & Switch Mode ── */}
      <div className="p-4 sm:p-5 border-b border-stone-100 flex items-center justify-between gap-2 bg-stone-50/70">
        <div>
          <h2 className="text-base font-bold text-stone-900">Estimasi & RAB</h2>
          <p className="text-[11px] text-stone-500">
            Atur ukuran bidang & komposisi panel
          </p>
        </div>

        {/* Segmented Control: 1 Produk vs Mix Produk */}
        <div className="inline-flex rounded-xl bg-stone-200/80 p-1">
          <button
            type="button"
            onClick={() => onToggleMixMode(false)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              !isMixMode
                ? 'bg-stone-900 text-amber-300 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            1 Produk
          </button>
          <button
            type="button"
            onClick={() => onToggleMixMode(true)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
              isMixMode
                ? 'bg-stone-900 text-amber-300 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <span>Mix 2 Produk</span>
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-5 flex flex-col gap-5">
        {/* ── BAGIAN 1: PILIHAN MATERIAL (1 PRODUK VS 2 SLOT KLIK LANGSUNG) ── */}
        {!isMixMode ? (
          /* Kartu Produk Tunggal */
          <div className="flex items-center gap-3 p-3 rounded-xl bg-stone-50 border border-stone-200">
            <img
              src={activeProduct.gambar2D}
              alt={activeProduct.nama}
              className="w-14 h-14 rounded-lg object-cover border border-stone-300 shrink-0"
            />
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
                {activeProduct.kategori}
              </span>
              <h3 className="text-sm font-bold text-stone-900 truncate">
                {activeProduct.nama}
              </h3>
              <p className="text-xs text-stone-500">
                {formatRupiah(activeProduct.harga)}{' '}
                <span className="text-stone-400">/ {activeProduct.satuan}</span>
              </p>
            </div>
          </div>
        ) : (
          /* ─── SISTEM 2 SLOT KLIK LANGSUNG UNTUK MIX PRODUK ─── */
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-700">
                1. Klik Slot untuk Ganti Motif dari Katalog:
              </span>
              <button
                type="button"
                onClick={onSwapMixProducts}
                title="Tukar Posisi Bingkai & Tengah"
                className="text-[11px] font-semibold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-md transition cursor-pointer"
              >
                ⇄ Tukar Posisi
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {/* SLOT 1: BINGKAI / SISI LUAR */}
              <button
                type="button"
                onClick={() => onActiveMixSlotChange('outer')}
                className={`text-left p-2.5 rounded-xl border-2 transition cursor-pointer relative ${
                  activeMixSlot === 'outer'
                    ? 'border-amber-500 bg-amber-50/40 shadow-xs'
                    : 'border-stone-200 bg-stone-50/60 hover:border-stone-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-stone-500">
                    Bingkai Luar
                  </span>
                  {activeMixSlot === 'outer' && (
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <img
                    src={activeProduct.gambar2D}
                    alt={activeProduct.kode}
                    className="w-10 h-10 rounded-lg object-cover border border-stone-300 shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-stone-900 truncate">
                      {activeProduct.kode}
                    </p>
                    <p className="text-[10px] text-stone-500 truncate">
                      {activeProduct.kategori}
                    </p>
                  </div>
                </div>
              </button>

              {/* SLOT 2: FOKUS TENGAH */}
              <button
                type="button"
                onClick={() => onActiveMixSlotChange('center')}
                className={`text-left p-2.5 rounded-xl border-2 transition cursor-pointer relative ${
                  activeMixSlot === 'center'
                    ? 'border-amber-500 bg-amber-50/40 shadow-xs'
                    : 'border-stone-200 bg-stone-50/60 hover:border-stone-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-amber-700">
                    Fokus Tengah
                  </span>
                  {activeMixSlot === 'center' && (
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <img
                    src={centerProduct?.gambar2D}
                    alt={centerProduct?.kode}
                    className="w-10 h-10 rounded-lg object-cover border border-stone-300 shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-stone-900 truncate">
                      {centerProduct?.kode}
                    </p>
                    <p className="text-[10px] text-stone-500 truncate">
                      {centerProduct?.kategori}
                    </p>
                  </div>
                </div>
              </button>
            </div>

            {/* ── PILIH POLA VISUAL MIX ── */}
            <div className="pt-1">
              <span className="text-xs font-bold text-stone-700 block mb-2">
                2. Pilih Bentuk Pola Kombinasi:
              </span>
              <div className="grid grid-cols-2 gap-2.5">
                {/* Pola Sayap Kiri-Kanan */}
                <button
                  type="button"
                  onClick={() => onMixPatternChange('wings')}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition cursor-pointer ${
                    mixPattern === 'wings'
                      ? 'border-stone-900 bg-stone-900 text-white shadow-xs'
                      : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  {/* Ikon Mini Sayap Kiri-Kanan */}
                  <div className="w-8 h-7 rounded border border-current/30 flex overflow-hidden shrink-0">
                    <div className="w-1/4 h-full bg-current opacity-35" />
                    <div className="w-2/4 h-full bg-amber-400" />
                    <div className="w-1/4 h-full bg-current opacity-35" />
                  </div>
                  <div>
                    <p className="text-xs font-bold leading-tight">Sayap Kiri-Kanan</p>
                    <p className="text-[10px] opacity-70">Tengah penuh atas-bawah</p>
                  </div>
                </button>

                {/* Pola Bingkai 4 Sisi */}
                <button
                  type="button"
                  onClick={() => onMixPatternChange('frame')}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition cursor-pointer ${
                    mixPattern === 'frame'
                      ? 'border-stone-900 bg-stone-900 text-white shadow-xs'
                      : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  {/* Ikon Mini Bingkai 4 Sisi */}
                  <div className="w-8 h-7 rounded border border-current/30 p-1 flex items-center justify-center bg-current/15 shrink-0">
                    <div className="w-full h-full bg-amber-400 rounded-[2px]" />
                  </div>
                  <div>
                    <p className="text-xs font-bold leading-tight">Bingkai 4 Sisi</p>
                    <p className="text-[10px] opacity-70">Panel tengah melayang</p>
                  </div>
                </button>
              </div>
            </div>

            {/* ── UKURAN PANEL FOKUS TENGAH ── */}
            <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/90 flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-stone-700">
                  Lebar Fokus Tengah (m)
                </label>
                <div className="flex items-center gap-1">
                  {[1.2, 2.4].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => onCenterWidthChange(preset)}
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold border cursor-pointer transition ${
                        Number(centerWidth) === preset
                          ? 'bg-amber-500 text-stone-950 border-amber-500'
                          : 'bg-white text-stone-600 border-stone-300 hover:bg-stone-100'
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
                className="w-full text-sm font-semibold bg-white border border-stone-300 rounded-lg px-3 py-1.5 focus:outline-none focus:border-amber-500"
              />

              {isFrameMode && (
                <div className="pt-1">
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    Tinggi Fokus Tengah (m)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.2"
                    max={tinggiValid || 10}
                    value={centerHeight}
                    onChange={(e) => onCenterHeightChange(e.target.value)}
                    className="w-full text-sm font-semibold bg-white border border-stone-300 rounded-lg px-3 py-1.5 focus:outline-none focus:border-amber-500"
                  />
                </div>
              )}

              <p className="text-[11px] text-stone-500">
                Sisa Bingkai Kiri & Kanan:{' '}
                <strong className="text-stone-700">{sideWidth.toFixed(2)} m</strong> per sisi
              </p>
            </div>
          </div>
        )}

        {/* ── BAGIAN 2: INPUT DIMENSI DINDING UTAMA ── */}
        <div>
          <span className="text-xs font-bold text-stone-700 block mb-2">
            Ukuran Bidang Dinding (Meter)
          </span>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-stone-500 block mb-1">
                Lebar Dinding (m)
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={lebar}
                onChange={(e) => onLebarChange(e.target.value)}
                className="w-full text-sm font-bold bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500 focus:bg-white transition"
              />
            </div>
            <div>
              <label className="text-[11px] text-stone-500 block mb-1">
                Tinggi Dinding (m)
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={tinggi}
                onChange={(e) => onTinggiChange(e.target.value)}
                className="w-full text-sm font-bold bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500 focus:bg-white transition"
              />
            </div>
          </div>
        </div>

        {/* ── BAGIAN 3: KARTU RINGKASAN RAB (DARK CHARCOAL & GOLD) ── */}
        <div className="rounded-2xl bg-stone-950 text-stone-100 p-4 flex flex-col gap-3 shadow-inner">
          <div className="flex items-center justify-between text-xs text-stone-400 border-b border-stone-800 pb-2">
            <span>Luas Total Bidang</span>
            <span className="font-mono font-semibold text-stone-200">
              {luasDinding.toFixed(2)} m²
            </span>
          </div>

          {activeMix ? (
            <div className="flex flex-col gap-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-stone-300">
                  Bingkai ({activeProduct.kode})
                </span>
                <span className="font-semibold text-white">
                  {hasilOuter.jumlah} {activeProduct.satuan} ·{' '}
                  <span className="text-amber-300">
                    {formatRupiah(hasilOuter.totalHarga)}
                  </span>
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-300">
                  Tengah ({centerProduct.kode})
                </span>
                <span className="font-semibold text-white">
                  {hasilCenter.jumlah} {centerProduct.satuan} ·{' '}
                  <span className="text-amber-300">
                    {formatRupiah(hasilCenter.totalHarga)}
                  </span>
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between text-xs">
              <span className="text-stone-300">Kebutuhan Material</span>
              <span className="text-sm font-bold text-white">
                {hasilTunggal.jumlah} {activeProduct.satuan}
              </span>
            </div>
          )}

          <div className="pt-2 border-t border-stone-800 flex items-baseline justify-between">
            <span className="text-xs text-stone-400">Estimasi Harga Bahan</span>
            <span className="text-lg sm:text-xl font-extrabold text-amber-400">
              {formatRupiah(grandTotal)}
            </span>
          </div>

          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="mt-1 w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs sm:text-sm transition cursor-pointer flex items-center justify-center gap-2 shadow-sm"
          >
            <span>Bagikan Estimasi ke WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  );
}