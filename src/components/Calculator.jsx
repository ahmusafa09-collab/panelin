import { useState } from 'react';

export default function Calculator({
  catalogData = [],
  activeProduct,
  lebar,
  setLebar,
  tinggi,
  setTinggi,
  isMixMode = false,
  setIsMixMode = () => {},
  mixPattern = 'wings',
  setMixPattern = () => {},
  centerProduct = null,
  setCenterProduct = () => {},
  centerWidth = 1.2,
  setCenterWidth = () => {},
  centerHeight = 2.0,
  setCenterHeight = () => {},
}) {
  const [pakaiCadangan, setPakaiCadangan] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!activeProduct) return null;

  const {
    kode,
    nama,
    kategori,
    dimensi: { lebar_cm, tinggi_cm },
    luas_m2,
    harga,
    satuan,
    motif,
    gambar2D,
  } = activeProduct;

  const satuanKapital = satuan.charAt(0).toUpperCase() + satuan.slice(1);
  const tinggiStandarMeter = tinggi_cm / 100;

  const lebarValid = Number(lebar) > 0 ? Number(lebar) : 0;
  const tinggiValid = Number(tinggi) > 0 ? Number(tinggi) : 0;
  const luasDinding = lebarValid * tinggiValid;
  const isMelebihiTinggiStandar = tinggiValid > tinggiStandarMeter;

  // ─── Fungsi Pembantu Hitung Kebutuhan per Lajur/Luas ───────────────────────
  const hitungKebutuhanZona = (lebarZonaMeter, prod) => {
    if (lebarZonaMeter <= 0 || tinggiValid <= 0 || !prod) return 0;
    const tinggiProdMeter = prod.dimensi.tinggi_cm / 100;
    if (tinggiValid > tinggiProdMeter) {
      return Math.ceil((lebarZonaMeter * tinggiValid) / prod.luas_m2);
    }
    return Math.ceil((lebarZonaMeter * 100) / prod.dimensi.lebar_cm);
  };

  // ─── Kalkulasi Mode Tunggal vs Mode Mix ────────────────────────────────────
  const activeMix = isMixMode && centerProduct && lebarValid > 0 && tinggiValid > 0;
  const isFrameMode = activeMix && mixPattern === 'frame';

  // ─── [1] POSISI VALIDASI UKURAN PANEL TENGAH VS DINDING ────────────────────
  const rawCenterWidth = Number(centerWidth) || 0;
  const rawCenterHeight = Number(centerHeight) || 0;

  const isCenterWiderThanWall = activeMix && lebarValid > 0 && rawCenterWidth > lebarValid;
  const isCenterTallerThanWall = isFrameMode && tinggiValid > 0 && rawCenterHeight > tinggiValid;
  const isCenterExceedsWall = isCenterWiderThanWall || isCenterTallerThanWall;

  const effectiveCenterWidth = activeMix
    ? Math.min(Math.max(rawCenterWidth, 0.1), lebarValid)
    : 0;
  const effectiveCenterHeight = isFrameMode
    ? Math.min(Math.max(rawCenterHeight, 0.1), tinggiValid)
    : tinggiValid;

  const sideWidthEach = activeMix ? Math.max((lebarValid - effectiveCenterWidth) / 2, 0) : 0;
  const topBottomHeightEach = isFrameMode
    ? Math.max((tinggiValid - effectiveCenterHeight) / 2, 0)
    : 0;

  const luasAreaTengah = effectiveCenterWidth * effectiveCenterHeight;
  const luasAreaBingkai = Math.max(luasDinding - luasAreaTengah, 0);

  // 1. Kebutuhan Produk Utama (Panel Bingkai / Polos)
  let pokokUtama = 0;
  if (!activeMix) {
    pokokUtama = hitungKebutuhanZona(lebarValid, activeProduct);
  } else if (isFrameMode) {
    pokokUtama = luasAreaBingkai > 0 ? Math.ceil(luasAreaBingkai / luas_m2) : 0;
  } else {
    pokokUtama = hitungKebutuhanZona(sideWidthEach, activeProduct) * 2;
  }

  const cadanganUtama = pakaiCadangan ? Math.ceil(pokokUtama * 0.1) : 0;
  const totalUtama = pokokUtama + cadanganUtama;
  const biayaUtama = totalUtama * harga;

  // 2. Kebutuhan Produk Tengah (Khusus Mode Mix)
  let pokokTengah = 0;
  if (activeMix) {
    if (isFrameMode) {
      const kolomTengah = Math.ceil((effectiveCenterWidth * 100) / centerProduct.dimensi.lebar_cm);
      const barisTengah = Math.ceil((effectiveCenterHeight * 100) / centerProduct.dimensi.tinggi_cm);
      const luasKebutuhanTengah = luasAreaTengah / centerProduct.luas_m2;
      pokokTengah = Math.max(
        Math.ceil(luasKebutuhanTengah),
        Math.ceil(
          (kolomTengah * barisTengah) /
            (effectiveCenterHeight <= centerProduct.dimensi.tinggi_cm / 200 ? 2 : 1)
        )
      );
    } else {
      pokokTengah = hitungKebutuhanZona(effectiveCenterWidth, centerProduct);
    }
  }

  const cadanganTengah = activeMix && pakaiCadangan ? Math.ceil(pokokTengah * 0.1) : 0;
  const totalTengah = pokokTengah + cadanganTengah;
  const biayaTengah = activeMix ? totalTengah * centerProduct.harga : 0;

  const totalAnggaran = biayaUtama + biayaTengah;

  const formatRupiah = (angka) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(angka);

  const formatDesimal = (angka, digit = 2) =>
    angka.toLocaleString('id-ID', {
      minimumFractionDigits: digit,
      maximumFractionDigits: digit,
    });

  // ─── Generator Teks RAB WhatsApp ───────────────────────────────────────────
  const generateRABText = () => {
    if (activeMix) {
      const satTengahKap =
        centerProduct.satuan.charAt(0).toUpperCase() + centerProduct.satuan.slice(1);
      const rincianPola = isFrameMode
        ? `• Pola Desain: Bingkai 4 Sisi (Atas-Bawah ${formatDesimal(topBottomHeightEach, 2)} m, Kiri-Kanan ${formatDesimal(sideWidthEach, 2)} m — Pasang Vertikal)\n` +
          `• Ukuran Area Tengah: ${formatDesimal(effectiveCenterWidth, 2)} m × ${formatDesimal(effectiveCenterHeight, 2)} m (${formatDesimal(luasAreaTengah, 2)} m²)`
        : `• Pola Desain: Sayap Kiri (${formatDesimal(sideWidthEach, 2)} m) + Tengah (${formatDesimal(effectiveCenterWidth, 2)} m) + Sayap Kanan (${formatDesimal(sideWidthEach, 2)} m)`;

      return (
        `*ESTIMASI MIX MATERIAL - PANELIN*\n` +
        `----------------------------------------\n` +
        `*Ukuran Dinding:* ${lebarValid} m × ${tinggiValid} m (${formatDesimal(luasDinding, 2)} m²)\n` +
        `${rincianPola}\n` +
        `• Cadangan Potongan (+10%): ${pakaiCadangan ? 'Ya' : 'Tidak'}\n\n` +
        `*1. Panel Tengah (${centerProduct.nama}):*\n` +
        `• Harga: ${formatRupiah(centerProduct.harga)} / ${centerProduct.satuan}\n` +
        `• Kebutuhan: *${totalTengah} ${satTengahKap}* (${formatRupiah(biayaTengah)})\n\n` +
        `*2. Panel Bingkai / Sisi (${nama}):*\n` +
        `• Harga: ${formatRupiah(harga)} / ${satuan}\n` +
        `• Kebutuhan: *${totalUtama} ${satuanKapital}* (${formatRupiah(biayaUtama)})\n\n` +
        `*TOTAL ANGGARAN GABUNGAN: ${formatRupiah(totalAnggaran)}*\n` +
        `----------------------------------------\n` +
        `_Dihitung otomatis melalui Panelin Smart Estimator_`
      );
    }

    const barisCadangan = pakaiCadangan
      ? `• Rincian Kebutuhan: ${pokokUtama} ${satuanKapital} + ${cadanganUtama} Cadangan (+10%)\n`
      : '';

    return (
      `*ESTIMASI KEBUTUHAN MATERIAL - PANELIN*\n` +
      `----------------------------------------\n` +
      `• Produk: ${nama} (${kode})\n` +
      `• Kategori: ${kategori}\n` +
      `• Dimensi Panel: ${lebar_cm} cm × ${tinggi_cm} cm (${formatDesimal(luas_m2, 3)} m²/${satuan})\n` +
      `• Harga Satuan: ${formatRupiah(harga)} / ${satuan}\n\n` +
      `*Ukuran Bidang Dinding:*\n` +
      `• Lebar × Tinggi: ${lebarValid} m × ${tinggiValid} m (${formatDesimal(luasDinding, 2)} m²)\n` +
      `• Metode Hitung: ${isMelebihiTinggiStandar ? 'Berdasarkan Total Luas' : 'Per Lajur Lebar'}\n\n` +
      `*Total Kebutuhan & Anggaran:*\n` +
      barisCadangan +
      `• Total Kebutuhan: *${totalUtama} ${satuanKapital}*\n` +
      `• Total Anggaran: *${formatRupiah(totalAnggaran)}*\n` +
      `----------------------------------------\n` +
      `_Dihitung otomatis melalui Panelin Smart Estimator_`
    );
  };

  const handleSalinRAB = async () => {
    try {
      await navigator.clipboard.writeText(generateRABText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Gagal menyalin RAB:', err);
    }
  };

  const handleKirimWhatsApp = () => {
    const nomorWA = '6281390184012';
    const text = generateRABText();
    const url = `https://api.whatsapp.com/send?phone=${nomorWA}&text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex flex-col gap-4">
      {/* Header + Toggle Mode Tunggal / Mix */}
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-bold text-gray-800">Kalkulator</h2>
        <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setIsMixMode(false)}
            className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
              !isMixMode ? 'bg-white text-blue-600 shadow-2xs' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            1 Produk
          </button>
          <button
            type="button"
            onClick={() => setIsMixMode(true)}
            className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
              isMixMode ? 'bg-amber-500 text-white shadow-2xs' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            Mix Produk ✨
          </button>
        </div>
      </div>

      {/* Kartu Produk Utama (Bingkai / Sisi) */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5">
        {isMixMode && (
          <div className="text-[11px] font-bold text-blue-600 uppercase tracking-wide mb-2">
            Panel Bingkai / Sisi Luar (Pilih dari Katalog)
          </div>
        )}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={gambar2D}
              alt={nama}
              className="w-11 h-11 rounded-lg object-cover border border-gray-200 shrink-0"
            />
            <div className="min-w-0">
              <h3 className="font-bold text-gray-800 text-sm truncate">{nama}</h3>
              <p className="text-xs text-gray-500 truncate">
                <span className="text-blue-600 font-medium">{kategori}</span> • {motif}
              </p>
            </div>
          </div>

          <div className="bg-white border border-blue-100 px-2.5 py-1.5 rounded-lg text-right shrink-0 shadow-2xs">
            <span className="text-sm font-bold text-blue-600">{formatRupiah(harga)}</span>
            <span className="text-[11px] text-gray-500"> / {satuan}</span>
          </div>
        </div>
      </div>

      {/* Panel Pengaturan Mix Produk */}
      {isMixMode && centerProduct && (
        <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 flex flex-col gap-3">
          {/* Pilihan Pola Mix */}
          <div>
            <span className="block text-[11px] font-bold text-amber-900 uppercase tracking-wide mb-1.5">
              Pilih Pola Desain Mix:
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setMixPattern('wings')}
                className={`py-1.5 px-2 rounded-lg border transition cursor-pointer ${
                  mixPattern === 'wings'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                    : 'bg-white text-gray-700 border-amber-300 hover:bg-amber-100'
                }`}
              >
                Sayap Kiri–Kanan
              </button>
              <button
                type="button"
                onClick={() => setMixPattern('frame')}
                className={`py-1.5 px-2 rounded-lg border transition cursor-pointer ${
                  mixPattern === 'frame'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                    : 'bg-white text-gray-700 border-amber-300 hover:bg-amber-100'
                }`}
              >
                Bingkai 4 Sisi (Frame)
              </button>
            </div>
          </div>

          {/* Dropdown pilih produk tengah */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wide">
                Panel Fokus Tengah
              </span>
              <span className="text-xs font-bold text-amber-700">
                {formatRupiah(centerProduct.harga)} / {centerProduct.satuan}
              </span>
            </div>
            <select
              value={centerProduct.kode}
              onChange={(e) => {
                const found = catalogData.find((p) => p.kode === e.target.value);
                if (found) setCenterProduct(found);
              }}
              className="w-full px-3 py-2 bg-white border border-amber-300 rounded-lg text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {catalogData.map((item) => (
                <option key={item.kode} value={item.kode}>
                  {item.nama} — {item.motif} ({formatRupiah(item.harga)})
                </option>
              ))}
            </select>
          </div>

          {/* Input Dimensi Area Tengah */}
          <div className={`grid ${isFrameMode ? 'grid-cols-2' : 'grid-cols-1'} gap-2.5`}>
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                Lebar Tengah (m)
              </label>
              <div className="flex gap-1.5">
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max={lebarValid || 10}
                  value={centerWidth}
                  onChange={(e) => setCenterWidth(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                {!isFrameMode &&
                  [1.2, 2.4].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setCenterWidth(preset)}
                      className="px-2 py-1.5 bg-white border border-amber-300 hover:bg-amber-100 text-amber-900 rounded-lg text-xs font-semibold shrink-0 cursor-pointer"
                    >
                      {preset}m
                    </button>
                  ))}
              </div>
            </div>

            {isFrameMode && (
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                  Tinggi Tengah (m)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max={tinggiValid || 10}
                  value={centerHeight}
                  onChange={(e) => setCenterHeight(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            )}
          </div>

          {/* ─── [2] POSISI ALERT JIKA UKURAN PANEL TENGAH MELEBIHI DINDING ─── */}
          {isCenterExceedsWall && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-2.5 text-[11px] text-red-800 flex flex-col gap-1.5">
              <div className="font-bold flex items-center gap-1 text-red-700">
                <span>🚨</span>
                <span>Ukuran Panel Tengah Melebihi Dinding!</span>
              </div>
              <ul className="list-disc list-inside text-red-700 space-y-0.5">
                {isCenterWiderThanWall && (
                  <li>
                    Lebar tengah (<strong>{rawCenterWidth}m</strong>) lebih besar dari lebar dinding (
                    <strong>{lebarValid}m</strong>).
                  </li>
                )}
                {isCenterTallerThanWall && (
                  <li>
                    Tinggi tengah (<strong>{rawCenterHeight}m</strong>) lebih besar dari tinggi dinding (
                    <strong>{tinggiValid}m</strong>).
                  </li>
                )}
              </ul>
              <div className="flex items-center justify-between pt-1 border-t border-red-200/70">
                <span className="text-[10px] text-red-600">
                  Preview otomatis menyesuaikan batas maksimal dinding.
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (isCenterWiderThanWall) setCenterWidth(lebarValid);
                    if (isCenterTallerThanWall) setCenterHeight(tinggiValid);
                  }}
                  className="px-2 py-0.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded text-[10px] cursor-pointer shrink-0"
                >
                  Samakan Batas
                </button>
              </div>
            </div>
          )}

          {/* Info Sisa Bingkai */}
          <div className="text-[11px] text-amber-900/80 bg-white/80 px-2.5 py-1.5 rounded-lg border border-amber-200/70">
            {isFrameMode ? (
              <>
                Bingkai Vertikal: Kiri/Kanan <strong>{formatDesimal(sideWidthEach, 2)}m</strong> · Atas/Bawah{' '}
                <strong>{formatDesimal(topBottomHeightEach, 2)}m</strong>
              </>
            ) : (
              <>
                Sisi Kiri & Kanan: <strong>{formatDesimal(sideWidthEach, 2)} m</strong> per sisi
              </>
            )}
          </div>
        </div>
      )}

      {/* Input Dimensi Dinding */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Lebar Dinding (m)
          </label>
          <input
            type="number"
            step="0.1"
            min="0.1"
            value={lebar}
            onChange={(e) => setLebar(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Tinggi Dinding (m)
          </label>
          <input
            type="number"
            step="0.1"
            min="0.1"
            value={tinggi}
            onChange={(e) => setTinggi(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Checkbox Cadangan Potongan (+10%) */}
      <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition">
        <input
          type="checkbox"
          checked={pakaiCadangan}
          onChange={(e) => setPakaiCadangan(e.target.checked)}
          className="mt-0.5 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
        />
        <div className="text-xs">
          <div className="font-semibold text-gray-800">
            Tambahkan cadangan potongan (+10%)
          </div>
          <p className="text-gray-500 mt-0.5 leading-relaxed">
            Sangat disarankan untuk pola bingkai 4 sisi & pertemuan sudut material.
          </p>
        </div>
      </label>

      {/* Alert Peringatan Tinggi > 2.9m */}
      {isMelebihiTinggiStandar && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-3 rounded-r-xl text-xs text-amber-900">
          <div className="font-bold text-amber-800">
            ⚠️ Peringatan Tinggi Dinding ({tinggiValid} m)
          </div>
          <p className="mt-0.5 text-amber-700">
            Melebihi tinggi standar panel ({formatDesimal(tinggiStandarMeter, 1)} m). Butuh sambungan horizontal.
          </p>
        </div>
      )}

      {/* Ringkasan Rincian & Total Anggaran */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 flex flex-col gap-2 text-xs">
        <div className="flex justify-between items-center">
          <span className="text-gray-500">Luas Bidang Dinding:</span>
          <span className="font-semibold text-gray-800">{formatDesimal(luasDinding, 2)} m²</span>
        </div>

        {activeMix ? (
          <>
            <div className="border-t border-gray-200 my-1" />
            <div className="flex justify-between items-center">
              <span className="text-gray-600">
                Panel Tengah ({centerProduct.kode}):
              </span>
              <span className="font-bold text-amber-700">
                {totalTengah} {centerProduct.satuan} ({formatRupiah(biayaTengah)})
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">
                {isFrameMode ? 'Bingkai 4 Sisi' : 'Sisi Kiri+Kanan'} ({kode}):
              </span>
              <span className="font-bold text-blue-600">
                {totalUtama} {satuan} ({formatRupiah(biayaUtama)})
              </span>
            </div>
          </>
        ) : (
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Kebutuhan Panel:</span>
            <span className="font-extrabold text-blue-600 text-sm">
              {pakaiCadangan
                ? `${pokokUtama} + ${cadanganUtama} = ${totalUtama} ${satuanKapital}`
                : `${totalUtama} ${satuanKapital}`}
            </span>
          </div>
        )}

        <div className="border-t border-gray-200 my-1" />

        <div className="flex justify-between items-end">
          <div>
            <div className="font-bold text-gray-800 text-sm">Total Anggaran:</div>
            <div className="text-[11px] text-gray-500 mt-0.5">
              {activeMix ? 'Gabungan 2 Material' : `${totalUtama} ${satuanKapital} × ${formatRupiah(harga)}`}
            </div>
          </div>
          <div className="text-xl font-extrabold text-emerald-600">
            {formatRupiah(totalAnggaran)}
          </div>
        </div>
      </div>

      {/* Tombol Aksi */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={handleSalinRAB}
          className="flex items-center justify-center gap-2 py-2.5 px-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold text-xs rounded-xl transition cursor-pointer"
        >
          <span>{copied ? '✅' : '📋'}</span>
          <span>{copied ? 'RAB Tersalin!' : 'Salinan RAB'}</span>
        </button>

        <button
          type="button"
          onClick={handleKirimWhatsApp}
          className="flex items-center justify-center gap-2 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-2xs transition cursor-pointer"
        >
          <span>💬</span>
          <span>Kirim ke WhatsApp</span>
        </button>
      </div>
    </div>
  );
}