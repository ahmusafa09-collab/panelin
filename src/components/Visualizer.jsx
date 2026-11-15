export default function Visualizer({
  activeProduct,
  lebar,
  tinggi,
  isMixMode = false,
  mixPattern = 'wings',
  centerProduct = null,
  centerWidth = 1.2,
  centerHeight = 2.0,
}) {
  const {
    kategori,
    satuan,
    gambar2D: gambarPanel,
    dimensi: { lebar_cm: lebarPanelCm, tinggi_cm: tinggiPanelCm },
  } = activeProduct;

  const lebarValid = Number(lebar) > 0 ? Number(lebar) : 0;
  const tinggiValid = Number(tinggi) > 0 ? Number(tinggi) : 0;
  const aspectRatio = lebarValid > 0 && tinggiValid > 0 ? lebarValid / tinggiValid : 1;

  const lebarPanelMeter = lebarPanelCm / 100;
  const tinggiPanelMeter = tinggiPanelCm / 100;

  // ─── Skala Panel Utama (Berdiri Vertikal) ──────────────────────────────────
  const lebarPanelPercent =
    lebarValid > 0 && lebarPanelMeter > 0 ? (lebarPanelMeter / lebarValid) * 100 : 0;
  const tinggiPanelPercent =
    tinggiValid > 0 && tinggiPanelMeter > 0 ? (tinggiPanelMeter / tinggiValid) * 100 : 0;

  const totalLajur = lebarPanelMeter > 0 ? Math.ceil(lebarValid / lebarPanelMeter) : 0;
  const verticalSeams = [];
  for (let i = 1; i < totalLajur; i++) {
    const pos = ((i * lebarPanelMeter) / lebarValid) * 100;
    if (pos < 100) verticalSeams.push({ pos, nomor: i });
  }

  // ─── Perhitungan Mode Mix (Sayap Kiri-Kanan vs Bingkai 4 Sisi) ─────────────
  const activeMix = isMixMode && centerProduct && lebarValid > 0 && tinggiValid > 0;
  const isFrameMode = activeMix && mixPattern === 'frame';

  const effectiveCenterWidth = activeMix
    ? Math.min(Math.max(Number(centerWidth) || 0, 0.1), lebarValid)
    : 0;
  const effectiveCenterHeight = isFrameMode
    ? Math.min(Math.max(Number(centerHeight) || 0, 0.1), tinggiValid)
    : tinggiValid;

  const sideWidth = activeMix ? Math.max((lebarValid - effectiveCenterWidth) / 2, 0) : 0;
  const topBottomHeight = isFrameMode
    ? Math.max((tinggiValid - effectiveCenterHeight) / 2, 0)
    : 0;

  // Persentase dimensi kotak tengah terhadap dinding
  const centerWidthPct = lebarValid > 0 ? (effectiveCenterWidth / lebarValid) * 100 : 0;
  const centerHeightPct = tinggiValid > 0 ? (effectiveCenterHeight / tinggiValid) * 100 : 0;

  // Skala tile produk tengah relatif terhadap ukuran kotak tengah
  const centerPanelMeter = centerProduct ? centerProduct.dimensi.lebar_cm / 100 : 1.2;
  const centerPanelHeightMeter = centerProduct ? centerProduct.dimensi.tinggi_cm / 100 : 2.9;
  const centerTileWidthPct =
    effectiveCenterWidth > 0 ? (centerPanelMeter / effectiveCenterWidth) * 100 : 0;
  const centerTileHeightPct =
    effectiveCenterHeight > 0 ? (centerPanelHeightMeter / effectiveCenterHeight) * 100 : 0;

  // ─── Sambungan Horizontal (> 2.9m) ─────────────────────────────────────────
  const TOLERANSI_FP = 0.001;
  const isTinggiLebih =
    tinggiPanelMeter > 0 && tinggiValid > tinggiPanelMeter + TOLERANSI_FP;
  const horizontalSeamPosBottom =
    isTinggiLebih && tinggiValid > 0 ? (tinggiPanelMeter / tinggiValid) * 100 : 100;

  const labelKategori = `${kategori} (${lebarPanelCm} cm)`;

  return (
    <div className="w-full flex flex-col items-center justify-center select-none">
      {/* ── Header di atas preview ── */}
      <div className="flex flex-wrap items-center justify-between w-full max-w-lg mb-2 text-xs font-semibold text-gray-600 px-1 gap-2">
        <span>
          Dinding: <strong className="text-gray-900">{lebarValid}m (L) × {tinggiValid}m (T)</strong>
        </span>
        <span className="bg-white px-2 py-0.5 rounded border border-gray-200 shadow-2xs">
          {activeMix ? (
            <>
              {isFrameMode ? 'Bingkai 4 Sisi: ' : 'Sayap Kiri-Kanan: '}
              <strong className="text-blue-600">{activeProduct.kode}</strong>
              {' + '}
              <strong className="text-amber-600">{centerProduct.kode}</strong>
            </>
          ) : (
            <>
              Panel:{' '}
              <strong className="text-blue-600">{lebarPanelCm}cm × {tinggiPanelCm}cm</strong>
              {' · '}
              <span className="text-gray-500">{labelKategori}</span>
            </>
          )}
        </span>
      </div>

      {/* ── Bingkai Dinding Preview ── */}
      <div
        className="w-full max-w-lg max-h-[420px] border-4 border-gray-800 rounded-lg shadow-2xl overflow-hidden relative bg-white transition-all duration-300"
        style={{ aspectRatio: `${aspectRatio}` }}
      >
        {activeMix ? (
          /* ================= TAMPILAN MODE MIX (BERDIRI VERTIKAL) ================= */
          <div
            className="w-full h-full relative flex items-center justify-center"
            style={{
              backgroundImage: `url(${gambarPanel})`,
              backgroundRepeat: 'repeat',
              backgroundSize: `${lebarPanelPercent}% ${tinggiPanelPercent}%`,
              backgroundPosition: 'left bottom',
            }}
          >
            {/* Label Dimensi Bingkai Atas & Bawah (Khusus Pola Frame 4 Sisi) */}
            {isFrameMode && topBottomHeight > 0 && (
              <>
                <span className="absolute top-1.5 left-1/2 -translate-x-1/2 bg-black/70 text-white text-[9px] px-2 py-0.5 rounded shadow">
                  Bingkai Atas: {topBottomHeight.toFixed(2)}m (Vertikal)
                </span>
                <span className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-black/70 text-white text-[9px] px-2 py-0.5 rounded shadow">
                  Bingkai Bawah: {topBottomHeight.toFixed(2)}m
                </span>
              </>
            )}

            {/* Label Dimensi Sisi Kiri & Kanan */}
            {sideWidth > 0 && (
              <>
                <span className="absolute left-1.5 top-1/2 -translate-y-1/2 bg-black/70 text-white text-[9px] px-1.5 py-0.5 rounded shadow">
                  Kiri {sideWidth.toFixed(2)}m
                </span>
                <span className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-black/70 text-white text-[9px] px-1.5 py-0.5 rounded shadow">
                  Kanan {sideWidth.toFixed(2)}m
                </span>
              </>
            )}

            {/* Panel Fokus Tengah (UV Marble) */}
            <div
              className={`relative shadow-xl transition-all duration-300 ${
                isFrameMode
                  ? 'border-2 border-gray-900/85 rounded-xs'
                  : 'border-x-2 border-gray-900/85'
              }`}
              style={{
                width: `${centerWidthPct}%`,
                height: `${centerHeightPct}%`,
                backgroundImage: `url(${centerProduct.gambar2D})`,
                backgroundRepeat: 'repeat',
                backgroundSize: `${centerTileWidthPct}% ${centerTileHeightPct}%`,
                backgroundPosition: 'center bottom',
              }}
            >
              <span className="absolute top-1.5 left-1/2 -translate-x-1/2 bg-amber-600/95 text-white text-[9px] font-bold px-2 py-0.5 rounded shadow whitespace-nowrap">
                {centerProduct.kode} ({effectiveCenterWidth}m × {effectiveCenterHeight}m)
              </span>
            </div>

            {/* Sambungan Horizontal (> 2.9m) */}
            {isTinggiLebih && (
              <div
                className="absolute left-0 right-0 pointer-events-none z-10 flex items-center"
                style={{ bottom: `${horizontalSeamPosBottom}%` }}
              >
                <div className="w-full border-b-2 border-dashed border-amber-500" />
                <span className="absolute right-2 -top-4 bg-amber-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow">
                  Sambungan Horizontal ({tinggiPanelMeter}m)
                </span>
              </div>
            )}
          </div>
        ) : gambarPanel ? (
          /* ================= TAMPILAN MODE TUNGGAL (1 PRODUK) ================= */
          <div
            className="w-full h-full relative"
            style={{
              backgroundImage: `url(${gambarPanel})`,
              backgroundRepeat: 'repeat',
              backgroundSize: `${lebarPanelPercent}% ${tinggiPanelPercent}%`,
              backgroundPosition: 'left bottom',
            }}
          >
            {verticalSeams.map(({ pos, nomor }) => (
              <div
                key={nomor}
                className="absolute top-0 bottom-0 pointer-events-none flex flex-col items-center"
                style={{ left: `${pos}%` }}
              >
                <div className="w-[1.5px] h-full bg-black/45 shadow-[0_0_2px_rgba(255,255,255,0.6)]" />
                {lebarPanelCm >= 40 && (
                  <span className="absolute top-1 -translate-x-1/2 bg-black/70 text-white text-[9px] px-1 py-0.5 rounded font-mono shadow">
                    Nat {nomor}
                  </span>
                )}
              </div>
            ))}

            {isTinggiLebih && (
              <div
                className="absolute left-0 right-0 pointer-events-none z-10 flex items-center"
                style={{ bottom: `${horizontalSeamPosBottom}%` }}
              >
                <div className="w-full border-b-2 border-dashed border-amber-500 shadow-2xs" />
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

        {/* ── Badge Pojok Kanan Bawah ── */}
        <div className="absolute bottom-2 right-2 bg-black/75 text-white text-[10px] px-2.5 py-1 rounded backdrop-blur-xs shadow flex flex-col items-end gap-0.5 z-20">
          {activeMix ? (
            <>
              <span className="font-semibold text-amber-300">
                {isFrameMode ? 'Bingkai 4 Sisi (Vertikal)' : 'Sayap Kiri–Kanan'}
              </span>
              <span>
                Bingkai {activeProduct.kategori} · Tengah {centerProduct.kategori}
              </span>
            </>
          ) : (
            <>
              <span className="font-semibold text-amber-300">{labelKategori}</span>
              <span>
                {totalLajur} lajur {satuan} vertikal
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}