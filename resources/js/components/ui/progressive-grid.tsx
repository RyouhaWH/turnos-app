import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, GridReadyEvent, RowNode } from 'ag-grid-community';
import { Skeleton } from '@/components/ui/skeleton';

interface ProgressiveGridProps {
    rowData: any[];
    columnDefs: ColDef[];
    onGridReady?: (params: GridReadyEvent) => void;
    chunkSize?: number;
    delayBetweenChunks?: number;
    placeholderRows?: number;
    className?: string;
}

export const ProgressiveGrid: React.FC<ProgressiveGridProps> = ({
    rowData,
    columnDefs,
    onGridReady,
    chunkSize = 50,
    delayBetweenChunks = 100,
    placeholderRows = 20,
    className = '',
}) => {
    const [displayedData, setDisplayedData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentChunk, setCurrentChunk] = useState(0);
    const [gridApi, setGridApi] = useState<any>(null);

    // Generar datos placeholder
    const placeholderData = useMemo(() => {
        return Array.from({ length: placeholderRows }, (_, index) => ({
            id: `placeholder-${index}`,
            nombre: `Cargando empleado ${index + 1}...`,
            isPlaceholder: true,
        }));
    }, [placeholderRows]);

    // Función para cargar datos progresivamente
    const loadDataProgressively = useCallback(async () => {
        if (!rowData || rowData.length === 0) {
            setDisplayedData([]);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setCurrentChunk(0);

        // Mostrar placeholders inicialmente
        setDisplayedData(placeholderData);

        // Simular delay para mostrar placeholders
        await new Promise(resolve => setTimeout(resolve, 200));

        const totalChunks = Math.ceil(rowData.length / chunkSize);
        let loadedData: any[] = [];

        for (let i = 0; i < totalChunks; i++) {
            const startIndex = i * chunkSize;
            const endIndex = Math.min(startIndex + chunkSize, rowData.length);
            const chunk = rowData.slice(startIndex, endIndex);

            loadedData = [...loadedData, ...chunk];
            setDisplayedData(loadedData);
            setCurrentChunk(i + 1);

            // Delay entre chunks para no bloquear el hilo principal
            if (i < totalChunks - 1) {
                await new Promise(resolve => setTimeout(resolve, delayBetweenChunks));
            }
        }

        setIsLoading(false);
    }, [rowData, chunkSize, delayBetweenChunks, placeholderData]);

    // Cargar datos cuando cambie rowData
    useEffect(() => {
        loadDataProgressively();
    }, [loadDataProgressively]);

    // Configuración de la grid optimizada
    const gridOptions = useMemo(() => ({
        rowData: displayedData,
        columnDefs,
        defaultColDef: {
            sortable: true,
            filter: true,
            resizable: true,
            suppressMenu: true,
        },
        rowHeight: 40,
        headerHeight: 50,
        suppressRowClickSelection: true,
        suppressCellFocus: true,
        suppressRowHoverHighlight: true,
        suppressColumnVirtualisation: false,
        suppressRowVirtualisation: false,
        enableCellTextSelection: true,
        suppressMovableColumns: true,
        suppressMenuHide: true,
        suppressColumnMoveAnimation: true,
        suppressRowMoveAnimation: true,
        suppressAnimationFrame: true,
        suppressBrowserResizeObserver: true,
        suppressPropertyNamesCheck: true,
        suppressFieldDotNotation: true,
        suppressParentInRowNodes: true,
        suppressModelUpdateAfterUpdateTransaction: true,
        suppressAggFuncInHeader: true,
        suppressMenu: true,
        suppressMenuHide: true,
        suppressColumnMoveAnimation: true,
        suppressRowMoveAnimation: true,
        suppressAnimationFrame: true,
        suppressBrowserResizeObserver: true,
        suppressPropertyNamesCheck: true,
        suppressFieldDotNotation: true,
        suppressParentInRowNodes: true,
        suppressModelUpdateAfterUpdateTransaction: true,
        suppressAggFuncInHeader: true,
    }), [displayedData, columnDefs]);

    // Renderizar placeholder para filas de carga
    const getRowClass = useCallback((params: { data: any }) => {
        if (params.data?.isPlaceholder) {
            return 'placeholder-row';
        }
        return '';
    }, []);

    // Componente de placeholder para celdas
    const PlaceholderCell = () => (
        <div className="flex items-center space-x-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
        </div>
    );

    return (
        <div className={`ag-theme-alpine ${className}`}>
            {/* Indicador de progreso */}
            {isLoading && rowData.length > 0 && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-blue-700">
                            Cargando datos... {Math.round((currentChunk * chunkSize / rowData.length) * 100)}%
                        </span>
                        <div className="w-32 bg-blue-200 rounded-full h-2">
                            <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${(currentChunk * chunkSize / rowData.length) * 100}%` }}
                            />
                        </div>
                    </div>
                </div>
            )}

            <AgGridReact
                {...gridOptions}
                onGridReady={(params) => {
                    setGridApi(params.api);
                    onGridReady?.(params);
                }}
                getRowClass={getRowClass}
                components={{
                    placeholderCell: PlaceholderCell,
                }}
            />

            {/* Estilos para placeholders */}
            <style jsx>{`
                .placeholder-row {
                    background-color: #f8f9fa;
                    opacity: 0.7;
                }
                .placeholder-row .ag-cell {
                    color: #6c757d;
                }
            `}</style>
        </div>
    );
};
