import { useState, useRef } from 'react';

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
  const [roomPreset, setRoomPreset] = useState('tv'); // 'polos' | 'tv' | 'kamar'
  const [lightingMode, setLightingMode] = useState('siang'); // 'siang' | 'malam'
  const [is3DMode, setIs3DMode] = useState(false);
  const [yawAngle, setYawAngle] = useState(-18); // Sudut pandang (-34° s/d +34°)
  const [sideWallTheme, setSideWallTheme] = useState('krem'); // 'putih' | 'krem' | 'abu'
  const [isSavingImg, setIsSavingImg] = useState(false);

  const dragStartX = useRef(null);
  const dragStartYaw = useRef(0);

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
        hex: '#fbbf24',
      };
    }
    if (listHColor === 'Rosegold') {
      return {
        barClass:
          'bg-gradient-to-r from-rose-300 via-amber-200 to-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.75)]',
        borderClass: 'border-rose-300 shadow-[0_0_12px_rgba(251,113,133,0.45)]',
        ringClass: 'ring-rose-300 shadow-[0_0_14px_rgba(251,113,133,0.45)]',
        dotClass: 'bg-rose-300',
        hex: '#fda4af',
      };
    }
    if (listHColor === 'Hitam') {
      return {
        barClass: 'bg-stone-950 shadow-[0_1px_3px_rgba(0,0,0,0.85)]',
        borderClass: 'border-stone-950',
        ringClass: 'ring-stone-950',
        dotClass: 'bg-stone-950',
        hex: '#1c1917',
      };
    }
    return {
      barClass:
        'bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-500 shadow-[0_0_8px_rgba(251,191,36,0.85)]',
      borderClass: 'border-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.5)]',
      ringClass: 'ring-amber-300 shadow-[0_0_14px_rgba(251,191,36,0.5)]',
      dotClass: 'bg-amber-400',
      hex: '#f59e0b',
    };
  })();

  const isNight = lightingMode === 'malam';

  // Palet Warna Cat Dinding Samping
  const sideWallPalette = {
    putih: {
      label: 'Putih',
      dot: 'bg-stone-100 border-stone-400',
      leftBg: isNight
        ? 'linear-gradient(to right, #78716c 0%, #a8a29e 45%, #d6d3d1 100%)'
        : 'linear-gradient(to right, #d6d3d1 0%, #f5f5f4 45%, #ffffff 100%)',
      rightBg: isNight
        ? 'linear-gradient(to left, #78716c 0%, #a8a29e 45%, #d6d3d1 100%)'
        : 'linear-gradient(to left, #d6d3d1 0%, #f5f5f4 45%, #ffffff 100%)',
      ceilingBg: isNight
        ? 'linear-gradient(to bottom, #78716c 0%, #a8a29e 40%, #d6d3d1 100%)'
        : 'linear-gradient(to bottom, #e7e5e4 0%, #f5f5f4 40%, #ffffff 100%)',
    },
    krem: {
      label: 'Krem',
      dot: 'bg-amber-100 border-amber-400',
      leftBg: isNight
        ? 'linear-gradient(to right, #6b5f51 0%, #948472 45%, #bfb09e 100%)'
        : 'linear-gradient(to right, #b8aa96 0%, #dfd5c5 45%, #f3ece1 100%)',
      rightBg: isNight
        ? 'linear-gradient(to left, #6b5f51 0%, #948472 45%, #bfb09e 100%)'
        : 'linear-gradient(to left, #b8aa96 0%, #dfd5c5 45%, #f3ece1 100%)',
      ceilingBg: isNight
        ? 'linear-gradient(to bottom, #7d7062 0%, #a69786 40%, #cbbba8 100%)'
        : 'linear-gradient(to bottom, #d6cbbd 0%, #ebe3d7 40%, #f7f3ec 100%)',
    },
    abu: {
      label: 'Abu',
      dot: 'bg-stone-500 border-stone-700',
      leftBg: isNight
        ? 'linear-gradient(to right, #292524 0%, #44403c 45%, #78716c 100%)'
        : 'linear-gradient(to right, #57534e 0%, #8c857e 45%, #b8b2ab 100%)',
      rightBg: isNight
        ? 'linear-gradient(to left, #292524 0%, #44403c 45%, #78716c 100%)'
        : 'linear-gradient(to left, #57534e 0%, #8c857e 45%, #b8b2ab 100%)',
      ceilingBg: isNight
        ? 'linear-gradient(to bottom, #57534e 0%, #78716c 40%, #a8a29e 100%)'
        : 'linear-gradient(to bottom, #a8a29e 0%, #d6d3d1 40%, #e7e5e4 100%)',
    },
  }[sideWallTheme];

  // Handler Geser Langsung di Layar (Touch / Pointer Drag)
  const handlePointerDown = (e) => {
    if (!is3DMode) return;
    dragStartX.current = e.clientX;
    dragStartYaw.current = yawAngle;
  };

  const handlePointerMove = (e) => {
    if (!is3DMode || dragStartX.current === null) return;
    const deltaX = e.clientX - dragStartX.current;
    const nextYaw = Math.max(
      -34,
      Math.min(34, Math.round(dragStartYaw.current + deltaX * 0.2))
    );
    setYawAngle(nextYaw);
  };

  const handlePointerUp = () => {
    dragStartX.current = null;
  };

  // Fungsi Simpan Preview Dinding ke Gambar PNG Bersih
  const handleSaveSnapshot = async () => {
    if (isSavingImg || lebarValid <= 0 || tinggiValid <= 0) return;
    setIsSavingImg(true);

    const loadImg = (src) =>
      new Promise((resolve) => {
        if (!src) return resolve(null);
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = src;
      });

    try {
      const [outerImg, centerImg] = await Promise.all([
        loadImg(gambarPanel),
        activeMix ? loadImg(centerProduct?.gambar2D) : Promise.resolve(null),
      ]);

      const canvas = document.createElement('canvas');
      const baseWidth = 1080;
      const wallW = 960;
      const wallH = Math.max(Math.min(Math.round(wallW / aspectRatio), 1080), 360);
      const headerH = 96;
      const footerH = 74;

      canvas.width = baseWidth;
      canvas.height = headerH + wallH + footerH;
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = '#1c1917';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText('PANELIN · Simulasi Desain Dinding', 60, 44);

      ctx.fillStyle = '#d6d3d1';
      ctx.font = '18px sans-serif';
      const subTitle = activeMix
        ? `${activeProduct.kode} + ${centerProduct.kode} · Bidang ${lebarValid}m × ${tinggiValid}m`
        : `${activeProduct.nama} (${lebarPanelCm}×${tinggiPanelCm}cm) · Bidang ${lebarValid}m × ${tinggiValid}m`;
      ctx.fillText(subTitle, 60, 74);

      const wx = (baseWidth - wallW) / 2;
      const wy = headerH;

      ctx.save();
      ctx.beginPath();
      ctx.rect(wx, wy, wallW, wallH);
      ctx.clip();

      ctx.fillStyle = '#e7e5e4';
      ctx.fillRect(wx, wy, wallW, wallH);

      if (outerImg) {
        const tileW = (lebarPanelPercent / 100) * wallW;
        const tileH = (tinggiPanelPercent / 100) * wallH;
        if (tileW > 2 && tileH > 2) {
          for (let x = wx; x < wx + wallW; x += tileW) {
            for (let y = wy + wallH - tileH; y > wy - tileH; y -= tileH) {
              ctx.drawImage(outerImg, x, y, tileW, tileH);
            }
          }
        }
      }

      if (activeMix && centerImg) {
        const cw = (centerWidthPct / 100) * wallW;
        const ch = (centerHeightPct / 100) * wallH;
        const cx = wx + (wallW - cw) / 2;
        const cy = wy + (wallH - ch) / 2;

        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.55)';
        ctx.shadowBlur = 24;
        ctx.fillStyle = '#d6d3d1';
        ctx.fillRect(cx, cy, cw, ch);
        ctx.restore();

        ctx.save();
        ctx.beginPath();
        ctx.rect(cx, cy, cw, ch);
        ctx.clip();

        const cTileW = (centerTileWidthPct / 100) * cw;
        const cTileH = (centerTileHeightPct / 100) * ch;
        if (cTileW > 2 && cTileH > 2) {
          for (let x = cx; x < cx + cw; x += cTileW) {
            for (let y = cy + ch - cTileH; y > cy - cTileH; y -= cTileH) {
              ctx.drawImage(centerImg, x, y, cTileW, cTileH);
            }
          }
        }
        ctx.restore();

        ctx.strokeStyle = listHStyle.hex;
        ctx.lineWidth = useListH ? 6 : 3;
        if (isFrameMode) {
          ctx.strokeRect(cx, cy, cw, ch);
        } else {
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx, cy + ch);
          ctx.moveTo(cx + cw, cy);
          ctx.lineTo(cx + cw, cy + ch);
          ctx.stroke();
        }
      }

      if (isTinggiLebih) {
        const seamY = wy + wallH - (horizontalSeamPosBottom / 100) * wallH;
        ctx.strokeStyle = useListH ? listHStyle.hex : '#fbbf24';
        ctx.lineWidth = useListH ? 6 : 2;
        if (!useListH) ctx.setLineDash([10, 8]);
        ctx.beginPath();
        ctx.moveTo(wx, seamY);
        ctx.lineTo(wx + wallW, seamY);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      openings.forEach((item) => {
        const opW = Math.max(Number(item.lebar) || 0, 0);
        const opH = Math.max(Number(item.tinggi) || 0, 0);
        const opLeft = Math.max(Number(item.jarakKiri) || 0, 0);
        const opBottom = Math.max(Number(item.jarakBawah) || 0, 0);
        if (opW <= 0 || opH <= 0) return;

        const ow = Math.min(opW / lebarValid, 1) * wallW;
        const oh = Math.min(opH / tinggiValid, 1) * wallH;
        const ox = wx + Math.min(opLeft / lebarValid, 1) * wallW;
        const oy = wy + wallH - Math.min(opBottom / tinggiValid, 1) * wallH - oh;

        ctx.fillStyle = opBottom > 0 ? '#e0f2fe' : '#e7e5e4';
        ctx.fillRect(ox, oy, ow, oh);
        ctx.strokeStyle = '#292524';
        ctx.lineWidth = 4;
        ctx.strokeRect(ox, oy, ow, oh);

        ctx.fillStyle = '#1c1917';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${item.nama} (${opW}×${opH}m)`, ox + ow / 2, oy + oh / 2 + 6);
        ctx.textAlign = 'left';
      });

      if (isNight) {
        ctx.fillStyle = 'rgba(245, 158, 11, 0.14)';
        ctx.fillRect(wx, wy, wallW, wallH);
      }

      ctx.restore();

      ctx.fillStyle = '#6b4930';
      ctx.fillRect(wx, wy + wallH, wallW, 18);

      ctx.fillStyle = '#a8a29e';
      ctx.font = '15px sans-serif';
      const aksesorisText = [
        useListH ? `List H ${listHColor}` : null,
        useListLWpc ? 'List L WPC' : null,
        isNight ? 'Pencahayaan Malam LED' : null,
      ]
        .filter(Boolean)
        .join(' · ');
      ctx.fillText(
        aksesorisText
          ? `Catatan: ${aksesorisText}`
          : 'Simulasi visual proporsional PANELIN Showroom Studio',
        60,
        canvas.height - 26
      );

      const link = document.createElement('a');
      link.download = `PANELIN-${activeProduct.kode}-${lebarValid}x${tinggiValid}m.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } finally {
      setIsSavingImg(false);
    }
  };

  const activeYaw = is3DMode ? yawAngle : 0;
  const directionalShade = activeYaw / 38;
  const roomDepth = isCompact ? 130 : 240;
  const bedLength3D = isCompact ? 76 : 148; // Panjang kasur menjorok ke depan (px)
  const credenzaDepth3D = isCompact ? 24 : 44; // Ketebalan credenza TV ke depan (px)

  const isOuterWpc = activeProduct.tipe === 'WPC';
  const isCenterWpc = activeMix && centerProduct?.tipe === 'WPC';

  return (
    <div className="w-full flex flex-col items-center justify-center select-none">
      {/* ── Bar Kontrol Atas ── */}
      <div
        className={`w-full max-w-xl flex flex-wrap items-center justify-between gap-2 px-0.5 transition-all duration-300 ${
          isCompact ? 'mb-1.5' : 'mb-2.5'
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

        {/* Grup Tombol Kanan: Switch 2D/3D, Simpan Gambar, & Pin HP */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="flex items-center rounded-xl bg-stone-200/90 p-0.5 border border-stone-300/70">
            <button
              type="button"
              onClick={() => setIs3DMode(false)}
              className={`${
                isCompact ? 'min-h-[30px] px-2 text-[10px]' : 'min-h-[36px] px-2.5 text-[11px]'
              } rounded-lg font-bold transition cursor-pointer ${
                !is3DMode
                  ? 'bg-stone-900 text-white shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              2D
            </button>
            <button
              type="button"
              onClick={() => setIs3DMode(true)}
              className={`${
                isCompact ? 'min-h-[30px] px-2 text-[10px]' : 'min-h-[36px] px-2.5 text-[11px]'
              } rounded-lg font-bold transition cursor-pointer flex items-center gap-1 ${
                is3DMode
                  ? 'bg-amber-500 text-stone-950 shadow-2xs'
                  : 'text-stone-700 hover:text-stone-950'
              }`}
            >
              <span>3D Ruangan</span>
            </button>
          </div>

          {!isCompact && (
            <button
              type="button"
              onClick={handleSaveSnapshot}
              disabled={isSavingImg}
              title="Simpan gambar simulasi untuk dikirim ke klien"
              className="min-h-[40px] px-2.5 sm:px-3 rounded-xl text-[11px] sm:text-xs font-bold border border-stone-300 bg-white hover:bg-stone-100 text-stone-800 transition cursor-pointer shadow-2xs flex items-center gap-1.5"
            >
              <svg
                className="w-3.5 h-3.5 text-amber-600 shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span className="hidden sm:inline">
                {isSavingImg ? 'Menyimpan...' : 'Simpan Gambar'}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={onToggleMobileSticky}
            title={
              isMobileSticky
                ? 'Lepas preview dari atas layar'
                : 'Kunci preview di atas layar'
            }
            className={`lg:hidden ${
              isCompact ? 'min-h-[34px] px-2' : 'min-h-[40px] px-2.5'
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
          </button>
        </div>
      </div>

      {/* ── Bar Preset Ruangan (Polos / Ruang TV / Kamar Tidur) & Lampu Siang/Malam ── */}
      {!isCompact && (
        <div className="w-full max-w-xl flex flex-wrap items-center justify-between gap-2 mb-2.5 px-0.5">
          <div className="flex items-center rounded-xl bg-stone-100 p-1 border border-stone-200/90 gap-1">
            {[
              { id: 'polos', label: 'Polos' },
              { id: 'tv', label: 'Ruang TV' },
              { id: 'kamar', label: 'Kamar Tidur' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setRoomPreset(item.id)}
                className={`min-h-[34px] px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                  roomPreset === item.id
                    ? 'bg-stone-900 text-amber-300 shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="flex items-center rounded-xl bg-stone-100 p-1 border border-stone-200/90 gap-1">
            <button
              type="button"
              onClick={() => setLightingMode('siang')}
              className={`min-h-[34px] px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center gap-1 ${
                lightingMode === 'siang'
                  ? 'bg-white text-stone-900 shadow-2xs border border-stone-200'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <span>☀️</span>
              <span>Siang</span>
            </button>
            <button
              type="button"
              onClick={() => setLightingMode('malam')}
              className={`min-h-[34px] px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center gap-1 ${
                lightingMode === 'malam'
                  ? 'bg-stone-950 text-amber-300 shadow-2xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <span>🌙</span>
              <span>Malam LED</span>
            </button>
          </div>
        </div>
      )}

      {/* ── Panel Kontrol Putar Sudut 3D + Pilihan Warna Cat Dinding Samping ── */}
      {is3DMode && !isCompact && (
        <div className="w-full max-w-xl mb-2.5 px-3 py-2 rounded-xl bg-stone-900 text-stone-200 flex flex-wrap items-center justify-between gap-2.5 text-xs shadow-xs">
          <div className="flex items-center gap-1">
            {[
              { label: 'Kiri', val: -26 },
              { label: 'Depan', val: 0 },
              { label: 'Kanan', val: 26 },
            ].map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => setYawAngle(preset.val)}
                className={`px-2 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                  yawAngle === preset.val
                    ? 'bg-amber-400 text-stone-950'
                    : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 bg-stone-800/90 px-2 py-1 rounded-lg border border-stone-700">
            <span className="text-[10px] text-stone-400">Cat Samping:</span>
            {[
              { key: 'putih', label: 'Putih', cls: 'bg-white' },
              { key: 'krem', label: 'Krem', cls: 'bg-amber-100' },
              { key: 'abu', label: 'Abu', cls: 'bg-stone-500' },
            ].map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setSideWallTheme(t.key)}
                title={`Warna Dinding Samping: ${t.label}`}
                className={`w-4 h-4 rounded-full border cursor-pointer transition ${t.cls} ${
                  sideWallTheme === t.key
                    ? 'ring-2 ring-amber-400 scale-110 border-stone-900'
                    : 'border-stone-500 opacity-75 hover:opacity-100'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-1.5 flex-1 min-w-[130px] max-w-[200px]">
            <input
              type="range"
              min="-34"
              max="34"
              step="1"
              value={yawAngle}
              onChange={(e) => setYawAngle(Number(e.target.value))}
              aria-label="Putar sudut interior ruangan 3D"
              className="w-full accent-amber-400 cursor-pointer h-1.5 bg-stone-700 rounded-lg"
            />
            <span className="text-[10px] font-mono text-amber-300 w-8 text-right shrink-0">
              {yawAngle > 0 ? `+${yawAngle}°` : `${yawAngle}°`}
            </span>
          </div>
        </div>
      )}

      {/* ── Area Simulasi Ruangan ── */}
      <div className="w-full max-w-xl px-1 sm:px-8 flex flex-col items-center">
        {/* Garis Dimensi Lebar (Mode 2D) */}
        {!isCompact && !is3DMode && (
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
          {/* ══════════ VIEWPORT KAMERA INTERIOR 3D ══════════ */}
          <div
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            className={`w-full rounded-xl overflow-hidden transition-all duration-300 relative ${
              is3DMode
                ? 'bg-stone-950 shadow-[0_24px_50px_-12px_rgba(0,0,0,0.65)] border-2 border-stone-800 cursor-grab active:cursor-grabbing touch-pan-y'
                : 'bg-stone-900 shadow-[0_14px_30px_-10px_rgba(0,0,0,0.3)] border border-stone-300'
            }`}
            style={
              is3DMode
                ? {
                    perspective: '420px',
                    perspectiveOrigin: '50% 48%',
                  }
                : undefined
            }
          >
            {/* ══════════ KOTAK RUANGAN 3D SEJATI ══════════ */}
            <div
              className="w-full flex flex-col relative transition-transform duration-200 ease-out"
              style={
                is3DMode
                  ? {
                      transformStyle: 'preserve-3d',
                      transform: `translateZ(-${roomDepth * 0.65}px) rotateY(${activeYaw}deg)`,
                    }
                  : undefined
              }
            >
              {/* 1. PLAFON RUANGAN 3D */}
              {is3DMode && (
                <div
                  aria-hidden="true"
                  className="absolute top-0 left-0 right-0 origin-top pointer-events-none flex items-center justify-around border-b border-stone-400/50 transition-all duration-300"
                  style={{
                    height: `${roomDepth}px`,
                    transform: 'rotateX(90deg)',
                    background: sideWallPalette.ceilingBg,
                    boxShadow: 'inset 0 28px 45px rgba(0,0,0,0.4)',
                  }}
                >
                  {[0, 1, 2].map((lamp) => (
                    <span
                      key={lamp}
                      className={`w-8 h-3 rounded-full transition-all duration-300 ${
                        isNight
                          ? 'bg-amber-200 shadow-[0_0_32px_rgba(251,191,36,1)]'
                          : 'bg-amber-50 shadow-[0_0_16px_rgba(251,191,36,0.75)]'
                      }`}
                    />
                  ))}
                </div>
              )}

              {/* 2. DINDING SAMPING KIRI 3D */}
              {is3DMode && (
                <div
                  aria-hidden="true"
                  className="absolute top-0 bottom-0 left-0 origin-left pointer-events-none transition-all duration-300"
                  style={{
                    width: `${roomDepth}px`,
                    transform: 'rotateY(-90deg)',
                    background: sideWallPalette.leftBg,
                    boxShadow: 'inset 32px 0 48px rgba(0,0,0,0.48)',
                  }}
                >
                  <div className="w-full h-3 bg-stone-200/90 border-b border-stone-400" />
                  <div className="w-full h-4 bg-stone-900 border-t border-stone-700 absolute bottom-0" />
                </div>
              )}

              {/* 3. DINDING SAMPING KANAN 3D */}
              {is3DMode && (
                <div
                  aria-hidden="true"
                  className="absolute top-0 bottom-0 right-0 origin-right pointer-events-none transition-all duration-300"
                  style={{
                    width: `${roomDepth}px`,
                    transform: 'rotateY(90deg)',
                    background: sideWallPalette.rightBg,
                    boxShadow: 'inset -32px 0 48px rgba(0,0,0,0.48)',
                  }}
                >
                  <div className="w-full h-3 bg-stone-200/90 border-b border-stone-400" />
                  <div className="w-full h-4 bg-stone-900 border-t border-stone-700 absolute bottom-0" />
                </div>
              )}

              {/* Plafon 2D */}
              {!is3DMode && (
                <div
                  className={`${
                    isCompact ? 'h-2' : 'h-3.5'
                  } w-full bg-gradient-to-b from-stone-200 to-stone-300 border-b border-stone-400/60 relative flex items-center justify-around transition-all duration-300`}
                >
                  {[0, 1, 2].map((lamp) => (
                    <span
                      key={lamp}
                      className={`w-5 h-1 rounded-full transition-all duration-300 ${
                        isNight
                          ? 'bg-amber-200 shadow-[0_2px_14px_rgba(251,191,36,1)]'
                          : 'bg-amber-100 shadow-[0_2px_10px_rgba(251,191,36,0.85)]'
                      }`}
                    />
                  ))}
                </div>
              )}

              {/* 4. BIDANG DINDING UTAMA PANEL */}
              <div
                className={`w-full ${
                  isCompact ? 'max-h-[155px]' : 'max-h-[340px] sm:max-h-[390px]'
                } relative bg-stone-200 transition-all duration-300 ${
                  is3DMode ? 'overflow-visible' : 'overflow-hidden'
                }`}
                style={{
                  aspectRatio: `${aspectRatio}`,
                  transformStyle: is3DMode ? 'preserve-3d' : undefined,
                }}
              >
                {/* Layer Clipping khusus Tekstur Panel & Garis Sambungan Dinding */}
                <div className="absolute inset-0 overflow-hidden">
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
                      {is3DMode && isOuterWpc && (
                        <div
                          className="absolute inset-0 pointer-events-none"
                          style={{
                            backgroundImage:
                              'repeating-linear-gradient(90deg, rgba(0,0,0,0.34) 0px, transparent 3px, rgba(255,255,255,0.12) 6px, rgba(0,0,0,0.34) 11px)',
                          }}
                        />
                      )}

                      <div
                        className={`relative transition-all duration-500 ${
                          is3DMode
                            ? 'shadow-[0_14px_28px_rgba(0,0,0,0.72)]'
                            : 'shadow-[0_10px_28px_rgba(0,0,0,0.55)]'
                        } ${
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
                        {is3DMode && isCenterWpc && (
                          <div
                            className="absolute inset-0 pointer-events-none"
                            style={{
                              backgroundImage:
                                'repeating-linear-gradient(90deg, rgba(0,0,0,0.36) 0px, transparent 3px, rgba(255,255,255,0.14) 6px, rgba(0,0,0,0.36) 11px)',
                            }}
                          />
                        )}

                        <div
                          className="absolute inset-0 pointer-events-none"
                          style={{
                            background:
                              'linear-gradient(125deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.02) 45%, rgba(0,0,0,0.14) 100%)',
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
                      {is3DMode && isOuterWpc && (
                        <div
                          className="absolute inset-0 pointer-events-none"
                          style={{
                            backgroundImage:
                              'repeating-linear-gradient(90deg, rgba(0,0,0,0.34) 0px, transparent 3px, rgba(255,255,255,0.12) 6px, rgba(0,0,0,0.34) 11px)',
                          }}
                        />
                      )}

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
                    className={`absolute inset-y-0 left-0 z-15 pointer-events-none transition-all duration-500 bg-gradient-to-r from-amber-900/95 via-amber-700/85 to-transparent ${
                      useListLWpc ? 'w-2 opacity-100' : 'w-0 opacity-0'
                    }`}
                  />
                  <div
                    className={`absolute inset-y-0 right-0 z-15 pointer-events-none transition-all duration-500 bg-gradient-to-l from-amber-900/95 via-amber-700/85 to-transparent ${
                      useListLWpc ? 'w-2 opacity-100' : 'w-0 opacity-0'
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
                          className={`absolute z-15 transition-all duration-200 flex flex-col items-center justify-center shadow-[inset_0_4px_14px_rgba(0,0,0,0.42)] ${
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

                  {/* Layer Pencahayaan Ruangan (Siang Alami vs Malam Warm Downlight LED) */}
                  <div
                    className="absolute inset-0 pointer-events-none z-10 transition-all duration-500"
                    style={{
                      boxShadow: is3DMode
                        ? 'inset 0 0 46px rgba(0,0,0,0.58)'
                        : undefined,
                      background: isNight
                        ? `
                          radial-gradient(ellipse 22% 58% at 22% 0%, rgba(253, 224, 71, 0.34) 0%, transparent 80%),
                          radial-gradient(ellipse 22% 58% at 50% 0%, rgba(253, 224, 71, 0.38) 0%, transparent 80%),
                          radial-gradient(ellipse 22% 58% at 78% 0%, rgba(253, 224, 71, 0.34) 0%, transparent 80%),
                          linear-gradient(to bottom, rgba(12, 10, 9, 0.32) 0%, rgba(245, 158, 11, 0.08) 45%, rgba(12, 10, 9, 0.56) 100%),
                          linear-gradient(to right, rgba(0,0,0,${Math.max(
                            0.34 + directionalShade * 0.22,
                            0.12
                          )}) 0%, transparent 22%, transparent 78%, rgba(0,0,0,${Math.max(
                            0.34 - directionalShade * 0.22,
                            0.12
                          )}) 100%)
                        `
                        : `
                          radial-gradient(ellipse 80% 45% at 50% 0%, rgba(255, 244, 214, 0.3) 0%, transparent 75%),
                          linear-gradient(to right, rgba(0,0,0,${Math.max(
                            0.26 + directionalShade * 0.22,
                            0.08
                          )}) 0%, transparent 20%, transparent 80%, rgba(0,0,0,${Math.max(
                            0.26 - directionalShade * 0.22,
                            0.08
                          )}) 100%),
                          linear-gradient(to bottom, rgba(0,0,0,0.32) 0%, transparent 14%, transparent 84%, rgba(0,0,0,0.42) 100%)
                        `,
                    }}
                  />
                </div>

                {/* ─── LAYER PRESET FURNITUR (RUANG TV / KAMAR TIDUR 3D & 2D) ─── */}
                {roomPreset === 'tv' && (
                  <div
                    className="absolute inset-0 pointer-events-none z-20 flex flex-col items-center justify-end"
                    style={
                      is3DMode
                        ? { transformStyle: 'preserve-3d' }
                        : undefined
                    }
                  >
                    {/* TV Gantung */}
                    <div
                      className="w-[44%] max-w-[230px] aspect-video mb-[11%] relative flex items-center justify-center"
                      style={
                        is3DMode
                          ? { transform: 'translateZ(14px)' }
                          : undefined
                      }
                    >
                      <div
                        className={`absolute -inset-2 rounded-lg transition-all duration-500 ${
                          isNight
                            ? 'bg-amber-300/65 blur-lg'
                            : 'bg-amber-300/35 blur-md'
                        }`}
                      />
                      <div className="w-full h-full bg-gradient-to-tr from-stone-950 via-stone-900 to-stone-800 rounded-xs border-2 border-stone-700 shadow-[0_14px_28px_rgba(0,0,0,0.8)] relative overflow-hidden">
                        <div
                          className="w-full h-full opacity-30"
                          style={{
                            background:
                              'linear-gradient(115deg, rgba(255,255,255,0.35) 0%, transparent 45%)',
                          }}
                        />
                      </div>
                    </div>

                    {/* Meja Credenza TV (3D Blok saat mode 3D aktif) */}
                    {is3DMode ? (
                      <div
                        className="w-[62%] max-w-[320px] h-[7%] min-h-[14px] relative"
                        style={{
                          transformStyle: 'preserve-3d',
                          transform: `translateZ(${credenzaDepth3D}px)`,
                        }}
                      >
                        {/* Muka Depan Credenza */}
                        <div className="w-full h-full bg-gradient-to-b from-stone-800 to-stone-950 border-t border-amber-400/50 shadow-[0_10px_20px_rgba(0,0,0,0.75)] flex items-center justify-around px-3">
                          <div className="w-1/3 h-[1px] bg-stone-600/60" />
                          <div className="w-1/3 h-[1px] bg-stone-600/60" />
                        </div>
                        {/* Permukaan Atas Credenza */}
                        <div
                          className="absolute top-0 left-0 right-0 origin-top bg-gradient-to-b from-stone-700 to-stone-800 border-t border-stone-600"
                          style={{
                            height: `${credenzaDepth3D}px`,
                            transform: 'rotateX(-90deg)',
                          }}
                        />
                        {/* Sisi Kiri & Kanan Credenza */}
                        <div
                          className="absolute top-0 bottom-0 left-0 origin-left bg-stone-900 border-r border-stone-700"
                          style={{
                            width: `${credenzaDepth3D}px`,
                            transform: 'rotateY(90deg)',
                          }}
                        />
                        <div
                          className="absolute top-0 bottom-0 right-0 origin-right bg-stone-900 border-l border-stone-700"
                          style={{
                            width: `${credenzaDepth3D}px`,
                            transform: 'rotateY(-90deg)',
                          }}
                        />
                      </div>
                    ) : (
                      <div className="w-[62%] max-w-[320px] h-[7%] min-h-[12px] bg-gradient-to-b from-stone-800 to-stone-950 rounded-t-xs border-t border-amber-400/40 shadow-[0_-4px_14px_rgba(0,0,0,0.55)] flex items-center justify-around px-3">
                        <div className="w-1/3 h-[1px] bg-stone-600/60" />
                        <div className="w-1/3 h-[1px] bg-stone-600/60" />
                      </div>
                    )}
                  </div>
                )}

                {roomPreset === 'kamar' && (
                  <div
                    className="absolute inset-0 pointer-events-none z-20 flex items-end justify-center gap-2 sm:gap-3 px-4"
                    style={
                      is3DMode
                        ? { transformStyle: 'preserve-3d' }
                        : undefined
                    }
                  >
                    {/* Nakas & Lampu Tidur Kiri */}
                    <div
                      className="w-[13%] max-w-[54px] flex flex-col items-center"
                      style={
                        is3DMode
                          ? { transform: 'translateZ(18px)' }
                          : undefined
                      }
                    >
                      <div className="relative flex flex-col items-center mb-0.5">
                        {isNight && (
                          <div className="absolute -inset-3 bg-amber-300/60 blur-md rounded-full" />
                        )}
                        <div className="w-3.5 h-3 bg-amber-100 rounded-t-sm border border-amber-300/80 relative z-10" />
                        <div className="w-1 h-2 bg-stone-700" />
                      </div>
                      <div className="w-full h-6 sm:h-8 bg-gradient-to-b from-stone-800 to-stone-950 rounded-t-xs border-t border-stone-600 shadow-md" />
                    </div>

                    {/* Ranjang (Headboard + Kasur 3D menjorok maju ke depan saat mode 3D) */}
                    <div
                      className="w-[52%] max-w-[270px] flex flex-col items-center relative"
                      style={
                        is3DMode
                          ? { transformStyle: 'preserve-3d' }
                          : undefined
                      }
                    >
                      {/* Headboard Empuk Menempel Dinding */}
                      <div
                        className="w-full h-14 sm:h-18 bg-gradient-to-b from-stone-700 via-stone-800 to-stone-900 rounded-t-md border-x border-t border-stone-600 shadow-[0_-4px_16px_rgba(0,0,0,0.55)] flex items-end justify-around px-2 pb-1.5"
                        style={
                          is3DMode
                            ? { transform: 'translateZ(8px)' }
                            : undefined
                        }
                      >
                        <div className="w-[42%] h-4 sm:h-5 bg-stone-200 rounded-t-sm border border-stone-300 shadow-xs" />
                        <div className="w-[42%] h-4 sm:h-5 bg-stone-200 rounded-t-sm border border-stone-300 shadow-xs" />
                      </div>

                      {/* Badan Kasur 3D Sejati vs 2D */}
                      {is3DMode ? (
                        <div
                          className="w-[104%] h-7 sm:h-9 relative"
                          style={{
                            transformStyle: 'preserve-3d',
                            // Geser muka ujung kasur maju sejauh bedLength3D ke arah kamera
                            transform: `translateZ(${bedLength3D}px)`,
                          }}
                        >
                          {/* 1. Ujung Depan / Kaki Kasur (Divan + Selimut Depan) */}
                          <div className="w-full h-full flex flex-col shadow-[0_14px_24px_rgba(0,0,0,0.75)]">
                            <div className="w-full h-1/2 bg-gradient-to-b from-stone-100 to-stone-200 border-t-2 border-amber-500/70" />
                            <div className="w-full h-1/2 bg-gradient-to-b from-stone-800 to-stone-950 border-t border-stone-700" />
                          </div>

                          {/* 2. Permukaan Atas Kasur (Sprei & Selimut Membentang dari Headboard ke Depan) */}
                          <div
                            className="absolute top-0 left-0 right-0 origin-top flex flex-col justify-between border-x border-stone-300"
                            style={{
                              height: `${bedLength3D}px`,
                              transform: 'rotateX(-90deg)',
                              background:
                                'linear-gradient(to bottom, #f5f5f4 0%, #e7e5e4 32%, #d6d3d1 34%, #fafaf9 100%)',
                              boxShadow: 'inset 0 14px 24px rgba(0,0,0,0.28)',
                            }}
                          >
                            {/* Lipatan Selimut & Bantal di Bagian Kepala */}
                            <div className="w-full h-[30%] bg-stone-200/90 border-b-2 border-amber-500/60 flex items-center justify-around px-3">
                              <div className="w-[40%] h-[68%] bg-white rounded-xs shadow-2xs border border-stone-300" />
                              <div className="w-[40%] h-[68%] bg-white rounded-xs shadow-2xs border border-stone-300" />
                            </div>
                          </div>

                          {/* 3. Sisi Samping Kiri Kasur 3D */}
                          <div
                            className="absolute top-0 bottom-0 left-0 origin-left flex flex-col"
                            style={{
                              width: `${bedLength3D}px`,
                              transform: 'rotateY(90deg)',
                              boxShadow: 'inset 0 0 18px rgba(0,0,0,0.35)',
                            }}
                          >
                            <div className="w-full h-1/2 bg-stone-200 border-b border-stone-400" />
                            <div className="w-full h-1/2 bg-stone-900" />
                          </div>

                          {/* 4. Sisi Samping Kanan Kasur 3D */}
                          <div
                            className="absolute top-0 bottom-0 right-0 origin-right flex flex-col"
                            style={{
                              width: `${bedLength3D}px`,
                              transform: 'rotateY(-90deg)',
                              boxShadow: 'inset 0 0 18px rgba(0,0,0,0.35)',
                            }}
                          >
                            <div className="w-full h-1/2 bg-stone-200 border-b border-stone-400" />
                            <div className="w-full h-1/2 bg-stone-900" />
                          </div>
                        </div>
                      ) : (
                        <div className="w-[104%] h-5 sm:h-7 bg-gradient-to-b from-stone-100 to-stone-300 border-t-2 border-amber-500/50 shadow-inner" />
                      )}
                    </div>

                    {/* Nakas & Lampu Tidur Kanan */}
                    <div
                      className="w-[13%] max-w-[54px] flex flex-col items-center"
                      style={
                        is3DMode
                          ? { transform: 'translateZ(18px)' }
                          : undefined
                      }
                    >
                      <div className="relative flex flex-col items-center mb-0.5">
                        {isNight && (
                          <div className="absolute -inset-3 bg-amber-300/60 blur-md rounded-full" />
                        )}
                        <div className="w-3.5 h-3 bg-amber-100 rounded-t-sm border border-amber-300/80 relative z-10" />
                        <div className="w-1 h-2 bg-stone-700" />
                      </div>
                      <div className="w-full h-6 sm:h-8 bg-gradient-to-b from-stone-800 to-stone-950 rounded-t-xs border-t border-stone-600 shadow-md" />
                    </div>
                  </div>
                )}
              </div>

              {/* 5. LANTAI KAYU RUANGAN 3D */}
              {is3DMode ? (
                <div
                  aria-hidden="true"
                  className="absolute bottom-0 left-0 right-0 origin-bottom pointer-events-none border-t-4 border-stone-900"
                  style={{
                    height: `${roomDepth}px`,
                    transform: 'rotateX(-90deg)',
                    background:
                      'repeating-linear-gradient(90deg, #78553a 0px, #6b4930 48px, #5c3d26 49px, #78553a 96px)',
                    boxShadow: 'inset 0 -30px 48px rgba(0,0,0,0.58)',
                  }}
                />
              ) : (
                <>
                  <div
                    className={`${
                      isCompact ? 'h-1' : 'h-2'
                    } w-full bg-stone-800 border-t border-stone-600`}
                  />
                  <div
                    className={`${
                      isCompact ? 'h-2.5' : 'h-5'
                    } w-full relative transition-all duration-300`}
                    style={{
                      background:
                        'repeating-linear-gradient(90deg, #78553a 0px, #6b4930 48px, #5c3d26 49px, #78553a 96px)',
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-b from-black/35 to-transparent" />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Garis Dimensi Tinggi Sisi Kanan Luar (Mode 2D Desktop) */}
          {!is3DMode && (
            <div className="hidden sm:flex flex-col items-center justify-center pl-2 text-[11px] font-mono text-stone-700 shrink-0">
              <div className="h-full border-y border-stone-400 flex items-center justify-center relative px-1">
                <div className="h-full border-r border-stone-400 absolute" />
                <span className="bg-stone-100 py-1 px-1 relative z-10 font-semibold [writing-mode:vertical-rl] rotate-180">
                  Tinggi: {tinggiValid} m
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Keterangan Ringkas di Bawah Lantai */}
        {!isCompact && (
          <div className="w-full flex flex-wrap items-center justify-between text-[11px] text-stone-500 mt-2 px-1 gap-2">
            <span>
              Bidang: <strong className="text-stone-700">{lebarValid}m × {tinggiValid}m</strong>
              {openings.length > 0 && <> · {openings.length} Bukaan</>}
              {isFrameMode && (
                <> · Bingkai Sisi {sideWidth.toFixed(2)}m · Atas/Bawah {topBottomHeight.toFixed(2)}m</>
              )}
            </span>
            <span className="text-stone-400 hidden sm:inline">
              {is3DMode
                ? '*Geser gambar 3D atau ubah cat samping & suasana lampu di atas'
                : '*Simulasi pencahayaan & skala proporsional'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}