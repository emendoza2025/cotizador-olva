import React, { useState, useEffect } from 'react';

const ShippingCalculator = () => {
  const [rateData, setRateData] = useState([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedProv, setSelectedProv] = useState('');
  const [selectedDist, setSelectedDist] = useState('');
  const [weight, setWeight] = useState(1);
  const [loading, setLoading] = useState(true);

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
    if (!selectedDept || !selectedProv || !selectedDist || weight <= 0) return null;

    const rate = rateData.find(item =>
      item.Departamento === selectedDept &&
      item.Provincia === selectedProv &&
      item.Distrito === selectedDist
    );

    if (!rate) return null;

    const basePrice = rate['Precio por envío de caja de 1 kilo (inc IGV)'];
    const excessWeight = Math.max(0, weight - 1);
    const excessPrice = excessWeight * rate['PRECIO KILO EXCESO INC IGV'];
    
    return basePrice + excessPrice;
  };

  const total = calculateShipping();

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

        <div className="mt-4">
          <label className="block text-base font-bold text-gray-900 mb-1">Peso (kg)</label>
          <input
            type="number"
            min="0.1"
            step="0.1"
            value={weight}
            onChange={(e) => setWeight(parseFloat(e.target.value))}
            className="w-full p-2 border rounded text-gray-900 font-medium bg-white"
          />
        </div>

        {total && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-lg font-bold text-gray-900">Costo Total del Envío</h3>
            <p className="text-3xl font-bold text-blue-600">S/ {total.toFixed(2)}</p>
            <div className="mt-2 text-gray-900 font-medium">
              <p>Tarifa base (1kg): S/ {rateData.find(item =>
                item.Departamento === selectedDept &&
                item.Provincia === selectedProv &&
                item.Distrito === selectedDist
              )?.['Precio por envío de caja de 1 kilo (inc IGV)']}</p>
              {weight > 1 && (
                <p>Cargo por peso adicional ({(weight-1).toFixed(1)} kg): S/ {(total - rateData.find(item =>
                  item.Departamento === selectedDept &&
                  item.Provincia === selectedProv &&
                  item.Distrito === selectedDist
                )?.['Precio por envío de caja de 1 kilo (inc IGV)']).toFixed(2)}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShippingCalculator;