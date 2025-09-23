import type { Coupon } from '../types';

export const initialCoupons: Coupon[] = [
  {
    id: 'CUP-ASDF123',
    code: 'BIENVENIDO10',
    type: 'percentage',
    value: 10,
    expiryDate: '2024-12-31',
    status: 'active',
  },
  {
    id: 'CUP-QWER456',
    code: 'VERANO2024',
    type: 'fixed',
    value: 5,
    expiryDate: '2024-08-31',
    status: 'active',
  },
  {
    id: 'CUP-ZXCV789',
    code: 'DIA-DEL-PADRE',
    type: 'percentage',
    value: 15,
    expiryDate: '2024-06-16',
    status: 'expired',
  },
  {
    id: 'CUP-TYUI012',
    code: 'COMPRA100',
    type: 'fixed',
    value: 20,
    expiryDate: '2025-01-01',
    status: 'active',
  },
];
