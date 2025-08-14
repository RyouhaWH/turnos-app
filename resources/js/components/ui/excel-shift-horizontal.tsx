import React, { useMemo, useRef, useEffect, useCallback, useState, forwardRef, useImperativeHandle } from 'react'
import { AgGridReact } from 'ag-grid-react';
import {
    AllCommunityModule,
    ModuleRegistry,
    ColDef,
    CellValueChangedEvent,
    GridReadyEvent,
    CellClickedEvent,
    RowClickedEvent,
    GridApi
} from 'ag-grid-community';

ModuleRegistry.registerModules([AllCommunityModule]);

interface TurnoData {
    id: string
    nombre: string
    [key: string]: string
}

interface Props {
    rowData: TurnoData[];
    onResumenChange: (cambios: Record<string, Record<string, string>>) => void;
    onRowClicked?: (event: any) => void;
    editable?: boolean;
    resetGrid?: boolean; // Cambiar a resetGrid para reiniciar el grid
    onRegisterChange?: (employee: string, day: string, oldValue: string, newValue: string) => void; // Nueva prop para registrar cambios
    isUndoing?: boolean; // Prop para evitar registrar cambios durante deshacer
    month?: number; // 0-11 (JavaScript month format)
    year?: number;
}

export interface AgGridHorizontalRef {
    autoSizeColumns: (columns?: string[]) => void
    sizeColumnsToFit: () => void
    api?: GridApi<TurnoData>
}

// Extraer días del mes desde los datos (con debug detallado)
const extractDaysFromData = (rowData: TurnoData[]): number[] => {
    if (!rowData || rowData.length === 0) return [];

    const sampleRow = rowData[0];

    // Analizar cada clave individualmente
    const allKeys = Object.keys(sampleRow);
    allKeys.forEach(key => {
        const parsed = parseInt(key);
        const isValid = !isNaN(parsed) && parsed >= 1 && parsed <= 31;
    });

    const days = allKeys
        .filter(key => key !== 'id' && key !== 'nombre')
        .map(key => parseInt(key))
        .filter(day => !isNaN(day) && day >= 1 && day <= 31)
        .sort((a, b) => a - b);

    // Verificar si hay gaps
    if (days.length > 0) {
        const minDay = Math.min(...days);
        const maxDay = Math.max(...days);

        const expectedDays = [];
        for (let i = minDay; i <= maxDay; i++) {
            expectedDays.push(i);
        }
    }

    return days;
};

// Generar información del día
const getDayInfo = (day: number, month: number, year: number) => {
    const date = new Date(year, month, day);
    const diaSemana = date.getDay();
    const diasCortos = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];

    return {
        day,
        fecha: date,
        nombre: diasCortos[diaSemana],
        nombreCompleto: date.toLocaleDateString('es-CL', { weekday: 'long' }),
        isFinDeSemana: diaSemana === 0 || diaSemana === 6,
        diaSemana
    };
};

// Count shifts across all data
const contarTurnos = (datos: TurnoData[]): Record<string, number> => {
    const conteo: Record<string, number> = {}

    for (const fila of datos) {
        for (const key in fila) {
            if (key === 'nombre' || key === 'id') continue

            const valor = (fila[key] || '').toUpperCase().trim()
            if (!valor) continue

            conteo[valor] = (conteo[valor] || 0) + 1
        }
    }

    return conteo
}

// Componente para header de fechas (simplificado)
const DateHeaderComponent = (props: any) => {
    const { displayName, dayInfo } = props;

    if (!dayInfo) {
        return (
            <div className="flex flex-col items-center justify-center h-full py-1 px-1 text-center">
                <div className="text-sm font-bold">{displayName}</div>
            </div>
        );
    }

    return (
        <div className={`
            flex flex-col items-center justify-center h-full py-1 px-1 text-center relative

        `}>
            <div className="text-sm font-bold leading-tight">
                {dayInfo.day}
            </div>
            <div className="text-xs leading-tight opacity-80">
                {dayInfo.nombre}
            </div>
        </div>
    );
};

const AgGridHorizontal = forwardRef<AgGridHorizontalRef, Props>(({ rowData, onResumenChange, onRowClicked, editable = true, resetGrid = false, onRegisterChange, isUndoing = false, month, year }, ref) => {

        // Usar fecha actual si no se proporcionan month/year
        const currentDate = new Date();
        const activeMonth = month !== undefined ? month : currentDate.getMonth();
        const activeYear = year !== undefined ? year : currentDate.getFullYear();

        // Extraer días de los datos
        const daysInData = useMemo(() => extractDaysFromData(rowData), [rowData]);

        // Generar información de cada día
        const daysInfo = useMemo(() => {
            return daysInData.map(day => getDayInfo(day, activeMonth, activeYear));
        }, [daysInData, activeMonth, activeYear]);

        const [cambios, setCambios] = useState<Record<string, Record<string, string>>>({})
        const gridRef = useRef<AgGridReact<TurnoData>>(null)

        // Debug logging mejorado
        useEffect(() => {

            // También verificar algunos datos de muestra
            if (rowData.length > 0) {

                // Verificar valores específicos para algunos días
                const sampleRow = rowData[0];
                daysInfo.slice(0, 5).forEach(dayInfo => {
                    const fieldValue = sampleRow[dayInfo.day.toString()];
                });
            }
        }, [daysInfo, rowData]);

        // Efecto para reiniciar el grid cuando se solicita
        useEffect(() => {
            if (resetGrid) {
                setCambios({});
                // Forzar refresco del grid
                if (gridRef.current?.api) {
                    gridRef.current.api.refreshCells();
                    gridRef.current.api.redrawRows();
                }
            }
        }, [resetGrid]);

        // Expose grid methods to parent component
        useImperativeHandle(ref, () => ({
            autoSizeColumns: (columns?: string[]) => {
                const api = gridRef.current?.api
                if (api) {
                    if (columns) {
                        api.autoSizeColumns(columns)
                    } else {
                        api.autoSizeAllColumns()
                    }
                }
            },
            sizeColumnsToFit: () => {
                gridRef.current?.api?.sizeColumnsToFit()
            },
            api: gridRef.current?.api
        }))

        // Define columns
        const columnDefs = useMemo<ColDef[]>(() => {

            const columns: ColDef[] = [
                {
                    headerName: 'Nombre',
                    field: 'nombre',
                    pinned: 'left',
                    minWidth: 120,
                    maxWidth: 250,
                    flex: 0,
                    suppressSizeToFit: true,
                    autoHeight: true
                }
            ];

            // Agregar columnas para cada día
            daysInfo.forEach((dayInfo, index) => {
                const fieldName = dayInfo.day.toString();

                columns.push({
                    headerName: fieldName,
                    field: fieldName, // Usar el número del día como field
                    headerComponent: DateHeaderComponent,
                    headerComponentParams: {
                        dayInfo: dayInfo
                    },
                    editable: editable, // Usar la propiedad editable del componente
                    width: 50,
                    minWidth: 50,
                    maxWidth: 50,
                    flex: 0,
                    headerClass: dayInfo.isFinDeSemana ? 'weekend-header' : '',
                    cellClass: (params) => {
                        const classes = [];
                        if (dayInfo.isFinDeSemana) classes.push('weekend-cell');
                        if (params.value) classes.push(`shift-${params.value.toLowerCase()}`);
                        return classes.join(' ');
                    },
                    valueParser: (params: any) =>
                        (params.newValue || '').toUpperCase().slice(0, 2),
                    tooltipValueGetter: (params) => {
                        const turno = params.value || 'Sin turno';
                        return `${params.data.nombre} - ${dayInfo.nombreCompleto} ${dayInfo.day}: ${turno}`;
                    }
                });
            });
            return columns;
        }, [daysInfo, editable])

        // Handle cell value changes
        const handleCellChange = useCallback((e: CellValueChangedEvent<TurnoData>) => {
            if (!e || !e.data || !e.colDef?.field) return

            const funcionario = e.data.nombre;
            const employeeId = e.data.employee_id || e.data.id;
            const dayField = e.colDef.field;

            // Verificar que sea un día válido
            if (dayField === 'nombre' || dayField === 'id' || dayField === 'employee_id' || dayField === 'rut') return;

            const turno = e.value || '';
            const valorAnterior = e.oldValue || '';

            // No registrar cambios si estamos deshaciendo
            if (onRegisterChange && valorAnterior !== turno && !isUndoing) {
                onRegisterChange(funcionario, dayField, valorAnterior, turno);
            }

            // No actualizar el resumen si estamos deshaciendo
            if (!isUndoing) {
                setCambios(prev => {
                    const newCambios = { ...prev }

                    // Usar employee_id como clave en lugar del nombre normalizado
                    const clave = employeeId.toString();

                    if (!newCambios[clave]) {
                        newCambios[clave] = {}
                    }

                    // Verificar si realmente hay un cambio
                    const valorAnterior = e.oldValue || '';
                    const valorNuevo = turno || '';

                    // Solo agregar al resumen si hay un cambio real
                    if (valorAnterior !== valorNuevo) {
                        if (turno) {
                            newCambios[clave][dayField] = turno
                        } else {
                            // Enviar valor vacío explícitamente para indicar eliminación
                            newCambios[clave][dayField] = ''
                        }
                    } else {
                        // Si no hay cambio, remover del resumen
                        delete newCambios[clave][dayField]

                        // Limpiar objetos vacíos
                        if (Object.keys(newCambios[clave]).length === 0) {
                            delete newCambios[clave]
                        }
                    }

                    onResumenChange(newCambios)
                    return newCambios
                })
            }

            // Log del resumen de turnos
            if (gridRef.current?.api) {
                const allData: TurnoData[] = []
                gridRef.current.api.forEachNode(node => {
                    if (node.data) allData.push(node.data)
                })
                const resumen = contarTurnos(allData)
            }
        }, [onResumenChange, onRegisterChange, isUndoing])

        // Handle grid ready event
        const handleGridReady = useCallback((params: GridReadyEvent<TurnoData>) => {
            requestAnimationFrame(() => {
                if (params.api) {
                    params.api.autoSizeColumns(['nombre'])
                    requestAnimationFrame(() => {
                        params.api.sizeColumnsToFit()
                    })
                }
            })
        }, [])

        // Handle cell clicks
        const onCellClicked = useCallback((event: CellClickedEvent<TurnoData>) => {
            if (event.colDef?.field === 'nombre') return

            const dayField = event.colDef?.field
            const funcionario = event.data?.nombre
            const turno = event.value

            if (dayField && funcionario) {
                const dayInfo = daysInfo.find(d => d.day.toString() === dayField);
                if (dayInfo) {
                }
            }
        }, [daysInfo])

        // Resize columns when data changes
        useEffect(() => {
            if (gridRef.current?.api && rowData.length > 0) {
                requestAnimationFrame(() => {
                    const api = gridRef.current?.api
                    if (api) {
                        api.autoSizeColumns(['nombre'])
                        requestAnimationFrame(() => {
                            api.sizeColumnsToFit()
                        })
                    }
                })
            }
        }, [rowData])

        return (
            <div className="w-full h-full">
                {/* Estilos CSS simples desde cero */}

                <style>{`
                    /* Texto centrado y en negrita para todas las celdas de datos */
                    .ag-theme-alpine .ag-cell {
                        text-align: center !important;
                        // font-weight: bold !important;
                        display: flex !important;
                        align-items: center !important;
                        justify-content: center !important;
                    }

                    /* Colores básicos para turnos - tonos un poco más vibrantes */
                    .ag-theme-alpine .shift-m { background-color: #ffe0b3 !important; } /* Mañana - naranja más vibrante */
                    .ag-theme-alpine .shift-t { background-color: #b3d9ff !important; } /* Tarde - azul más vibrante */
                    .ag-theme-alpine .shift-n {
                        background-color: #b39ddb !important; /* Morado suave */
                        color: #f3e5f5 !important;           /* Texto en tono más oscuro */
                    }

                    .ag-theme-alpine .shift-v { background-color: #ffd4b3 !important; } /* Vacaciones - melocotón más vibrante */
                    .ag-theme-alpine .shift-a { background-color: #b3e6ff !important; } /* Administrativo - celeste más vibrante */
                    .ag-theme-alpine .shift-s { background-color: #f2b3d9 !important; } /* Salud - rosa más vibrante */
                    .ag-theme-alpine .shift-lm { background-color: #ffb3b3 !important; } /* Licencia médica - rojo más vibrante */

                    /* Turnos numéricos */
                    .ag-theme-alpine .shift-1 { background-color: #ffe0b3 !important; }
                    .ag-theme-alpine .shift-2 { background-color: #b3d9ff !important; }
                    .ag-theme-alpine .shift-3 { background-color: #d9d9d9 !important; }

                    /* F y L sin color en días de semana (fondo blanco por defecto) */
                    .ag-theme-alpine .shift-f,
                    .ag-theme-alpine .shift-l {
                        background-color: transparent !important;
                    }

                    /* Fines de semana con colores vibrantes pero no tan contrastantes */
                    .ag-theme-alpine .weekend-cell.shift-m { background-color: #ffcc80 !important; color: #e65100 !important; } /* Naranja vibrante */
                    .ag-theme-alpine .weekend-cell.shift-t { background-color: #90caf9 !important; color: #1976d2 !important; } /* Azul vibrante */
                    .ag-theme-alpine .weekend-cell.shift-n {
                        background-color: #9575cd !important; /* Morado vibrante */
                        color: #ede7f6 !important;            /* Texto oscuro para contraste */
                    }
                    .ag-theme-alpine .weekend-cell.shift-v { background-color: #ffb74d !important; color: #ef6c00 !important; } /* Amber vibrante */
                    .ag-theme-alpine .weekend-cell.shift-a { background-color: #81d4fa !important; color: #0277bd !important; } /* Azul claro vibrante */
                    .ag-theme-alpine .weekend-cell.shift-s { background-color: #f48fb1 !important; color: #c2185b !important; } /* Rosa vibrante */
                    .ag-theme-alpine .weekend-cell.shift-lm { background-color: #ef5350 !important; color: #c62828 !important; } /* Rojo vibrante */

                    .ag-theme-alpine .weekend-cell.shift-1 { background-color: #ffcc80 !important; color: #e65100 !important; }
                    .ag-theme-alpine .weekend-cell.shift-2 { background-color: #90caf9 !important; color: #1976d2 !important; }
                    .ag-theme-alpine .weekend-cell.shift-3 { background-color: #bcbcbc !important; color: #424242 !important; }

                    /* F y L en fines de semana - más grises */
                    .ag-theme-alpine .weekend-cell.shift-f,
                    .ag-theme-alpine .weekend-cell.shift-l {
                        background-color: #e8e8e8 !important;
                        color: #666666 !important;
                    }

                    /* Headers de fin de semana con fondo diferente */
                    .ag-theme-alpine .weekend-header {
                        background-color: #f5f5f5 !important;
                        font-weight: 600 !important;
                    }
                `}</style>

                <AgGridReact
                    ref={gridRef}
                    rowData={rowData}
                    columnDefs={columnDefs}
                    defaultColDef={{
                        resizable: true,
                        sortable: false,
                        filter: false
                    }}
                    onCellClicked={onCellClicked}
                    onCellValueChanged={handleCellChange}
                    onGridReady={handleGridReady}
                    onRowClicked={onRowClicked}
                    rowHeight={32}
                    headerHeight={50}
                    suppressColumnVirtualisation={true}
                    suppressRowVirtualisation={true}
                    suppressLoadingOverlay={true}
                    suppressNoRowsOverlay={true}
                    animateRows={false}
                    maintainColumnOrder={true}
                />
            </div>
        )
    }
)

export default AgGridHorizontal
