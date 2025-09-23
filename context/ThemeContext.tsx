import React, { createContext, useState, useContext, ReactNode, useEffect, useMemo } from 'react';

interface Palette {
  name: string;
  colors: {
    '--color-primary-dark': string;
    '--color-primary-orange': string;
    '--color-primary-light-green': string;
    '--color-primary-light-green-dark': string;
    '--color-vibrant-red': string;
    '--color-vibrant-red-dark': string;
    '--color-vinotinto': string;
  };
}

export const palettes: Record<string, Palette> = {
  classic: {
    name: 'Clásico BBC',
    colors: {
      '--color-primary-dark': '#004d40',
      '--color-primary-orange': '#f57c00',
      '--color-primary-light-green': '#a2c13c',
      '--color-primary-light-green-dark': '#829a30',
      '--color-vibrant-red': '#DC2626',
      '--color-vibrant-red-dark': '#b01e1e',
      '--color-vinotinto': '#8D1C3D',
    },
  },
  neon: {
    name: 'Neón Nocturno',
    colors: {
      '--color-primary-dark': '#4a00e0',
      '--color-primary-orange': '#00bfff',
      '--color-primary-light-green': '#39ff14',
      '--color-primary-light-green-dark': '#2ecc11',
      '--color-vibrant-red': '#ff0055',
      '--color-vibrant-red-dark': '#d9004a',
      '--color-vinotinto': '#8338ec',
    },
  },
  sunset: {
    name: 'Atardecer Caribeño',
    colors: {
      '--color-primary-dark': '#2c3e50',
      '--color-primary-orange': '#ff8c42',
      '--color-primary-light-green': '#f9c80e',
      '--color-primary-light-green-dark': '#d6ac0c',
      '--color-vibrant-red': '#e74c3c',
      '--color-vibrant-red-dark': '#c23f31',
      '--color-vinotinto': '#c0392b',
    },
  },
  forest: {
    name: 'Bosque Profundo',
    colors: {
      '--color-primary-dark': '#1b4332',
      '--color-primary-orange': '#ffb703',
      '--color-primary-light-green': '#70e000',
      '--color-primary-light-green-dark': '#5fb900',
      '--color-vibrant-red': '#c1121f',
      '--color-vibrant-red-dark': '#a40f1a',
      '--color-vinotinto': '#7f5539',
    },
  },
  orchid: {
    name: 'Orquídea Salvaje',
    colors: {
      '--color-primary-dark': '#581c87',
      '--color-primary-orange': '#e879f9',
      '--color-primary-light-green': '#f472b6',
      '--color-primary-light-green-dark': '#f04da5',
      '--color-vibrant-red': '#db2777',
      '--color-vibrant-red-dark': '#ba2164',
      '--color-vinotinto': '#86198f',
    },
  },
  galaxy: {
    name: 'Galaxia Púrpura',
    colors: {
      '--color-primary-dark': '#3b0764',
      '--color-primary-orange': '#c026d3',
      '--color-primary-light-green': '#a78bfa',
      '--color-primary-light-green-dark': '#9373f9',
      '--color-vibrant-red': '#f43f5e',
      '--color-vibrant-red-dark': '#f22346',
      '--color-vinotinto': '#7e22ce',
    },
  },
  lilac: {
    name: 'Lila Luminoso',
    colors: {
      '--color-primary-dark': '#4C1D95',
      '--color-primary-orange': '#C4B5FD',
      '--color-primary-light-green': '#F9A8D4',
      '--color-primary-light-green-dark': '#F472B6',
      '--color-vibrant-red': '#D946EF',
      '--color-vibrant-red-dark': '#C026D3',
      '--color-vinotinto': '#7E22CE',
    },
  },
  pink: {
    name: 'Furia Rosa',
    colors: {
      '--color-primary-dark': '#831843',
      '--color-primary-orange': '#F472B6',
      '--color-primary-light-green': '#5EEAD4',
      '--color-primary-light-green-dark': '#2DD4BF',
      '--color-vibrant-red': '#EC4899',
      '--color-vibrant-red-dark': '#DB2777',
      '--color-vinotinto': '#BE185D',
    },
  },
  cyber_blue: {
    name: 'Ciber Azul',
    colors: {
      '--color-primary-dark': '#082f49',
      '--color-primary-orange': '#0ea5e9',
      '--color-primary-light-green': '#A3E635',
      '--color-primary-light-green-dark': '#84CC16',
      '--color-vibrant-red': '#F43F5E',
      '--color-vibrant-red-dark': '#E11D48',
      '--color-vinotinto': '#2563EB',
    },
  },
  matrix_green: {
    name: 'Matrix Verde',
    colors: {
      '--color-primary-dark': '#18181b',
      '--color-primary-orange': '#FACC15',
      '--color-primary-light-green': '#4ADE80',
      '--color-primary-light-green-dark': '#22C55E',
      '--color-vibrant-red': '#EC4899',
      '--color-vibrant-red-dark': '#DB2777',
      '--color-vinotinto': '#059669',
    },
  },
  liquid_gold: {
    name: 'Oro Líquido',
    colors: {
      '--color-primary-dark': '#1c1917',
      '--color-primary-orange': '#FBBF24',
      '--color-primary-light-green': '#D1D5DB',
      '--color-primary-light-green-dark': '#9CA3AF',
      '--color-vibrant-red': '#B91C1C',
      '--color-vibrant-red-dark': '#991B1B',
      '--color-vinotinto': '#422006',
    },
  },
};

interface ThemeContextType {
  theme: string;
  setTheme: (theme: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('bbc-theme') || 'classic';
  });

  useEffect(() => {
    const currentPalette = palettes[theme];
    if (currentPalette) {
      const root = document.documentElement;
      Object.entries(currentPalette.colors).forEach(([key, value]) => {
        root.style.setProperty(key, value);
      });
      localStorage.setItem('bbc-theme', theme);
    }
  }, [theme]);

  const value = useMemo(() => ({ theme, setTheme }), [theme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
