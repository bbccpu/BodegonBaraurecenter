// Fix: Changed 'import type' to a full 'import' for React to ensure the global JSX namespace declaration for 'ion-icon' is correctly applied.
import React from 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      // Fix: Updated ion-icon type to use React.DetailedHTMLProps for better compatibility with custom elements and removed the problematic 'class' property.
      'ion-icon': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & { name: string; };
    }
  }
}

export interface Product {
  id: number;
  name: string;
  code: string;
  barcode?: string;
  price_usd: number; // Corrected: This is the main price from the DB
  price_bss?: number;
  imageurl: string; // Changed to match database field name
  category: string;
  subcategory: string;
  isbestseller?: boolean; // Changed to match database field name
  quantity: number;
  weight?: number;
  weight_unit?: string;
  iva_status?: 'E' | 'N'; // E = Exento, N = No exento
}

export interface CartItem extends Product {
  cartQuantity: number;
}

export interface Subcategory {
  name: string;
}

export interface Category {
  name: string;
  subcategories: Subcategory[];
}

// --- New Types for Admin Panel ---

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  joinDate: string;
  totalSpent: number;
  lastOrderDate: string;
}

export interface OrderItem {
  productId: number;
  productName: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  customerName: string;
  customerId?: string | null; // Optional for anonymous orders
  date: string;
  total: number;
  status: 'Completado' | 'Pendiente' | 'Cancelado' | 'En Proceso';
  items: OrderItem[];
  // Payment fields
  payment_method?: string;
  payment_reference?: string;
  customer_email?: string | null;
  payment_instructions?: string;
  payment_status?: string;
  // Shipping fields
  shipping_name?: string;
  shipping_lastname?: string;
  shipping_id?: string;
  shipping_phone?: string;
}


export type UserRole = 'T1' | 'T2' | 'T3';

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole; // T1: User, T2: Cashier/Stock, T3: Admin
}

export interface Profile {
  id: string;
  username?: string;
  email: string;
  role: UserRole;
  cedula?: string;
  nombre?: string;
  apellido?: string;
  phone?: string;
}

export interface SupplyOrder {
  id: string;
  supplier: string;
  date: string;
  status: 'Pendiente' | 'Recibido' | 'Cancelado';
  items: Array<{
    productName: string;
    quantity: number;
    price: number;
  }>;
  total: number;
}
