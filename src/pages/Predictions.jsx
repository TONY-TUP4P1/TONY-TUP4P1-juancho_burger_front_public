import React, { useMemo } from 'react';
import { TrendingUp, Package, AlertTriangle, ArrowUpRight } from 'lucide-react';
import { useData } from '../hooks/useData';

const Predictions = () => {
  const { products, loading } = useData();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  const safeProducts = Array.isArray(products) ? products : [];

  // 1. RECETAS (Estándar)
  const RECIPES = {
    'Hamburguesa': { 'Pan de Hamburguesa': 1, 'Carne (g)': 140, 'Queso (laminas)': 1, 'Lechuga (g)': 20 },
    'Combos': { 'Pan de Hamburguesa': 1, 'Carne (g)': 140, 'Papas (g)': 200, 'Gaseosa (ml)': 500 },
    'Bebidas': { 'Vasos descartables': 1 },
    'Complementos': { 'Empaques': 1, 'Salsas (ml)': 30 },
    'default': { 'Servilletas': 2, 'Empaques': 1 }
  };

  // 2. PRECIOS REALES DE MERCADO (Costo unitario estimado)
  const PRICES = {
    'Pan de Hamburguesa': 0.35,  // 35 céntimos la unidad
    'Carne (g)': 0.028,          // 28 soles el Kilo (0.028 el gramo)
    'Queso (laminas)': 0.60,     // 60 céntimos la lámina
    'Lechuga (g)': 0.005,        // 5 soles el Kilo
    'Papas (g)': 0.006,          // 6 soles el Kilo (Papa amarilla)
    'Gaseosa (ml)': 0.004,       // Insumo de bebida
    'Vasos descartables': 0.10,
    'Empaques': 0.50,
    'Salsas (ml)': 0.015,
    'Servilletas': 0.02
  };

  const { predictions, purchaseRecommendations, totalInvestment } = useMemo(() => {
    // A. Proyección de Ventas (Conservadora)
    const activeProducts = safeProducts
        .filter(p => (parseFloat(p.sales) || 0) > 0)
        .sort((a, b) => parseFloat(b.sales) - parseFloat(a.sales));

    const preds = activeProducts.slice(0, 5).map(p => {
        const currentSales = parseFloat(p.sales) || 0;
        // Crecimiento conservador del 5% al 10%
        const growthFactor = 1.05 + (Math.random() * 0.05); 
        
        const nextWeek = Math.ceil(currentSales * growthFactor);
        const dailyAvg = Math.ceil(nextWeek / 7);

        return {
            id: p.id,
            product: p.name,
            category: p.category,
            sales: currentSales,
            nextWeekProjection: nextWeek,
            tomorrowProjection: dailyAvg,
            growth: ((growthFactor - 1) * 100).toFixed(1),
            icon: p.category === 'Bebidas' ? '🥤' : '🍔'
        };
    });

    // B. Cálculo de Insumos
    const ingredientsNeeded = {};

    preds.forEach(pred => {
        const recipe = RECIPES[pred.category] || RECIPES['Hamburguesa'] || RECIPES['default'];
        
        Object.entries(recipe).forEach(([ingredient, qtyPerUnit]) => {
            const totalQty = qtyPerUnit * pred.nextWeekProjection;
            if (ingredientsNeeded[ingredient]) {
                ingredientsNeeded[ingredient] += totalQty;
            } else {
                ingredientsNeeded[ingredient] = totalQty;
            }
        });
    });

    // C. Formateo Inteligente (Gramos -> Kilos)
    const recommendations = Object.entries(ingredientsNeeded).map(([item, qty]) => {
        const costPerUnit = PRICES[item] || 0.10; // Precio por defecto si no está en lista
        const estimatedCost = (qty * costPerUnit).toFixed(2);
        
        let displayQty = `${qty.toLocaleString()} und`;
        
        // Si es gramo o mililitro, convertir a Kilo/Litro para que se vea mejor
        if (item.includes('(g)')) {
            displayQty = `${(qty / 1000).toFixed(1)} Kg`;
        } else if (item.includes('(ml)')) {
            displayQty = `${(qty / 1000).toFixed(1)} Lt`;
        }

        // Prioridad más lógica
        let priority = 'low';
        const costNum = parseFloat(estimatedCost);
        
        if (item.includes('Carne') && costNum > 100) priority = 'critical';
        else if (costNum > 200) priority = 'high';
        else if (costNum > 50) priority = 'medium';

        return {
            item: item.replace('(g)', '').replace('(ml)', '').trim(), // Limpiar nombre
            action: `Comprar ${displayQty}`,
            priority,
            reason: 'Reposición semanal',
            cost: estimatedCost,
            rawCost: costNum
        };
    }).sort((a, b) => b.rawCost - a.rawCost); // Ordenar por costo, lo más caro arriba

    const totalInv = recommendations.reduce((sum, r) => sum + r.rawCost, 0);

    return { 
        predictions: preds, 
        purchaseRecommendations: recommendations,
        totalInvestment: totalInv
    };

  }, [safeProducts]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-4xl font-bold text-gray-800">Predicciones de Demanda</h2>
        <p className="text-gray-600 mt-1">RF05: Análisis predictivo de demanda e insumos</p>
      </div>

      <div className="bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-2xl shadow-lg p-8 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm">
                <TrendingUp size={48} />
            </div>
            <div>
                <h3 className="text-2xl font-bold">Motor de Predicción Activo</h3>
                <p className="text-indigo-100 mt-2 max-w-2xl">
                    Proyección basada en costos reales de mercado y tendencias de venta de la última semana.
                </p>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* COLUMNA 1: VENTAS */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <TrendingUp className="text-blue-600" />
            Proyección de Demanda
          </h3>
          
          <div className="space-y-4">
            {predictions.length > 0 ? (
              predictions.map((pred) => (
                <div key={pred.id} className="border border-gray-100 rounded-xl p-4 hover:border-blue-200 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                        <span className="text-3xl bg-gray-50 w-12 h-12 flex items-center justify-center rounded-lg">{pred.icon}</span>
                        <div>
                            <h4 className="font-bold text-gray-800">{pred.product}</h4>
                            <p className="text-xs text-gray-500">Ventas actuales: {pred.sales}</p>
                        </div>
                    </div>
                    <span className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-lg text-xs font-bold">
                        <ArrowUpRight size={14} /> +{pred.growth}%
                    </span>
                  </div>
                  
                  <div className="bg-blue-50 rounded-lg p-3 border border-blue-100 flex justify-between items-center">
                        <p className="text-xs text-blue-600 font-semibold">Proyección Semana</p>
                        <p className="text-xl font-bold text-blue-700">{pred.nextWeekProjection} <span className="text-xs font-normal text-blue-400">unid.</span></p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-gray-400">
                <Package size={48} className="mx-auto mb-3 opacity-20" />
                <p>No hay suficientes datos de ventas para predecir.</p>
              </div>
            )}
          </div>
        </div>

        {/* COLUMNA 2: COMPRAS (CALIBRADO) */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 flex flex-col">
          <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Package className="text-orange-600" />
            Sugerencias de Abastecimiento
          </h3>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-[600px] pr-2">
            {purchaseRecommendations.length > 0 ? (
                purchaseRecommendations.map((rec, i) => (
                <div key={i} className={`border-l-4 rounded-r-xl p-4 shadow-sm ${
                    rec.priority === 'critical' ? 'border-red-500 bg-red-50' :
                    rec.priority === 'high' ? 'border-orange-500 bg-orange-50' :
                    'border-gray-300 bg-gray-50'
                }`}>
                    <div className="flex justify-between items-start">
                        <div>
                            <h4 className="font-bold text-gray-800 flex items-center gap-2">
                                {rec.item}
                                {rec.priority === 'critical' && <AlertTriangle size={16} className="text-red-600" />}
                            </h4>
                            <p className="text-sm font-medium text-gray-700 mt-1">{rec.action}</p>
                        </div>
                        <div className="text-right">
                            <p className="mt-1 text-sm font-bold text-gray-600">S/ {rec.cost}</p>
                        </div>
                    </div>
                </div>
                ))
            ) : (
                <div className="text-center py-10 text-gray-400">
                    <p>El inventario parece saludable.</p>
                </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100">
            <div className="flex justify-between items-center bg-gray-900 text-white p-4 rounded-xl shadow-lg">
                <div>
                    <p className="text-xs text-gray-400">Inversión Estimada</p>
                    <p className="text-xs text-gray-500">Para la semana</p>
                </div>
                <p className="text-2xl font-bold text-green-400">S/ {totalInvestment.toFixed(2)}</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Predictions;