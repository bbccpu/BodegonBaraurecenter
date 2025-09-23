
import type { Category } from '../types';

export const categories: Category[] = [
  {
    name: "Despensa",
    subcategories: [
      { name: "Arroz" },
      { name: "Harinas" },
      { name: "Pastas" },
      { name: "Aceites" },
      { name: "Granos" },
      { name: "Azúcar, Sal y Condimentos" },
      { name: "Salsas" },
      { name: "Untables" },
    ],
  },
  {
    name: "Alimentos Frescos",
    subcategories: [
      { name: "Charcutería" },
      { name: "Verduras y Hortalizas" },
      { name: "Carnicería" },
      { name: "Pescadería" },
      { name: "Huevos" },
      { name: "Pollo" },
    ],
  },
  {
    name: "Congelados y Refrigerados",
    subcategories: [
      { name: "Pasapalos Congelados" },
      { name: "Comida Lista" },
      { name: "Hielo" },
      { name: "Helados" },
      { name: "Masas" },
    ],
  },
  {
    name: "Licores",
    subcategories: [
      { name: "Cerveza Nacional" },
      { name: "Rones" },
      { name: "Whisky" },
      { name: "Bebidas Dulces" },
      { name: "Espumantes" },
    ],
  },
  {
    name: "Bebidas",
    subcategories: [
      { name: "Refrescos" },
      { name: "Agua" },
      { name: "Bebidas Instantáneas" },
      { name: "Bebidas Energéticas" },
      { name: "Maltas" },
    ],
  },
  {
    name: "Cuidado Personal",
    subcategories: [
        { name: "Cuidado del Cabello" },
        { name: "Higiene Bucal" },
        { name: "Jabones y Geles" },
    ]
  },
  {
    name: "Limpieza",
    subcategories: [
        { name: "Limpiadores de Piso" },
        { name: "Detergentes" },
        { name: "Lavaplatos" },
    ]
  },
];
