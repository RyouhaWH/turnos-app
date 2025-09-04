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
    amzoma?: boolean | string | number
    first_name?: string
    paternal_lastname?: string
    isSeparator?: boolean
    isGroupHeader?: boolean
    groupType?: 'amzoma' | 'municipal'
    [key: string]: string | boolean | number | undefined
}

interface CambioData {
    rut: string;
    nombre: string;
    employee_id?: string | number;
    first_name?: string;
    paternal_lastname?: string;
    turnos: Record<string, string>;
}

interface Props {
    rowData: TurnoData[];
    onResumenChange: (cambios: Record<string, CambioData>) => void;
    onRowClicked?: (event: any) => void;
    editable?: boolean;
    resetGrid?: boolean; // Cambiar a resetGrid para reiniciar el grid
    onRegisterChange?: (employee: string, rut: string, day: string, oldValue: string, newValue: string) => void; // Nueva prop para registrar cambios
    isUndoing?: boolean; // Prop para evitar registrar cambios durante deshacer
    month?: number; // 0-11 (JavaScript month format)
    year?: number;
    pendingChanges?: Array<{
        id: string;
        employeeId: string | number;
        employeeName: string;
        employeeRut: string;
        day: string;
        oldValue: string;
        newValue: string;
        timestamp: number;
    }>; // Cambios pendientes para mostrar visualmente
    originalChangeDate?: Date | null; // Fecha original de los cambios
    showPendingChanges?: boolean; // Controla si mostrar cambios pendientes visualmente
    clearChanges?: boolean; // Nueva prop para limpiar cambios internos

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
            if (key === 'nombre' || key === 'id' || key === 'employee_id' || key === 'rut') continue

            // Convertir a string de forma segura antes de aplicar toUpperCase
            const rawValue = fila[key]
            const valor = String(rawValue || '').toUpperCase().trim()
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
            flex flex-col items-center justify-center h-full p-1 text-center

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

// Función para agregar separadores entre Amzoma y Municipal con funcionalidad de grupos
const addSeparatorRow = (data: TurnoData[]): TurnoData[] => {
    if (!data || data.length === 0) return data;

    const result: TurnoData[] = [];
    let amzomaHeaderAdded = false;
    let municipalHeaderAdded = false;
    let hasAmzoma = false;
    let hasNonAmzoma = false;

    // Verificar si hay empleados de ambos tipos
    data.forEach(item => {
        const isAmzoma = item.amzoma === true || item.amzoma === 'true' || item.amzoma === 1;
        if (isAmzoma) hasAmzoma = true;
        else hasNonAmzoma = true;
    });

    // Solo agregar separadores si hay empleados de ambos tipos
    if (!hasAmzoma || !hasNonAmzoma) return data;

    // Función para crear fila separadora con funcionalidad de grupo
    const createGroupHeaderRow = (id: string, text: string, groupType: 'amzoma' | 'municipal'): TurnoData => {
        const separatorRow: TurnoData = {
            id: id,
            nombre: text,
            isSeparator: true,
            isGroupHeader: true,
            groupType: groupType,
        };

        // Agregar campos de días con valores vacíos
        const sampleRow = data[0];
        Object.keys(sampleRow).forEach(key => {
            if (key !== 'id' && key !== 'nombre' && key !== 'amzoma' && key !== 'first_name' && key !== 'paternal_lastname' && key !== 'isSeparator' && key !== 'isGroupHeader' && key !== 'groupType') {
                (separatorRow as any)[key] = '';
            }
        });

        return separatorRow;
    };

    data.forEach((item, index) => {
        const isAmzoma = item.amzoma === true || item.amzoma === 'true' || item.amzoma === 1;
        const nextItem = data[index + 1];
        const nextIsAmzoma = nextItem ? (nextItem.amzoma === true || nextItem.amzoma === 'true' || nextItem.amzoma === 1) : false;

                // Agregar header "MUNICIPAL" antes del primer empleado municipal
        if (!isAmzoma && !municipalHeaderAdded) {
            result.push(createGroupHeaderRow('municipal-header', '▶ MUNICIPAL', 'municipal'));
            municipalHeaderAdded = true;
        }

        // Agregar header "AMZOMA" antes del primer empleado de Amzoma
        if (isAmzoma && !amzomaHeaderAdded) {
            result.push(createGroupHeaderRow('amzoma-header', '▶ AMZOMA', 'amzoma'));
            amzomaHeaderAdded = true;
        }

        result.push(item);
    });

    return result;
};

const AgGridHorizontal = forwardRef<AgGridHorizontalRef, Props>(({ rowData, onResumenChange, onRowClicked, editable = true, resetGrid = false, onRegisterChange, isUndoing = false, month, year, pendingChanges = [], originalChangeDate, showPendingChanges = false, clearChanges = false }, ref) => {

    // Usar fecha actual si no se proporcionan month/year
    const currentDate = useMemo(() => new Date(), []);
    const activeMonth = useMemo(() => month !== undefined ? month : currentDate.getMonth(), [month]);
    const activeYear = useMemo(() => year !== undefined ? year : currentDate.getFullYear(), [year]);

    // Estado para grupos colapsados
    const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
    const [cambios, setCambios] = useState<Record<string, CambioData>>({})
    const gridRef = useRef<AgGridReact<TurnoData>>(null)

    // Función centralizada para sincronizar el grid
    const syncGrid = useCallback(() => {
        if (gridRef.current?.api) {
            gridRef.current.api.refreshCells();
            gridRef.current.api.redrawRows();
        }
    }, []);

    // Procesar datos para agregar separador y manejar grupos colapsados
    const processedRowData = useMemo(() => {
        const dataWithSeparators = addSeparatorRow(rowData);

        // Filtrar filas basado en grupos colapsados
        if (collapsedGroups.size === 0) return dataWithSeparators;

        const filteredData: TurnoData[] = [];
        let skipUntilNextGroup = false;

        dataWithSeparators.forEach((row) => {
            if (row.isGroupHeader) {
                const currentGroup = row.groupType || null;
                if (currentGroup && collapsedGroups.has(currentGroup)) {
                    skipUntilNextGroup = true;
                    filteredData.push(row);
                } else {
                    skipUntilNextGroup = false;
                    filteredData.push(row);
                }
            } else if (!skipUntilNextGroup) {
                filteredData.push(row);
            }
        });

        return filteredData;
    }, [rowData, collapsedGroups]);

    // Extraer días de los datos
    const daysInData = useMemo(() => extractDaysFromData(processedRowData), [processedRowData]);

    // Generar información de cada día
    const daysInfo = useMemo(() => {
        return daysInData.map(day => getDayInfo(day, activeMonth, activeYear));
    }, [daysInData, activeMonth, activeYear]);

    // Efecto principal para manejar cambios críticos y sincronización
    useEffect(() => {
        if (!gridRef.current?.api) return;

        // Si estamos deshaciendo, forzar actualización completa del grid
        if (isUndoing) {
            // Limpiar cambios internos
            setCambios({});

            // Forzar actualización del modelo de datos con los datos originales
            gridRef.current.api.setGridOption('rowData', processedRowData);

            // Actualización inmediata
            gridRef.current.api.refreshCells({ force: true });
            gridRef.current.api.redrawRows();

            // Segunda actualización después de un breve retraso para asegurar sincronización
            const timeoutId = setTimeout(() => {
                if (gridRef.current?.api) {
                    gridRef.current.api.refreshCells({ force: true });
                    gridRef.current.api.redrawRows();
                }
            }, 100);

            return () => clearTimeout(timeoutId);
        }

        // Si se solicita reset o limpieza, limpiar cambios internos
        if (resetGrid || clearChanges) {
            setCambios({});
            gridRef.current.api.refreshCells({ force: true });
            gridRef.current.api.redrawRows();
        }

        // Sincronización general del grid
        const timeoutId = setTimeout(syncGrid, 50);
        return () => clearTimeout(timeoutId);
    }, [isUndoing, resetGrid, clearChanges, processedRowData, syncGrid]);

    // Efecto para sincronizar cambios pendientes
    useEffect(() => {
        if (pendingChanges.length > 0) {
            // Convertir pendingChanges a la estructura interna del grid
            const newCambios: Record<string, CambioData> = {};

            pendingChanges.forEach(change => {
                const clave = String(change.employeeId);

                if (!newCambios[clave]) {
                    newCambios[clave] = {
                        rut: change.employeeRut,
                        nombre: change.employeeName,
                        employee_id: change.employeeId,
                        turnos: {}
                    };
                }

                // Solo agregar si hay un valor nuevo
                if (change.newValue) {
                    newCambios[clave].turnos[change.day] = change.newValue;
                }
            });

            setCambios(newCambios);
        } else {
            // Limpiar cambios si no hay pendientes
            setCambios({});
        }

        // Sincronizar el grid
        const timeoutId = setTimeout(syncGrid, 50);
        return () => clearTimeout(timeoutId);
    }, [pendingChanges, syncGrid]);

    // Efecto para sincronizar cuando cambia rowData (importante para deshacer)
    useEffect(() => {
        if (!gridRef.current?.api) return;

        // Si estamos deshaciendo, usar setGridOption para forzar actualización completa
        if (isUndoing) {
            gridRef.current.api.setGridOption('rowData', processedRowData);
        } else {
            // Para cambios normales, usar applyTransaction
            gridRef.current.api.applyTransaction({ update: processedRowData });
        }

        // Forzar actualización completa
        gridRef.current.api.refreshCells({ force: true });
        gridRef.current.api.redrawRows();
    }, [rowData, processedRowData, isUndoing]);

    // Efecto para sincronización cuando cambia collapsedGroups
    useEffect(() => {
        const timeoutId = setTimeout(syncGrid, 100);
        return () => clearTimeout(timeoutId);
    }, [collapsedGroups, syncGrid]);

    // Efecto para sincronización cuando cambia daysInfo
    useEffect(() => {
        const timeoutId = setTimeout(syncGrid, 100);
        return () => clearTimeout(timeoutId);
    }, [daysInfo, syncGrid]);

    // Efecto para sincronización cuando cambia processedRowData
    useEffect(() => {
        const timeoutId = setTimeout(syncGrid, 100);
        return () => clearTimeout(timeoutId);
    }, [processedRowData, syncGrid]);

    // Efecto para sincronización cuando cambia cambios
    useEffect(() => {
        const timeoutId = setTimeout(syncGrid, 100);
        return () => clearTimeout(timeoutId);
    }, [cambios, syncGrid]);





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
                minWidth: 60,
                maxWidth: 150,
                flex: 0,
                suppressSizeToFit: true,
                autoHeight: true,
                lockPosition: true,
                suppressMovable: true,
                resizable: true,
                sortable: true,
                filter: false,
                cellClass: (params) => {
                    if (params.data?.isSeparator) {
                        return 'separator-name-cell';
                    }
                    return '';
                },
                cellStyle: (params) => {
                    if (params.data?.isSeparator) {
                        return {
                            fontSize: '11px',
                            padding: '0px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            textAlign: 'center',
                            fontWeight: '600',
                            backgroundColor: '#f9fafb',
                            color: '#4b5563',
                            borderTop: '1px solid #e5e7eb',
                            borderBottom: '1px solid #e5e7eb',
                            height: '24px',
                            cursor: params.data?.isGroupHeader ? 'pointer' : 'default'
                        } as any;
                    }
                    return {
                        fontSize: '12px',
                        padding: '0px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        textAlign: 'start'
                    } as any;
                },
                                valueGetter: (params) => {
                        // Si es header de grupo, mostrar con ícono de expandir/colapsar
                        if (params.data?.isGroupHeader) {
                            const groupType = params.data.groupType;
                            const isCollapsed = collapsedGroups.has(groupType || '');
                            const icon = isCollapsed ? '▶' : '▼';
                            const text = params.data.nombre.replace(/^[▶▼]\s*/, '');
                            return `${icon} ${text}`;
                        }

                        // Si es fila separadora, mostrar el texto tal como está
                        if (params.data?.isSeparator) {
                            return params.data.nombre;
                        }

                        // Si tiene first_name y paternal_lastname, usar esos
                        if (params.data?.first_name && params.data?.paternal_lastname) {
                            // Extraer solo el primer nombre del first_name
                            const firstName = params.data.first_name.split(' ')[0];
                            return `${firstName} ${params.data.paternal_lastname}`;
                        }
                        // Si no, usar el nombre completo como fallback
                        return params.data?.nombre || '';
                }
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
                editable: (params) => {
                    // No permitir edición en filas separadoras
                    if (params.data?.isSeparator) return false;
                    return editable;
                },
                width: 50,
                minWidth: 50,
                maxWidth: 50,
                flex: 0,
                lockPosition: true,
                suppressMovable: true,
                resizable: false,
                sortable: true,
                filter: false,
                headerClass: dayInfo.isFinDeSemana ? 'weekend-header' : '',
                cellClass: (params) => {
                    const classes = [];

                    // Estilo especial para filas separadoras
                    if (params.data?.isSeparator) {
                        classes.push('separator-cell');
                        return classes.join(' ');
                    }

                    if (dayInfo.isFinDeSemana) classes.push('weekend-cell');
                    if (params.value) {
                        const firstChar = String(params.value).toLowerCase().charAt(0);
                        classes.push(`shift-${firstChar}`);
                    }
                    return classes.join(' ');
                },
                valueParser: (params: any) =>
                    String(params.newValue || '').toUpperCase().slice(0, 2),
            });
        });
        return columns;
    }, [daysInfo, editable])

    // Handle cell value changes
    const handleCellChange = useCallback((e: CellValueChangedEvent<TurnoData>) => {
        if (!e || !e.data || !e.colDef?.field) return

        // Ignorar cambios en filas separadoras
        if (e.data.isSeparator) return;

        const funcionario = String(e.data.nombre);
        const rut = String(e.data.rut || '');
        const employeeId = String(e.data.employee_id || e.data.id || '');
        const dayField = e.colDef.field;

        // Verificar que sea un día válido
        if (dayField === 'nombre' || dayField === 'id' || dayField === 'employee_id' || dayField === 'rut') return;

        const turno = e.value || '';
        const valorAnterior = e.oldValue || '';

        // No registrar cambios si estamos deshaciendo
        if (onRegisterChange && valorAnterior !== turno && !isUndoing) {
            onRegisterChange(funcionario, rut, dayField, valorAnterior, turno);
        }

        // No actualizar el resumen si estamos deshaciendo
        if (!isUndoing) {
            setCambios(prev => {
                const newCambios = { ...prev }

                // Usar employee_id como clave en lugar del nombre normalizado
                const clave = employeeId;
                // const clave = rut;

                if (!newCambios[clave]) {
                    newCambios[clave] = {
                        rut: rut,
                        nombre: funcionario,
                        employee_id: employeeId,
                        first_name: e.data.first_name,
                        paternal_lastname: e.data.paternal_lastname,
                        turnos: {}
                    }
                }

                // Verificar si realmente hay un cambio
                const valorAnterior = e.oldValue || '';
                const valorNuevo = turno || '';

                // Solo agregar al resumen si hay un cambio real
                if (valorAnterior !== valorNuevo) {
                    if (turno) {
                        newCambios[clave].turnos[dayField] = turno
                    } else {
                        // Enviar valor vacío explícitamente para indicar eliminación
                        newCambios[clave].turnos[dayField] = ''
                    }
                } else {
                    // Si no hay cambio, remover del resumen
                    delete newCambios[clave].turnos[dayField]

                    // Limpiar objetos vacíos
                    if (Object.keys(newCambios[clave].turnos).length === 0) {
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
        // Manejar click en headers de grupo
        if (event.data?.isGroupHeader && event.colDef?.field === 'nombre') {
            const groupType = event.data.groupType;
            if (groupType) {
                setCollapsedGroups(prev => {
                    const newSet = new Set(prev);
                    if (newSet.has(groupType)) {
                        newSet.delete(groupType);
                    } else {
                        newSet.add(groupType);
                    }
                    return newSet;
                });
                return;
            }
        }

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



                    /* Estilos para cambios pendientes */
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

                    /* Estilos para filas separadoras - más delgadas */
                    .ag-theme-alpine .separator-cell {
                        background-color: #f9fafb !important;
                        border-top: 1px solid #e5e7eb !important;
                        border-bottom: 1px solid #e5e7eb !important;
                        color: #4b5563 !important;
                        font-weight: 600 !important;
                        font-size: 11px !important;
                        pointer-events: none !important;
                        height: 24px !important;
                    }

                    .ag-theme-alpine .separator-name-cell {
                        background-color: #f9fafb !important;
                        border-top: 1px solid #e5e7eb !important;
                        border-bottom: 1px solid #e5e7eb !important;
                        color: #4b5563 !important;
                        font-weight: 600 !important;
                        font-size: 11px !important;
                        pointer-events: auto !important;
                        height: 24px !important;
                        cursor: pointer !important;
                    }

                    .ag-theme-alpine .separator-name-cell:hover {
                        background-color: #f3f4f6 !important;
                        color: #374151 !important;
                    }

                `}</style>

            <AgGridReact
                ref={gridRef}
                rowData={processedRowData}
                columnDefs={columnDefs}
                defaultColDef={{
                    resizable: false,
                    sortable: false,
                    filter: false
                }}
                onCellClicked={onCellClicked}
                onCellValueChanged={handleCellChange}
                onGridReady={handleGridReady}
                onRowClicked={onRowClicked}
                getRowHeight={(params) => {
                    // Altura más pequeña para separadores
                    if (params.data?.isSeparator) {
                        return 24;
                    }
                    return 32;
                }}
                headerHeight={50}
                suppressColumnVirtualisation={true}
                suppressRowVirtualisation={true}
                suppressLoadingOverlay={true}
                suppressNoRowsOverlay={true}
                animateRows={false}
                suppressContextMenu={true}
                getRowId={(params) => params.data.id || params.data.nombre}
            />
        </div>
    )
}
)

export default AgGridHorizontal
