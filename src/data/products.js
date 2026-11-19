// 1. Spesifikasi standar tiap kategori
const SPESIFIKASI_KATEGORI = {
  WPC: {
    kategori: "WPC",
    dimensi: { lebar_cm: 16, tinggi_cm: 290 },
    luas_m2: 0.464,
    harga: 75000,
    satuan: "batang",
    folderGambar: "/images/wpc",
  },
  RFP: {
    kategori: "RFP",
    dimensi: { lebar_cm: 30, tinggi_cm: 290 },
    luas_m2: 0.87,
    harga: 79000,
    satuan: "lembar",
    folderGambar: "/images/rfp",
  },
  Wallboard: {
    kategori: "Wallboard",
    dimensi: { lebar_cm: 40, tinggi_cm: 290 },
    luas_m2: 1.16,
    harga: 89000,
    satuan: "lembar",
    folderGambar: "/images/wallboard",
  },
  UVMarble: {
    kategori: "UV Marble",
    dimensi: { lebar_cm: 120, tinggi_cm: 290 },
    luas_m2: 3.48,
    harga: 390000,
    satuan: "lembar",
    folderGambar: "/images/uvm",
  },
  UVMarbleGold: {
    kategori: "UV Marble Gold Series",
    dimensi: { lebar_cm: 120, tinggi_cm: 290 },
    luas_m2: 3.48,
    harga: 440000,
    satuan: "lembar",
    folderGambar: "/images/goldseries",
  },
};

// 2. Daftar seluruh produk
const daftarProdukMentah = [
  // --- WPC ---
  {
    tipe: "WPC",
    kode: "ZP06",
    motif: "Teak Wood 3D Fluted",
    deskripsi: "Panel kisi kayu komposit 16cm aksen 3D.",
  },

  // --- RFP (Lebar 30 cm × Tinggi 290 cm — Rp 79.000) ---
  {
    tipe: "RFP",
    kode: "RFP21",
    motif: "RFP Series 21",
    deskripsi: "Panel dinding dekoratif lebar 30cm tinggi 290cm.",
  },
  {
    tipe: "RFP",
    kode: "RFP22",
    motif: "RFP Series 22",
    deskripsi: "Panel dinding dekoratif lebar 30cm tinggi 290cm.",
  },
  {
    tipe: "RFP",
    kode: "RFP23",
    motif: "RFP Series 23",
    deskripsi: "Panel dinding dekoratif lebar 30cm tinggi 290cm.",
  },
  {
    tipe: "RFP",
    kode: "RFP24",
    motif: "RFP Series 24",
    deskripsi: "Panel dinding dekoratif lebar 30cm tinggi 290cm.",
  },
  {
    tipe: "RFP",
    kode: "RFP25",
    motif: "RFP Series 25",
    deskripsi: "Panel dinding dekoratif lebar 30cm tinggi 290cm.",
  },
  {
    tipe: "RFP",
    kode: "RFP26",
    motif: "RFP Series 26",
    deskripsi: "Panel dinding dekoratif lebar 30cm tinggi 290cm.",
  },

  // --- Wallboard ---
  {
    tipe: "Wallboard",
    kode: "ZWB05",
    motif: "Linen Fabric Gray",
    deskripsi: "Papan komposit 40cm interlocking bebas nat lebar.",
  },

  // --- UV Marble Reguler (Rp 390.000) ---
  {
    tipe: "UVMarble",
    kode: "KL8276",
    motif: "Calacatta Gold White Marble",
    deskripsi: "Slab marmer PVC 120cm motif calacatta high gloss.",
  },

  // --- UV Marble Gold Series (Rp 440.000) ---
  {
    tipe: "UVMarbleGold",
    kode: "KLG3007",
    motif: "Black Portoro Gold Vein",
    deskripsi: "Slab marmer Gold Series hitam urat emas high gloss.",
  },
  {
    tipe: "UVMarbleGold",
    kode: "80117",
    motif: "Gold Series 80117",
    deskripsi: "Slab marmer PVC 120cm seri Gold mewah high gloss.",
  },
  {
    tipe: "UVMarbleGold",
    kode: "8011",
    motif: "Gold Series 8011",
    deskripsi: "Slab marmer PVC 120cm seri Gold mewah high gloss.",
  },
  {
    tipe: "UVMarbleGold",
    kode: "80114",
    motif: "Gold Series 80114",
    deskripsi: "Slab marmer PVC 120cm seri Gold mewah high gloss.",
  },
  {
    tipe: "UVMarbleGold",
    kode: "80113",
    motif: "Gold Series 80113",
    deskripsi: "Slab marmer PVC 120cm seri Gold mewah high gloss.",
  },
  {
    tipe: "UVMarbleGold",
    kode: "S1643-2",
    motif: "Gold Series S1643-2",
    deskripsi: "Slab marmer PVC 120cm seri Gold mewah high gloss.",
  },
  {
    tipe: "UVMarbleGold",
    kode: "S1642-1",
    motif: "Gold Series S1642-1",
    deskripsi: "Slab marmer PVC 120cm seri Gold mewah high gloss.",
  },
];

// 3. Transformasi otomatis ke format catalogData
export const catalogData = daftarProdukMentah.map((item) => {
  const spec = SPESIFIKASI_KATEGORI[item.tipe];
  const namaAwal = spec.kategori === "WPC" ? "WPC Wallpanel" : spec.kategori;

  return {
    ...spec,
    ...item,
    nama: `${namaAwal} ${item.kode}`,
    gambar2D: `${spec.folderGambar}/${item.kode.toLowerCase()}.jpeg`,
  };
});

export default catalogData;