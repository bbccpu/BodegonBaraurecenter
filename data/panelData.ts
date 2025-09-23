export const payments = [
  { id: 'PAY-001', date: '2024-07-28', amount: '$150.75', method: 'Tarjeta de Crédito', status: 'Completado' },
  { id: 'PAY-002', date: '2024-07-28', amount: '$89.99', method: 'Cashea', status: 'Completado' },
  { id: 'PAY-003', date: '2024-07-27', amount: '$25.50', method: 'Pago Móvil BCV', status: 'Completado' },
  { id: 'PAY-004', date: '2024-07-27', amount: '$312.00', method: 'Transferencia Banesco', status: 'Pendiente' },
  { id: 'PAY-005', date: '2024-07-26', amount: '$45.00', method: 'Efectivo', status: 'Completado' },
  { id: 'PAY-006', date: '2024-07-26', amount: '$12.25', method: 'Pago Móvil BCV', status: 'Completado' },
  { id: 'PAY-007', date: '2024-07-25', amount: '$220.00', method: 'Cashea', status: 'Completado' },
  { id: 'PAY-008', date: '2024-07-25', amount: '$5.50', method: 'Efectivo', status: 'Completado' },
  { id: 'PAY-009', date: '2024-07-24', amount: '$500.00', method: 'Transferencia Banesco', status: 'Completado' },
  { id: 'PAY-010', date: '2024-07-24', amount: '$78.90', method: 'Tarjeta de Crédito', status: 'Completado' },
  { id: 'PAY-011', date: '2024-07-23', amount: '$18.00', method: 'Efectivo', status: 'Rechazado' },
  { id: 'PAY-012', date: '2024-07-23', amount: '$99.99', method: 'Cashea', status: 'Completado' },
];

export const supplyOrders = [
  { id: 'ORD-101', supplier: 'Alimentos Polar', arrivalDate: '2024-08-05', items: 50, status: 'En Tránsito' },
  { id: 'ORD-102', supplier: 'Coca-Cola FEMSA', arrivalDate: '2024-08-02', items: 120, status: 'Confirmado' },
  { id: 'ORD-103', supplier: 'Diageo Venezuela', arrivalDate: '2024-08-10', items: 30, status: 'Pendiente' },
  { id: 'ORD-104', supplier: 'Frigorífico Andino', arrivalDate: '2024-08-01', items: 25, status: 'Entregado' },
];

export const casheaReceipts = [
  { receiptId: 'CSH-9871', date: '2024-07-28', amount: '$89.99', customer: 'Ana Pérez' },
  { receiptId: 'CSH-9870', date: '2024-07-26', amount: '$120.00', customer: 'Luis González' },
];

export const bcvReceipts = [
  { receiptId: 'BCV-5541', date: '2024-07-27', amount: '$25.50', customer: 'María Rodriguez' },
];

export const banescoReceipts = [
  { receiptId: 'BAN-1123', date: '2024-07-27', amount: '$312.00', customer: 'Carlos Sánchez (Empresa)' },
];