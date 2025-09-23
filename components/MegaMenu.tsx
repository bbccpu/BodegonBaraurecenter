import React, { useState } from 'react';
import { Link } from 'react-router-dom';
// Fix: Import for side-effects to load global custom JSX element types for ion-icon.
import '../types';
// Fix: Changed to a full import to ensure global type declarations for custom JSX elements like 'ion-icon' are loaded.
import { Category } from '../types';

interface MegaMenuProps {
  categories: Category[];
  isOpen: boolean;
  onClose: () => void;
}

const slugify = (text: string) => text.toLowerCase().replace(/\s+/g, '-');

export const MegaMenu: React.FC<MegaMenuProps> = ({ categories, isOpen, onClose }) => {
  const [openCategory, setOpenCategory] = useState<string | null>(null);

  const toggleCategory = (categoryName: string) => {
    setOpenCategory(openCategory === categoryName ? null : categoryName);
  };

  const handleLinkClick = () => {
    onClose();
  };

  return (
    <>
      {/* Backdrop for mobile */}
      <div 
          className={`fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          onClick={onClose}
          aria-hidden="true"
      ></div>

      <nav className={`fixed inset-y-0 left-0 z-40 w-64 bg-gray-800 p-4 transform transition-transform duration-300 ease-in-out 
                     ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
                     md:sticky md:translate-x-0 md:top-[72px] md:h-[calc(100vh-72px)] md:z-auto md:w-64 flex-shrink-0`}>
        <div className="flex justify-between items-center mb-4 md:block">
          <h2 className="text-xl font-bold text-white">Categorías</h2>
          <button onClick={onClose} className="text-white md:hidden">
              <ion-icon name="close-outline" style={{fontSize: '28px'}}></ion-icon>
          </button>
        </div>
        <ul className="overflow-y-auto h-[calc(100%-4rem)]">
          {categories.map((category) => (
            <li key={category.name} className="mb-2">
              <button
                onClick={() => toggleCategory(category.name)}
                className="w-full text-left font-semibold text-white hover:text-primary-orange transition-colors duration-200 flex justify-between items-center p-2 rounded-md"
                aria-expanded={openCategory === category.name}
              >
                {category.name}
                <span className={`transform transition-transform duration-300 ${openCategory === category.name ? 'rotate-180' : 'rotate-0'}`}>
                  <ion-icon name="chevron-down-outline"></ion-icon>
                </span>
              </button>
              <div
                className={`overflow-hidden transition-all duration-500 ease-in-out ${openCategory === category.name ? 'max-h-96' : 'max-h-0'}`}
              >
                <ul className="pl-4 pt-2">
                  {category.subcategories.map((sub) => (
                    <li key={sub.name} className="mb-2">
                      <Link
                        to={`/category/${slugify(sub.name)}`}
                        onClick={handleLinkClick}
                        className="block text-gray-300 hover:text-white hover:bg-gray-700 p-2 rounded-md transition-colors duration-200"
                      >
                        {sub.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
};