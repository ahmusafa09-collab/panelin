import { useState } from 'react';

const CATEGORY_STYLES = {
  'WPC': {
    badge: 'bg-amber-100 text-amber-800 border border-amber-300',
    dot: 'bg-amber-500',
    typeLabel: 'Kisi 16cm'
  },
  'Wallboard': {
    badge: 'bg-teal-100 text-teal-800 border border-teal-300',
    dot: 'bg-teal-500',
    typeLabel: 'Interlock 40cm'
  },
  'UV Marble': {
    badge: 'bg-indigo-100 text-indigo-800 border border-indigo-300',
    dot: 'bg-indigo-500',
    typeLabel: 'Slab Jumbo 120cm'
  }
};

export default function Catalog({ products, onSelect, activeId }) {
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = ['Semua', 'WPC', 'Wallboard', 'UV Marble'];

  // Hitung jumlah produk per kategori
  const categoryCounts = categories.reduce((acc, cat) => {
    if (cat === 'Semua') {
      acc[cat] = products.length;
    } else {
      acc[cat] = products.filter((p) => p.kategori === cat).length;
    }
    return acc;
  }, {});

  const filteredProducts = products.filter((product) => {
    const matchCategory = selectedCategory === 'Semua' || product.kategori === selectedCategory;
    const matchQuery =
      product.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.kode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.motif && product.motif.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCategory && matchQuery;
  });

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-base font-bold text-gray-800">Katalog Produk</h2>
          <p className="text-[11px] text-gray-500">Pilih panel untuk simulasi & kalkulasi</p>
        </div>
        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-semibold">
          {filteredProducts.length} Produk
        </span>
      </div>

      {/* Kolom Pencarian */}
      <div className="relative mb-3">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari kode (ZP06, KL8276), nama, motif..."
          className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
        />
        <svg
          className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35M16.65 11a5.65 5.65 0 11-11.3 0 5.65 5.65 0 0111.3 0z" />
        </svg>
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="text-[10px] text-gray-400 hover:text-gray-600 absolute right-2.5 top-1/2 -translate-y-1/2"
          >
            ✕
          </button>
        )}
      </div>

      {/* Tab Filter Kategori */}
      <div className="flex items-center gap-1.5 mb-3 overflow-x-auto pb-1 scrollbar-thin">
        {categories.map((category) => {
          const isActive = selectedCategory === category;
          const count = categoryCounts[category] || 0;
          return (
            <button
              key={category}
              type="button"
              onClick={() => setSelectedCategory(category)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150 flex items-center gap-1.5 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-600/30'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
              }`}
            >
              <span>{category}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isActive ? 'bg-blue-700 text-blue-100' : 'bg-gray-200 text-gray-600'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Grid Produk */}
      <div className="grid grid-cols-2 gap-2.5 max-h-[320px] overflow-y-auto pr-1">
        {filteredProducts.map((product) => {
          const isSelected = activeId === product.kode;
          const style = CATEGORY_STYLES[product.kategori] || {
            badge: 'bg-gray-100 text-gray-700 border-gray-300',
            dot: 'bg-gray-400',
            typeLabel: product.kategori
          };
          const hargaPerM2 = Math.round(product.harga / product.luas_m2);
          const satuan = product.satuan || (product.kategori === 'WPC' ? 'Batang' : 'Lembar');

          return (
            <button
              key={product.kode}
              type="button"
              onClick={() => onSelect(product)}
              className={`flex flex-col text-left p-2.5 rounded-xl border-2 transition-all duration-200 relative group ${
                isSelected
                  ? 'border-blue-600 bg-blue-50/70 shadow-md ring-2 ring-blue-500/20 scale-[1.01]'
                  : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
              }`}
            >
              {/* Badge Centang Aktif */}
              {isSelected && (
                <div className="absolute top-2 right-2 z-10 bg-blue-600 text-white rounded-full p-0.5 shadow">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}

              {/* Preview Gambar */}
              <div className="w-full h-24 bg-gray-100 rounded-lg mb-2 overflow-hidden relative">
                <img
                  src={product.gambar2D}
                  alt={product.nama}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                <span
                  className={`absolute bottom-1 left-1 text-[9px] font-bold px-1.5 py-0.5 rounded backdrop-blur-sm ${style.badge}`}
                >
                  {product.kategori} ({product.dimensi.lebar_cm}cm)
                </span>
              </div>

              {/* Info Produk */}
              <div className="flex items-center justify-between w-full mb-0.5">
                <span className="text-xs font-bold text-gray-800 truncate" title={product.nama}>
                  {product.kode}
                </span>
                <span className="text-[10px] text-gray-500 font-mono">
                  {product.dimensi.lebar_cm}×{product.dimensi.tinggi_cm}cm
                </span>
              </div>

              <div className="text-[10px] text-gray-500 truncate mb-1">
                {product.motif || product.nama}
              </div>

              {/* Harga & Komparasi per m2 */}
              <div className="mt-auto pt-1 border-t border-gray-100">
                <div className="text-xs font-bold text-blue-700">
                  Rp {product.harga.toLocaleString('id-ID')}
                  <span className="text-[10px] text-gray-500 font-normal"> /{satuan.toLowerCase()}</span>
                </div>
                <div className="text-[9px] text-gray-400 font-medium">
                  ≈ Rp {hargaPerM2.toLocaleString('id-ID')}/m²
                </div>
              </div>
            </button>
          );
        })}

        {filteredProducts.length === 0 && (
          <div className="col-span-2 py-8 text-center text-xs text-gray-400">
            Tidak ada produk yang cocok dengan pencarian.
          </div>
        )}
      </div>
    </div>
  );
}
