import React, { useState } from 'react';
import { useBackground, backgrounds } from '../context/BackgroundContext';
// Fix: Import for side-effects to load global custom JSX element types for ion-icon.
import '../types';

export const BackgroundSwitcher: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { background, setBackground } = useBackground();

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-gray-800 bg-opacity-80 backdrop-blur-sm p-3 rounded-full text-gray-300 transition-all duration-300 hover:scale-110 hover:text-primary-orange shadow-lg border border-gray-700"
        aria-label="Cambiar fondo de la página"
      >
        <ion-icon name="image-outline" style={{ fontSize: '24px', display: 'block' }}></ion-icon>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-gray-800 rounded-lg shadow-2xl p-6 w-full max-w-lg m-4 relative border border-gray-700">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Elige un Fondo</h2>
                <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">
                    <ion-icon name="close-outline" style={{fontSize: '24px'}}></ion-icon>
                </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(backgrounds).map(([key, bg]) => (
                <div key={key} className={`p-4 rounded-lg border-2 transition-colors ${background === key ? 'border-primary-orange bg-gray-700' : 'border-gray-600 bg-gray-900'}`}>
                  <h3 className="font-bold mb-3 text-lg">{bg.name}</h3>
                  <div className="w-full h-24 rounded-md shadow-inner mb-4" style={bg.previewStyle}></div>
                  <button
                    onClick={() => {
                      setBackground(key);
                      setIsOpen(false);
                    }}
                    disabled={background === key}
                    className="w-full bg-primary-orange text-white font-bold py-2 px-4 rounded-md hover:bg-orange-600 transition-colors duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed"
                  >
                    {background === key ? 'Seleccionado' : 'Aplicar'}
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