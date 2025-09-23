import React, { createContext, useState, useContext, ReactNode, useEffect, useMemo } from 'react';

interface Background {
  name: string;
  className: string;
  previewStyle: React.CSSProperties;
}

export const backgrounds: Record<string, Background> = {
  default: {
    name: 'Oscuro Clásico',
    className: 'bg-gray-900',
    previewStyle: { backgroundColor: '#111827' },
  },
  carbon: {
    name: 'Fibra de Carbono',
    className: 'bg-carbon-fiber',
    previewStyle: {
      backgroundColor: '#282828',
      backgroundImage: `
        linear-gradient(45deg, rgba(0, 0, 0, 0.2) 25%, transparent 25%, transparent 75%, rgba(0, 0, 0, 0.2) 75%, rgba(0, 0, 0, 0.2)),
        linear-gradient(-45deg, rgba(0, 0, 0, 0.2) 25%, transparent 25%, transparent 75%, rgba(0, 0, 0, 0.2) 75%, rgba(0, 0, 0, 0.2))
      `,
      backgroundSize: '8px 8px',
    }
  },
  wood: {
    name: 'Madera Oscura',
    className: 'bg-dark-wood',
    previewStyle: {
      backgroundImage: `url('https://www.transparenttextures.com/patterns/dark-wood.png')`,
      backgroundColor: '#3a322d'
    }
  },
  geometric: {
    name: 'Puntos Geométricos',
    className: 'bg-geo-dots',
    previewStyle: {
      backgroundColor: '#0d1117',
      backgroundImage: `radial-gradient(circle at 1px 1px, #2d333b 1px, transparent 0)`,
      backgroundSize: '20px 20px',
    }
  },
};

const backgroundClasses = Object.values(backgrounds).map(b => b.className);

interface BackgroundContextType {
  background: string;
  setBackground: (background: string) => void;
}

const BackgroundContext = createContext<BackgroundContextType | undefined>(undefined);

export const BackgroundProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [background, setBackground] = useState(() => {
    return localStorage.getItem('bbc-background') || 'default';
  });

  useEffect(() => {
    const currentBg = backgrounds[background];
    if (currentBg) {
      document.body.classList.remove(...backgroundClasses);
      document.body.classList.add(currentBg.className);
      localStorage.setItem('bbc-background', background);
    }
  }, [background]);

  const value = useMemo(() => ({ background, setBackground }), [background]);

  return (
    <BackgroundContext.Provider value={value}>
      {children}
    </BackgroundContext.Provider>
  );
};

export const useBackground = () => {
  const context = useContext(BackgroundContext);
  if (context === undefined) {
    throw new Error('useBackground must be used within a BackgroundProvider');
  }
  return context;
};
