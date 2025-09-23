import React, { useState, useMemo } from 'react';
import { useDollarRate } from '../../context/DollarRateContext';
import { useNavigate } from 'react-router-dom';
// Fix: Import for side-effects to load global custom JSX element types for ion-icon.
import '../../types';

interface GenericTableViewProps {
    title: string;
    data: Record<string, any>[];
}

const ITEMS_PER_PAGE = 10;

// Fix: Added SortConfig interface and typed the state and hook parameter to fix type errors.
interface SortConfig {
    key: string;
    direction: 'ascending' | 'descending';
}

// Custom hook for sorting
const useSortableData = (items: Record<string, any>[], config: SortConfig = { key: '', direction: 'ascending' }) => {
    const [sortConfig, setSortConfig] = useState<SortConfig>(config);

    const sortedItems = useMemo(() => {
        if (!items) return [];
        let sortableItems = [...items];
        if (sortConfig.key) {
            sortableItems.sort((a, b) => {
                const aValue = a[sortConfig.key];
                const bValue = b[sortConfig.key];

                if (aValue < bValue) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [items, sortConfig]);

    const requestSort = (key: string) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    return { items: sortedItems, requestSort, sortConfig };
};


const GenericTableView: React.FC<GenericTableViewProps> = ({ title, data }) => {
    const navigate = useNavigate();
    const [currentPage, setCurrentPage] = useState(1);
    
    // Set initial sort key based on the first header
    const initialSortKey = (Array.isArray(data) && data.length > 0) ? Object.keys(data[0])[0] : '';
    const { items: sortedData, requestSort, sortConfig } = useSortableData(data, { key: initialSortKey, direction: 'ascending' });

    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return sortedData.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [currentPage, sortedData]);

    const totalPages = Math.ceil(sortedData.length / ITEMS_PER_PAGE);

    const handleExport = () => {
        if (!Array.isArray(data) || data.length === 0) return;

        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => 
                headers.map(header => {
                    let cell = row[header] === null || row[header] === undefined ? '' : String(row[header]);
                    if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
                        cell = `"${cell.replace(/"/g, '""')}"`;
                    }
                    return cell;
                }).join(',')
            )
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        const filename = `${title.toLowerCase().replace(/\s+/g, '_')}.csv`;
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    
    if (!Array.isArray(data) || data.length === 0 || typeof data[0] !== 'object' || data[0] === null) {
        return (
            <div>
                <div className="mb-6">
                    <button onClick={() => navigate(-1)} className="flex items-center text-sm text-gray-400 hover:text-white transition-colors">
                        <ion-icon name="arrow-back-outline" className="mr-1"></ion-icon>
                        Volver
                    </button>
                </div>
                <h1 className="text-3xl font-bold text-white mb-8">{title}</h1>
                <div className="bg-gray-800 p-8 rounded-lg text-center text-gray-400">
                    No hay datos para mostrar.
                </div>
            </div>
        );
    }
    
    const headers = Object.keys(data[0]);
    const SortIcon: React.FC<{ direction?: 'ascending' | 'descending' }> = ({ direction }) => {
        if (!direction) return null;
        return direction === 'ascending' ? 
            <ion-icon name="arrow-up-outline" className="ml-1"></ion-icon> : 
            <ion-icon name="arrow-down-outline" className="ml-1"></ion-icon>;
    };

    const { rate, loading } = useDollarRate();
    return (
        <div>
            <div className="mb-6">
                 <button onClick={() => navigate(-1)} className="flex items-center text-sm text-gray-400 hover:text-white transition-colors">
                    <ion-icon name="arrow-back-outline" className="mr-1"></ion-icon>
                    Volver
                </button>
            </div>
            <div className="flex justify-between items-center mb-8">
                 <h1 className="text-3xl font-bold text-white">{title}</h1>
                 <button 
                    onClick={handleExport}
                    className="flex items-center bg-primary-orange text-white font-bold py-2 px-4 rounded-md hover:bg-orange-600 transition-colors duration-300"
                >
                    <ion-icon name="download-outline" className="mr-2"></ion-icon>
                    Exportar a CSV
                </button>
            </div>
            <div className="bg-gray-800 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-700">
                            <tr>
                                {headers.map(header => (
                                    <th key={header} className="p-4 font-semibold capitalize">
                                        <button onClick={() => requestSort(header)} className="flex items-center hover:text-primary-orange transition-colors">
                                            {header.replace(/([A-Z])/g, ' $1')}
                                            {sortConfig.key === header && <SortIcon direction={sortConfig.direction} />}
                                        </button>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedData.map((row, rowIndex) => (
                                <tr key={rowIndex} className="border-b border-gray-700 hover:bg-gray-700/50">
                                    {headers.map(header => {
                                        const value = row[header];
                                        // Detecta si es un campo de precio
                                        if (typeof value === 'number' && /price|total|monto|importe|pago|abono|deuda|saldo/i.test(header)) {
                                            const usd = value;
                                            const bss = rate ? usd * rate : null;
                                            return (
                                                <td key={`${rowIndex}-${header}`} className="p-4">
                                                    <span className="text-primary-orange font-bold">${usd.toFixed(2)}</span>
                                                    <span className="block text-green-400 text-xs font-semibold">
                                                        {loading ? 'Cargando...' : bss !== null ? `${bss.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs` : 'No disponible'}
                                                    </span>
                                                </td>
                                            );
                                        }
                                        return (
                                            <td key={`${rowIndex}-${header}`} className="p-4">{value}</td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                 {totalPages > 1 && (
                    <div className="flex justify-between items-center p-4 bg-gray-700">
                        <button 
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Anterior
                        </button>
                        <span className="text-gray-300">
                            Página {currentPage} de {totalPages}
                        </span>
                        <button 
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Siguiente
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GenericTableView;
