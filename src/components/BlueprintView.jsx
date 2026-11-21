import { forwardRef, useImperativeHandle, useState } from 'react';

const BlueprintView = forwardRef(function BlueprintView(
  {
    activeProduct,
    lebarValid,
    tinggiValid,
    aspectRatio,
    openings = [],
    activeMix = false,
    isFrameMode = false,
    centerProduct = null,
    effectiveCenterWidth = 0,
    effectiveCenterHeight = 0,
    sideWidth = 0,
    centerWidthPct = 0,
    centerHeightPct = 0,
    sideWidthPct = 0,
    useListH = false,
    listHColor = 'Gold',
    useListLWpc = false,
    isCompact = false,
    onSavingChange = () => {},
  },
  ref
) {
  const [isSaving, setIsSaving] = useState(false);

  const lebarPanelCm = activeProduct?.dimensi?.lebar_cm || 0;
  const tinggiPanelCm = activeProduct?.dimensi?.tinggi_cm || 0;
  const lebarPanelMeter = lebarPanelCm / 100;
  const tinggiPanelMeter = tinggiPanelCm / 100;

  const TOLERANSI_FP = 0.001;
  const totalLajur = lebarPanelMeter > 0 ? Math.ceil(lebarValid / lebarPanelMeter) : 0;

  // Perhitungan Sambungan Tinggi (> 2.9m)
  const isTinggiLebih =
    tinggiPanelMeter > 0 && tinggiValid > tinggiPanelMeter + TOLERANSI_FP;
  const horizontalSeamPosBottom =
    isTinggiLebih && tinggiValid > 0 ? (tinggiPanelMeter / tinggiValid) * 100 : 100;

  const utuhPerLajur =
    tinggiPanelMeter > 0
      ? Math.floor((tinggiValid + TOLERANSI_FP) / tinggiPanelMeter)
      : 0;
  const sisaTinggiMeter = Math.max(tinggiValid - utuhPerLajur * tinggiPanelMeter, 0);
  const sisaTinggiCm = Math.round(sisaTinggiMeter * 100);
  const potonganPerLembar =
    sisaTinggiMeter > TOLERANSI_FP
      ? Math.max(Math.floor((tinggiPanelMeter + TOLERANSI_FP) / sisaTinggiMeter), 1)
      : 0;

  // Sisa Lebar Lajur Terakhir
  const lebarSisaLajurTerakhirCm = (() => {
    if (totalLajur <= 0 || lebarValid <= 0) return 0;
    const terpakaiSebelumnya = (totalLajur - 1) * lebarPanelCm;
    const sisa = Math.round(lebarValid * 100 - terpakaiSebelumnya);
    return sisa > 0 ? sisa : lebarPanelCm;
  })();

  // Rincian Lajur Kolom (Mode 1 Produk)
  const blueprintColumns = (() => {
    if (totalLajur <= 0 || lebarValid <= 0) return [];
    const cols = [];
    for (let i = 0; i < totalLajur; i++) {
      const startM = i * lebarPanelMeter;
      const endM = Math.min((i + 1) * lebarPanelMeter, lebarValid);
      const widthM = Math.max(endM - startM, 0);
      const widthCm = Math.round(widthM * 100);
      cols.push({
        index: i + 1,
        leftPct: (startM / lebarValid) * 100,
        widthPct: (widthM / lebarValid) * 100,
        widthCm,
        isCutWidth: widthCm < lebarPanelCm,
      });
    }
    return cols;
  })();

  // Ekspor Gambar Kerja Blueprint PNG untuk Tukang
  const handleDownloadBlueprint = () => {
    if (isSaving || lebarValid <= 0 || tinggiValid <= 0 || !activeProduct) return;
    setIsSaving(true);
    onSavingChange(true);

    try {
      const canvas = document.createElement('canvas');
      const baseWidth = 1140;
      const wallW = 920;
      const wallH = Math.max(Math.min(Math.round(wallW / aspectRatio), 760), 340);
      const headerH = 126;
      const footerH = 195;

      canvas.width = baseWidth;
      canvas.height = headerH + wallH + footerH;
      const ctx = canvas.getContext('2d');

      // Kertas Blueprint Biru Arsitektur
      ctx.fillStyle = '#0f2942';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.strokeRect(24, 20, canvas.width - 48, canvas.height - 40);

      // Kop Judul Gambar Kerja
      ctx.fillStyle = '#bae6fd';
      ctx.font = 'bold 24px monospace';
      ctx.fillText('PANELIN · GAMBAR KERJA & PANDUAN POTONG TUKANG', 52, 58);

      ctx.fillStyle = '#7dd3fc';
      ctx.font = '16px monospace';
      const titleLine = activeMix
        ? `MODE MIX (${isFrameMode ? 'BINGKAI 4 SISI' : 'SAYAP KIRI-KANAN'}): ${activeProduct.kode} + ${centerProduct.kode}`
        : `MATERIAL: ${activeProduct.nama} (${lebarPanelCm} × ${tinggiPanelCm} cm)`;
      ctx.fillText(titleLine, 52, 86);

      ctx.fillStyle = '#fde047';
      ctx.font = 'bold 16px monospace';
      ctx.fillText(
        `DIMENSI BIDANG: ${lebarValid}m (${Math.round(lebarValid * 100)}cm) × ${tinggiValid}m (${Math.round(
          tinggiValid * 100
        )}cm)`,
        52,
        112
      );

      const wx = (baseWidth - wallW) / 2;
      const wy = headerH + 14;

      // Bidang Dinding Utama
      ctx.fillStyle = '#163a5f';
      ctx.fillRect(wx, wy, wallW, wallH);
      ctx.strokeStyle = '#7dd3fc';
      ctx.lineWidth = 3;
      ctx.strokeRect(wx, wy, wallW, wallH);

      if (activeMix && centerProduct) {
        const cw = (centerWidthPct / 100) * wallW;
        const ch = (centerHeightPct / 100) * wallH;
        const cx = wx + (wallW - cw) / 2;
        const cy = wy + (wallH - ch) / 2;

        ctx.fillStyle = 'rgba(250, 204, 21, 0.16)';
        ctx.fillRect(cx, cy, cw, ch);
        ctx.strokeStyle = '#fde047';
        ctx.lineWidth = 3;
        ctx.strokeRect(cx, cy, cw, ch);

        ctx.fillStyle = '#fde047';
        ctx.font = 'bold 17px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(
          `TENGAH: ${centerProduct.kode}`,
          cx + cw / 2,
          cy + ch / 2 - 8
        );
        ctx.font = '15px monospace';
        ctx.fillText(
          `${Math.round(effectiveCenterWidth * 100)}cm × ${Math.round(
            effectiveCenterHeight * 100
          )}cm`,
          cx + cw / 2,
          cy + ch / 2 + 16
        );

        if (sideWidth > 0) {
          const sw = (sideWidthPct / 100) * wallW;
          ctx.fillStyle = '#bae6fd';
          ctx.font = 'bold 14px monospace';
          ctx.fillText('SISI KIRI', wx + sw / 2, wy + 34);
          ctx.fillText(`${Math.round(sideWidth * 100)} cm`, wx + sw / 2, wy + 54);

          ctx.fillText('SISI KANAN', wx + wallW - sw / 2, wy + 34);
          ctx.fillText(
            `${Math.round(sideWidth * 100)} cm`,
            wx + wallW - sw / 2,
            wy + 54
          );
        }
        ctx.textAlign = 'left';
      } else {
        blueprintColumns.forEach((col) => {
          const cx = wx + (col.leftPct / 100) * wallW;
          const cw = (col.widthPct / 100) * wallW;

          ctx.strokeStyle = col.isCutWidth ? '#f87171' : 'rgba(125, 211, 252, 0.55)';
          ctx.lineWidth = col.isCutWidth ? 2.5 : 1.5;
          ctx.strokeRect(cx, wy, cw, wallH);

          if (cw >= 28) {
            ctx.fillStyle = col.isCutWidth ? '#fca5a5' : '#e0f2fe';
            ctx.font = 'bold 13px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(`#${col.index}`, cx + cw / 2, wy + wallH / 2 - 4);
            ctx.font = '11px monospace';
            ctx.fillText(`${col.widthCm}cm`, cx + cw / 2, wy + wallH / 2 + 14);
            ctx.textAlign = 'left';
          }
        });
      }

      // Garis Potong Sambungan Horizontal (> 2.9m)
      if (isTinggiLebih) {
        const seamY = wy + wallH - (horizontalSeamPosBottom / 100) * wallH;
        ctx.strokeStyle = '#f87171';
        ctx.lineWidth = 3;
        ctx.setLineDash([12, 8]);
        ctx.beginPath();
        ctx.moveTo(wx, seamY);
        ctx.lineTo(wx + wallW, seamY);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = '#0f2942';
        ctx.fillRect(wx + 12, seamY - 26, 360, 22);
        ctx.fillStyle = '#fca5a5';
        ctx.font = 'bold 13px monospace';
        ctx.fillText(
          `GARIS POTONG SAMBUNGAN ATAS: +${sisaTinggiCm} cm`,
          wx + 18,
          seamY - 10
        );
      }

      // Bukaan Pintu / Jendela
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

        ctx.fillStyle = '#081826';
        ctx.fillRect(ox, oy, ow, oh);
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(ox, oy, ow, oh);

        ctx.beginPath();
        ctx.moveTo(ox, oy);
        ctx.lineTo(ox + ow, oy + oh);
        ctx.moveTo(ox + ow, oy);
        ctx.lineTo(ox, oy + oh);
        ctx.stroke();

        ctx.fillStyle = '#fde047';
        ctx.font = 'bold 13px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(
          `${item.nama.toUpperCase()} (${Math.round(opW * 100)}×${Math.round(opH * 100)}cm)`,
          ox + ow / 2,
          oy + oh / 2 - 4
        );
        ctx.font = '11px monospace';
        ctx.fillText(`Kiri: ${Math.round(opLeft * 100)}cm`, ox + ow / 2, oy + oh / 2 + 14);
        ctx.textAlign = 'left';
      });

      // Kotak Instruksi Lapangan Tukang
      const boxY = wy + wallH + 22;
      ctx.fillStyle = '#081826';
      ctx.fillRect(52, boxY, canvas.width - 104, 134);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(52, boxY, canvas.width - 104, 134);

      ctx.fillStyle = '#fde047';
      ctx.font = 'bold 15px monospace';
      ctx.fillText('INSTRUKSI PEMASANGAN LAPANGAN:', 72, boxY + 26);

      ctx.fillStyle = '#e0f2fe';
      ctx.font = '14px monospace';
      const baris1 = activeMix
        ? `1. Pasang panel tengah (${centerProduct.kode}) terlebih dahulu tepat di as tengah dinding.`
        : `1. Total ${totalLajur} lajur ke samping (${
            lebarSisaLajurTerakhirCm < lebarPanelCm
              ? `${totalLajur - 1} utuh @${lebarPanelCm}cm + 1 potong @${lebarSisaLajurTerakhirCm}cm`
              : `semua utuh @${lebarPanelCm}cm`
          }).`;
      const baris2 = isTinggiLebih
        ? `2. Tinggi > ${tinggiPanelCm}cm: Pasang bagian bawah utuh ${tinggiPanelCm}cm, potong sambungan atas ${sisaTinggiCm}cm (${potonganPerLembar} potong/lembar).`
        : `2. Tinggi dinding <= ${tinggiPanelCm}cm: Potong tinggi panel menjadi ${Math.round(
            tinggiValid * 100
          )}cm (tanpa sambungan melintang).`;
      const baris3 = `3. Aksesoris: ${
        useListH ? `Pasang List H ${listHColor} di garis sambungan` : 'Tanpa List H'
      } · ${useListLWpc ? 'Tutup tepi luar dengan List L WPC' : 'Tepi standar'}.`;

      ctx.fillText(baris1, 72, boxY + 54);
      ctx.fillText(baris2, 72, boxY + 80);
      ctx.fillText(baris3, 72, boxY + 106);

      const link = document.createElement('a');
      link.download = `BLUEPRINT-PANELIN-${activeProduct.kode}-${lebarValid}x${tinggiValid}m.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } finally {
      setIsSaving(false);
      onSavingChange(false);
    }
  };

  useImperativeHandle(ref, () => ({
    downloadBlueprint: handleDownloadBlueprint,
  }));

  return (
    <div className="w-full max-w-xl px-1 sm:px-4 flex flex-col gap-3">
      <div className="rounded-xl bg-[#0f2942] border-2 border-sky-400/70 p-3 sm:p-4 text-sky-100 shadow-md">
        {/* Header Blueprint Teknis */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-sky-400/30 font-mono">
          <div>
            <span className="text-[10px] uppercase tracking-widest text-sky-300 block">
              Gambar Kerja Lapangan
            </span>
            <h3 className="text-xs sm:text-sm font-bold text-white">
              {activeMix && centerProduct
                ? `${activeProduct.kode} + ${centerProduct.kode} (${
                    isFrameMode ? 'Bingkai 4 Sisi' : 'Sayap'
                  })`
                : `${activeProduct.nama} (${lebarPanelCm}×${tinggiPanelCm}cm)`}
            </h3>
          </div>
          <div className="text-right">
            <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-sky-950 text-amber-300 border border-sky-400/40">
              {Math.round(lebarValid * 100)} × {Math.round(tinggiValid * 100)} cm
            </span>
          </div>
        </div>

        {/* Kanvas Skema Potongan Skala */}
        <div
          className={`w-full ${
            isCompact ? 'max-h-[155px]' : 'max-h-[320px]'
          } mx-auto relative bg-[#163a5f] border-2 border-sky-300 overflow-hidden`}
          style={{
            aspectRatio: `${aspectRatio}`,
            backgroundImage:
              'linear-gradient(to right, rgba(56,189,248,0.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(56,189,248,0.12) 1px, transparent 1px)',
            backgroundSize: '18px 18px',
          }}
        >
          {activeMix && centerProduct ? (
            <div className="w-full h-full relative flex items-center justify-center font-mono">
              {sideWidthPct > 8 && (
                <>
                  <div
                    style={{ width: `${sideWidthPct}%` }}
                    className="absolute inset-y-0 left-0 flex flex-col items-center justify-center border-r border-dashed border-sky-300/60 text-center px-1"
                  >
                    <span className="text-[9px] text-sky-300">KIRI</span>
                    <span className="text-[10px] sm:text-xs font-bold text-white">
                      {Math.round(sideWidth * 100)}cm
                    </span>
                  </div>
                  <div
                    style={{ width: `${sideWidthPct}%` }}
                    className="absolute inset-y-0 right-0 flex flex-col items-center justify-center border-l border-dashed border-sky-300/60 text-center px-1"
                  >
                    <span className="text-[9px] text-sky-300">KANAN</span>
                    <span className="text-[10px] sm:text-xs font-bold text-white">
                      {Math.round(sideWidth * 100)}cm
                    </span>
                  </div>
                </>
              )}

              <div
                style={{
                  width: `${centerWidthPct}%`,
                  height: `${centerHeightPct}%`,
                }}
                className="bg-amber-400/15 border-2 border-amber-300 flex flex-col items-center justify-center text-center p-1"
              >
                <span className="text-[10px] sm:text-xs font-bold text-amber-300">
                  {centerProduct.kode}
                </span>
                <span className="text-[9px] sm:text-[11px] text-white">
                  {Math.round(effectiveCenterWidth * 100)}×
                  {Math.round(effectiveCenterHeight * 100)}cm
                </span>
              </div>
            </div>
          ) : (
            blueprintColumns.map((col) => (
              <div
                key={col.index}
                style={{
                  left: `${col.leftPct}%`,
                  width: `${col.widthPct}%`,
                }}
                className={`absolute inset-y-0 border-r flex flex-col items-center justify-center font-mono text-center ${
                  col.isCutWidth
                    ? 'border-rose-400 bg-rose-500/15 text-rose-200'
                    : 'border-sky-300/60 text-sky-100'
                }`}
              >
                <span className="text-[10px] font-bold">#{col.index}</span>
                {!isCompact && (
                  <span className="text-[9px] opacity-90">{col.widthCm}cm</span>
                )}
              </div>
            ))
          )}

          {/* Garis Potong Sambungan Vertikal (> 2.9m) */}
          {isTinggiLebih && (
            <div
              style={{ bottom: `${horizontalSeamPosBottom}%` }}
              className="absolute left-0 right-0 border-b-2 border-dashed border-rose-400 flex items-center justify-between px-2 pointer-events-none z-10"
            >
              <span className="-mt-4 bg-rose-950/95 text-rose-200 border border-rose-400/60 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded">
                POTONG ATAS: +{sisaTinggiCm} cm ({potonganPerLembar} ptg/lbr)
              </span>
            </div>
          )}

          {/* Bukaan Pintu / Jendela Teknis */}
          {lebarValid > 0 &&
            tinggiValid > 0 &&
            openings.map((item) => {
              const opW = Math.max(Number(item.lebar) || 0, 0);
              const opH = Math.max(Number(item.tinggi) || 0, 0);
              const opLeft = Math.max(Number(item.jarakKiri) || 0, 0);
              const opBottom = Math.max(Number(item.jarakBawah) || 0, 0);
              if (opW <= 0 || opH <= 0) return null;

              return (
                <div
                  key={item.id}
                  style={{
                    width: `${Math.min((opW / lebarValid) * 100, 100)}%`,
                    height: `${Math.min((opH / tinggiValid) * 100, 100)}%`,
                    left: `${Math.min((opLeft / lebarValid) * 100, 100)}%`,
                    bottom: `${Math.min((opBottom / tinggiValid) * 100, 100)}%`,
                  }}
                  className="absolute z-15 bg-[#081826]/90 border-2 border-amber-400 flex flex-col items-center justify-center font-mono text-center p-1"
                >
                  <span className="text-[9px] font-bold text-amber-300 leading-tight">
                    {item.nama}
                  </span>
                  <span className="text-[8px] text-sky-200 leading-tight">
                    {Math.round(opW * 100)}×{Math.round(opH * 100)}cm (Kiri{' '}
                    {Math.round(opLeft * 100)}cm)
                  </span>
                </div>
              );
            })}
        </div>

        {/* Ringkasan Panduan Potong Tukang */}
        {!isCompact && (
          <div className="mt-3 pt-2.5 border-t border-sky-400/30 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
            <div className="p-2 rounded-lg bg-[#081826]/80 border border-sky-400/25">
              <span className="text-sky-300 block text-[10px]">
                POLA POTONG LEBAR:
              </span>
              {activeMix ? (
                <strong className="text-white">
                  Tengah {Math.round(effectiveCenterWidth * 100)}cm · Sisi @
                  {Math.round(sideWidth * 100)}cm
                </strong>
              ) : (
                <strong className="text-white">
                  {lebarSisaLajurTerakhirCm < lebarPanelCm
                    ? `${totalLajur - 1} lbr utuh (${lebarPanelCm}cm) + 1 potong (${lebarSisaLajurTerakhirCm}cm)`
                    : `${totalLajur} lajur utuh (@${lebarPanelCm}cm)`}
                </strong>
              )}
            </div>

            <div className="p-2 rounded-lg bg-[#081826]/80 border border-sky-400/25">
              <span className="text-sky-300 block text-[10px]">
                POLA POTONG TINGGI:
              </span>
              {isTinggiLebih ? (
                <strong className="text-rose-300">
                  Bawah {tinggiPanelCm}cm + Atas {sisaTinggiCm}cm ({potonganPerLembar}{' '}
                  ptg/lbr)
                </strong>
              ) : (
                <strong className="text-emerald-300">
                  Potong 1× tinggi {Math.round(tinggiValid * 100)}cm (tanpa sambungan)
                </strong>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default BlueprintView;