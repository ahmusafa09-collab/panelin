import { useState, useMemo } from 'react';
import catalogData from './data/products';
import Visualizer from './components/Visualizer';
import Calculator from './components/Calculator';

export default function App() {
  // Produk utama (dipakai juga sebagai Panel Bingkai/Luar saat Mode Mix)
  const [selectedProduct, setSelectedProduct] = useState(catalogData[0]);

  // Dimensi dinding (meter)
  const [lebar, setLebar] = useState(3);
  const [tinggi, setTinggi] = useState(3);

  // State Mode Mix Produk
  const [isMixMode, setIsMixMode] = useState(false);
  const [mixPattern, setMixPattern] = useState('wings'); // 'wings' | 'frame'
  const [activeMixSlot, setActiveMixSlot] = useState('center'); // 'outer' | 'center'

  // Default panel tengah saat Mix aktif (ambil UV Marble pertama jika ada)
  const defaultCenter = useMemo(
    () =>
      catalogData.find(
        (p) => p.tipe === 'UVMarble' || p.tipe === 'UVMarbleGold'
      ) || catalogData[1] || catalogData[0],
    []
  );
  const [centerProduct, setCenterProduct] = useState(defaultCenter);
  const [centerWidth, setCenterWidth] = useState(1.2);
  const [centerHeight, setCenterHeight] = useState(2.0);

  // Filter & pencarian katalog
  const [activeCategory, setActiveCategory] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = useMemo(() => {
    const unique = Array.from(new Set(catalogData.map((item) => item.kategori)));
    return ['Semua', ...unique];
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

  // Handler klik kartu katalog (otomatis mengisi slot yang aktif)
  const handleSelectCatalogProduct = (product) => {
    if (!isMixMode) {
      setSelectedProduct(product);
      return;
    }

    if (activeMixSlot === 'outer') {
      setSelectedProduct(product);
    } else {
      setCenterProduct(product);
      // Sesuaikan lebar default panel tengah mengikuti lebar lembar produk yang dipilih
      const lebarLembarMeter = product.dimensi.lebar_cm / 100;
      if (lebarLembarMeter <= Number(lebar)) {
        setCenterWidth(lebarLembarMeter);
      }
    }
  };

  // Tukar posisi material Bingkai <-> Tengah
  const handleSwapMixProducts = () => {
    const temp = selectedProduct;
    setSelectedProduct(centerProduct);
    setCenterProduct(temp);
  };

  const formatRupiah = (angka) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(angka);

  return (
    <div className="min-h-screen bg-stone-100 text-stone-800 flex flex-col font-sans">
      {/* ── HEADER SHOWROOM CHARCOAL & GOLD ── */}
      <header className="bg-stone-950 text-stone-100 border-b border-amber-500/20 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img
              src="/Iconpanel.png"
              alt="PANELIN Logo"
              className="w-9 h-9 rounded-lg object-cover ring-1 ring-amber-400/50 shadow-sm"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold tracking-wide text-white">
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

          {/* Info Ringkas Ukuran Dinding Aktif */}
          <div className="flex items-center gap-2 bg-stone-900/90 border border-stone-800 px-3 py-1.5 rounded-full text-xs">
            <span className="text-stone-400">Dinding:</span>
            <span className="font-semibold text-amber-300">
              {lebar || 0}m × {tinggi || 0}m
            </span>
          </div>
        </div>
      </header>

      {/* ── KONTEN UTAMA (VISUALIZER KIRI + KALKULATOR KANAN) ── */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-5 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* KOLOM KIRI: SIMULASI RUANGAN & KATALOG PRODUK (7 Kolom) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {/* Kartu Preview Ruangan */}
            <section className="bg-white rounded-2xl border border-stone-200/90 shadow-xs p-3 sm:p-5">
              <Visualizer
                activeProduct={selectedProduct}
                lebar={lebar}
                tinggi={tinggi}
                isMixMode={isMixMode}
                mixPattern={mixPattern}
                centerProduct={centerProduct}
                centerWidth={centerWidth}
                centerHeight={centerHeight}
              />
            </section>

            {/* ── KATALOG PRODUK INTERAKTIF ── */}
            <section className="bg-white rounded-2xl border border-stone-200/90 shadow-xs p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-base font-bold text-stone-900">
                    Katalog Material
                  </h2>
                  <p className="text-xs text-stone-500 mt-0.5">
                    {isMixMode ? (
                      <>
                        Klik motif di bawah untuk mengisi{' '}
                        <span className="font-semibold text-amber-700 underline decoration-amber-400">
                          {activeMixSlot === 'outer'
                            ? 'Slot 1: Bingkai / Sisi Luar'
                            : 'Slot 2: Panel Fokus Tengah'}
                        </span>
                      </>
                    ) : (
                      'Pilih motif panel untuk simulasi dinding & hitung kebutuhan'
                    )}
                  </p>
                </div>

                {/* Kolom Pencarian */}
                <div className="relative w-full sm:w-56">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari kode (ZP06, RFP21)..."
                    className="w-full text-xs bg-stone-50 border border-stone-300 rounded-xl pl-3 pr-8 py-2 focus:outline-none focus:border-amber-500 focus:bg-white transition"
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
                      className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition cursor-pointer ${
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
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {filteredProducts.map((product) => {
                    const isOuterSelected = selectedProduct.kode === product.kode;
                    const isCenterSelected =
                      isMixMode && centerProduct?.kode === product.kode;
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
                        {/* Thumbnail Tekstur */}
                        <div className="aspect-[4/3] w-full bg-stone-200 relative overflow-hidden">
                          <img
                            src={product.gambar2D}
                            alt={product.nama}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />

                          {/* Badge Status Pilihan */}
                          <div className="absolute top-1.5 left-1.5 flex flex-wrap gap-1">
                            {!isMixMode && isOuterSelected && (
                              <span className="bg-stone-950/90 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs">
                                Dipilih
                              </span>
                            )}
                            {isMixMode && isOuterSelected && (
                              <span className="bg-stone-950/90 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md shadow-xs">
                                Bingkai
                              </span>
                            )}
                            {isMixMode && isCenterSelected && (
                              <span className="bg-amber-500 text-stone-950 text-[10px] font-bold px-1.5 py-0.5 rounded-md shadow-xs">
                                Tengah
                              </span>
                            )}
                          </div>

                          {/* Badge Dimensi */}
                          <span className="absolute bottom-1.5 right-1.5 bg-black/65 text-white text-[10px] px-1.5 py-0.5 rounded backdrop-blur-2xs">
                            {product.dimensi.lebar_cm}×{product.dimensi.tinggi_cm}
                          </span>
                        </div>

                        {/* Info Produk */}
                        <div className="p-2.5 flex-1 flex flex-col justify-between">
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-700">
                              {product.kategori}
                            </p>
                            <h3 className="text-xs font-bold text-stone-900 line-clamp-1 mt-0.5">
                              {product.kode}
                            </h3>
                            <p className="text-[11px] text-stone-500 line-clamp-1">
                              {product.motif}
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

          {/* KOLOM KANAN: KALKULATOR & KONTROL MIX (5 Kolom) */}
          <div className="lg:col-span-5 lg:sticky lg:top-20">
            <Calculator
              activeProduct={selectedProduct}
              lebar={lebar}
              tinggi={tinggi}
              onLebarChange={setLebar}
              onTinggiChange={setTinggi}
              isMixMode={isMixMode}
              onToggleMixMode={setIsMixMode}
              mixPattern={mixPattern}
              onMixPatternChange={setMixPattern}
              activeMixSlot={activeMixSlot}
              onActiveMixSlotChange={setActiveMixSlot}
              centerProduct={centerProduct}
              onSwapMixProducts={handleSwapMixProducts}
              centerWidth={centerWidth}
              onCenterWidthChange={setCenterWidth}
              centerHeight={centerHeight}
              onCenterHeightChange={setCenterHeight}
            />
          </div>
        </div>
      </main>
    </div>
  );
}