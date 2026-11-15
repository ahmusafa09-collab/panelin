import { useState } from 'react';
import { catalogData } from './data/products';
import Visualizer from './components/Visualizer';
import Catalog from './components/Catalog';
import Calculator from './components/Calculator';

if (!catalogData || catalogData.length === 0) {
  throw new Error('[Panelin] catalogData di src/data/products.js kosong atau tidak ditemukan.');
}

function App() {
  const [activeProduct, setActiveProduct] = useState(catalogData[0]);
  const [lebar, setLebar] = useState(3);
  const [tinggi, setTinggi] = useState(3);

  // ─── State Fitur Mix Products ──────────────────────────────────────────────
  const [isMixMode, setIsMixMode] = useState(false);
  const [mixPattern, setMixPattern] = useState('wings'); // 'wings' | 'frame'
  const defaultCenter =
    catalogData.find((p) => p.kategori.includes('UV Marble')) ||
    catalogData[catalogData.length - 1];
  const [centerProduct, setCenterProduct] = useState(defaultCenter);
  const [centerWidth, setCenterWidth] = useState(1.2);
  const [centerHeight, setCenterHeight] = useState(2.0);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-lg p-6">
        
        <header className="mb-8 text-center border-b pb-4">
          <h1 className="text-3xl font-extrabold text-gray-800">PANELIN</h1>
          <p className="text-gray-500 mt-2">Smart Wallpanel Visualizer & Estimator</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Visualizer */}
          <div className="lg:col-span-2 flex items-center justify-center bg-gray-100 rounded-xl p-4">
            <Visualizer
              activeProduct={activeProduct}
              lebar={lebar}
              tinggi={tinggi}
              isMixMode={isMixMode}
              mixPattern={mixPattern}
              centerProduct={centerProduct}
              centerWidth={centerWidth}
              centerHeight={centerHeight}
            />
          </div>

          <div className="flex flex-col gap-6">
            <Catalog
              products={catalogData}
              onSelect={setActiveProduct}
              activeId={activeProduct.kode}
            />

            <Calculator
              catalogData={catalogData}
              activeProduct={activeProduct}
              lebar={lebar}
              setLebar={setLebar}
              tinggi={tinggi}
              setTinggi={setTinggi}
              isMixMode={isMixMode}
              setIsMixMode={setIsMixMode}
              mixPattern={mixPattern}
              setMixPattern={setMixPattern}
              centerProduct={centerProduct}
              setCenterProduct={setCenterProduct}
              centerWidth={centerWidth}
              setCenterWidth={setCenterWidth}
              centerHeight={centerHeight}
              setCenterHeight={setCenterHeight}
            />
          </div>
        </div>

      </div>
    </div>
  );
}

export default App;