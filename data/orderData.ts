import type { Order } from '../types';

export const initialOrders: Order[] = [
  {
    id: 'ORD-2024-001',
    customerName: 'Ana Pérez',
    customerId: 'CUST-001',
    date: '2024-07-28',
    total: 150.75,
    status: 'Completado',
    items: [
      { productId: 8, productName: 'Cerveza Polar Pilsen (Caja)', quantity: 2, price: 24.0 },
      { productId: 9, productName: 'Ron Cacique Añejo 0.75L', quantity: 3, price: 8.0 },
      { productId: 1, productName: 'Arroz Primor 1kg', quantity: 10, price: 1.5 },
      { productId: 11, productName: 'Coca-Cola 2L', quantity: 5, price: 2.0 },
    ],
  },
  {
    id: 'ORD-2024-002',
    customerName: 'Luis González',
    customerId: 'CUST-002',
    date: '2024-07-26',
    total: 89.99,
    status: 'En Proceso',
    items: [
      { productId: 10, productName: 'Whisky Old Parr 12 Años 0.75L', quantity: 1, price: 30.0 },
      { productId: 6, productName: 'Queso Blanco Fresco 500g', quantity: 2, price: 4.0 },
      { productId: 2, productName: 'Harina P.A.N. 1kg', quantity: 5, price: 1.2 },
    ],
  },
  {
    id: 'ORD-2024-003',
    customerName: 'Carlos Sánchez',
    customerId: 'CUST-004',
    date: '2024-07-27',
    total: 312.00,
    status: 'Pendiente',
    items: [
      { productId: 4, productName: 'Aceite Mazeite 1L', quantity: 20, price: 2.5 },
      { productId: 12, productName: 'Agua Minalba 5L', quantity: 30, price: 2.2 },
      { productId: 3, productName: 'Pasta Ronco Larga 1kg', quantity: 40, price: 1.8 },
    ],
  },
  {
    id: 'ORD-2024-004',
    customerName: 'María Rodriguez',
    customerId: 'CUST-003',
    date: '2024-07-27',
    total: 25.50,
    status: 'Cancelado',
    items: [
      { productId: 7, productName: 'Tomates por Kg', quantity: 5, price: 1.0 },
      { productId: 5, productName: 'Jamón de Pavo 250g', quantity: 3, price: 3.0 },
    ],
  },
];
