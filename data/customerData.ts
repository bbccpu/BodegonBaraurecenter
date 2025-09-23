import type { Customer } from '../types';

export const initialCustomers: Customer[] = [
  {
    id: 'CUST-001',
    name: 'Ana Pérez',
    email: 'ana.perez@email.com',
    phone: '0414-1234567',
    joinDate: '2024-01-15',
    totalSpent: 1250.75,
    lastOrderDate: '2024-07-28',
  },
  {
    id: 'CUST-002',
    name: 'Luis González',
    email: 'luis.gonzalez@email.com',
    phone: '0412-7654321',
    joinDate: '2023-11-20',
    totalSpent: 3480.50,
    lastOrderDate: '2024-07-26',
  },
  {
    id: 'CUST-003',
    name: 'María Rodriguez',
    email: 'maria.r@email.com',
    phone: '0424-5558899',
    joinDate: '2024-03-10',
    totalSpent: 890.00,
    lastOrderDate: '2024-07-27',
  },
  {
    id: 'CUST-004',
    name: 'Carlos Sánchez',
    email: 'carlos.sanchez@empresa.com',
    phone: '0416-9876543',
    joinDate: '2022-05-01',
    totalSpent: 15200.00,
    lastOrderDate: '2024-07-27',
  },
  {
    id: 'CUST-005',
    name: 'Elena Gómez',
    email: 'elena.gomez@email.com',
    phone: '0414-1112233',
    joinDate: '2024-06-05',
    totalSpent: 315.25,
    lastOrderDate: '2024-07-25',
  },
];
