import React, { useState, useEffect } from 'react';
import Image from 'next/image';

const ShippingCalculator = () => {
  const [rateData, setRateData] = useState([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedProv, setSelectedProv] = useState('');
  const [selectedDist, setSelectedDist] = useState('');
  const [weight, setWeight] = useState(1);
  const [loading, setLoading] = useState(true);
  const [length, setLength] = useState(0);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [declaredValue, setDeclaredValue] = useState(0);

  const calculateVolumetricWeight = () => {
    return (length * width * height) / 6000;
  };

  const calculateInsurance = () => {
    if (declaredValue <= 0) return 0;
    
    if (declaredValue <= 2999) {
      // Calculamos el seguro base
      const baseSeguro = (declaredValue * 0.6) / 100;
      const conIGV = baseSeguro * 1.18;
      
      // Convertimos a string para obtener exactamente el tercer decimal
      const numStr = conIGV.toFixed(3);
      const [entero, decimal] = numStr.split('.');
      
      // Si el tercer decimal es menor a 5, mantenemos dos decimales
      // Si es 5 o mayor, redondeamos hacia arriba
      if (parseInt(decimal[2]) >= 5) {
        const temp = parseInt(decimal.substring(0, 2)) + 1;
        return parseFloat(`${entero}.${temp.toString().padStart(2, '0')}`);
      } else {
        return parseFloat(`${entero}.${decimal.substring(0, 2)}`);
      }
    } 
    
    if (declaredValue <= 10000) {
      return declaredValue * 0.02;
    }
    
    return 10000 * 0.02;
  };

  const getChargeableWeight = () => {
    const volumetricWeight = calculateVolumetricWeight();
    const maxWeight = Math.max(weight, volumetricWeight);
    const decimal = maxWeight % 1;
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
  const provinces = selectedDept ? [...new Set(rateData.filter(item => item.Departamento === selectedDept).map(item => item.Provincia))].sort() : [];
  const districts = (selectedDept && selectedProv) ? rateData.filter(item => item.Departamento === selectedDept && item.Provincia === selectedProv).map(item => item.Distrito).sort() : [];

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
      <div className="flex items-center justify-between mb-6">
        <img 
          src="https://i.ibb.co/C3XFGfcL/logo-left-png.png"
          alt="Logo Izquierdo" 
          className="h-8 w-auto" // Reducido de h-12 a h-8
        />
        <h1 className="text-2xl font-bold text-gray-900">Cotizador OLVA</h1>
        <img 
          src="https://i.ibb.co/zWW6yQf8/logo-right-png.png"
          alt="Logo Derecho" 
          className="h-8 w-auto" // Reducido de h-12 a h-8
        />
      </div>
      
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
        <div className="grid grid-cols-4 gap-4">
          <div>
            <label className="block text-base font-bold text-gray-900 mb-1">Alto (cm)</label>
            <input
              type="number"
              min="0"
              step="1"
              value={height}
              onChange={(e) => setHeight(parseFloat(e.target.value) || 0)}
              className="w-full p-2 border rounded text-gray-900 font-medium bg-white"
            />
          </div>
          <div>
            <label className="block text-base font-bold text-gray-900 mb-1">Largo (cm)</label>
            <input
              type="number"
              min="0"
              step="1"
              value={length}
              onChange={(e) => setLength(parseFloat(e.target.value) || 0)}
              className="w-full p-2 border rounded text-gray-900 font-medium bg-white"
            />
          </div>
          <div>
            <label className="block text-base font-bold text-gray-900 mb-1">Ancho (cm)</label>
            <input
              type="number"
              min="0"
              step="1"
              value={width}
              onChange={(e) => setWidth(parseFloat(e.target.value) || 0)}
              className="w-full p-2 border rounded text-gray-900 font-medium bg-white"
            />
          </div>
          <div>
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
            <h3 className="text-lg font-bold text-black">Resumen de Costos</h3>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p><span className="font-medium text-black">Peso Físico:</span> <span className="text-black">{weight} kg</span></p>
                <p><span className="font-medium text-black">Peso Volumétrico:</span> <span className="text-black">{volumetricWeight.toFixed(2)} kg</span></p>
                <p><span className="font-medium text-black">Peso a Cobrar:</span> <span className="text-black">{getChargeableWeight()} kg</span></p>
              </div>
              <div>
                <p><span className="font-medium text-black">Costo Envío:</span> <span className="text-black">S/ {total.shipping.toFixed(2)}</span></p>
                <p><span className="font-medium text-black">Seguro:</span> <span className="text-black">S/ {total.insurance.toFixed(2)}</span></p>
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