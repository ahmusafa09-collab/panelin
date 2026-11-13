import { useState } from 'react';

export default function Calculator({ activeProduct, lebar, setLebar, tinggi, setTinggi }) {
  const [pakaiCadangan, setPakaiCadangan] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!activeProduct) return null;

  // 1. Ambil seluruh properti murni dari activeProduct (tanpa fallback WPC)
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
  const tinggiStandarMeter = tinggi_cm / 100; // 2.9 m

  // 2. Validasi & perhitungan ukuran dinding
  const lebarValid = Number(lebar) > 0 ? Number(lebar) : 0;
  const tinggiValid = Number(tinggi) > 0 ? Number(tinggi) : 0;
  const luasDinding = lebarValid * tinggiValid;

  const isMelebihiTinggiStandar = tinggiValid > tinggiStandarMeter;
  const jumlahLajur = lebarValid > 0 ? Math.ceil((lebarValid * 100) / lebar_cm) : 0;

  // 3. Logika kebutuhan pokok:
  // - Tinggi <= 2.9m: hitung per lajur lebar
  // - Tinggi > 2.9m : hitung berdasarkan total luas dinding dibagi luas per lembar/batang
  const kebutuhanPokok =
    lebarValid > 0 && tinggiValid > 0
      ? isMelebihiTinggiStandar
        ? Math.ceil(luasDinding / luas_m2)
        : jumlahLajur
      : 0;

  // 4. Perhitungan cadangan potongan (+10% dibulatkan ke atas) & total biaya
  const jumlahCadangan = pakaiCadangan ? Math.ceil(kebutuhanPokok * 0.1) : 0;
  const totalKebutuhan = kebutuhanPokok + jumlahCadangan;
  const totalAnggaran = totalKebutuhan * harga;

  // Format angka ke Rupiah & koma Indonesia
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

  // 5. Generator teks RAB untuk Salin & WhatsApp
  const generateRABText = () => {
    const barisCadangan = pakaiCadangan
      ? `• Rincian Kebutuhan: ${kebutuhanPokok} ${satuanKapital} + ${jumlahCadangan} Cadangan (+10%)\n`
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
      `• Total Kebutuhan: *${totalKebutuhan} ${satuanKapital}*\n` +
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
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-800">Kalkulator Estimasi</h2>
        <span className="text-xs font-medium bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full border border-blue-100">
          Visualisasi Sinkron
        </span>
      </div>

      {/* Kartu Ringkasan Produk Aktif */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={gambar2D}
              alt={nama}
              className="w-12 h-12 rounded-lg object-cover border border-gray-200 shrink-0"
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

        <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex items-center justify-between text-xs text-gray-600">
          <span>
            Dimensi: <strong className="text-gray-800">{lebar_cm} cm × {tinggi_cm} cm</strong>
          </span>
          <span>•</span>
          <span>
            Luas/{satuan}: <strong className="text-gray-800">{formatDesimal(luas_m2, 3)} m²</strong>
          </span>
        </div>
      </div>

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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Checkbox Cadangan Potongan / Waste (+10%) */}
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
            Direkomendasikan untuk mengantisipasi sisa potongan di sudut atau sambungan motif.
          </p>
        </div>
      </label>

      {/* Alert Peringatan Tinggi > 2.9m */}
      {isMelebihiTinggiStandar && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-3.5 rounded-r-xl text-xs text-amber-900">
          <div className="font-bold flex items-center gap-1.5 text-amber-800">
            <span>⚠️</span>
            <span>Peringatan Tinggi Dinding ({tinggiValid} m)</span>
          </div>
          <p className="mt-1 text-amber-700 leading-relaxed">
            Tinggi dinding melebihi tinggi standar panel ({formatDesimal(tinggiStandarMeter, 1)} m).
            Visualizer menampilkan garis sambungan horizontal pada batas {tinggiStandarMeter} m.
          </p>
        </div>
      )}

      {/* Ringkasan Rincian & Total Anggaran */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 flex flex-col gap-2.5 text-xs">
        <div className="flex justify-between items-center">
          <span className="text-gray-500">Produk Pilihan:</span>
          <span className="font-semibold text-gray-800">{nama}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-gray-500">Harga Satuan:</span>
          <span className="font-semibold text-blue-600">
            {formatRupiah(harga)} / {satuan}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-gray-500">Luas Dinding:</span>
          <span className="font-semibold text-gray-800">{formatDesimal(luasDinding, 2)} m²</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-gray-500">Panel Lajur:</span>
          <span className="font-semibold text-blue-600">
            {jumlahLajur} lajur vertikal <span className="text-gray-400 font-normal">(sesuai visualizer)</span>
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-gray-500">Mode Hitung:</span>
          <span className="font-semibold text-amber-600">
            {isMelebihiTinggiStandar
              ? `Luas (${formatDesimal(luasDinding, 2)} m² ÷ ${formatDesimal(luas_m2, 3)} m²)`
              : `Lajur Lebar (${lebarValid * 100} cm ÷ ${lebar_cm} cm)`}
          </span>
        </div>

        <div className="border-t border-gray-200 my-1" />

        <div className="flex justify-between items-baseline">
          <span className="font-bold text-gray-800 text-sm">Kebutuhan Panel:</span>
          <div className="text-right">
            <span className="text-base font-extrabold text-blue-600">
              {pakaiCadangan
                ? `${kebutuhanPokok} + ${jumlahCadangan} = ${totalKebutuhan} ${satuanKapital}`
                : `${totalKebutuhan} ${satuanKapital}`}
            </span>
            {pakaiCadangan && (
              <div className="text-[11px] text-gray-500">(+10% cadangan potongan)</div>
            )}
          </div>
        </div>

        <div className="border-t border-gray-200 my-1" />

        <div className="flex justify-between items-end">
          <div>
            <div className="font-bold text-gray-800 text-sm">Total Anggaran:</div>
            <div className="text-[11px] text-gray-500 mt-0.5">
              {totalKebutuhan} {satuanKapital} × {formatRupiah(harga)}
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
          className="flex items-center justify-center gap-2 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-xs transition cursor-pointer"
        >
          <span>💬</span>
          <span>Kirim ke WhatsApp</span>
        </button>
      </div>
    </div>
  );
}