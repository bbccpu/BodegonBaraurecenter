import type { Product } from '../types';

export const initialProducts: Product[] = [
  // Despensa
  { id: 1, name: "Arroz Primor 1kg", code: "BBC001", price_usd: 1.5, imageUrl: "https://picsum.photos/seed/rice/400/300", category: "Despensa", subcategory: "Arroz", isBestSeller: true, quantity: 150 },
  { id: 2, name: "Harina P.A.N. 1kg", code: "BBC002", price_usd: 1.2, imageUrl: "https://picsum.photos/seed/cornflour/400/300", category: "Despensa", subcategory: "Harinas", isBestSeller: true, quantity: 200 },
  { id: 3, name: "Pasta Ronco Larga 1kg", code: "BBC003", price_usd: 1.8, imageUrl: "https://picsum.photos/seed/pasta/400/300", category: "Despensa", subcategory: "Pastas", quantity: 120 },
  { id: 4, name: "Aceite Mazeite 1L", code: "BBC004", price_usd: 2.5, imageUrl: "https://picsum.photos/seed/oil/400/300", category: "Despensa", subcategory: "Aceites", isBestSeller: true, quantity: 100 },

  // Alimentos Frescos
  { id: 5, name: "Jamón de Pavo 250g", code: "BBC005", price_usd: 3.0, imageUrl: "https://picsum.photos/seed/ham/400/300", category: "Alimentos Frescos", subcategory: "Charcutería", quantity: 50 },
  { id: 6, name: "Queso Blanco Fresco 500g", code: "BBC006", price_usd: 4.0, imageUrl: "https://picsum.photos/seed/cheese/400/300", category: "Alimentos Frescos", subcategory: "Charcutería", isBestSeller: true, quantity: 80 },
  { id: 7, name: "Tomates por Kg", code: "BBC007", price_usd: 1.0, imageUrl: "https://picsum.photos/seed/tomatoes/400/300", category: "Alimentos Frescos", subcategory: "Verduras y Hortalizas", quantity: 250 },

  // Licores
  { id: 8, name: "Cerveza Polar Pilsen (Caja)", code: "BBC008", price_usd: 24.0, imageUrl: "https://picsum.photos/seed/beer/400/300", category: "Licores", subcategory: "Cerveza Nacional", isBestSeller: true, quantity: 40 },
  { id: 9, name: "Ron Cacique Añejo 0.75L", code: "BBC009", price_usd: 8.0, imageUrl: "https://picsum.photos/seed/rum/400/300", category: "Licores", subcategory: "Rones", isBestSeller: true, quantity: 60 },
  { id: 10, name: "Whisky Old Parr 12 Años 0.75L", code: "BBC010", price_usd: 30.0, imageUrl: "https://picsum.photos/seed/whisky/400/300", category: "Licores", subcategory: "Whisky", quantity: 25 },

  // Bebidas
  { id: 11, name: "Coca-Cola 2L", code: "BBC011", price_usd: 2.0, imageUrl: "https://picsum.photos/seed/soda/400/300", category: "Bebidas", subcategory: "Refrescos", quantity: 300 },
  { id: 12, name: "Agua Minalba 5L", code: "BBC012", price_usd: 2.2, imageUrl: "https://picsum.photos/seed/water/400/300", category: "Bebidas", subcategory: "Agua", quantity: 180 },
  { id: 13, name: "Malta Maltin Polar (Six-Pack)", code: "BBC013", price_usd: 3.5, imageUrl: "https://picsum.photos/seed/malta/400/300", category: "Bebidas", subcategory: "Maltas", isBestSeller: true, quantity: 100 },
];