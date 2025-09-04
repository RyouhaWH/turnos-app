import React, { useMemo, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import { AgGridReact } from 'ag-grid-react';
import {
    AllCommunityModule,
    ModuleRegistry,
    ColDef,
    CellValueChangedEvent,
    GridReadyEvent,
    CellClickedEvent,
    GridApi,
} from 'ag-grid-community';

ModuleRegistry.registerModules([AllCommunityModule]);

interface TurnoData {
    id: string;
    nombre: string;
    amzoma?: boolean | string | number;
    first_name?: string;
    paternal_lastname?: string;
    rut?: string;
    employee_id?: string | number;
    [key: string]: string | boolean | number | undefined;
}

interface SimpleExcelGridProps {
    rowData: TurnoData[];
    onCellValueChanged?: (change: any) => void;
    editable?: boolean;
    month?: number;
    year?: number;
    onGridReady?: (api: any) => void;
}

export interface SimpleExcelGridRef {
    autoSizeColumns: (columns?: string[]) => void;
    sizeColumnsToFit: () => void;
    api?: GridApi<TurnoData>;
}

// Extraer días del mes
const extractDaysFromData = (rowData: TurnoData[]): number[] => {
    if (!rowData || rowData.length === 0) return [];

    const sampleRow = rowData[0];
    if (!sampleRow) return [];

    const days = Object.keys(sampleRow)
        .filter(key => !['id', 'nombre', 'amzoma', 'first_name', 'paternal_lastname', 'rut', 'employee_id'].includes(key))
        .map(key => parseInt(key))
        .filter(day => !isNaN(day) && day >= 1 && day <= 31)
        .sort((a, b) => a - b);

    return days;
};

// Generar información del día
const getDayInfo = (day: number, month: number, year: number) => {
    const date = new Date(year, month, day);
    const diaSemana = date.getDay();
    const diasCortos = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];

    return {
        day,
        nombre: diasCortos[diaSemana],
        isFinDeSemana: diaSemana === 0 || diaSemana === 6,
    };
};

const SimpleExcelGrid = forwardRef<SimpleExcelGridRef, SimpleExcelGridProps>(({
    rowData,
    onCellValueChanged,
    editable = true,
    month,
    year,
    onGridReady,
}, ref) => {
    const gridRef = useRef<AgGridReact<TurnoData>>(null);

    // Usar fecha actual si no se proporcionan month/year
    const currentDate = useMemo(() => new Date(), []);
    const activeMonth = useMemo(() => month !== undefined ? month : currentDate.getMonth(), [month]);
    const activeYear = useMemo(() => year !== undefined ? year : currentDate.getFullYear(), [year]);

    // Extraer días y generar información
    const daysInData = useMemo(() => extractDaysFromData(rowData), [rowData]);
    const daysInfo = useMemo(() => {
        return daysInData.map(day => getDayInfo(day, activeMonth, activeYear));
    }, [daysInData, activeMonth, activeYear]);

    // Definición de columnas simplificada
    const columnDefs = useMemo<ColDef[]>(() => {
        const columns: ColDef[] = [
            {
                headerName: 'Nombre',
                field: 'nombre',
                pinned: 'left',
                minWidth: 150,
                maxWidth: 200,
                resizable: true,
                valueGetter: (params) => {
                    if (params.data?.first_name && params.data?.paternal_lastname) {
                        const firstName = String(params.data.first_name).split(' ')[0];
                        return `${firstName} ${params.data.paternal_lastname}`;
                    }
                    return params.data?.nombre || '';
                },
            }
        ];

        // Agregar columnas para cada día
        daysInfo.forEach((dayInfo) => {
            const fieldName = dayInfo.day.toString();

            columns.push({
                headerName: `${dayInfo.day} (${dayInfo.nombre})`,
                field: fieldName,
                editable: editable,
                width: 60,
                minWidth: 60,
                maxWidth: 80,
                cellClass: (params) => {
                    const classes = [];
                    if (dayInfo.isFinDeSemana) classes.push('weekend-cell');
                    if (params.value) {
                        const firstChar = String(params.value).toLowerCase().charAt(0);
                        classes.push(`shift-${firstChar}`);
                    }
                    return classes.join(' ');
                },
                valueParser: (params) => {
                    const value = String(params.newValue || '').toUpperCase().trim();
                    // Permitir hasta 3 caracteres para turnos como "LM"
                    return value.slice(0, 3);
                },
            });
        });

        return columns;
    }, [daysInfo, editable]);

    // Manejar cambios de celda
    const handleCellChange = useCallback((e: CellValueChangedEvent<TurnoData>) => {
        if (!e?.data || !e.colDef?.field) return;

        const employeeName = String(e.data.nombre || '');
        const employeeRut = String(e.data.rut || '');
        const employeeId = String(e.data.employee_id || e.data.id || '');
        const day = e.colDef.field;

        if (['nombre', 'id', 'employee_id', 'rut'].includes(day)) return;

        const newValue = String(e.newValue || '');
        const oldValue = String(e.oldValue || '');

        if (onCellValueChanged && oldValue !== newValue) {
            const change = {
                id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                employeeId,
                employeeName,
                employeeRut,
                day,
                oldValue,
                newValue,
                timestamp: Date.now(),
            };

            onCellValueChanged(change);
        }
    }, [onCellValueChanged]);

    // Configurar grid cuando esté listo
    const handleGridReady = useCallback((params: GridReadyEvent<TurnoData>) => {
        setTimeout(() => {
            if (params.api) {
                params.api.autoSizeColumns(['nombre']);
                setTimeout(() => {
                    params.api.sizeColumnsToFit();
                }, 50);
            }
        }, 100);

        // Notificar al componente padre que el grid está listo
        if (onGridReady && params.api) {
            onGridReady(params.api);
        }
    }, [onGridReady]);

    // Exponer métodos de la API
    useImperativeHandle(ref, () => ({
        autoSizeColumns: (columns?: string[]) => {
            const api = gridRef.current?.api;
            if (api) {
                if (columns) {
                    api.autoSizeColumns(columns);
                } else {
                    api.autoSizeAllColumns();
                }
            }
        },
        sizeColumnsToFit: () => {
            gridRef.current?.api?.sizeColumnsToFit();
        },
        api: gridRef.current?.api,
    }));

    return (
        <div className="w-full h-full">
            {/* Estilos CSS básicos */}
            <style>{`
                .ag-theme-alpine .ag-cell {
                    text-align: center !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                }

                .ag-theme-alpine .ag-cell[col-id="nombre"] {
                    text-align: start !important;
                    justify-content: flex-start !important;
                    padding: 4px 8px !important;
                }

                /* Colores para turnos */
                .ag-theme-alpine .shift-m { background-color: #ffe0b3 !important; color: #e65100 !important; }
                .ag-theme-alpine .shift-t { background-color: #b3d9ff !important; color: #1976d2 !important; }
                .ag-theme-alpine .shift-n { background-color: #b39ddb !important; color: #f3e5f5 !important; }
                .ag-theme-alpine .shift-v { background-color: #ffd4b3 !important; color: #ef6c00 !important; }
                .ag-theme-alpine .shift-a { background-color: #b3e6ff !important; color: #0277bd !important; }
                .ag-theme-alpine .shift-s { background-color: #f2b3d9 !important; color: #c2185b !important; }
                .ag-theme-alpine .shift-lm { background-color: #ffb3b3 !important; color: #c62828 !important; }
                .ag-theme-alpine .shift-pe { background-color: #e1bee7 !important; color: #7b1fa2 !important; }
                .ag-theme-alpine .shift-lc { background-color: #dcedc8 !important; color: #33691e !important; }

                .ag-theme-alpine .shift-1 { background-color: #ffe0b3 !important; }
                .ag-theme-alpine .shift-2 { background-color: #b3d9ff !important; }
                .ag-theme-alpine .shift-3 { background-color: #d9d9d9 !important; }

                /* F y L sin color en días de semana */
                .ag-theme-alpine .shift-f,
                .ag-theme-alpine .shift-l {
                    background-color: transparent !important;
                }

                /* Fines de semana */
                .ag-theme-alpine .weekend-cell.shift-m { background-color: #ffcc80 !important; color: #e65100 !important; }
                .ag-theme-alpine .weekend-cell.shift-t { background-color: #90caf9 !important; color: #1976d2 !important; }
                .ag-theme-alpine .weekend-cell.shift-n { background-color: #9575cd !important; color: #ede7f6 !important; }
                .ag-theme-alpine .weekend-cell.shift-v { background-color: #ffb74d !important; color: #ef6c00 !important; }
                .ag-theme-alpine .weekend-cell.shift-a { background-color: #81d4fa !important; color: #0277bd !important; }
                .ag-theme-alpine .weekend-cell.shift-s { background-color: #f48fb1 !important; color: #c2185b !important; }
                .ag-theme-alpine .weekend-cell.shift-lm { background-color: #ef5350 !important; color: #c62828 !important; }
                .ag-theme-alpine .weekend-cell.shift-pe { background-color: #ce93d8 !important; color: #7b1fa2 !important; }
                .ag-theme-alpine .weekend-cell.shift-lc { background-color: #c5e1a5 !important; color: #33691e !important; }

                .ag-theme-alpine .weekend-cell.shift-1 { background-color: #ffcc80 !important; color: #e65100 !important; }
                .ag-theme-alpine .weekend-cell.shift-2 { background-color: #90caf9 !important; color: #1976d2 !important; }
                .ag-theme-alpine .weekend-cell.shift-3 { background-color: #bcbcbc !important; color: #424242 !important; }

                .ag-theme-alpine .weekend-cell.shift-f,
                .ag-theme-alpine .weekend-cell.shift-l {
                    background-color: #e8e8e8 !important;
                    color: #666666 !important;
                }
            `}</style>

            <AgGridReact
                ref={gridRef}
                rowData={rowData}
                columnDefs={columnDefs}
                defaultColDef={{
                    resizable: false,
                    sortable: false,
                    filter: false,
                }}
                onCellValueChanged={handleCellChange}
                onGridReady={handleGridReady}
                headerHeight={50}
                rowHeight={32}
                suppressLoadingOverlay={true}
                suppressNoRowsOverlay={true}
                animateRows={false}
                suppressContextMenu={true}
            />
        </div>
    );
});

SimpleExcelGrid.displayName = 'SimpleExcelGrid';

export default SimpleExcelGrid;
