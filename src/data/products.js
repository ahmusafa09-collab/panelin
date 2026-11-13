/**
 * products.js — Sumber data tunggal (Single Source of Truth) untuk semua produk Panelin.
 *
 * Skema tiap objek produk:
 * @property {string}  kode       - Kode unik produk (dipakai sebagai key & activeId)
 * @property {string}  nama       - Nama lengkap produk
 * @property {string}  kategori   - Kategori: "WPC" | "Wallboard" | "UV Marble"
 * @property {{lebar_cm: number, tinggi_cm: number}} dimensi - Dimensi fisik panel (cm)
 * @property {number}  luas_m2    - Luas per satuan dalam m² (lebar_cm × tinggi_cm / 10000)
 * @property {number}  harga      - Harga per satuan (Rupiah)
 * @property {string}  satuan     - Satuan jual: "batang" (WPC) | "lembar" (Wallboard, UV Marble)
 * @property {string}  motif      - Nama motif / desain
 * @property {string}  deskripsi  - Deskripsi singkat produk
 * @property {string}  gambar2D   - Path gambar untuk Visualizer & Catalog (relatif dari /public)
 */
export const catalogData = [
  {
    kode: "ZP06",
    nama: "WPC Wallpanel ZP06",
    kategori: "WPC",
    dimensi: {
      lebar_cm: 16,
      tinggi_cm: 290
    },
    luas_m2: 0.464,
    harga: 75000,
    satuan: "batang",
    motif: "Teak Wood 3D Fluted",
    deskripsi: "Panel kisi kayu komposit 16cm dengan aksen 3D elegan.",
    gambar2D: "/images/wpc/zp06.jpeg"
  },
  {
    kode: "ZWB05",
    nama: "Wallboard ZWB05",
    kategori: "Wallboard",
    dimensi: {
      lebar_cm: 40,
      tinggi_cm: 290
    },
    luas_m2: 1.16,
    harga: 89000,
    satuan: "lembar",
    motif: "Linen Fabric Gray",
    deskripsi: "Papan komposit 40cm interlocking tongue & groove bebas nat lebar.",
    gambar2D: "/images/wallboard/zwb05.jpeg"
  },
  {
    kode: "KL8276",
    nama: "UV Marble KL8276",
    kategori: "UV Marble",
    dimensi: {
      lebar_cm: 120,
      tinggi_cm: 290
    },
    luas_m2: 3.48,
    harga: 390000,
    satuan: "lembar",
    motif: "Calacatta Gold White Marble",
    deskripsi: "Slab marmer PVC lebar 120cm motif calacatta mengkilap (high gloss).",
    gambar2D: "/images/uvm/kl8276.jpeg"
  },
  {
    kode: "KLG3007",
    nama: "UV Marble KLG3007",
    kategori: "UV Marble",
    dimensi: {
      lebar_cm: 120,
      tinggi_cm: 290
    },
    luas_m2: 3.48,
    harga: 440000,
    satuan: "lembar",
    motif: "Black Portoro Gold Vein",
    deskripsi: "Slab marmer PVC lebar 120cm motif marmer hitam emas mewah.",
    gambar2D: "/images/uvm/klg3007.jpeg"
  }
];

// Alias default — gunakan ini jika ingin impor lebih ekspresif di masa mendatang
export default catalogData;

