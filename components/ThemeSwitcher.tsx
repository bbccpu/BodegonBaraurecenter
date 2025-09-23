import React, { useState } from 'react';
import { useTheme, palettes } from '../context/ThemeContext';
// Fix: Import for side-effects to load global custom JSX element types for ion-icon.
import '../types';

export const ThemeSwitcher: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-gray-800 bg-opacity-80 backdrop-blur-sm p-3 rounded-full text-gray-300 transition-all duration-300 hover:scale-110 hover:text-primary-orange shadow-lg border border-gray-700"
        aria-label="Cambiar paleta de colores"
      >
        <ion-icon name="color-palette-outline" style={{ fontSize: '24px', display: 'block' }}></ion-icon>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-gray-800 rounded-lg shadow-2xl p-6 w-full max-w-lg m-4 relative border border-gray-700">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Elige una Paleta de Colores</h2>
                <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">
                    <ion-icon name="close-outline" style={{fontSize: '24px'}}></ion-icon>
                </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(palettes).map(([key, palette]) => (
                <div key={key} className={`p-4 rounded-lg border-2 transition-colors ${theme === key ? 'border-primary-orange bg-gray-700' : 'border-gray-600 bg-gray-900'}`}>
                  <h3 className="font-bold mb-3 text-lg">{palette.name}</h3>
                  <div className="flex space-x-2 mb-4">
                    {Object.values(palette.colors).map((color, index) => (
                      <div key={index} className="w-8 h-8 rounded-full shadow-inner" style={{ backgroundColor: color }}></div>
                    ))}
                  </div>
                  <button
                    onClick={() => {
                      setTheme(key);
                      setIsOpen(false);
                    }}
                    disabled={theme === key}
                    className="w-full bg-primary-orange text-white font-bold py-2 px-4 rounded-md hover:bg-orange-600 transition-colors duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed"
                  >
                    {theme === key ? 'Seleccionada' : 'Aplicar'}
                  </button>
                </div>
              ))}
            </div>

          </div>
        </div>
      )}
    </>
  );
};