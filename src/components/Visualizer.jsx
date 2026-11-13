export default function Visualizer({ activeProduct, lebar, tinggi }) {
  // ─── Destrukturisasi langsung dari activeProduct ─────────────────────────────
  const {
    kategori,
    satuan,
    gambar2D: gambarPanel,
    dimensi: { lebar_cm: lebarPanelCm, tinggi_cm: tinggiPanelCm },
  } = activeProduct;

  // ─── Konversi ke meter ───────────────────────────────────────────────────────
  // lebarPanelCm  = activeProduct.dimensi.lebar_cm  (16 | 40 | 120)
  // tinggiPanelCm = activeProduct.dimensi.tinggi_cm (290 untuk semua produk saat ini)
  const lebarPanelMeter  = lebarPanelCm  / 100;
  const tinggiPanelMeter = tinggiPanelCm / 100;

  // ─── Aspek rasio bingkai (mengikuti proporsi dinding nyata) ─────────────────
  const aspectRatio = lebar > 0 && tinggi > 0 ? lebar / tinggi : 1;

  // ─── Skala tile background ───────────────────────────────────────────────────
  // lebarPanelPercent  → seberapa lebar 1 panel (dari activeProduct.dimensi.lebar_cm)
  //                      relatif terhadap lebar dinding, dalam persen
  //   WPC 16cm / dinding 3m  = 0.16/3 × 100 = 5.33%
  //   Wallboard 40cm / 3m    = 0.40/3 × 100 = 13.33%
  //   UV Marble 120cm / 3m   = 1.20/3 × 100 = 40%
  const lebarPanelPercent  = lebar  > 0 && lebarPanelMeter  > 0
    ? (lebarPanelMeter  / lebar)  * 100
    : 0;   // 0 = tidak render tile jika data belum tersedia

  // tinggiPanelPercent → seberapa tinggi 1 panel (dari activeProduct.dimensi.tinggi_cm)
  //                      relatif terhadap tinggi dinding, dalam persen
  const tinggiPanelPercent = tinggi > 0 && tinggiPanelMeter > 0
    ? (tinggiPanelMeter / tinggi) * 100
    : 0;

  // ─── Jumlah lajur vertikal & posisi nat ─────────────────────────────────────
  // totalLajur = ceil(lebar_dinding / lebar_panel_meter)
  //            = ceil(lebar / (activeProduct.dimensi.lebar_cm / 100))
  //   WPC 16cm,  dinding 3m → ceil(3 / 0.16) = 19 lajur
  //   Wallboard 40cm, 3m    → ceil(3 / 0.40) =  8 lajur
  //   UV Marble 120cm, 3m   → ceil(3 / 1.20) =  3 lajur
  const totalLajur    = lebarPanelMeter > 0 ? Math.ceil(lebar / lebarPanelMeter) : 0;
  const verticalSeams = [];
  for (let i = 1; i < totalLajur; i++) {
    const pos = (i * lebarPanelMeter / lebar) * 100;
    if (pos < 100) verticalSeams.push({ pos, nomor: i });
  }

  // ─── Sambungan horizontal (tinggi dinding > tinggi panel) ───────────────────
  // Toleransi 0.001m (1mm) untuk floating point — konsisten dengan Calculator.jsx
  const TOLERANSI_FP            = 0.001;
  const isTinggiLebih           = tinggiPanelMeter > 0 && tinggi > (tinggiPanelMeter + TOLERANSI_FP);
  const horizontalSeamPosBottom = isTinggiLebih && tinggi > 0
    ? (tinggiPanelMeter / tinggi) * 100
    : 100;

  // ─── Label badge: activeProduct.kategori + activeProduct.dimensi.lebar_cm ───
  const labelKategori = `${kategori} (${lebarPanelCm} cm)`;

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="w-full flex flex-col items-center justify-center select-none">

      {/* ── Header di atas preview ── */}
      <div className="flex flex-wrap items-center justify-between w-full max-w-lg mb-2 text-xs font-semibold text-gray-600 px-1 gap-2">
        <span>
          Dinding: <strong className="text-gray-900">{lebar}m (L) × {tinggi}m (T)</strong>
        </span>
        {/* Chip: dimensi panel · kategori (lebar) — keduanya dari activeProduct */}
        <span className="bg-white px-2 py-0.5 rounded border border-gray-200 shadow-xs">
          Panel:{' '}
          <strong className="text-blue-600">{lebarPanelCm}cm × {tinggiPanelCm}cm</strong>
          {' · '}
          <span className="text-gray-500">{labelKategori}</span>
        </span>
      </div>

      {/* ── Bingkai Dinding Preview ── */}
      <div
        className="w-full max-w-lg max-h-[420px] border-4 border-gray-800 rounded-lg shadow-2xl overflow-hidden relative bg-white transition-all duration-300"
        style={{ aspectRatio: `${aspectRatio}` }}
      >
        {gambarPanel ? (
          <div
            className="w-full h-full relative"
            style={{
              backgroundImage:    `url(${gambarPanel})`,
              backgroundRepeat:   'repeat',
              backgroundSize:     `${lebarPanelPercent}% ${tinggiPanelPercent}%`,
              backgroundPosition: 'left bottom',
            }}
          >
            {/* ── Nat / Sambungan Vertikal ── */}
            {verticalSeams.map(({ pos, nomor }) => (
              <div
                key={nomor}
                className="absolute top-0 bottom-0 pointer-events-none flex flex-col items-center"
                style={{ left: `${pos}%` }}
              >
                <div className="w-[1.5px] h-full bg-black/45 shadow-[0_0_2px_rgba(255,255,255,0.6)]" />

                {/* Label nat hanya untuk panel lebar (bukan WPC) */}
                {lebarPanelCm >= 40 && (
                  <span className="absolute top-1 -translate-x-1/2 bg-black/70 text-white text-[9px] px-1 py-0.5 rounded font-mono shadow">
                    Nat {nomor}
                  </span>
                )}
              </div>
            ))}

            {/* ── Sambungan Horizontal (tinggi dinding melebihi tinggi panel) ── */}
            {isTinggiLebih && (
              <div
                className="absolute left-0 right-0 pointer-events-none z-10 flex items-center"
                style={{ bottom: `${horizontalSeamPosBottom}%` }}
              >
                <div className="w-full border-b-2 border-dashed border-amber-500 shadow-xs" />
                <span className="absolute right-2 -top-4 bg-amber-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow whitespace-nowrap">
                  Sambungan Horizontal ({tinggiPanelMeter}m)
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            Pilih produk
          </div>
        )}

        {/* ── Badge Pojok Kanan Bawah ──────────────────────────────────────────
              Baris 1 → activeProduct.kategori + activeProduct.dimensi.lebar_cm
              Baris 2 → totalLajur dihitung dari activeProduct.dimensi.lebar_cm  ── */}
        <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] px-2 py-1 rounded backdrop-blur-sm shadow flex flex-col items-end gap-0.5">
          <span className="font-semibold text-amber-300">
            {labelKategori}
          </span>
          <span>
            {totalLajur} lajur {satuan} vertikal
          </span>
        </div>
      </div>
    </div>
  );
}
