import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface DollarRateContextProps {
  rate: number | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

const DollarRateContext = createContext<DollarRateContextProps | undefined>(undefined);

export const DollarRateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [rate, setRate] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRate = async () => {
    setLoading(true);
    setError(null);
    try {
  const res = await fetch('https://ve.dolarapi.com/v1/dolares/oficial');
      if (!res.ok) throw new Error('No se pudo obtener la tasa');
      const data = await res.json();
      setRate(typeof data.promedio === 'number' ? data.promedio : 0);
    } catch (e) {
      setError('No disponible');
      setRate(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRate();
    const interval = setInterval(fetchRate, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <DollarRateContext.Provider value={{ rate, loading, error, refresh: fetchRate }}>
      {children}
    </DollarRateContext.Provider>
  );
};

export function useDollarRate() {
  const ctx = useContext(DollarRateContext);
  if (!ctx) throw new Error('useDollarRate debe usarse dentro de DollarRateProvider');
  return ctx;
}
