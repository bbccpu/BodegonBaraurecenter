import type { User } from '../types';

export const initialUsers: User[] = [
  {
    id: 'USER-001',
    username: 'admin',
    email: 'admin@bodegon.com',
    role: 'T3', // Admin
  },
  {
    id: 'USER-002',
    username: 'cajero01',
    email: 'cajero01@bodegon.com',
    role: 'T2', // Cajero y Stock
  },
  {
    id: 'USER-003',
    username: 'ana.perez',
    email: 'ana.perez@email.com',
    role: 'T1', // Usuario
  },
  {
    id: 'USER-004',
    username: 'luis.gonzalez',
    email: 'luis.gonzalez@email.com',
    role: 'T1', // Usuario
  },
  {
    id: 'USER-005',
    username: 'stockmanager',
    email: 'stock@bodegon.com',
    role: 'T2', // Cajero y Stock
  },
];
