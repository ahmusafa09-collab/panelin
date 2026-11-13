import { useState } from 'react';
import { catalogData } from './data/products';
import Visualizer from './components/Visualizer';
import Catalog from './components/Catalog';
import Calculator from './components/Calculator';

// Guard: pastikan data tidak kosong sebelum render
if (!catalogData || catalogData.length === 0) {
  throw new Error('[Panelin] catalogData di src/data/products.js kosong atau tidak ditemukan.');
}

function App() {
  const [activeProduct, setActiveProduct] = useState(catalogData[0]);
  // Simpan state ukuran dinding di sini agar bisa dipakai bersama
  const [lebar, setLebar] = useState(3);
  const [tinggi, setTinggi] = useState(3);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-lg p-6">
        
        <header className="mb-8 text-center border-b pb-4">
          <h1 className="text-3xl font-extrabold text-gray-800">PANELIN</h1>
          <p className="text-gray-500 mt-2">Smart Wallpanel Visualizer & Estimator</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Visualizer sekarang menerima data lebar & tinggi */}
          <div className="lg:col-span-2 flex items-center justify-center bg-gray-100 rounded-xl p-4">
            <Visualizer 
              activeProduct={activeProduct} 
              lebar={lebar} 
              tinggi={tinggi} 
            />
          </div>

          <div className="flex flex-col gap-6">
            <Catalog 
              products={catalogData} 
              onSelect={setActiveProduct} 
              activeId={activeProduct.kode} 
            />
            
            {/* Calculator menerima state dan fungsi pengubahnya */}
            <Calculator 
              activeProduct={activeProduct} 
              lebar={lebar} 
              setLebar={setLebar} 
              tinggi={tinggi} 
              setTinggi={setTinggi} 
            />
          </div>
        </div>

      </div>
    </div>
  );
}

export default App;
