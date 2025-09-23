import React from 'react';
import { useDollarRate } from '../context/DollarRateContext';

// Componente que muestra la tasa oficial USD -> BSS usando el contexto global (https://ve.dolarapi.com/v1/dolares/oficial)
export const DollarRateBanner: React.FC = () => {
  const { rate, loading, error } = useDollarRate();
  return (
    <div className="my-4 flex items-center justify-center">
      <div className="bg-gray-900 border border-primary-orange rounded-lg px-4 py-2 flex items-center gap-2 shadow-md">
        <span className="text-primary-orange font-bold">Tasa Oficial:</span>
        {loading ? (
          <span className="text-gray-300">Cargando...</span>
        ) : error ? (
          <span className="text-red-400">{error}</span>
        ) : (
          <span className="text-white font-mono text-lg">1 USD = {rate?.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs</span>
        )}
      </div>
    </div>
  );
};
