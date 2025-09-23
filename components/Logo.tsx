import React from 'react';

export const Logo: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <svg width="50" height="45" viewBox="0 0 55 50" className="flex-shrink-0">
        <g stroke="#004d40" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 3 H8 L14 33 H45 L52 10 H12" />
          <path d="M2 3 L6 18" />
        </g>
        <circle cx="18" cy="42" r="5" fill="#f57c00" />
        <circle cx="40" cy="42" r="5" fill="#004d40" />

        <text x="14" y="27" fontFamily="Verdana, sans-serif" fontSize="18" fontWeight="bold" fill="#004d40">B</text>
        <text x="25" y="27" fontFamily="Verdana, sans-serif" fontSize="18" fontWeight="bold" fill="#f57c00">B</text>
        <text x="36" y="27" fontFamily="Verdana, sans-serif" fontSize="18" fontWeight="bold" fill="#a2c13c">C</text>
      </svg>
      <div className="flex flex-col justify-center">
        <span className="text-lg font-bold tracking-tight text-white hidden md:block whitespace-nowrap leading-tight">
          Bodegon Baraure Center
        </span>
        <span className="text-xs font-bold tracking-wider text-gray-400 hidden md:block whitespace-nowrap">
          2025 C.A
        </span>
         <div className="text-2xl font-bold tracking-wider md:hidden">
            <span className="text-primary-dark">B</span>
            <span className="text-primary-orange">B</span>
            <span className="text-primary-light-green">C</span>
        </div>
      </div>
    </div>
  );
};
