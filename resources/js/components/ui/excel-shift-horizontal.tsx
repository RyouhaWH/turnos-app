import React, { useMemo, useRef, useEffect, useCallback, useState, forwardRef, useImperativeHandle } from 'react'
import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModule, ModuleRegistry, ColDef, CellValueChangedEvent } from 'ag-grid-community';
ModuleRegistry.registerModules([AllCommunityModule]);

interface TurnoData {
    id: string
    nombre: string
    [key: string]: string
}

interface ModifiedShift {
    nombre: string,
    dia: Date,
    turno: string
}

interface Props {
    rowData: TurnoData[]
    onResumenChange: (resumen: Record<string, Record<string, Date>>) => void
    onRowClicked?: (event: any) => void
}

const diasDelMes = Array.from({ length: 31 }, (_, i) => {
    const date = new Date(2025, 6, i + 1) // julio = mes 6 (base 0)
    const diaSemana = date.getDay()
    const mes = date.getMonth()
    const year = date.getFullYear()
    const diasCortos = ['D', 'L', 'M', 'X', 'J', 'V', 'S']
    return {
        fecha: date,
        dia: (i + 1).toString(),
        nombre: diasCortos[diaSemana],
        isFinDeSemana: diaSemana === 0 || diaSemana === 6,
    }
})

const contarTurnos = (datos: any[]): Record<string, number> => {
    const conteo: Record<string, number> = {}

    for (const fila of datos) {
        for (const key in fila) {
            if (key === 'nombre' || key === 'id') continue

            const valor = (fila[key] || '').toUpperCase().trim()

            if (!valor) continue

            if (!conteo[valor]) {
                conteo[valor] = 0
            }

            conteo[valor] += 1
        }
    }

    return conteo
}

// 🔥 NUEVO: Exportamos con forwardRef para permitir ref desde el componente padre
export default forwardRef<any, Props>(function AgGridHorizontal({ rowData, onResumenChange, onRowClicked }, ref) {
    const [cambios, setCambios] = useState<Record<string, Record<string, Date>>>({});
    const gridRef = useRef<AgGridReact<TurnoData>>(null)

    // 🔥 NUEVO: Exponemos métodos del grid al componente padre
    useImperativeHandle(ref, () => ({
        autoSizeColumns: (columns?: string[]) => {
            if (gridRef.current?.api) {
                if (columns) {
                    gridRef.current.api.autoSizeColumns(columns);
                } else {
                    gridRef.current.api.autoSizeAllColumns();
                }
            }
        },
        sizeColumnsToFit: () => {
            if (gridRef.current?.api) {
                gridRef.current.api.sizeColumnsToFit();
            }
        },
        api: gridRef.current?.api
    }));

    const columnDefs = useMemo<ColDef[]>(() => {
        return [
            {
                headerName: 'Nombre',
                field: 'nombre',
                pinned: 'left',
                // 🔥 CAMBIOS: Mejorar el autoajuste de la columna nombre
                minWidth: 120,
                maxWidth: 200,
                flex: 0, // No usar flex para que respete el autosize
                suppressSizeToFit: true, // No incluir en sizeColumnsToFit
                autoHeight: true,
                cellStyle: {
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    paddingLeft: '8px',
                    paddingRight: '8px'
                }
            },
            ...diasDelMes.map((d) => ({
                headerName: `${d.dia}\n${d.nombre}`,
                field: d.dia,
                editable: true,
                width: 46,
                minWidth: 46,
                maxWidth: 46,
                flex: 0,
                cellStyle: { textAlign: 'center' },
                headerClass: 'ag-custom-header',
                cellClass: d.isFinDeSemana ? 'fin-de-semana' : '',
                valueParser: (params: any) =>
                    (params.newValue || '').toUpperCase().slice(0, 2),
            })),
        ]
    }, [])

    const handleCellChange = useCallback((e: CellValueChangedEvent) => {
        if (!e || !gridRef.current) return;

        const datosActuales = gridRef.current.api.getRenderedNodes().map((node) => node.data)
        const resumenActual = contarTurnos(datosActuales)

        const funcionario = e.data.nombre;
        const dia = diasDelMes[Number(e.colDef.field) - 1]?.fecha
        if (!dia) return;

        const diaAnterior = new Date(dia);
        diaAnterior.setDate(dia.getDate() - 1);

        const fechaFormateada = diaAnterior.toISOString().split('T')[0];
        const turno = e.value

        setCambios(prev => {
            const prevCambios = { ...prev };
            const clave = funcionario
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/\s+/g, '_')
                .toLowerCase();

            if (!prevCambios[clave]) {
                prevCambios[clave] = {};
            }

            prevCambios[clave.toString()][fechaFormateada.toString()] = turno;
            onResumenChange(prevCambios)
            return prevCambios;
        });
    }, [onResumenChange])

    const handleGridReady = (params: any) => {
        // 🔥 NUEVO: Autoajustar columna nombre al cargar
        setTimeout(() => {
            if (params.api) {
                params.api.autoSizeColumns(['nombre']);
            }
        }, 100);
    };

    // 🔥 NUEVO: Mejorar el useEffect para manejar cambios de datos
    useEffect(() => {
        if (gridRef.current?.api && rowData.length > 0) {
            // Primero autosize la columna nombre, luego ajustar el resto
            setTimeout(() => {
                if (gridRef.current?.api) {
                    gridRef.current.api.autoSizeColumns(['nombre']);
                    // Pequeña pausa para que se calcule el tamaño
                    setTimeout(() => {
                        if (gridRef.current?.api) {
                            gridRef.current.api.sizeColumnsToFit();
                        }
                    }, 50);
                }
            }, 100);
        }
    }, [rowData])

    const onCellClicked = (event: any) => {
        if (event.colDef.field === 'nombre') return;
        const dia = event.colDef.field;
        const funcionario = event.data.nombre;
        const turno = event.value;
        console.log(`El funcionario "${funcionario}" el día "${dia}" tiene el turno "${turno}"`);
    };

    return (
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
            rowHeight={28}
            suppressColumnVirtualisation={true}
            suppressRowVirtualisation={true}
            // 🔥 NUEVO: Opciones adicionales para mejor rendering
            suppressLoadingOverlay={true}
            suppressNoRowsOverlay={true}
        />
    )
});
