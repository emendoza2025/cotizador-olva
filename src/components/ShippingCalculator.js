import React, { useState, useEffect } from 'react';

const ShippingCalculator = () => {
  const [rateData, setRateData] = useState([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedProv, setSelectedProv] = useState('');
  const [selectedDist, setSelectedDist] = useState('');
  const [weight, setWeight] = useState(1);
  const [loading, setLoading] = useState(true);
  
  // Nuevos estados para dimensiones y valor declarado
  const [length, setLength] = useState(0);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [declaredValue, setDeclaredValue] = useState(0);

  // Calcular peso volumétrico
  const calculateVolumetricWeight = () => {
    return (length * width * height) / 6000;
  };

  // Calcular seguro
  const calculateInsurance = () => {
    if (declaredValue <= 0) return 0;
    
    let insuranceRate;
    if (declaredValue <= 2999) {
      // 0.6% + IGV
      insuranceRate = (declaredValue * 0.6 / 100) * 1.18;
    } else if (declaredValue <= 10000) {
      // 2%
      insuranceRate = declaredValue * 0.02;
    } else {
      // Máximo valor asegurable
      insuranceRate = 10000 * 0.02;
    }
    
    // Redondeo según regla del .5
    return Math.round(insuranceRate * 100) / 100;
  };

  // Obtener el peso a cobrar (el mayor entre peso real y volumétrico)
  const getChargeableWeight = () => {
    const volumetricWeight = calculateVolumetricWeight();
    const maxWeight = Math.max(weight, volumetricWeight);
    const decimal = maxWeight % 1;
    // Redondeo especial: < 0.5 hacia abajo, >= 0.5 hacia arriba
    return decimal < 0.5 ? Math.floor(maxWeight) : Math.ceil(maxWeight);
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('/api/readExcel');
        const data = await response.json();
        
        const cleanedData = data.map(row => ({
          ...row,
          Departamento: row.Departamento?.trim(),
          Provincia: row.Provincia?.trim(),
          Distrito: row.Distrito?.trim()
        }));
        
        setRateData(cleanedData);
        setLoading(false);
      } catch (error) {
        console.error('Error al cargar datos:', error);
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const departments = [...new Set(rateData.map(item => item.Departamento))].sort();
  
  const provinces = selectedDept 
    ? [...new Set(rateData
        .filter(item => item.Departamento === selectedDept)
        .map(item => item.Provincia))].sort()
    : [];
  
  const districts = (selectedDept && selectedProv)
    ? rateData
        .filter(item => 
          item.Departamento === selectedDept && 
          item.Provincia === selectedProv
        )
        .map(item => item.Distrito)
        .sort()
    : [];

  const calculateShipping = () => {
    if (!selectedDept || !selectedProv || !selectedDist) return null;

    const rate = rateData.find(item =>
      item.Departamento === selectedDept &&
      item.Provincia === selectedProv &&
      item.Distrito === selectedDist
    );

    if (!rate) return null;

    const chargeableWeight = getChargeableWeight();
    const basePrice = rate['Precio por envío de caja de 1 kilo (inc IGV)'];
    const excessWeight = Math.max(0, chargeableWeight - 1);
    const excessPrice = excessWeight * rate['PRECIO KILO EXCESO INC IGV'];
    const insurance = calculateInsurance();
    
    return {
      shipping: basePrice + excessPrice,
      insurance: insurance,
      total: basePrice + excessPrice + insurance
    };
  };

  const total = calculateShipping();
  const volumetricWeight = calculateVolumetricWeight();

  if (loading) {
    return <div className="flex justify-center items-center h-screen text-gray-900 font-medium">Cargando tarifas...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold text-gray-900 text-center mb-6">Cotizador OLVA</h1>
      
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="block text-base font-bold text-gray-900 mb-1">Departamento</label>
            <select 
              className="w-full p-2 border rounded text-gray-900 font-medium bg-white"
              value={selectedDept}
              onChange={(e) => {
                setSelectedDept(e.target.value);
                setSelectedProv('');
                setSelectedDist('');
              }}
            >
              <option value="">Seleccione...</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-base font-bold text-gray-900 mb-1">Provincia</label>
            <select 
              className="w-full p-2 border rounded text-gray-900 font-medium bg-white"
              value={selectedProv}
              onChange={(e) => {
                setSelectedProv(e.target.value);
                setSelectedDist('');
              }}
              disabled={!selectedDept}
            >
              <option value="">Seleccione...</option>
              {provinces.map(prov => (
                <option key={prov} value={prov}>{prov}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-base font-bold text-gray-900 mb-1">Distrito</label>
            <select 
              className="w-full p-2 border rounded text-gray-900 font-medium bg-white"
              value={selectedDist}
              onChange={(e) => setSelectedDist(e.target.value)}
              disabled={!selectedProv}
            >
              <option value="">Seleccione...</option>
              {districts.map(dist => (
                <option key={dist} value={dist}>{dist}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Dimensiones en una sola fila */}
        <div className="grid grid-cols-1 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-bold text-black mb-3">Dimensiones y Peso</h3>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-black mb-1">Alto (cm)</label>
                <input
                  type="number"
                  min="0"
                  value={height}
                  onChange={(e) => setHeight(parseFloat(e.target.value) || 0)}
                  className="w-full p-2 border rounded text-black text-sm bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-1">Largo (cm)</label>
                <input
                  type="number"
                  min="0"
                  value={length}
                  onChange={(e) => setLength(parseFloat(e.target.value) || 0)}
                  className="w-full p-2 border rounded text-black text-sm bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-1">Ancho (cm)</label>
                <input
                  type="number"
                  min="0"
                  value={width}
                  onChange={(e) => setWidth(parseFloat(e.target.value) || 0)}
                  className="w-full p-2 border rounded text-black text-sm bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-1">Peso (kg)</label>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={weight}
                  onChange={(e) => setWeight(parseFloat(e.target.value))}
                  className="w-full p-2 border rounded text-black text-sm bg-white"
                />
              </div>
            </div>
          </div>
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-base font-bold text-gray-900 mb-1">Valor Declarado (S/)</label>
          <input
            type="number"
            min="0"
            step="1"
            value={declaredValue}
            onChange={(e) => setDeclaredValue(parseFloat(e.target.value) || 0)}
            className="w-full p-2 border rounded text-gray-900 font-medium bg-white"
          />
        </div>

        {total && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg space-y-2">
            <h3 className="text-lg font-bold text-gray-900">Resumen de Costos</h3>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p><span className="font-medium">Peso Físico:</span> {weight} kg</p>
                <p><span className="font-medium">Peso Volumétrico:</span> {volumetricWeight.toFixed(2)} kg</p>
                <p><span className="font-medium">Peso a Cobrar:</span> {getChargeableWeight().toFixed(2)} kg</p>
              </div>
              <div>
                <p><span className="font-medium">Costo Envío:</span> S/ {total.shipping.toFixed(2)}</p>
                <p><span className="font-medium">Seguro:</span> S/ {total.insurance.toFixed(2)}</p>
                <p className="text-lg font-bold text-blue-600">Total: S/ {total.total.toFixed(2)}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShippingCalculator;