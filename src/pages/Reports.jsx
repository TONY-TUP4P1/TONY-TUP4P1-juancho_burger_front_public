import React, { useEffect, useMemo } from 'react';
import { Download, Store, Truck, Calendar } from 'lucide-react';
import { useData } from '../hooks/useData';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Reports = () => {
  const { orders, products, users, loading, loadAllOrders } = useData();

  useEffect(() => {
    if (loadAllOrders) loadAllOrders();
  }, []);

  // DEBUG: Ver en consola qué fechas están llegando
  useEffect(() => {
    if (orders.length > 0) {
        console.log("🔍 Analizando fechas de las primeras 5 órdenes:", 
            orders.slice(0, 5).map(o => ({ id: o.id, fecha: o.date || o.created_at, total: o.total }))
        );
    }
  }, [orders]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const safeOrders = Array.isArray(orders) ? orders : [];
  const safeProducts = Array.isArray(products) ? products : [];
  const safeUsers = Array.isArray(users) ? users : [];

  // ========================================================================
  // 1. CÁLCULO DE VENTAS (LÓGICA BLINDADA)
  // ========================================================================
  const salesData = useMemo(() => {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const stats = days.map(d => ({ period: d, sales: 0, orders: 0 }));

    safeOrders.forEach(order => {
        // Aceptamos cualquier estado que no sea 'cancelled' (si existiera)
        // Ojo: Si tus estados son 'pending', 'completed', cuéntalos todos para probar.
        
        // 1. INTENTAMOS OBTENER LA FECHA DE CUALQUIER CAMPO POSIBLE
        const dateString = order.date || order.created_at;

        if (dateString) {
            try {
                // 2. LIMPIEZA DE FECHA: "2025-11-24 13:00..." -> "2025-11-24"
                const cleanDate = dateString.toString().substring(0, 10); 
                
                // 3. CONVERSIÓN SEGURA A DÍA DE SEMANA
                // year, month (0-11), day
                const parts = cleanDate.split('-');
                const localDate = new Date(parts[0], parts[1] - 1, parts[2]);
                
                const dayIndex = localDate.getDay();

                if (!isNaN(dayIndex)) {
                    stats[dayIndex].sales += parseFloat(order.total);
                    stats[dayIndex].orders += 1;
                }
            } catch (e) {
                console.warn("Fecha inválida:", dateString);
            }
        }
    });

    // Mover Domingo al final para que empiece Lunes
    const sunday = stats.shift();
    stats.push(sunday);
    
    return stats;
  }, [safeOrders]);

  // Resto de cálculos...
  const totalWeeklySales = salesData.reduce((sum, d) => sum + d.sales, 0);
  const totalWeeklyOrders = salesData.reduce((sum, d) => sum + d.orders, 0);
  const newCustomers = safeUsers.length;

  const topProduct = safeProducts.length > 0 
    ? safeProducts.reduce((max, p) => (parseFloat(p.sales) || 0) > (parseFloat(max.sales) || 0) ? p : max, safeProducts[0])
    : { name: 'Sin datos', sales: 0 }; 

  const bestDay = salesData.reduce((max, d) => d.sales > max.sales ? d : max, salesData[0]);

  // Función PDF (Igual que antes)
  const handleExportPDF = () => {
    const doc = new jsPDF();
    const fecha = new Date().toLocaleDateString();
    doc.setFontSize(20);
    doc.text("Juancho Burger - Reporte de Ventas", 14, 22);
    doc.setFontSize(10);
    doc.text(`Generado el: ${fecha}`, 14, 30);
    
    doc.text("Resumen General", 14, 45);
    autoTable(doc, {
        startY: 50,
        head: [['Indicador', 'Valor']],
        body: [
            ['Ventas Totales', `S/ ${totalWeeklySales.toFixed(2)}`],
            ['Pedidos Totales', totalWeeklyOrders],
            ['Ticket Promedio', `S/ ${(totalWeeklyOrders > 0 ? totalWeeklySales / totalWeeklyOrders : 0).toFixed(2)}`],
            ['Producto Estrella', `${topProduct.name} (${topProduct.sales} unid)`]
        ],
        theme: 'grid',
        headStyles: { fillColor: [220, 38, 38] }
    });

    const finalY = doc.lastAutoTable.finalY + 15;
    doc.text("Detalle por Día", 14, finalY);
    autoTable(doc, {
        startY: finalY + 5,
        head: [['Día', 'Pedidos', 'Ventas (S/)']],
        body: salesData.map(d => [d.period, d.orders, `S/ ${d.sales.toFixed(2)}`]),
        theme: 'striped'
    });
    doc.save(`Reporte_Ventas_${fecha.replace(/\//g, '-')}.pdf`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-4xl font-bold text-gray-800">Reportes y Analíticas</h2>
          <p className="text-gray-600 mt-1">RF03: Reportes de ventas en tiempo real</p>
        </div>
        <button onClick={handleExportPDF} className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg transition-all hover:scale-105 active:scale-95">
          <Download size={20} />
          <span>Exportar PDF</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <p className="text-sm text-gray-600 font-medium">Ventas Totales</p>
          <p className="text-3xl font-bold text-gray-800 mt-2">S/ {totalWeeklySales.toFixed(2)}</p>
          <p className="text-xs text-green-600 font-semibold mt-1">Semana Actual</p>
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <p className="text-sm text-gray-600 font-medium">Pedidos Totales</p>
          <p className="text-3xl font-bold text-gray-800 mt-2">{totalWeeklyOrders}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <p className="text-sm text-gray-600 font-medium">Ticket Promedio</p>
          <p className="text-3xl font-bold text-gray-800 mt-2">S/ {totalWeeklyOrders > 0 ? (totalWeeklySales / totalWeeklyOrders).toFixed(2) : '0.00'}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <p className="text-sm text-gray-600 font-medium">Clientes</p>
          <p className="text-3xl font-bold text-gray-800 mt-2">{newCustomers}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Calendar className="text-blue-500" /> Ventas por Día de la Semana
        </h3>
        <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip formatter={(value) => `S/ ${value}`} />
                    <Legend />
                    <Bar dataKey="sales" name="Ventas (S/)" fill="#f97316" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
      </div>
      {/* ... Resto de los gráficos (Distribución, Resumen) se mantienen igual ... */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Distribución de Pedidos</h3>
          <div className="space-y-4">
            {[
              { type: 'Salón', count: safeOrders.filter(o => o.type === 'Salón').length, icon: Store, color: 'from-purple-400 to-purple-600' },
              { type: 'Delivery', count: safeOrders.filter(o => o.type === 'Delivery').length, icon: Truck, color: 'from-orange-400 to-orange-600' },
            ].map((dist, i) => {
              const Icon = dist.icon;
              const percentage = totalWeeklyOrders > 0 ? ((dist.count / totalWeeklyOrders) * 100).toFixed(1) : 0;
              return (
                <div key={i} className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <Icon size={20} className="text-gray-600" />
                      <span className="font-semibold text-gray-700">{dist.type}</span>
                    </div>
                    <span className="font-bold text-gray-800">{dist.count} pedidos</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div className={`h-full rounded-full bg-gradient-to-r ${dist.color}`} style={{ width: `${percentage}%` }}></div>
                  </div>
                  <p className="text-sm text-gray-600 mt-2 text-center font-medium">{percentage}% del total</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-purple-500 text-white rounded-2xl shadow-lg p-8">
            <h3 className="text-2xl font-bold mb-4">Resumen Ejecutivo</h3>
            <div className="grid grid-cols-1 gap-6">
            <div>
                <p className="text-blue-100 font-medium">Día más rentable</p>
                <p className="text-3xl font-bold">{bestDay.period}</p>
                <p className="text-sm text-blue-100 mt-1">S/ {bestDay.sales.toFixed(2)} en ventas</p>
            </div>
            <div>
                <p className="text-blue-100 font-medium">Producto estrella</p>
                <p className="text-3xl font-bold">{topProduct.name}</p>
                <p className="text-sm text-blue-100 mt-1">{topProduct.sales || 0} unidades vendidas</p>
            </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;