import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

const Dashboard = () => {
  // 1. Extraemos 'logout' para sacar al usuario si su token vence
  const { user, logout } = useAuth(); 
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        fetchDashboardStats();
      } else {
        setLoading(false);
        setError('Acceso denegado: Se requieren permisos de administrador.');
      }
    }
  }, [user]);

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem('ACCESS_TOKEN') || localStorage.getItem('authToken');
      
      if (!token) throw new Error('No_Token'); // Error interno corto

      const response = await fetch('http://127.0.0.1:8000/api/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        // Si es 401, lanzamos un error específico para capturarlo abajo
        if (response.status === 401) throw new Error('Unauthorized');
        throw new Error('Error de servidor');
      }

      const data = await response.json();
      const statsData = data.data || data; 
      setStats(statsData);

    } catch (error) {
      // 2. LIMPIEZA DE CONSOLA:
      // En lugar de console.error(error), manejamos el error silenciosamente.
      
      if (error.message === 'Unauthorized' || error.message === 'No_Token') {
        // Si el token venció o no existe, cerramos sesión limpiamente.
        // Esto evita pantallas rojas y redirige al login.
        logout(); 
      } else {
        // Solo guardamos el mensaje para mostrarlo en la UI si es otro tipo de error
        setError(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border-2 border-red-400 text-red-700 px-4 py-3 rounded-lg animate-fade-in">
        <strong>Atención:</strong> {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800 flex items-center space-x-3">
          <span className="text-4xl">📊</span>
          <span>Dashboard</span>
        </h1>
        <p className="text-gray-600 mt-1">Panel de control y estadísticas</p>
      </div>

      {/* Tarjetas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Ventas de Hoy */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-green-100 text-sm font-medium">Ventas de Hoy</p>
              <p className="text-3xl font-bold mt-2">S/. {parseFloat(stats?.today_sales?.total || 0).toFixed(2)}</p>
            </div>
            <span className="text-6xl opacity-80">💰</span>
          </div>
          <div className="flex items-center space-x-2 text-sm">
            <span className={stats?.today_sales?.change >= 0 ? "text-green-200" : "text-red-200"}>
              {stats?.today_sales?.change >= 0 ? "↗" : "↘"}
            </span>
            <span>{stats?.today_sales?.change}% vs ayer</span>
          </div>
        </div>

        {/* Pedidos Activos */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-blue-100 text-sm font-medium">Pedidos Activos</p>
              <p className="text-3xl font-bold mt-2">{stats?.active_orders?.count || 0}</p>
            </div>
            <span className="text-6xl opacity-80">🍔</span>
          </div>
          <div className="text-sm text-blue-100">
            {stats?.active_orders?.total_today || 0} pedidos hoy
          </div>
        </div>

        {/* Productos Bajo de Stock */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-orange-100 text-sm font-medium">Stock Bajo</p>
              <p className="text-3xl font-bold mt-2">{stats?.low_stock?.count || 0}</p>
            </div>
            <span className="text-6xl opacity-80">⚠️</span>
          </div>
          <div className="text-sm text-orange-100">
            Productos requieren compra
          </div>
        </div>

        {/* Clientes Nuevos */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-purple-100 text-sm font-medium">Clientes Nuevos</p>
              <p className="text-3xl font-bold mt-2">{stats?.new_customers?.count || 0}</p>
            </div>
            <span className="text-6xl opacity-80">👥</span>
          </div>
          <div className="text-sm text-purple-100">
            Última semana
          </div>
        </div>
      </div>

      {/* Productos Más Vendidos */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center space-x-2">
          <span className="text-2xl">🏆</span>
          <span>Productos Más Vendidos</span>
        </h2>
        
        <div className="space-y-4">
          {stats?.top_products?.length > 0 ? (
            stats.top_products.map((product, index) => (
              <div key={product.id || index} className="flex items-center space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {index + 1}
                </div>
                
                <img
                  src={product.image || `https://ui-avatars.com/api/?name=${product.name}&background=random`}
                  alt={product.name}
                  className="w-16 h-16 rounded-lg object-cover bg-gray-100"
                  onError={(e) => {
                    e.target.onerror = null; 
                    e.target.src = `https://ui-avatars.com/api/?name=${product.name}&background=random&color=fff`;
                  }}
                />
                
                <div className="flex-1">
                  <p className="font-semibold text-gray-800">{product.name}</p>
                  <p className="text-sm text-gray-500">{product.category}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-800">{product.sales}</p>
                  <p className="text-sm text-gray-500">ventas</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-8">No hay datos de ventas aún</p>
          )}
        </div>
      </div>

      {/* Productos Bajo de Stock - Detalle */}
      {stats?.low_stock?.items?.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center space-x-2">
            <span className="text-2xl">📦</span>
            <span>Inventario Bajo de Stock</span>
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-orange-100">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Producto</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Stock Actual</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Stock Mínimo</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {stats.low_stock.items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-800">{item.name}</p>
                        <p className="text-sm text-gray-500">{item.category}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-orange-600">{item.stock} {item.unit}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-gray-600">{item.min_stock} {item.unit}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
                        ⚠️ Crítico
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Ventas por Día */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center space-x-2">
            <span className="text-2xl">📈</span>
            <span>Ventas de la Semana</span>
        </h2>
        {stats?.sales_by_day?.length > 0 ? (
            <div className="space-y-3">
            {stats.sales_by_day.map((day) => {
                const maxSale = Math.max(...stats.sales_by_day.map(d => parseFloat(d.total)));
                const percentage = maxSale > 0 ? (parseFloat(day.total) / maxSale) * 100 : 0;
                
                return (
                <div key={day.date} className="flex items-center space-x-4">
                    <div className="w-24 text-sm font-medium text-gray-700">
                    {new Date(day.date).toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: '2-digit' })}
                    </div>
                    <div className="flex-1">
                    <div className="bg-gray-200 rounded-full h-8 overflow-hidden">
                        <div
                        className="bg-gradient-to-r from-green-500 to-green-600 h-full flex items-center justify-end pr-3 text-white text-sm font-bold rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(percentage, 5)}%` }}
                        >
                        {percentage > 15 && `S/. ${parseFloat(day.total).toFixed(2)}`}
                        </div>
                    </div>
                    </div>
                    {percentage <= 15 && (
                    <div className="w-24 text-right text-sm font-bold text-gray-700">
                        S/. {parseFloat(day.total).toFixed(2)}
                    </div>
                    )}
                </div>
                );
            })}
            </div>
        ) : (
            <p className="text-gray-500 text-center py-8">No hay datos de ventas esta semana</p>
        )}
      </div>

       {/* Resumen Ejecutivo y Métodos de pago */}
       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center space-x-2">
                    <span className="text-2xl">💳</span>
                    <span>Métodos de Pago (Hoy)</span>
                </h2>
                {stats?.payment_methods?.length > 0 ? (
                    <div className="space-y-3">
                    {stats.payment_methods.map((method) => (
                        <div key={method.payment_method} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium text-gray-700">{method.payment_method}</span>
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-bold">
                            {method.count}
                        </span>
                        </div>
                    ))}
                    </div>
                ) : <p className="text-gray-500 text-center py-8">Sin pedidos hoy</p>}
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center space-x-2">
                    <span className="text-2xl">🚚</span>
                    <span>Distribución de Pedidos</span>
                </h2>
                {stats?.orders_by_type?.length > 0 ? (
                    <div className="space-y-3">
                    {stats.orders_by_type.map((type) => (
                        <div key={type.type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium text-gray-700">{type.type}</span>
                        <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full font-bold">
                            {type.count}
                        </span>
                        </div>
                    ))}
                    </div>
                ) : <p className="text-gray-500 text-center py-8">Sin pedidos hoy</p>}
            </div>
       </div>

      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-lg p-6 text-white">
        <h2 className="text-xl font-bold mb-6 flex items-center space-x-2">
          <span className="text-2xl">📋</span>
          <span>Resumen Ejecutivo</span>
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="text-gray-400 text-sm">Ingresos Totales</p>
            <p className="text-2xl font-bold mt-1">S/. {parseFloat(stats?.summary?.total_revenue || 0).toFixed(2)}</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm">Pedidos Totales</p>
            <p className="text-2xl font-bold mt-1">{stats?.summary?.total_orders || 0}</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm">Ticket Promedio</p>
            <p className="text-2xl font-bold mt-1">S/. {parseFloat(stats?.summary?.average_ticket || 0).toFixed(2)}</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm">Total Clientes</p>
            <p className="text-2xl font-bold mt-1">{stats?.summary?.total_customers || 0}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;