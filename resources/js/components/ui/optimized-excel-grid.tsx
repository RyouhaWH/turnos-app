import React, { useMemo, useRef, useEffect, useCallback, useState, forwardRef, useImperativeHandle } from 'react';
import { AgGridReact } from 'ag-grid-react';
import {
    AllCommunityModule,
    ModuleRegistry,
    ColDef,
    CellValueChangedEvent,
    GridReadyEvent,
    CellClickedEvent,
    GridApi,
    GetRowIdParams,
    RowClassParams,
    CellClassParams,
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
    isSeparator?: boolean;
    isGroupHeader?: boolean;
    groupType?: 'amzoma' | 'municipal' | 'totals';
    isTotalsRow?: boolean;
    shiftType?: string;
    [key: string]: string | boolean | number | undefined;
}

interface OptimizedGridChange {
    id: string;
    employeeId: string;
    employeeName: string;
    employeeRut: string;
    day: string;
    oldValue: string;
    newValue: string;
    timestamp: number;
}

interface OptimizedExcelGridProps {
    rowData: TurnoData[];
    onCellValueChanged?: (change: OptimizedGridChange) => void;
    onRowClicked?: (event: any) => void;
    onGridReady?: (api: any) => void; // Para sistema de undo
    editable?: boolean;
    month?: number;
    year?: number;
    pendingChanges?: OptimizedGridChange[];
    showPendingChanges?: boolean;
    isProcessingChanges?: boolean;
    hiddenShiftTypes?: Set<string>;
    className?: string;
    showTotals?: boolean; // Nueva prop para mostrar totales
    selectedTotalsShiftTypes?: Set<string>; // Tipos de turnos seleccionados para totales
}

export interface OptimizedExcelGridRef {
    autoSizeColumns: (columns?: string[]) => void;
    sizeColumnsToFit: () => void;
    refreshCells: () => void;
    api?: GridApi<TurnoData>;
}

// Componente optimizado para header de fechas
const OptimizedDateHeader = React.memo((props: any) => {
    const { displayName, dayInfo } = props;

    if (!dayInfo) {
        return (
            <div className="flex h-full items-center justify-center px-1 text-center">
                <div className="text-sm font-bold">{displayName}</div>
            </div>
        );
    }

    return (
        <div className={`flex h-full flex-col items-center justify-center p-1 text-center ${
            dayInfo.isFinDeSemana ? '' : ''
        }`}>
            <div className="text-sm font-bold leading-tight">{dayInfo.day}</div>
            <div className="text-xs leading-tight opacity-80">{dayInfo.nombre}</div>
        </div>
    );
});

// Extraer días del mes optimizado
const extractDaysFromData = (rowData: TurnoData[]): number[] => {
    if (!rowData || rowData.length === 0) return [];

    const sampleRow = rowData.find(row => !row.isSeparator) || rowData[0];
    if (!sampleRow) return [];

    const days = Object.keys(sampleRow)
        .filter(key => !['id', 'nombre', 'amzoma', 'first_name', 'paternal_lastname', 'rut', 'employee_id', 'isSeparator', 'isGroupHeader', 'groupType'].includes(key))
        .map(key => parseInt(key))
        .filter(day => !isNaN(day) && day >= 1 && day <= 31)
        .sort((a, b) => a - b);

    return days;
};

// Generar información del día optimizada
const getDayInfo = (day: number, month: number, year: number) => {
    const date = new Date(year, month, day);
    const diaSemana = date.getDay();
    const diasCortos = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];

    return {
        day,
        fecha: date,
        nombre: diasCortos[diaSemana],
        isFinDeSemana: diaSemana === 0 || diaSemana === 6,
        isSabado: diaSemana === 6,
        isDomingo: diaSemana === 0,
        diaSemana,
    };
};

// Función para aplicar cambios pendientes a los datos
const applyPendingChangesToData = (data: TurnoData[], pendingChanges: OptimizedGridChange[]): TurnoData[] => {
    if (!pendingChanges || pendingChanges.length === 0) return data;

    // Crear una copia profunda de los datos para no modificar el original
    const dataWithChanges = data.map(row => {
        const newRow = { ...row };
        // Copiar todas las propiedades dinámicas (días del mes)
        Object.keys(row).forEach(key => {
            if (!['id', 'nombre', 'amzoma', 'first_name', 'paternal_lastname', 'rut', 'employee_id', 'isSeparator', 'isGroupHeader', 'groupType', 'isTotalsRow', 'shiftType'].includes(key)) {
                (newRow as any)[key] = (row as any)[key];
            }
        });
        return newRow;
    });

    // Aplicar cada cambio pendiente
    pendingChanges.forEach(change => {
        const targetRow = dataWithChanges.find(row =>
            String(row.employee_id || row.id || '') === change.employeeId
        );

        if (targetRow && change.day) {
            (targetRow as any)[change.day] = change.newValue;
        }
    });

    return dataWithChanges;
};

// Función para calcular totales por tipo de turno
const calculateTotalsByShiftType = (data: TurnoData[], daysInData: number[], selectedShiftTypes: Set<string>): TurnoData[] => {
    if (!data || data.length === 0 || daysInData.length === 0) return [];

    // Obtener todos los tipos de turnos únicos presentes en los datos
    const availableShiftTypes = new Set<string>();
    data.forEach(row => {
        if (!row.isSeparator) {
            daysInData.forEach(day => {
                const value = String(row[day.toString()] || '').toUpperCase().trim();
                if (value && value !== '') {
                    availableShiftTypes.add(value);
                }
            });
        }
    });

    // Filtrar solo los tipos de turnos seleccionados que están disponibles en los datos
    const shiftTypesToShow = Array.from(availableShiftTypes).filter(shiftType =>
        selectedShiftTypes.size === 0 || selectedShiftTypes.has(shiftType)
    );

    // Crear filas de totales para cada tipo de turno
    const totalsRows: TurnoData[] = [];

    shiftTypesToShow.sort().forEach(shiftType => {
        const totalsRow: TurnoData = {
            id: `totals-${shiftType}`,
            nombre: `${shiftType}`,
            isSeparator: true,
            isGroupHeader: false,
            isTotalsRow: true,
            shiftType: shiftType,
        };

        // Calcular totales para cada día
        daysInData.forEach(day => {
            const dayStr = day.toString();
            let count = 0;

            data.forEach(row => {
                if (!row.isSeparator) {
                    const value = String(row[dayStr] || '').toUpperCase().trim();
                    if (value === shiftType) {
                        count++;
                    }
                }
            });

            (totalsRow as any)[dayStr] = count > 0 ? count.toString() : '';
        });

        totalsRows.push(totalsRow);
    });

    return totalsRows;
};

// Función para agregar separadores optimizada
const addOptimizedSeparators = (data: TurnoData[]): TurnoData[] => {
    if (!data || data.length === 0) return data;

    const result: TurnoData[] = [];
    let hasAmzoma = false;
    let hasNonAmzoma = false;

    // Verificar tipos de empleados
    data.forEach(item => {
        const isAmzoma = item.amzoma === true || item.amzoma === 'true' || item.amzoma === 1;
        if (isAmzoma) hasAmzoma = true;
        else hasNonAmzoma = true;
    });

    if (!hasAmzoma || !hasNonAmzoma) return data;

    // Crear separadores optimizados
    const createSeparator = (id: string, text: string, groupType: 'amzoma' | 'municipal'): TurnoData => {
        const separator: TurnoData = {
            id,
            nombre: text,
            isSeparator: true,
            isGroupHeader: true,
            groupType,
        };

        // Agregar campos de días
        const sampleRow = data[0];
        Object.keys(sampleRow).forEach(key => {
            if (!['id', 'nombre', 'amzoma', 'first_name', 'paternal_lastname', 'rut', 'employee_id'].includes(key)) {
                (separator as any)[key] = '';
            }
        });

        return separator;
    };

    let municipalAdded = false;
    let amzomaAdded = false;

    data.forEach(item => {
        const isAmzoma = item.amzoma === true || item.amzoma === 'true' || item.amzoma === 1;

        if (!isAmzoma && !municipalAdded) {
            result.push(createSeparator('municipal-header', '▼ MUNICIPAL', 'municipal'));
            municipalAdded = true;
        }

        if (isAmzoma && !amzomaAdded) {
            result.push(createSeparator('amzoma-header', '▼ AMZOMA', 'amzoma'));
            amzomaAdded = true;
        }

        result.push(item);
    });

    return result;
};

const OptimizedExcelGrid = forwardRef<OptimizedExcelGridRef, OptimizedExcelGridProps>((
    {
        rowData,
        onCellValueChanged,
        onRowClicked,
        onGridReady,
        editable = true,
        month,
        year,
        pendingChanges = [],
        showPendingChanges = false,
        isProcessingChanges = false,
        hiddenShiftTypes = new Set(),
        className = '',
        showTotals = false,
        selectedTotalsShiftTypes = new Set(),
    },
    ref
) => {
    const gridRef = useRef<AgGridReact<TurnoData>>(null);
    const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

    // Usar fecha actual si no se proporcionan month/year
    const currentDate = useMemo(() => new Date(), []);
    const activeMonth = useMemo(() => month !== undefined ? month : currentDate.getMonth(), [month]);
    const activeYear = useMemo(() => year !== undefined ? year : currentDate.getFullYear(), [year]);

    // Procesar datos con separadores y grupos colapsados
    const processedRowData = useMemo(() => {
        const dataWithSeparators = addOptimizedSeparators(rowData);

        let filteredData: TurnoData[] = [];
        let skipUntilNextGroup = false;

        dataWithSeparators.forEach((row) => {
            if (row.isGroupHeader) {
                const currentGroup = row.groupType || null;
                skipUntilNextGroup = currentGroup ? collapsedGroups.has(currentGroup) : false;
                filteredData.push(row);
            } else if (!skipUntilNextGroup) {
                filteredData.push(row);
            }
        });

        // Agregar totales si está habilitado
        if (showTotals && filteredData.length > 0) {
            // Crear una copia temporal solo para calcular totales (incluyendo cambios pendientes)
            const dataForTotalsCalculation = applyPendingChangesToData(filteredData, pendingChanges);
            const daysInData = extractDaysFromData(dataForTotalsCalculation);
            const totalsRows = calculateTotalsByShiftType(dataForTotalsCalculation, daysInData, selectedTotalsShiftTypes);

            if (totalsRows.length > 0) {
                // Crear separador de totales
                const hasPendingChanges = pendingChanges && pendingChanges.length > 0;
                const totalsSeparator: TurnoData = {
                    id: 'totals-separator',
                    nombre: hasPendingChanges ? '▼ TOTAL (Actualizado)' : '▼ TOTAL',
                    isSeparator: true,
                    isGroupHeader: true,
                    groupType: 'totals',
                };

                // Agregar campos de días vacíos al separador
                const sampleRow = filteredData[0];
                Object.keys(sampleRow).forEach(key => {
                    if (!['id', 'nombre', 'amzoma', 'first_name', 'paternal_lastname', 'rut', 'employee_id'].includes(key)) {
                        (totalsSeparator as any)[key] = '';
                    }
                });

                // Agregar separador y totales a los datos principales (sin cambios pendientes aplicados)
                filteredData.push(totalsSeparator);
                filteredData.push(...totalsRows);
            }
        }

        return filteredData;
    }, [rowData, collapsedGroups, showTotals, selectedTotalsShiftTypes, pendingChanges]);

    // Extraer días y generar información
    const daysInData = useMemo(() => extractDaysFromData(processedRowData), [processedRowData]);
    const daysInfo = useMemo(() => {
        return daysInData.map(day => getDayInfo(day, activeMonth, activeYear));
    }, [daysInData, activeMonth, activeYear]);

    // Crear mapa de cambios pendientes para mejor performance
    const pendingChangesMap = useMemo(() => {
        const map = new Map<string, OptimizedGridChange>();
        pendingChanges.forEach(change => {
            const key = `${change.employeeId}-${change.day}`;
            map.set(key, change);
        });
        return map;
    }, [pendingChanges]);

    // Definición de columnas optimizada
    const columnDefs = useMemo<ColDef[]>(() => {
        const columns: ColDef[] = [
            {
                headerName: 'Nombre',
                field: 'nombre',
                pinned: 'left',
                minWidth: 60,
                maxWidth: 150,
                flex: 0,
                suppressSizeToFit: true,
                lockPosition: true,
                suppressMovable: true,
                resizable: true,
                sortable: true,
                filter: false,
                cellClass: (params: CellClassParams) => {
                    if (params.data?.isTotalsRow) return 'totals-name-cell';
                    if (params.data?.isSeparator) {
                        const classes = ['separator-name-cell'];
                        if (params.data?.groupType === 'totals') {
                            classes.push('totals-separator');
                        }
                        return classes.join(' ');
                    }
                    return 'employee-name-cell';
                },
                cellStyle: (params) => {
                    if (params.data?.isTotalsRow) {
                        return {
                            fontSize: '11px',
                            fontWeight: '600',
                            textAlign: 'center',
                            backgroundColor: '#f8fafc',
                            color: '#1e293b',
                        } as any;
                    }
                    if (params.data?.isSeparator) {
                        return {
                            fontSize: '10px',
                            fontWeight: '500',
                            //borderTop: '1px solid #e5e7eb',
                            //borderBottom: '1px solid #e5e7eb',
                            textAlign: 'center',
                            cursor: params.data?.isGroupHeader ? 'pointer' : 'default',
                        } as any;
                    }
                    return {
                        fontSize: '12px',
                        textAlign: 'start',
                        padding: '4px 8px',
                    } as any;
                },
                valueGetter: (params) => {
                    if (params.data?.isGroupHeader) {
                        const groupType = params.data.groupType;
                        const isCollapsed = collapsedGroups.has(groupType || '');
                        const icon = isCollapsed ? '▶' : '▼';
                        const text = params.data.nombre.replace(/^[▶▼]\s*/, '');
                        return `${icon} ${text}`;
                    }

                    if (params.data?.isSeparator) return params.data.nombre;

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
                headerName: fieldName,
                field: fieldName,
                headerComponent: OptimizedDateHeader,
                headerComponentParams: { dayInfo },
                editable: (params) => {
                    if (params.data?.isSeparator || params.data?.isTotalsRow || isProcessingChanges) return false;
                    return editable;
                },
                width: 40,
                minWidth: 30,
                maxWidth: 75,
                flex: 1,
                lockPosition: true,
                suppressMovable: true,
                resizable: false,
                sortable: false,
                filter: false,
                headerClass: dayInfo.isFinDeSemana ? 'weekend-header' : '',
                cellClass: (params: CellClassParams) => {
                    const classes = [];

                    if (params.data?.isTotalsRow) {
                        classes.push('totals-cell');
                        return classes.join(' ');
                    }

                    if (params.data?.isSeparator) {
                        classes.push('separator-cell');
                        return classes.join(' ');
                    }

                    if (dayInfo.isFinDeSemana) classes.push('weekend-cell');
                    if (dayInfo.isDomingo) classes.push('day-d');
                    if (dayInfo.isSabado) classes.push('day-s');

                    if (params.value) {
                        const shiftValue = String(params.value).toLowerCase();
                        // Para turnos de múltiples caracteres como LM, usar el valor completo
                        if (shiftValue === 'lm') {
                            classes.push('shift-lm');
                        } else if (shiftValue === 'sa') {
                            classes.push('shift-sa');
                        } else {
                            // Para turnos de un solo carácter, usar el primer carácter
                            const firstChar = shiftValue.charAt(0);
                            classes.push(`shift-${firstChar}`);
                        }

                        // Ocultar celda si el tipo de turno está en hiddenShiftTypes
                        if (hiddenShiftTypes.has(String(params.value).toUpperCase())) {
                            classes.push('hidden-shift');
                        }
                    }

                    // Agregar clase para cambios pendientes
                    if (showPendingChanges && params.data) {
                        const employeeId = String(params.data.employee_id || params.data.id || '');
                        const key = `${employeeId}-${fieldName}`;
                        if (pendingChangesMap.has(key)) {
                            classes.push('pending-change');
                        }
                    }


                    return classes.join(' ');
                },
                valueGetter: (params) => {
                    // Si es una fila de totales o separador, mostrar el valor normal
                    if (params.data?.isTotalsRow || params.data?.isSeparator) {
                        return (params.data as any)[fieldName];
                    }

                    // Para filas normales, verificar si hay cambios pendientes
                    if (params.data && fieldName) {
                        const employeeId = String(params.data.employee_id || params.data.id || '');
                        const key = `${employeeId}-${fieldName}`;
                        const pendingChange = pendingChangesMap.get(key);
                        
                        if (pendingChange) {
                            return pendingChange.newValue;
                        }
                    }

                    return (params.data as any)[fieldName];
                },
                valueParser: (params) => {
                    const value = String(params.newValue || '').toUpperCase().trim();
                    // Permitir hasta 3 caracteres para turnos como "LM"
                    return value.slice(0, 3);
                },
            });
        });

        return columns;
    }, [daysInfo, editable, collapsedGroups, isProcessingChanges, showPendingChanges, pendingChangesMap, hiddenShiftTypes]);

    // Manejar cambios de celda optimizado
    const handleCellChange = useCallback((e: CellValueChangedEvent<TurnoData>) => {
        if (!e?.data || !e.colDef?.field || e.data.isSeparator || e.data.isTotalsRow || isProcessingChanges) return;

        const employeeName = String(e.data.nombre || '');
        const employeeRut = String(e.data.rut || '');
        const employeeId = String(e.data.employee_id || e.data.id || '');
        const day = e.colDef.field;

        if (['nombre', 'id', 'employee_id', 'rut'].includes(day)) return;

        const newValue = String(e.newValue || '');
        const oldValue = String(e.oldValue || '');

        if (onCellValueChanged && oldValue !== newValue) {
            const change: OptimizedGridChange = {
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
    }, [onCellValueChanged, isProcessingChanges]);

    // Manejar clicks en celdas
    const onCellClicked = useCallback((event: CellClickedEvent<TurnoData>) => {
        // Manejar click en headers de grupo
        if (event.data?.isGroupHeader && event.colDef?.field === 'nombre') {
            const groupType = event.data.groupType;
            if (groupType && groupType !== 'totals') { // No permitir colapsar totales
                setCollapsedGroups(prev => {
                    const newSet = new Set(prev);
                    if (newSet.has(groupType)) {
                        newSet.delete(groupType);
                    } else {
                        newSet.add(groupType);
                    }
                    return newSet;
                });
            }
            return;
        }

        // Otros clicks
        if (event.colDef?.field !== 'nombre' && onRowClicked) {
            onRowClicked(event);
        }
    }, [onRowClicked]);

    // Configurar grid cuando esté listo
    const handleGridReady = useCallback((params: GridReadyEvent<TurnoData>) => {
        // Notificar al padre que el grid está listo (para sistema de undo)
        if (onGridReady && params.api) {
            onGridReady(params.api);
        }

        // Configuración inicial del grid
        requestAnimationFrame(() => {
            if (params.api) {
                params.api.autoSizeColumns(['nombre']);
                requestAnimationFrame(() => {
                    params.api.sizeColumnsToFit();
                });
            }
        });
    }, [onGridReady]);

    // Obtener ID de fila optimizado
    const getRowId = useCallback((params: GetRowIdParams<TurnoData>) => {
        return params.data.id || params.data.nombre || `row-${Math.random()}`;
    }, []);

    // Clases de fila optimizadas
    const getRowClass = useCallback((params: RowClassParams<TurnoData>) => {
        const classes = [];

        if (params.data?.isTotalsRow) {
            classes.push('totals-row');
        } else if (params.data?.isSeparator) {
            classes.push('separator-row');
        }

        if (isProcessingChanges) {
            classes.push('processing-changes');
        }

        return classes.join(' ');
    }, [isProcessingChanges]);

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
        refreshCells: () => {
            gridRef.current?.api?.refreshCells({ force: true });
        },
        api: gridRef.current?.api,
    }));

    // Redimensionar columnas cuando cambien los datos
    useEffect(() => {
        if (gridRef.current?.api && processedRowData.length > 0) {
            requestAnimationFrame(() => {
                const api = gridRef.current?.api;
                if (api) {
                    api.autoSizeColumns(['nombre']);
                    requestAnimationFrame(() => {
                        api.sizeColumnsToFit();
                    });
                }
            });
        }
    }, [processedRowData]);

    return (
        <div className={`w-full h-full ${className}`}>
            {/* Estilos CSS optimizados */}
            <style>{`
                .ag-theme-alpine .ag-cell {
                    text-align: center !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                }

                .ag-theme-alpine .employee-name-cell {
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
                .ag-theme-alpine .shift-lm { background-color: #ffcdd2 !important; color: #d32f2f !important; }
                .ag-theme-alpine .shift-pe { background-color: #e1bee7 !important; color: #7b1fa2 !important; }
                .ag-theme-alpine .shift-lc { background-color: #dcedc8 !important; color: #33691e !important; }

                .ag-theme-alpine .shift-1 { background-color: #ffe0b3 !important; }
                .ag-theme-alpine .shift-2 { background-color: #b3d9ff !important; }
                .ag-theme-alpine .shift-3 { background-color: #d9d9d9 !important; }

                /* F, L y SA sin color en días de semana */
                .ag-theme-alpine .shift-f,
                .ag-theme-alpine .shift-l,
                .ag-theme-alpine .shift-sa {
                    background-color: transparent !important;
                }

                /* Fines de semana */
                .ag-theme-alpine .weekend-cell.shift-m { background-color: #ffcc80 !important; color: #e65100 !important; }
                .ag-theme-alpine .weekend-cell.shift-t { background-color: #90caf9 !important; color: #1976d2 !important; }
                .ag-theme-alpine .weekend-cell.shift-n { background-color: #9575cd !important; color: #ede7f6 !important; }
                .ag-theme-alpine .weekend-cell.shift-v { background-color: #ffb74d !important; color: #ef6c00 !important; }
                .ag-theme-alpine .weekend-cell.shift-a { background-color: #81d4fa !important; color: #0277bd !important; }
                .ag-theme-alpine .weekend-cell.shift-s { background-color: #f48fb1 !important; color: #c2185b !important; }
                .ag-theme-alpine .weekend-cell.shift-lm { background-color: #f44336 !important; color: #ffffff !important; }
                .ag-theme-alpine .weekend-cell.shift-pe { background-color: #ce93d8 !important; color: #7b1fa2 !important; }
                .ag-theme-alpine .weekend-cell.shift-lc { background-color: #c5e1a5 !important; color: #33691e !important; }

                .ag-theme-alpine .weekend-cell.shift-1 { background-color: #ffcc80 !important; color: #e65100 !important; }
                .ag-theme-alpine .weekend-cell.shift-2 { background-color: #90caf9 !important; color: #1976d2 !important; }
                .ag-theme-alpine .weekend-cell.shift-3 { background-color: #bcbcbc !important; color: #424242 !important; }

                .ag-theme-alpine .weekend-cell.shift-f,
                .ag-theme-alpine .weekend-cell.shift-l,
                .ag-theme-alpine .weekend-cell.shift-sa {
                    background-color: #fafafa !important;
                    color: #666666 !important;
                }
                // .ag-theme-alpine .weekend-cell.day-s {
                //     border-left: 2px solid #2b2b2b !important;
                // }
                // .ag-theme-alpine .weekend-cell.day-d {
                //     border-right: 2px solid #2b2b2b !important;
                // }

                .ag-theme-alpine .weekend-header {
                    background-color: #f5f5f5 !important;
                    font-weight: 600 !important;
                }
                .ag-theme-alpine .weekend-cell{
                    opacity: 1 !important;
                }

                /* Cambios pendientes */
                .ag-theme-alpine .pending-change {
                    background-color: #fef3c7 !important;
                    border: 2px solid #f59e0b !important;
                    position: relative !important;
                }

                .ag-theme-alpine .pending-change::after {
                    content: "⏳" !important;
                    position: absolute !important;
                    top: -2px !important;
                    right: -2px !important;
                    background-color: #f59e0b !important;
                    color: white !important;
                    font-size: 8px !important;
                    padding: 1px 2px !important;
                    border-radius: 2px !important;
                    line-height: 1 !important;
                }

                /* Separadores */
                .ag-theme-alpine .separator-cell {
                    background-color: #f9fafb !important;
                    border-top: 1px solid #e5e7eb !important;
                    border-bottom: 1px solid #e5e7eb !important;
                    color: #4b5563 !important;
                    font-weight: 600 !important;
                    font-size: 10px !important;
                    pointer-events: none !important;
                    height: 20px !important;
                }

                .ag-theme-alpine .separator-name-cell {
                    background-color: #f9fafb !important;
                    border-top: 1px solid #e5e7eb !important;
                    border-bottom: 1px solid #e5e7eb !important;
                    color: #4b5563 !important;
                    font-weight: 600 !important;
                    font-size: 10px !important;
                    height: 24px !important;
                    cursor: pointer !important;
                }

                .ag-theme-alpine .separator-name-cell:hover {
                    background-color: #f3f4f6 !important;
                    color: #374151 !important;
                }

                /* Filas en procesamiento */
                .ag-theme-alpine .processing-changes {
                    opacity: 0.7 !important;
                    pointer-events: none !important;
                }

                /* Turnos ocultos */
                .ag-theme-alpine .hidden-shift {
                    display: none !important;
                }

                /* Filas de totales */
                .ag-theme-alpine .totals-row {
                    background-color: #f8fafc !important;
                }

                .ag-theme-alpine .totals-cell {
                    background-color: #f1f5f9 !important;
                    color: #1e293b !important;
                    font-weight: 600 !important;
                    font-size: 11px !important;
                    text-align: center !important;
                    border: 1px solid #e2e8f0 !important;
                }

                .ag-theme-alpine .totals-name-cell {
                    background-color: #f1f5f9 !important;
                    color: #1e293b !important;
                    font-weight: 600 !important;
                    font-size: 11px !important;
                    text-align: center !important;
                    border: 1px solid #e2e8f0 !important;
                }

                /* Separador de totales con cambios pendientes */
                .ag-theme-alpine .totals-separator {
                    background-color: #fef3c7 !important;
                    color: #92400e !important;
                    border: 1px solid #f59e0b !important;
                }
            `}</style>

            <AgGridReact
                ref={gridRef}
                rowData={processedRowData}
                columnDefs={columnDefs}
                defaultColDef={{
                    resizable: false,
                    sortable: false,
                    filter: false,
                }}
                onCellClicked={onCellClicked}
                onCellValueChanged={handleCellChange}
                onGridReady={handleGridReady}
                onRowClicked={onRowClicked}
                getRowId={getRowId}
                getRowClass={getRowClass}
                getRowHeight={(params) => {
                    if (params.data?.isTotalsRow) return 22;
                    return params.data?.isSeparator ? 20 : 24;
                }}
                headerHeight={50}
                suppressLoadingOverlay={true}
                suppressNoRowsOverlay={true}
                animateRows={false}
                suppressContextMenu={true}
                rowBuffer={10}
            />
        </div>
    );
});

OptimizedExcelGrid.displayName = 'OptimizedExcelGrid';

export default OptimizedExcelGrid;
