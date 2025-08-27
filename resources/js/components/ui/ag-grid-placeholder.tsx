import React from 'react';

interface AgGridPlaceholderProps {
    isMobile?: boolean;
    rows?: number;
    columns?: number;
}

export const AgGridPlaceholder: React.FC<AgGridPlaceholderProps> = ({
    isMobile = false,
    rows = 20,
    columns = 32
}) => {
    const rowHeight = isMobile ? 24 : 32;
    const headerHeight = isMobile ? 40 : 50;
    const cellWidth = isMobile ? 40 : 50;
    const nameColumnWidth = isMobile ? 120 : 150;

    return (
        <div className="w-full h-full bg-white border border-gray-200 rounded-lg overflow-hidden">
            {/* Header Placeholder */}
            <div
                className="bg-gray-50 border-b border-gray-200 flex"
                style={{ height: headerHeight }}
            >
                {/* Name column header */}
                <div
                    className="bg-gray-100 border-r border-gray-200 flex items-center justify-center"
                    style={{ width: nameColumnWidth, minWidth: nameColumnWidth }}
                >
                    <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
                </div>

                {/* Day columns headers */}
                {Array.from({ length: columns }, (_, i) => (
                    <div
                        key={i}
                        className="border-r border-gray-200 flex flex-col items-center justify-center"
                        style={{ width: cellWidth, minWidth: cellWidth }}
                    >
                        <div className="w-4 h-3 bg-gray-200 rounded animate-pulse mb-1"></div>
                        <div className="w-3 h-2 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                ))}
            </div>

            {/* Rows Placeholder */}
            <div className="overflow-hidden">
                {Array.from({ length: rows }, (_, rowIndex) => (
                    <div
                        key={rowIndex}
                        className="flex border-b border-gray-100"
                        style={{ height: rowHeight }}
                    >
                        {/* Name column */}
                        <div
                            className="border-r border-gray-100 flex items-center px-2"
                            style={{ width: nameColumnWidth, minWidth: nameColumnWidth }}
                        >
                            <div className="w-20 h-3 bg-gray-100 rounded animate-pulse"></div>
                        </div>

                        {/* Day columns */}
                        {Array.from({ length: columns }, (_, colIndex) => (
                            <div
                                key={colIndex}
                                className="border-r border-gray-50 flex items-center justify-center"
                                style={{ width: cellWidth, minWidth: cellWidth }}
                            >
                                <div className="w-6 h-4 bg-gray-50 rounded animate-pulse"></div>
                            </div>
                        ))}
                    </div>
                ))}
            </div>

            {/* Loading indicator */}
            <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                    <p className="text-sm text-gray-600">Cargando turnos...</p>
                </div>
            </div>
        </div>
    );
};

export default AgGridPlaceholder;
