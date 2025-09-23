import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';

interface CustomerData {
  nombre: string;
  apellido: string;
  cedula: string;
  phone: string;
  totalGastado: number;
  ultimoPedido: string;
  tipo: 'profile' | 'caja_client';
}

const ITEMS_PER_PAGE = 10;

const Clientes: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get all customers from both tables using cedula as unique identifier
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('nombre, apellido, cedula, phone')
        .not('cedula', 'is', null);

      if (profilesError) throw profilesError;

      const { data: cajaClientsData, error: cajaClientsError } = await supabase
        .from('caja_clients')
        .select('nombre, apellido, cedula, phone');

      if (cajaClientsError) throw cajaClientsError;

      // Combine and deduplicate by cedula
      const allCustomers = new Map<string, CustomerData>();

      // Add profiles
      profilesData?.forEach(profile => {
        if (profile.cedula) {
          allCustomers.set(profile.cedula, {
            nombre: profile.nombre || '',
            apellido: profile.apellido || '',
            cedula: profile.cedula,
            phone: profile.phone || '',
            totalGastado: 0,
            ultimoPedido: '',
            tipo: 'profile'
          });
        }
      });

      // Add caja_clients (will override profiles if same cedula)
      cajaClientsData?.forEach(client => {
        if (client.cedula) {
          allCustomers.set(client.cedula, {
            nombre: client.nombre,
            apellido: client.apellido,
            cedula: client.cedula,
            phone: client.phone || '',
            totalGastado: 0,
            ultimoPedido: '',
            tipo: 'caja_client'
          });
        }
      });

      // Get order statistics for each customer
      const customerStats = await Promise.all(
        Array.from(allCustomers.keys()).map(async (cedula) => {
          const { data: orders, error: ordersError } = await supabase
            .from('orders')
            .select('total, date')
            .eq('shipping_id', cedula)
            .eq('status', 'Completado')
            .order('date', { ascending: false });

          if (ordersError) {
            console.error(`Error fetching orders for cedula ${cedula}:`, ordersError);
            return { cedula, totalGastado: 0, ultimoPedido: '' };
          }

          const totalGastado = orders?.reduce((sum, order) => sum + (order.total || 0), 0) || 0;
          const ultimoPedido = orders && orders.length > 0
            ? new Date(orders[0].date).toLocaleDateString('es-ES')
            : '';

          return { cedula, totalGastado, ultimoPedido };
        })
      );

      // Update customers with order statistics
      customerStats.forEach(stat => {
        const customer = allCustomers.get(stat.cedula);
        if (customer) {
          customer.totalGastado = stat.totalGastado;
          customer.ultimoPedido = stat.ultimoPedido;
        }
      });

      setCustomers(Array.from(allCustomers.values()));
    } catch (err) {
      console.error('Error fetching customers:', err);
      setError('Error al cargar los clientes');
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return customers;
    const lowercasedQuery = searchQuery.toLowerCase();
    return customers.filter(customer =>
      customer.nombre.toLowerCase().includes(lowercasedQuery) ||
      customer.apellido.toLowerCase().includes(lowercasedQuery) ||
      customer.cedula.toLowerCase().includes(lowercasedQuery) ||
      customer.phone.toLowerCase().includes(lowercasedQuery)
    );
  }, [searchQuery, customers]);

  const paginatedCustomers = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredCustomers.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [currentPage, filteredCustomers]);

  const totalPages = Math.ceil(filteredCustomers.length / ITEMS_PER_PAGE);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white">Cargando clientes...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-400">{error}</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-white">Gestión de Clientes</h1>
          <div className="flex items-center space-x-4">
            <button
              onClick={fetchCustomers}
              className="bg-primary-orange text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors flex items-center space-x-2"
            >
              <ion-icon name="refresh-outline"></ion-icon>
              <span>Actualizar</span>
            </button>
            <input
              type="text"
              placeholder="Buscar por nombre, apellido, cédula o teléfono..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1); // Reset page on new search
              }}
              className="w-full max-w-xs bg-gray-700 text-white placeholder-gray-400 border-2 border-gray-600 focus:border-primary-orange focus:ring-0 rounded-lg py-2 px-4"
            />
          </div>
        </div>
        <div className="text-gray-400 text-sm">
          {filteredCustomers.length} cliente{filteredCustomers.length !== 1 ? 's' : ''} encontrado{filteredCustomers.length !== 1 ? 's' : ''}
          {searchQuery && ` para "${searchQuery}"`}
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-700">
              <tr>
                <th className="p-4 font-semibold">Nombre</th>
                <th className="p-4 font-semibold">Cédula</th>
                <th className="p-4 font-semibold">Teléfono</th>
                <th className="p-4 font-semibold">Total Gastado</th>
                <th className="p-4 font-semibold">Último Pedido</th>
              </tr>
            </thead>
            <tbody>
              {paginatedCustomers.length > 0 ? (
                paginatedCustomers.map((customer) => (
                  <tr key={customer.cedula} className="border-b border-gray-700 hover:bg-gray-700/50">
                    <td className="p-4 font-medium">{customer.nombre} {customer.apellido}</td>
                    <td className="p-4 text-gray-300">{customer.cedula}</td>
                    <td className="p-4 text-gray-300">{customer.phone}</td>
                    <td className="p-4 text-primary-orange font-bold">${customer.totalGastado.toFixed(2)}</td>
                    <td className="p-4 text-gray-400">{customer.ultimoPedido || 'Sin pedidos'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-400">
                    {searchQuery ? 'No se encontraron clientes con esa búsqueda' : 'No hay clientes registrados'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex justify-between items-center p-4 bg-gray-700">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <span className="text-gray-300">
              Página {currentPage} de {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Siguiente
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Clientes;
