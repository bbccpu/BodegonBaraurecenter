import React from 'react';
// Fix: Import for side-effects to load global custom JSX element types for ion-icon.
import '../types';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TermsModal: React.FC<TermsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-2xl p-8 w-full max-w-2xl m-4 relative border border-gray-700 max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Términos y Condiciones</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white">
                <ion-icon name="close-outline" style={{fontSize: '24px'}}></ion-icon>
            </button>
        </div>
        <div className="overflow-y-auto pr-4 text-gray-300 space-y-4">
            <p>Este es un documento de ejemplo para los Términos y Condiciones. Al utilizar nuestro sitio web, usted acepta cumplir y estar sujeto a los siguientes términos y condiciones de uso, que junto con nuestra política de privacidad rigen la relación de Bodegon Baraure Centro con usted en relación con este sitio web.</p>
            <h3 className="font-bold text-lg text-white pt-2">1. Uso del Sitio Web</h3>
            <p>El contenido de las páginas de este sitio web es para su información y uso general. Está sujeto a cambios sin previo aviso.</p>
            <h3 className="font-bold text-lg text-white pt-2">2. Propiedad Intelectual</h3>
            <p>Este sitio web contiene material que es propiedad nuestra o que tenemos licenciado. Este material incluye, pero no se limita a, el diseño, la disposición, el aspecto, la apariencia y los gráficos. Se prohíbe la reproducción, excepto de conformidad con el aviso de derechos de autor, que forma parte de estos términos y condiciones.</p>
            <h3 className="font-bold text-lg text-white pt-2">3. Exclusión de Responsabilidad</h3>
            <p>Ni nosotros ni ningún tercero ofrecemos ninguna garantía en cuanto a la exactitud, puntualidad, rendimiento, integridad o idoneidad de la información y los materiales que se encuentran u ofrecen en este sitio web para un propósito particular. Usted reconoce que dicha información y materiales pueden contener inexactitudes o errores y excluimos expresamente la responsabilidad por tales inexactitudes o errores en la máxima medida permitida por la ley.</p>
        </div>
        <div className="mt-6 text-right">
            <button onClick={onClose} className="bg-primary-orange text-white font-bold py-2 px-6 rounded-md hover:bg-orange-600 transition-colors duration-300">
                Cerrar
            </button>
        </div>
      </div>
    </div>
  );
};