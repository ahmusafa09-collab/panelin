import { useState, useMemo, useEffect } from 'react';
import catalogData from './data/products';
import Visualizer from './components/Visualizer';
import Calculator from './components/Calculator';
import ProjectSummaryView from './components/ProjectSummaryView';

const STORAGE_KEY_WALL_TABS = 'panelin_wall_tabs_v2';

const createFreshWall = (defaultCenter) => ({
  id: `wall_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
  name: '', // Kosong agar user bebas memberi nama (placeholder: "Contoh: Ruang tamu sisi kanan")
  selectedProduct: catalogData[0],
  lebar: 3,
  tinggi: 3,
  openings: [],
  isMixMode: false,
  mixPattern: 'wings',
  activeMixSlot: 'center',
  centerProduct: defaultCenter,
  centerWidth: 1.2,
  centerHeight: 2.0,
  useListH: false,
  listHColor: 'Gold',
  listHQty: 1,
  useListLWpc: false,
  listLWpcQty: 2,
});

// Fungsi pembantu hitung ringkasan biaya per dinding
const computeWallSummary = (w) => {
  const lebarVal = Math.max(Number(w.lebar) || 0, 0);
  const tinggiVal = Math.max(Number(w.tinggi) || 0, 0);
  const luasKotor = lebarVal * tinggiVal;
  const luasBukaan = (w.openings || []).reduce((acc, op) => {
    const ow = Math.max(Number(op.lebar) || 0, 0);
    const oh = Math.max(Number(op.tinggi) || 0, 0);
    return acc + ow * oh;
  }, 0);
  const luasBersih = Math.max(luasKotor - luasBukaan, 0);

  const hitungLembar = (produk, luasTarget) => {
    if (!produk || luasTarget <= 0) return 0;
    const luasPerLembar =
      (produk.dimensi.lebar_cm / 100) * (produk.dimensi.tinggi_cm / 100);
    return luasPerLembar > 0 ? Math.ceil(luasTarget / luasPerLembar) : 0;
  };

  const items = [];
  if (w.isMixMode && w.centerProduct) {
    const cw = Math.min(Math.max(Number(w.centerWidth) || 0, 0.1), lebarVal);
    const ch =
      w.mixPattern === 'frame'
        ? Math.min(Math.max(Number(w.centerHeight) || 0, 0.1), tinggiVal)
        : tinggiVal;
    const luasTengah = Math.min(cw * ch, luasBersih);
    const luasLuar = Math.max(luasBersih - luasTengah, 0);

    const qtyLuar = hitungLembar(w.selectedProduct, luasLuar);
    const qtyTengah = hitungLembar(w.centerProduct, luasTengah);

    if (qtyLuar > 0) {
      items.push({
        kode: w.selectedProduct.kode,
        nama: w.selectedProduct.nama,
        kategori: w.selectedProduct.kategori,
        motif: w.selectedProduct.motif,
        tipe: w.selectedProduct.tipe,
        gambar2D: w.selectedProduct.gambar2D,
        satuan: w.selectedProduct.satuan || 'lbr',
        hargaSatuan: w.selectedProduct.harga,
        qty: qtyLuar,
        subtotal: qtyLuar * w.selectedProduct.harga,
      });
    }
    if (qtyTengah > 0) {
      items.push({
        kode: w.centerProduct.kode,
        nama: w.centerProduct.nama,
        kategori: w.centerProduct.kategori,
        motif: w.centerProduct.motif,
        tipe: w.centerProduct.tipe,
        gambar2D: w.centerProduct.gambar2D,
        satuan: w.centerProduct.satuan || 'lbr',
        hargaSatuan: w.centerProduct.harga,
        qty: qtyTengah,
        subtotal: qtyTengah * w.centerProduct.harga,
      });
    }
  } else {
    const qtyUtama = hitungLembar(w.selectedProduct, luasBersih);
    items.push({
      kode: w.selectedProduct.kode,
      nama: w.selectedProduct.nama,
      kategori: w.selectedProduct.kategori,
      motif: w.selectedProduct.motif,
      tipe: w.selectedProduct.tipe,
      gambar2D: w.selectedProduct.gambar2D,
      satuan: w.selectedProduct.satuan || 'lbr',
      hargaSatuan: w.selectedProduct.harga,
      qty: qtyUtama,
      subtotal: qtyUtama * w.selectedProduct.harga,
    });
  }

  const subtotalMaterial = items.reduce((sum, i) => sum + i.subtotal, 0);
  const qtyListH = w.useListH ? Math.max(Number(w.listHQty) || 0, 0) : 0;
  const qtyListL = w.useListLWpc ? Math.max(Number(w.listLWpcQty) || 0, 0) : 0;

  const butuhLemKuning = items.some((i) =>
    ['UVMarble', 'UVMarbleGold', 'Vinyl'].includes(i.tipe)
  );
  const qtyLem = butuhLemKuning && luasBersih > 0 ? Math.ceil(luasBersih / 4) : 0;

  const subtotalAksesoris =
    qtyListH * 65000 + qtyListL * 45000 + qtyLem * 45000;
  const totalBiaya = subtotalMaterial + subtotalAksesoris;

  return {
    luasBersih,
    items,
    qtyListH,
    qtyListL,
    qtyLem,
    subtotalMaterial,
    subtotalAksesoris,
    totalBiaya,
  };
};

export default function App() {
  const defaultCenter = useMemo(
    () =>
      catalogData.find(
        (p) => p.tipe === 'UVMarble' || p.tipe === 'UVMarbleGold'
      ) || catalogData[1] || catalogData[0],
    []
  );

  // Daftar Tab Dinding (Setiap tab = 1 workspace lengkap & terpisah)
  const [walls, setWalls] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_WALL_TABS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Abaikan error storage
    }
    return [createFreshWall(defaultCenter)];
  });

  // Tab aktif: ID dinding atau 'summary' (Rekap Total)
  const [activeTabId, setActiveTabId] = useState(() => walls[0]?.id || 'summary');

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_WALL_TABS, JSON.stringify(walls));
    } catch {
      // Abaikan jika mode private
    }
  }, [walls]);

  const activeWallIndex = walls.findIndex((w) => w.id === activeTabId);
  const activeWall = activeWallIndex >= 0 ? walls[activeWallIndex] : walls[0];
  const isSummaryTab = activeTabId === 'summary';

  // Helper memperbarui state milik dinding yang sedang aktif saja
  const updateActiveWall = (updater) => {
    if (!activeWall) return;
    setWalls((prev) =>
      prev.map((w) => {
        if (w.id !== activeWall.id) return w;
        const patch = typeof updater === 'function' ? updater(w) : updater;
        return { ...w, ...patch };
      })
    );
  };

  // Tambah Halaman Dinding Baru yang Bersih
  const handleAddNewWall = () => {
    const fresh = createFreshWall(defaultCenter);
    setWalls((prev) => [...prev, fresh]);
    setActiveTabId(fresh.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRemoveWall = (idToRemove) => {
    setWalls((prev) => {
      if (prev.length <= 1) return prev;
      const filtered = prev.filter((w) => w.id !== idToRemove);
      if (activeTabId === idToRemove) {
        setActiveTabId(filtered[filtered.length - 1].id);
      }
      return filtered;
    });
  };

  const handleResetAllWalls = () => {
    const fresh = createFreshWall(defaultCenter);
    setWalls([fresh]);
    setActiveTabId(fresh.id);
  };

  // Hitung ringkasan tiap dinding untuk ditampilkan di tab Rekap Total
  const wallsWithSummary = useMemo(
    () =>
      walls.map((w) => ({
        ...w,
        summary: computeWallSummary(w),
      })),
    [walls]
  );

  // State Sticky & Compact Preview khusus Mobile
  const [isMobileSticky, setIsMobileSticky] = useState(true);
  const [isMobileScrolled, setIsMobileScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsMobileScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Filter & pencarian katalog
  const [activeCategory, setActiveCategory] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = useMemo(() => {
    const unique = Array.from(catalogData.map((item) => item.kategori));
    return ['Semua', ...new Set(unique)];
  }, []);

  const filteredProducts = useMemo(() => {
    return catalogData.filter((item) => {
      const matchCategory =
        activeCategory === 'Semua' || item.kategori === activeCategory;
      const q = searchQuery.trim().toLowerCase();
      const matchQuery =
        !q ||
        item.kode.toLowerCase().includes(q) ||
        item.nama.toLowerCase().includes(q) ||
        item.motif.toLowerCase().includes(q);
      return matchCategory && matchQuery;
    });
  }, [activeCategory, searchQuery]);

  const handleSelectCatalogProduct = (product) => {
    if (!activeWall.isMixMode) {
      updateActiveWall({ selectedProduct: product });
      return;
    }

    if (activeWall.activeMixSlot === 'outer') {
      updateActiveWall({ selectedProduct: product });
    } else {
      const lebarLembarMeter = product.dimensi.lebar_cm / 100;
      updateActiveWall({
        centerProduct: product,
        centerWidth:
          lebarLembarMeter <= Number(activeWall.lebar)
            ? lebarLembarMeter
            : activeWall.centerWidth,
      });
    }
  };

  const handleSwapMixProducts = () => {
    updateActiveWall({
      selectedProduct: activeWall.centerProduct,
      centerProduct: activeWall.selectedProduct,
    });
  };

  const handleAddOpening = (jenis = 'Pintu') => {
    const isJendela = jenis === 'Jendela';
    const newOpening = {
      id: Date.now(),
      nama: isJendela ? 'Jendela' : 'Pintu',
      lebar: isJendela ? 1.2 : 0.9,
      tinggi: isJendela ? 1.4 : 2.1,
      jarakKiri: 0.3,
      jarakBawah: isJendela ? 0.9 : 0,
    };
    updateActiveWall((prev) => ({
      openings: [...prev.openings, newOpening],
    }));
  };

  const handleUpdateOpening = (id, field, value) => {
    updateActiveWall((prev) => ({
      openings: prev.openings.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      ),
    }));
  };

  const handleRemoveOpening = (id) => {
    updateActiveWall((prev) => ({
      openings: prev.openings.filter((item) => item.id !== id),
    }));
  };

  const formatRupiah = (angka) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(angka);

  const isCompactMobile = isMobileSticky && isMobileScrolled;

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden bg-stone-100 text-stone-800 flex flex-col font-sans">
      {/* ── HEADER SHOWROOM CHARCOAL & GOLD ── */}
      <header className="bg-stone-950 text-stone-100 border-b border-stone-800 sticky top-0 z-30 shrink-0">
        <div className="max-w-7xl mx-auto px-3.5 sm:px-6 py-2.5 flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <img
              src="/Iconpanel.png"
              alt="PANELIN Logo"
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg object-cover ring-1 ring-amber-400/50 shadow-sm"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-lg font-bold tracking-wide text-white">
                  PANELIN
                </h1>
                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-400/30 font-semibold">
                  Showroom Studio
                </span>
              </div>
              <p className="text-[11px] text-stone-400 hidden sm:block">
                Smart Wallpanel Visualizer & Kalkulator RAB Interior
              </p>
            </div>
          </div>

          {!isSummaryTab && activeWall && (
            <div className="flex items-center gap-2 bg-stone-900/90 border border-stone-800 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs">
              <span className="text-stone-400 hidden xs:inline">Ukuran Aktif:</span>
              <span className="font-semibold text-amber-300">
                {activeWall.lebar || 0}m × {activeWall.tinggi || 0}m
              </span>
            </div>
          )}
        </div>

        {/* ── BAR TAB HALAMAN DINDING & REKAP TOTAL ── */}
        <div className="bg-stone-900 border-t border-stone-800/90">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 py-1.5 flex items-center justify-between gap-2 overflow-x-auto scrollbar-none">
            <div className="flex items-center gap-1.5">
              {walls.map((w, idx) => {
                const isCurrent = !isSummaryTab && w.id === activeWall?.id;
                const labelTab = w.name?.trim() || `Dinding ${idx + 1}`;
                return (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => setActiveTabId(w.id)}
                    className={`min-h-[34px] px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                      isCurrent
                        ? 'bg-amber-400 text-stone-950 shadow-2xs'
                        : 'bg-stone-800 text-stone-300 hover:bg-stone-700 hover:text-white'
                    }`}
                  >
                    <span>{labelTab}</span>
                    <span
                      className={`text-[10px] font-mono ${
                        isCurrent ? 'text-stone-800' : 'text-stone-400'
                      }`}
                    >
                      ({w.lebar || 0}×{w.tinggi || 0}m)
                    </span>
                  </button>
                );
              })}

              {/* Tombol Tambah Halaman Dinding Baru */}
              <button
                type="button"
                onClick={handleAddNewWall}
                className="min-h-[34px] px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition cursor-pointer border border-dashed border-amber-400/60 text-amber-300 hover:bg-amber-500/15 flex items-center gap-1"
              >
                <span>+ Tambah Dinding</span>
              </button>
            </div>

            {/* Tombol Tab Rekap Total Gabungan */}
            <button
              type="button"
              onClick={() => setActiveTabId('summary')}
              className={`min-h-[34px] px-3.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
                isSummaryTab
                  ? 'bg-emerald-500 text-stone-950 shadow-2xs'
                  : 'bg-stone-800 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-950/60'
              }`}
            >
              <span>Rekap Total</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  isSummaryTab
                    ? 'bg-stone-950 text-emerald-300'
                    : 'bg-emerald-500/20 text-emerald-300'
                }`}
              >
                {walls.length}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════════════════
          TAMPILAN 1: HALAMAN REKAP TOTAL & PENAWARAN WHATSAPP GABUNGAN
      ══════════════════════════════════════════════════════════════════════ */}
      {isSummaryTab ? (
        <ProjectSummaryView
          walls={wallsWithSummary}
          onSelectWallTab={(id) => setActiveTabId(id)}
          onAddNewWall={handleAddNewWall}
          onRemoveWall={handleRemoveWall}
          onResetAllWalls={handleResetAllWalls}
        />
      ) : (
        /* ══════════════════════════════════════════════════════════════════════
            TAMPILAN 2: HALAMAN KERJA DINDING AKTIF (SAMA PERSIS DENGAN LAYAR UTAMA)
        ══════════════════════════════════════════════════════════════════════ */
        <main className="max-w-7xl w-full mx-auto px-3 sm:px-6 py-3 sm:py-5 flex-1 lg:overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 lg:gap-6 h-full">
            {/* KOLOM KIRI: NAMA DINDING, SIMULASI RUANGAN & KATALOG PRODUK */}
            <div className="lg:col-span-7 flex flex-col gap-4 sm:gap-5 lg:h-full lg:overflow-y-auto lg:pr-2 pb-2 lg:pb-4">
              {/* Input Nama Sisi Dinding (Kosong dengan Contoh Penamaan) */}
              <div className="bg-white rounded-2xl border border-stone-200/90 px-3.5 py-2.5 shadow-2xs flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-xs font-bold text-stone-500 shrink-0">
                    Nama Dinding:
                  </span>
                  <input
                    type="text"
                    value={activeWall.name}
                    onChange={(e) => updateActiveWall({ name: e.target.value })}
                    placeholder="Contoh: Ruang tamu sisi kanan"
                    className="w-full min-h-[36px] px-3 rounded-xl bg-stone-50 border border-stone-200 text-xs font-semibold text-stone-900 placeholder:font-normal placeholder:text-stone-400 focus:bg-white focus:border-amber-500 focus:outline-none"
                  />
                </div>

                {walls.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveWall(activeWall.id)}
                    title="Hapus halaman dinding ini"
                    className="min-h-[36px] px-2.5 rounded-xl text-[11px] font-semibold text-rose-600 hover:bg-rose-50 transition cursor-pointer shrink-0"
                  >
                    Hapus
                  </button>
                )}
              </div>

              {/* Preview Simulasi 2D / 3D / Blueprint */}
              <section
                className={`${
                  isMobileSticky ? 'sticky top-[92px] sm:top-[100px]' : 'relative'
                } lg:static z-20 bg-white rounded-2xl border border-stone-200/90 transition-all duration-300 ${
                  isCompactMobile
                    ? 'p-2 sm:p-3 shadow-lg ring-1 ring-stone-900/5'
                    : 'p-3 sm:p-5 shadow-md lg:shadow-xs'
                }`}
              >
                <Visualizer
                  activeProduct={activeWall.selectedProduct}
                  lebar={activeWall.lebar}
                  tinggi={activeWall.tinggi}
                  openings={activeWall.openings}
                  isMixMode={activeWall.isMixMode}
                  mixPattern={activeWall.mixPattern}
                  centerProduct={activeWall.centerProduct}
                  centerWidth={activeWall.centerWidth}
                  centerHeight={activeWall.centerHeight}
                  useListH={activeWall.useListH}
                  listHColor={activeWall.listHColor}
                  useListLWpc={activeWall.useListLWpc}
                  isCompact={isCompactMobile}
                  isMobileSticky={isMobileSticky}
                  onToggleMobileSticky={() => setIsMobileSticky((prev) => !prev)}
                />
              </section>

              {/* ── KATALOG PRODUK INTERAKTIF ── */}
              <section className="bg-white rounded-2xl border border-stone-200/90 shadow-xs p-3.5 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div>
                    <h2 className="text-base font-bold text-stone-900">
                      Katalog Material
                    </h2>
                    <p className="text-xs text-stone-500 mt-0.5">
                      {activeWall.isMixMode ? (
                        <>
                          Klik motif di bawah untuk mengisi{' '}
                          <span className="font-semibold text-amber-700 underline decoration-amber-400">
                            {activeWall.activeMixSlot === 'outer'
                              ? 'Slot 1: Bingkai / Sisi Luar'
                              : 'Slot 2: Panel Fokus Tengah'}
                          </span>
                        </>
                      ) : (
                        'Pilih motif panel untuk simulasi dinding & hitung kebutuhan'
                      )}
                    </p>
                  </div>

                  <div className="relative w-full sm:w-56">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Cari motif atau kode..."
                      className="w-full min-h-[40px] text-xs bg-stone-50 border border-stone-300 rounded-xl pl-3 pr-8 py-2 focus:outline-none focus:border-amber-500 focus:bg-white transition"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 text-xs cursor-pointer"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {/* Filter Tab Kategori */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-4 scrollbar-none">
                  {categories.map((cat) => {
                    const active = activeCategory === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setActiveCategory(cat)}
                        className={`min-h-[36px] px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                          active
                            ? 'bg-stone-900 text-amber-300 shadow-2xs'
                            : 'bg-stone-100 text-stone-600 hover:bg-stone-200/80'
                        }`}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>

                {/* Grid Kartu Produk */}
                {filteredProducts.length === 0 ? (
                  <div className="text-center py-10 text-xs text-stone-400">
                    Tidak ada produk yang cocok dengan pencarian &ldquo;{searchQuery}&rdquo;.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-3">
                    {filteredProducts.map((product) => {
                      const isOuterSelected =
                        activeWall.selectedProduct.kode === product.kode;
                      const isCenterSelected =
                        activeWall.isMixMode &&
                        activeWall.centerProduct?.kode === product.kode;
                      const isHighlighted = isOuterSelected || isCenterSelected;

                      return (
                        <button
                          key={product.kode}
                          type="button"
                          onClick={() => handleSelectCatalogProduct(product)}
                          className={`group text-left rounded-xl overflow-hidden border transition-all cursor-pointer flex flex-col bg-white ${
                            isHighlighted
                              ? 'border-amber-500 ring-2 ring-amber-400/50 shadow-md'
                              : 'border-stone-200 hover:border-stone-400 hover:shadow-sm'
                          }`}
                        >
                          <div className="aspect-[4/3] w-full bg-stone-200 relative overflow-hidden">
                            <img
                              src={product.gambar2D}
                              alt={product.nama}
                              loading="lazy"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />

                            <div className="absolute top-1.5 left-1.5 flex flex-wrap gap-1">
                              {!activeWall.isMixMode && isOuterSelected && (
                                <span className="bg-stone-950/90 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs">
                                  Dipilih
                                </span>
                              )}
                              {activeWall.isMixMode && isOuterSelected && (
                                <span className="bg-stone-950/90 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md shadow-xs">
                                  Bingkai
                                </span>
                              )}
                              {activeWall.isMixMode && isCenterSelected && (
                                <span className="bg-amber-500 text-stone-950 text-[10px] font-bold px-1.5 py-0.5 rounded-md shadow-xs">
                                  Tengah
                                </span>
                              )}
                            </div>

                            <span className="absolute bottom-1.5 right-1.5 bg-black/65 text-white text-[10px] px-1.5 py-0.5 rounded backdrop-blur-2xs">
                              {product.dimensi.lebar_cm}×{product.dimensi.tinggi_cm}
                            </span>
                          </div>

                          <div className="p-2.5 flex-1 flex flex-col justify-between">
                            <div>
                              <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-700">
                                {product.kategori}
                              </p>
                              <h3 className="text-xs font-bold text-stone-900 line-clamp-1 mt-0.5">
                                {product.motif}
                              </h3>
                              <p className="text-[10px] text-stone-400 line-clamp-1">
                                Kode: {product.kode}
                              </p>
                            </div>

                            <div className="mt-2 pt-1.5 border-t border-stone-100 flex items-baseline justify-between">
                              <span className="text-xs font-bold text-stone-900">
                                {formatRupiah(product.harga)}
                              </span>
                              <span className="text-[10px] text-stone-400">
                                /{product.satuan}
                              </span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>

            {/* KOLOM KANAN: KALKULATOR, BUKAAN (PINTU/JENDELA) & AKSESORIS LIST */}
            <div className="lg:col-span-5 lg:h-full lg:overflow-y-auto lg:pr-1 pb-8">
              <Calculator
                activeProduct={activeWall.selectedProduct}
                lebar={activeWall.lebar}
                tinggi={activeWall.tinggi}
                onLebarChange={(val) => updateActiveWall({ lebar: val })}
                onTinggiChange={(val) => updateActiveWall({ tinggi: val })}
                openings={activeWall.openings}
                onAddOpening={handleAddOpening}
                onUpdateOpening={handleUpdateOpening}
                onRemoveOpening={handleRemoveOpening}
                isMixMode={activeWall.isMixMode}
                onToggleMixMode={(val) => updateActiveWall({ isMixMode: val })}
                mixPattern={activeWall.mixPattern}
                onMixPatternChange={(val) => updateActiveWall({ mixPattern: val })}
                activeMixSlot={activeWall.activeMixSlot}
                onActiveMixSlotChange={(val) =>
                  updateActiveWall({ activeMixSlot: val })
                }
                centerProduct={activeWall.centerProduct}
                onSwapMixProducts={handleSwapMixProducts}
                centerWidth={activeWall.centerWidth}
                onCenterWidthChange={(val) =>
                  updateActiveWall({ centerWidth: val })
                }
                centerHeight={activeWall.centerHeight}
                onCenterHeightChange={(val) =>
                  updateActiveWall({ centerHeight: val })
                }
                useListH={activeWall.useListH}
                onToggleListH={(val) => updateActiveWall({ useListH: val })}
                listHColor={activeWall.listHColor}
                onListHColorChange={(val) => updateActiveWall({ listHColor: val })}
                listHQty={activeWall.listHQty}
                onListHQtyChange={(val) => updateActiveWall({ listHQty: val })}
                useListLWpc={activeWall.useListLWpc}
                onToggleListLWpc={(val) => updateActiveWall({ useListLWpc: val })}
                listLWpcQty={activeWall.listLWpcQty}
                onListLWpcQtyChange={(val) =>
                  updateActiveWall({ listLWpcQty: val })
                }
              />
            </div>
          </div>
        </main>
      )}
    </div>
  );
}