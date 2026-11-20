import { useState } from 'react';

export default function Visualizer({
  activeProduct,
  lebar,
  tinggi,
  openings = [],
  isMixMode = false,
  mixPattern = 'wings',
  centerProduct = null,
  centerWidth = 1.2,
  centerHeight = 2.0,
  useListH = false,
  listHColor = 'Gold',
  useListLWpc = false,
  isCompact = false,
  isMobileSticky = true,
  onToggleMobileSticky = () => {},
}) {
  const [showTvRoom, setShowTvRoom] = useState(true);

  if (!activeProduct) return null;

  const {
    gambar2D: gambarPanel,
    dimensi: { lebar_cm: lebarPanelCm, tinggi_cm: tinggiPanelCm },
  } = activeProduct;

  const lebarValid = Number(lebar) > 0 ? Number(lebar) : 0;
  const tinggiValid = Number(tinggi) > 0 ? Number(tinggi) : 0;
  const aspectRatio = lebarValid > 0 && tinggiValid > 0 ? lebarValid / tinggiValid : 1;

  const lebarPanelMeter = lebarPanelCm / 100;
  const tinggiPanelMeter = tinggiPanelCm / 100;

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

  // Perhitungan Mode Mix
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

  // Sambungan Horizontal (> 2.9m)
  const TOLERANSI_FP = 0.001;
  const isTinggiLebih =
    tinggiPanelMeter > 0 && tinggiValid > tinggiPanelMeter + TOLERANSI_FP;
  const horizontalSeamPosBottom =
    isTinggiLebih && tinggiValid > 0 ? (tinggiPanelMeter / tinggiValid) * 100 : 100;

  // Styling Metalik / Matte Dinamis untuk List Transisi H
  const listHStyle = (() => {
    if (!useListH) {
      return {
        barClass: 'bg-amber-400/70',
        borderClass: 'border-amber-400/70',
        ringClass: 'ring-amber-400/70',
        dotClass: 'bg-amber-400',
      };
    }
    if (listHColor === 'Rosegold') {
      return {
        barClass:
          'bg-gradient-to-r from-rose-300 via-amber-200 to-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.75)]',
        borderClass: 'border-rose-300 shadow-[0_0_12px_rgba(251,113,133,0.45)]',
        ringClass: 'ring-rose-300 shadow-[0_0_14px_rgba(251,113,133,0.45)]',
        dotClass: 'bg-rose-300',
      };
    }
    if (listHColor === 'Hitam') {
      return {
        barClass: 'bg-stone-950 shadow-[0_1px_3px_rgba(0,0,0,0.85)]',
        borderClass: 'border-stone-950',
        ringClass: 'ring-stone-950',
        dotClass: 'bg-stone-950',
      };
    }
    return {
      barClass:
        'bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-500 shadow-[0_0_8px_rgba(251,191,36,0.85)]',
      borderClass: 'border-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.5)]',
      ringClass: 'ring-amber-300 shadow-[0_0_14px_rgba(251,191,36,0.5)]',
      dotClass: 'bg-amber-400',
    };
  })();

  return (
    <div className="w-full flex flex-col items-center justify-center select-none">
      {/* ── Bar Kontrol Atas (Ringkas Otomatis saat Mobile Scroll) ── */}
      <div
        className={`w-full max-w-xl flex items-center justify-between gap-2 px-0.5 transition-all duration-300 ${
          isCompact ? 'mb-1.5' : 'mb-3.5'
        }`}
      >
        <div className="flex flex-wrap items-center gap-1.5 text-xs sm:text-sm min-w-0">
          <span className="inline-block w-2 h-2 rounded-full bg-amber-500 shrink-0" />
          {activeMix ? (
            <span className="text-stone-700 font-medium truncate">
              <strong className="text-stone-900">{activeProduct.kode}</strong>
              {' + '}
              <strong className="text-amber-700">{centerProduct.kode}</strong>
            </span>
          ) : (
            <span className="text-stone-700 font-medium truncate">
              <strong className="text-stone-900">
                {isCompact ? activeProduct.kode : activeProduct.nama}
              </strong>
              {!isCompact && (
                <span className="text-stone-400 text-xs ml-1">
                  ({lebarPanelCm}×{tinggiPanelCm} cm)
                </span>
              )}
            </span>
          )}

          {useListH && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-stone-900 text-amber-200 border border-amber-400/40 shrink-0">
              <span className={`w-1.5 h-1.5 rounded-full ${listHStyle.dotClass}`} />
              <span>List H {listHColor}</span>
            </span>
          )}

          {useListLWpc && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-950 border border-amber-300 shrink-0">
              + List L
            </span>
          )}
        </div>

        {/* Tombol Kontrol Kanan (Pin Sticky HP + Toggle Furnitur TV) */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Tombol Pin/Lepas Sticky khusus Layar HP */}
          <button
            type="button"
            onClick={onToggleMobileSticky}
            title={isMobileSticky ? 'Lepas preview dari atas layar' : 'Kunci preview di atas layar'}
            className={`lg:hidden ${
              isCompact ? 'min-h-[34px] px-2.5 py-1' : 'min-h-[40px] px-3 py-1.5'
            } rounded-xl text-[11px] font-bold border transition cursor-pointer flex items-center gap-1 ${
              isMobileSticky
                ? 'bg-amber-50 text-amber-900 border-amber-300'
                : 'bg-stone-100 text-stone-600 border-stone-300'
            }`}
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
              <path d="M12 17v5" />
              <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z" />
            </svg>
            <span className="hidden xs:inline">
              {isMobileSticky ? 'Terkunci' : 'Lepas'}
            </span>
          </button>

          {/* Tombol Toggle Furnitur TV */}
          <button
            type="button"
            onClick={() => setShowTvRoom((prev) => !prev)}
            className={`${
              isCompact ? 'min-h-[34px] px-2.5 py-1' : 'min-h-[40px] sm:min-h-[44px] px-3 sm:px-4 py-1.5 sm:py-2'
            } rounded-xl text-[11px] sm:text-xs font-bold border transition cursor-pointer shadow-2xs flex items-center gap-1.5 ${
              showTvRoom
                ? 'bg-stone-900 text-amber-300 border-stone-800 hover:bg-stone-800'
                : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
            }`}
          >
            <svg
              className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="2" y="4" width="20" height="13" rx="2" />
              <path d="M8 21h8" />
              <path d="M12 17v4" />
            </svg>
            <span>{isCompact ? 'TV' : showTvRoom ? 'TV: Aktif' : 'Tampilkan TV'}</span>
          </button>
        </div>
      </div>

      {/* ── Area Simulasi Ruangan + Garis Dimensi Arsitektur ── */}
      <div className="w-full max-w-xl px-1 sm:px-8 flex flex-col items-center">
        {/* Garis Dimensi Lebar (Sembunyikan saat mode compact agar hemat tempat) */}
        {!isCompact && (
          <>
            {activeMix ? (
              <div className="w-full flex items-center text-[11px] font-mono text-stone-600 mb-1.5 px-0.5">
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
              <div className="w-full flex items-center justify-center border-x border-stone-400 text-[11px] font-mono text-stone-700 mb-1.5 relative">
                <div className="w-full border-b border-stone-400 absolute" />
                <span className="bg-stone-100 px-2 relative z-10 font-semibold">
                  Lebar Dinding: {lebarValid} m
                </span>
              </div>
            )}
          </>
        )}

        <div className="w-full flex items-stretch justify-center relative">
          {/* ══════════ KOTAK SIMULASI RUANGAN ══════════ */}
          <div className="w-full rounded-xl overflow-hidden shadow-[0_14px_30px_-10px_rgba(0,0,0,0.3)] border border-stone-300 bg-stone-900 flex flex-col transition-all duration-300">
            {/* 1. Plafon & Lampu Downlight */}
            <div
              className={`${
                isCompact ? 'h-2' : 'h-3.5'
              } w-full bg-gradient-to-b from-stone-200 to-stone-300 border-b border-stone-400/60 relative flex items-center justify-around transition-all duration-300`}
            >
              <span className="w-5 h-1 rounded-full bg-amber-100 shadow-[0_2px_10px_rgba(251,191,36,0.9)]" />
              <span className="w-5 h-1 rounded-full bg-amber-100 shadow-[0_2px_10px_rgba(251,191,36,0.9)]" />
              <span className="w-5 h-1 rounded-full bg-amber-100 shadow-[0_2px_10px_rgba(251,191,36,0.9)]" />
            </div>

            {/* 2. Bidang Dinding Utama (Tinggi otomatis menyusut saat isCompact) */}
            <div
              className={`w-full ${
                isCompact ? 'max-h-[155px]' : 'max-h-[340px] sm:max-h-[390px]'
              } relative overflow-hidden bg-stone-200 transition-all duration-300`}
              style={{ aspectRatio: `${aspectRatio}` }}
            >
              {activeMix ? (
                <div
                  className="w-full h-full relative flex items-center justify-center"
                  style={{
                    backgroundImage: `url(${gambarPanel})`,
                    backgroundRepeat: 'repeat',
                    backgroundSize: `${lebarPanelPercent}% ${tinggiPanelPercent}%`,
                    backgroundPosition: 'left bottom',
                  }}
                >
                  <div
                    className={`relative transition-all duration-500 shadow-[0_10px_28px_rgba(0,0,0,0.55)] ${
                      isFrameMode
                        ? `${useListH ? 'ring-[3px] sm:ring-[4px]' : 'ring-2'} ${listHStyle.ringClass}`
                        : `${useListH ? 'border-x-[3px] sm:border-x-[4px]' : 'border-x-2'} ${listHStyle.borderClass}`
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
                      className="absolute top-0 bottom-0 pointer-events-none"
                      style={{ left: `${pos}%` }}
                    >
                      <div className="w-[1px] h-full bg-black/30" />
                    </div>
                  ))}
                </div>
              ) : null}

              {/* Animasi List L / Siku WPC */}
              <div
                className={`absolute inset-y-0 left-0 z-15 pointer-events-none transition-all duration-500 bg-gradient-to-r from-amber-900/90 via-amber-700/80 to-transparent ${
                  useListLWpc ? 'w-1.5 sm:w-2 opacity-100' : 'w-0 opacity-0'
                }`}
              />
              <div
                className={`absolute inset-y-0 right-0 z-15 pointer-events-none transition-all duration-500 bg-gradient-to-l from-amber-900/90 via-amber-700/80 to-transparent ${
                  useListLWpc ? 'w-1.5 sm:w-2 opacity-100' : 'w-0 opacity-0'
                }`}
              />

              {/* Garis Sambungan Horizontal (> 2.9m) */}
              {isTinggiLebih && (
                <div
                  className="absolute left-0 right-0 pointer-events-none z-15 flex items-center"
                  style={{ bottom: `${horizontalSeamPosBottom}%` }}
                >
                  <div
                    className={`transition-all duration-500 ${
                      useListH
                        ? `w-full h-[3px] sm:h-[4px] ${listHStyle.barClass}`
                        : 'w-full border-b border-dashed border-amber-400/90'
                    }`}
                  />
                  {!isCompact && (
                    <span className="ml-2 -mt-5 bg-stone-900/90 text-amber-300 text-[9px] font-semibold px-2 py-0.5 rounded backdrop-blur-xs shadow-xs whitespace-nowrap">
                      {useListH
                        ? `List H ${listHColor} (${tinggiPanelMeter}m)`
                        : `Sambungan (${tinggiPanelMeter}m)`}
                    </span>
                  )}
                </div>
              )}

              {/* Layer Bukaan Dinding (Pintu / Jendela) */}
              {lebarValid > 0 &&
                tinggiValid > 0 &&
                openings.map((item) => {
                  const opW = Math.max(Number(item.lebar) || 0, 0);
                  const opH = Math.max(Number(item.tinggi) || 0, 0);
                  const opLeft = Math.max(Number(item.jarakKiri) || 0, 0);
                  const opBottom = Math.max(Number(item.jarakBawah) || 0, 0);

                  if (opW <= 0 || opH <= 0) return null;

                  const widthPct = Math.min((opW / lebarValid) * 100, 100);
                  const heightPct = Math.min((opH / tinggiValid) * 100, 100);
                  const leftPct = Math.min((opLeft / lebarValid) * 100, 100);
                  const bottomPct = Math.min((opBottom / tinggiValid) * 100, 100);
                  const isJendela = opBottom > 0;

                  return (
                    <div
                      key={item.id}
                      style={{
                        width: `${widthPct}%`,
                        height: `${heightPct}%`,
                        left: `${leftPct}%`,
                        bottom: `${bottomPct}%`,
                      }}
                      className={`absolute z-15 transition-all duration-200 flex flex-col items-center justify-center shadow-[inset_0_2px_10px_rgba(0,0,0,0.28)] ${
                        isJendela
                          ? 'bg-gradient-to-b from-sky-100 via-stone-50 to-stone-100 border-2 sm:border-[3px] border-stone-800'
                          : 'bg-gradient-to-b from-stone-100 to-stone-200 border-x-2 sm:border-x-[3px] border-t-2 sm:border-t-[3px] border-stone-800'
                      }`}
                    >
                      {isJendela && (
                        <div className="w-[1px] h-full bg-stone-400/60 absolute" />
                      )}
                      {!isJendela && (
                        <div className="w-1 h-2.5 rounded-full bg-stone-500 absolute right-1 top-1/2" />
                      )}

                      {!isCompact && (
                        <div className="relative z-10 bg-white/95 px-1.5 py-0.5 rounded border border-stone-300 text-center shadow-2xs">
                          <p className="text-[9px] sm:text-[10px] font-bold text-stone-800 leading-tight">
                            {item.nama}
                          </p>
                          <p className="text-[8px] sm:text-[9px] font-mono text-stone-500 leading-tight">
                            {opW}×{opH}m
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}

              {/* Layer Pencahayaan Ruangan */}
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

              {/* Layer Simulasi Furnitur Ruang TV */}
              {showTvRoom && (
                <div className="absolute inset-0 pointer-events-none z-20 flex flex-col items-center justify-end">
                  <div className="w-[44%] max-w-[230px] aspect-video mb-[11%] relative flex items-center justify-center">
                    <div className="absolute -inset-2 bg-amber-300/35 blur-md rounded-lg" />
                    <div className="w-full h-full bg-gradient-to-tr from-stone-950 via-stone-900 to-stone-800 rounded-xs border-2 border-stone-700 shadow-[0_12px_24px_rgba(0,0,0,0.75)] relative overflow-hidden">
                      <div
                        className="w-full h-full opacity-30"
                        style={{
                          background:
                            'linear-gradient(115deg, rgba(255,255,255,0.35) 0%, transparent 45%)',
                        }}
                      />
                    </div>
                  </div>

                  <div className="w-[62%] max-w-[320px] h-[7%] min-h-[12px] bg-gradient-to-b from-stone-800 to-stone-950 rounded-t-xs border-t border-amber-400/40 shadow-[0_-4px_12px_rgba(0,0,0,0.45)] flex items-center justify-around px-3">
                    <div className="w-1/3 h-[1px] bg-stone-600/60" />
                    <div className="w-1/3 h-[1px] bg-stone-600/60" />
                  </div>
                </div>
              )}
            </div>

            {/* 3. Plint Lantai & Lantai Kayu */}
            <div className={`${isCompact ? 'h-1' : 'h-2'} w-full bg-stone-800 border-t border-stone-600`} />
            <div
              className={`${isCompact ? 'h-2.5' : 'h-5'} w-full relative transition-all duration-300`}
              style={{
                background:
                  'repeating-linear-gradient(90deg, #78553a 0px, #6b4930 48px, #5c3d26 49px, #78553a 96px)',
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-black/35 to-transparent" />
            </div>
          </div>

          {/* Garis Dimensi Tinggi Sisi Kanan Luar */}
          <div className="hidden sm:flex flex-col items-center justify-center pl-2 text-[11px] font-mono text-stone-700 shrink-0">
            <div className="h-full border-y border-stone-400 flex items-center justify-center relative px-1">
              <div className="h-full border-r border-stone-400 absolute" />
              <span className="bg-stone-100 py-1 px-1 relative z-10 font-semibold [writing-mode:vertical-rl] rotate-180">
                Tinggi: {tinggiValid} m
              </span>
            </div>
          </div>
        </div>

        {/* Keterangan Ringkas di Bawah Lantai (Sembunyikan saat compact) */}
        {!isCompact && (
          <div className="w-full flex flex-wrap items-center justify-between text-[11px] text-stone-500 mt-2 px-1 gap-2">
            <span>
              Bidang: <strong className="text-stone-700">{lebarValid}m × {tinggiValid}m</strong>
              {openings.length > 0 && (
                <> · {openings.length} Bukaan</>
              )}
              {isFrameMode && (
                <> · Bingkai Sisi {sideWidth.toFixed(2)}m · Atas/Bawah {topBottomHeight.toFixed(2)}m</>
              )}
            </span>
            <span className="text-stone-400 hidden sm:inline">
              *Simulasi pencahayaan & skala proporsional
            </span>
          </div>
        )}
      </div>
    </div>
  );
}