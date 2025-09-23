import React, { useState, useEffect } from 'react';
import type { Order } from '../../types';
// Fix: Import for side-effects to load global custom JSX element types for ion-icon.
import '../../types';
import { supabase } from '../../lib/supabaseClient';



const Pagos: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCompletedPayments();
  }, []);

  const fetchCompletedPayments = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('payment_status', 'completed')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching completed orders:', error);
        return;
      }

      // Transform the data to match our Order interface
      const transformedOrders: Order[] = (data || []).map(order => ({
        id: order.id,
        customerName: order.customername,
        customerId: order.customerid,
        date: order.date,
        total: order.total,
        status: order.status,
        items: order.items || [],
        payment_method: order.payment_method,
        payment_reference: order.payment_reference,
        customer_email: order.customer_email,
        payment_instructions: order.payment_instructions,
        payment_status: order.payment_status,
        shipping_name: order.shipping_name,
        shipping_lastname: order.shipping_lastname,
        shipping_id: order.shipping_id,
        shipping_phone: order.shipping_phone
      }));

      setOrders(transformedOrders);
    } catch (error) {
      console.error('Error in fetchCompletedOrders:', error);
    } finally {
      setLoading(false);
    }
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white">Cargando pagos...</div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">Gestión de Pagos</h1>

      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-700">
              <tr>
                <th className="p-4 font-semibold">ID Pedido</th>
                <th className="p-4 font-semibold">Cliente</th>
                <th className="p-4 font-semibold">Teléfono</th>
                <th className="p-4 font-semibold">Método Pago</th>
                <th className="p-4 font-semibold text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                  <td className="p-4 font-mono text-sm text-gray-400">{order.payment_reference || order.id.slice(0, 8)}...</td>
                  <td className="p-4 font-medium">{order.customerName}</td>
                  <td className="p-4 text-gray-300">{order.shipping_phone || 'N/A'}</td>
                  <td className="p-4 text-gray-300">{order.payment_method || 'N/A'}</td>
                  <td className="p-4 text-right font-bold text-primary-orange">${order.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Pagos;