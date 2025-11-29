import React, { useEffect } from 'react';
import { Tag } from 'lucide-react';
import { useData } from '../hooks/useData';

const UserPromotions = () => {
  const { promotions, loadInitialData } = useData();

  useEffect(() => {
    loadInitialData();
  }, []);

  const activePromotions = promotions ? promotions.filter(p => p.status === 'active') : [];

  // --- FUNCIÓN DE FECHA BLINDADA ---
  const formatDate = (dateString) => {
    if (!dateString) return 'Indefinido';
    
    // 1. Cortamos siempre los primeros 10 caracteres (YYYY-MM-DD)
    // Esto elimina cualquier hora, T, Z o ceros que vengan después.
    const cleanDate = dateString.toString().substring(0, 10);
    
    // 2. Separamos por el guion
    const parts = cleanDate.split('-');
    
    // 3. Si algo salió mal y no hay 3 partes, devolvemos el original limpio
    if (parts.length !== 3) return cleanDate;

    // 4. Retornamos formato Latam: Día/Mes/Año
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  };
  // ---------------------------------

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-4xl font-bold text-gray-800">Promociones Disponibles</h2>
        <p className="text-gray-600 mt-1">Aprovecha nuestras ofertas especiales</p>
      </div>

      <div className="bg-gradient-to-br from-red-500 to-orange-500 text-white rounded-2xl shadow-lg p-8">
        <h3 className="text-2xl font-bold mb-2">¡Ofertas Especiales!</h3>
        <p className="text-lg">{activePromotions.length} promociones activas disponibles</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activePromotions.map((promo) => (
          <div key={promo.id} className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 overflow-hidden hover:shadow-xl transition-all flex flex-col">
            <div className="bg-gradient-to-r from-green-500 to-green-600 p-6">
              <div className="flex items-center justify-between text-white mb-2">
                <Tag size={24} />
                <span className="bg-white text-green-700 px-3 py-1 rounded-full text-xs font-bold">
                  ✓ Activa
                </span>
              </div>
              <h3 className="text-2xl font-bold text-white">{promo.name}</h3>
            </div>
            
            <div className="p-6 flex-1 flex flex-col justify-between">
              <div>
                <p className="text-gray-600 mb-4">{promo.description}</p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <span className="text-sm text-gray-600 font-medium">Descuento:</span>
                    <span className="text-2xl font-bold text-red-600">{promo.discount}%</span>
                  </div>
                  
                  {promo.price && (
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <span className="text-sm text-gray-600 font-medium">Precio Especial:</span>
                      <span className="text-2xl font-bold text-gray-800">S/ {parseFloat(promo.price).toFixed(2)}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600 font-medium">Válido hasta:</span>
                    {/* --- FECHA LIMPIA --- */}
                    <span className="text-sm font-semibold text-gray-800">
                        {formatDate(promo.valid_until || promo.validUntil)}
                    </span>
                    {/* -------------------- */}
                  </div>
                </div>
              </div>
              
              <button className="w-full mt-6 bg-gradient-to-r from-red-500 to-orange-500 text-white py-3 rounded-xl font-bold hover:shadow-lg transition-transform active:scale-95">
                Solicitar Promoción
              </button>
            </div>
          </div>
        ))}
        
        {activePromotions.length === 0 && (
            <div className="col-span-full text-center py-10 text-gray-500">
                No hay promociones activas en este momento.
            </div>
        )}
      </div>
    </div>
  );
};

export default UserPromotions;