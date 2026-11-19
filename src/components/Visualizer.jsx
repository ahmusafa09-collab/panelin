import { useState } from 'react';

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
  // Toggle internal untuk menampilkan/menyembunyikan furnitur Ruang TV
  const [showTvRoom, setShowTvRoom] = useState(true);

  if (!activeProduct) return null;

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

  const centerWidthPct = lebarValid > 0 ? (effectiveCenterWidth / lebarValid) * 100 : 0;
  const centerHeightPct = tinggiValid > 0 ? (effectiveCenterHeight / tinggiValid) * 100 : 0;
  const sideWidthPct = lebarValid > 0 ? (sideWidth / lebarValid) * 100 : 0;

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

  return (
    <div className="w-full flex flex-col items-center justify-center select-none py-2">
      {/* ── Bar Kontrol Atas (Info Material & Toggle Simulasi Ruang TV) ── */}
      <div className="w-full max-w-xl flex flex-wrap items-center justify-between gap-2 mb-4 px-2">
        <div className="flex items-center gap-2 text-xs">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500 shadow-xs" />
          {activeMix ? (
            <span className="text-stone-700 font-medium">
              Kombinasi{' '}
              <strong className="text-stone-900">{activeProduct.kode}</strong>
              {' + '}
              <strong className="text-amber-700">{centerProduct.kode}</strong>
            </span>
          ) : (
            <span className="text-stone-700 font-medium">
              <strong className="text-stone-900">{activeProduct.nama}</strong>{' '}
              <span className="text-stone-400">
                ({lebarPanelCm}×{tinggiPanelCm} cm · {totalLajur} {satuan})
              </span>
            </span>
          )}
        </div>

        {/* Tombol Toggle Simulasi Ruang TV */}
        <button
          type="button"
          onClick={() => setShowTvRoom((prev) => !prev)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition cursor-pointer shadow-2xs ${
            showTvRoom
              ? 'bg-stone-900 text-amber-300 border-stone-800 hover:bg-stone-800'
              : 'bg-white text-stone-600 border-stone-300 hover:bg-stone-50'
          }`}
        >
          <span>{showTvRoom ? '📺' : '🖼️'}</span>
          <span>{showTvRoom ? 'Ruang TV: Aktif' : 'Tampilkan Ruang TV'}</span>
        </button>
      </div>

      {/* ── Area Simulasi Ruangan + Garis Dimensi Arsitektur ── */}
      <div className="w-full max-w-xl px-4 sm:px-8 flex flex-col items-center">
        {/* Garis Dimensi Lebar Atas (Khusus Mode Mix: Kiri - Tengah - Kanan) */}
        {activeMix ? (
          <div className="w-full flex items-center text-[10px] font-mono text-stone-600 mb-1.5 px-0.5">
            {sideWidthPct > 0 && (
              <div
                style={{ width: `${sideWidthPct}%` }}
                className="flex items-center justify-center border-x border-stone-400 relative"
              >
                <div className="w-full border-b border-dashed border-stone-400 absolute" />
                <span className="bg-stone-100 px-1 relative z-10 text-stone-600">
                  {sideWidth.toFixed(2)}m
                </span>
              </div>
            )}
            <div
              style={{ width: `${centerWidthPct}%` }}
              className="flex items-center justify-center border-x border-amber-600 relative"
            >
              <div className="w-full border-b border-amber-600 absolute" />
              <span className="bg-stone-100 px-1.5 relative z-10 font-bold text-amber-700">
                {effectiveCenterWidth}m
              </span>
            </div>
            {sideWidthPct > 0 && (
              <div
                style={{ width: `${sideWidthPct}%` }}
                className="flex items-center justify-center border-x border-stone-400 relative"
              >
                <div className="w-full border-b border-dashed border-stone-400 absolute" />
                <span className="bg-stone-100 px-1 relative z-10 text-stone-600">
                  {sideWidth.toFixed(2)}m
                </span>
              </div>
            )}
          </div>
        ) : (
          /* Garis Dimensi Lebar Total Atas (Mode Tunggal) */
          <div className="w-full flex items-center justify-center border-x border-stone-400 text-[11px] font-mono text-stone-700 mb-1.5 relative">
            <div className="w-full border-b border-stone-400 absolute" />
            <span className="bg-stone-100 px-2 relative z-10 font-semibold">
              Lebar Dinding: {lebarValid} m
            </span>
          </div>
        )}

        {/* Baris Tengah: Bingkai Ruangan + Garis Tinggi Kanan */}
        <div className="w-full flex items-stretch justify-center relative">
          {/* ══════════ KOTAK SIMULASI RUANGAN REALISTIS ══════════ */}
          <div className="w-full rounded-xl overflow-hidden shadow-[0_20px_45px_-12px_rgba(0,0,0,0.35)] border border-stone-300 bg-stone-900 flex flex-col">
            {/* 1. Plafon & Lis Atas */}
            <div className="h-3.5 w-full bg-gradient-to-b from-stone-200 to-stone-300 border-b border-stone-400/60 relative flex items-center justify-around">
              {/* Titik lampu downlight */}
              <span className="w-6 h-1 rounded-full bg-amber-100 shadow-[0_2px_10px_rgba(251,191,36,0.9)]" />
              <span className="w-6 h-1 rounded-full bg-amber-100 shadow-[0_2px_10px_rgba(251,191,36,0.9)]" />
              <span className="w-6 h-1 rounded-full bg-amber-100 shadow-[0_2px_10px_rgba(251,191,36,0.9)]" />
            </div>

            {/* 2. Bidang Dinding Utama */}
            <div
              className="w-full max-h-[390px] relative overflow-hidden bg-stone-200 transition-all duration-300"
              style={{ aspectRatio: `${aspectRatio}` }}
            >
              {activeMix ? (
                /* ─── RENDER MODE MIX (SAYAP / BINGKAI 4 SISI) ─── */
                <div
                  className="w-full h-full relative flex items-center justify-center"
                  style={{
                    backgroundImage: `url(${gambarPanel})`,
                    backgroundRepeat: 'repeat',
                    backgroundSize: `${lebarPanelPercent}% ${tinggiPanelPercent}%`,
                    backgroundPosition: 'left bottom',
                  }}
                >
                  {/* Panel Fokus Tengah (UV Marble dengan efek timbul & trim halus) */}
                  <div
                    className={`relative transition-all duration-300 shadow-[0_10px_28px_rgba(0,0,0,0.55)] ${
                      isFrameMode
                        ? 'ring-2 ring-amber-400/80'
                        : 'border-x-2 border-amber-400/80'
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
                    {/* Kilau halus pada permukaan UV Marble */}
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        background:
                          'linear-gradient(125deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.02) 45%, rgba(0,0,0,0.12) 100%)',
                      }}
                    />
                  </div>
                </div>
              ) : gambarPanel ? (
                /* ─── RENDER MODE TUNGGAL (1 PRODUK) ─── */
                <div
                  className="w-full h-full relative"
                  style={{
                    backgroundImage: `url(${gambarPanel})`,
                    backgroundRepeat: 'repeat',
                    backgroundSize: `${lebarPanelPercent}% ${tinggiPanelPercent}%`,
                    backgroundPosition: 'left bottom',
                  }}
                >
                  {/* Garis Nat Vertikal Halus */}
                  {verticalSeams.map(({ pos, nomor }) => (
                    <div
                      key={nomor}
                      className="absolute top-0 bottom-0 pointer-events-none"
                      style={{ left: `${pos}%` }}
                    >
                      <div className="w-[1px] h-full bg-black/30" />
                    </div>
                  ))}
                </div>
              ) : null}

              {/* Sambungan Horizontal (> 2.9m) dengan garis tipis elegan */}
              {isTinggiLebih && (
                <div
                  className="absolute left-0 right-0 pointer-events-none z-10 flex items-center"
                  style={{ bottom: `${horizontalSeamPosBottom}%` }}
                >
                  <div className="w-full border-b border-dashed border-amber-400/90 shadow-xs" />
                  <span className="ml-2 -mt-4 bg-stone-900/80 text-amber-300 text-[9px] px-1.5 py-0.5 rounded backdrop-blur-xs">
                    List H ({tinggiPanelMeter}m)
                  </span>
                </div>
              )}

              {/* ─── LAYER PENCAHAYAAN RUANGAN (DOWNLIGHT & AMBIENT SHADOW) ─── */}
              <div
                className="absolute inset-0 pointer-events-none z-10"
                style={{
                  background: `
                    radial-gradient(ellipse 80% 45% at 50% 0%, rgba(255, 244, 214, 0.28) 0%, transparent 75%),
                    linear-gradient(to bottom, rgba(0,0,0,0.22) 0%, transparent 10%, transparent 88%, rgba(0,0,0,0.32) 100%),
                    linear-gradient(to right, rgba(0,0,0,0.2) 0%, transparent 6%, transparent 94%, rgba(0,0,0,0.2) 100%)
                  `,
                }}
              />

              {/* ─── LAYER SIMULASI FURNITUR RUANG TV (OPSIONAL) ─── */}
              {showTvRoom && (
                <div className="absolute inset-0 pointer-events-none z-20 flex flex-col items-center justify-end">
                  {/* Layar TV Gantung + Backlight LED Hangat */}
                  <div className="w-[44%] max-w-[230px] aspect-video mb-[11%] relative flex items-center justify-center">
                    {/* Pendaran LED Backlight di belakang TV */}
                    <div className="absolute -inset-2 bg-amber-300/35 blur-md rounded-lg" />
                    {/* Bingkai Layar TV */}
                    <div className="w-full h-full bg-gradient-to-tr from-stone-950 via-stone-900 to-stone-800 rounded-xs border-2 border-stone-700 shadow-[0_12px_24px_rgba(0,0,0,0.75)] relative overflow-hidden">
                      {/* Refleksi layar kaca */}
                      <div
                        className="w-full h-full opacity-30"
                        style={{
                          background:
                            'linear-gradient(115deg, rgba(255,255,255,0.35) 0%, transparent 45%)',
                        }}
                      />
                    </div>
                  </div>

                  {/* Meja Konsol / Credenza TV Minimalis di Bawah */}
                  <div className="w-[62%] max-w-[320px] h-[7%] min-h-[18px] bg-gradient-to-b from-stone-800 to-stone-950 rounded-t-xs border-t border-amber-400/40 shadow-[0_-4px_12px_rgba(0,0,0,0.45)] flex items-center justify-around px-3">
                    <div className="w-1/3 h-[1px] bg-stone-600/60" />
                    <div className="w-1/3 h-[1px] bg-stone-600/60" />
                  </div>
                </div>
              )}
            </div>

            {/* 3. Plint Lantai (Skirting) & Lantai Kayu */}
            <div className="h-2 w-full bg-stone-800 border-t border-stone-600" />
            <div
              className="h-5 w-full relative"
              style={{
                background:
                  'repeating-linear-gradient(90deg, #78553a 0px, #6b4930 48px, #5c3d26 49px, #78553a 96px)',
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-black/35 to-transparent" />
            </div>
          </div>

          {/* ── Garis Dimensi Tinggi di Sisi Kanan Luar ── */}
          <div className="hidden sm:flex flex-col items-center justify-center pl-2 text-[11px] font-mono text-stone-700 shrink-0">
            <div className="h-full border-y border-stone-400 flex items-center justify-center relative px-1">
              <div className="h-full border-r border-stone-400 absolute" />
              <span className="bg-stone-100 py-1 px-1 relative z-10 font-semibold [writing-mode:vertical-rl] rotate-180">
                Tinggi: {tinggiValid} m
              </span>
            </div>
          </div>
        </div>

        {/* Keterangan Ringkas di Bawah Lantai */}
        <div className="w-full flex flex-wrap items-center justify-between text-[11px] text-stone-500 mt-2.5 px-1 gap-2">
          <span>
            Bidang: <strong className="text-stone-700">{lebarValid}m × {tinggiValid}m</strong>
            {isFrameMode && (
              <> · Bingkai Sisi {sideWidth.toFixed(2)}m · Atas/Bawah {topBottomHeight.toFixed(2)}m</>
            )}
          </span>
          <span className="text-stone-400">
            *Simulasi pencahayaan & skala proporsional
          </span>
        </div>
      </div>
    </div>
  );
}