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
    rowData: TurnoData[]
    onResumenChange: (resumen: Record<string, Record<string, string>>) => void
    onRowClicked?: (event: RowClickedEvent<TurnoData>) => void
    month?: number // 0-11 (JavaScript month format)
    year?: number
}

export interface AgGridHorizontalRef {
    autoSizeColumns: (columns?: string[]) => void
    sizeColumnsToFit: () => void
    api?: GridApi<TurnoData>
}

// Generate days for the specified month and year
const generateDiasDelMes = (year: number, month: number) => {
    const daysInMonth = new Date(year, month + 1, 0).getDate() // Get last day of month

    return Array.from({ length: daysInMonth }, (_, i) => {
        const date = new Date(year, month, i + 1)
        const diaSemana = date.getDay()
        const diasCortos = ['D', 'L', 'M', 'X', 'J', 'V', 'S']

        return {
            fecha: date,
            dia: (i + 1).toString(),
            nombre: diasCortos[diaSemana],
            isFinDeSemana: diaSemana === 0 || diaSemana === 6,
        }
    })
}

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

const AgGridHorizontal = forwardRef<AgGridHorizontalRef, Props>(
    function AgGridHorizontal({ rowData, onResumenChange, onRowClicked, month, year }, ref) {
        // Use current date if month/year not provided
        const currentDate = new Date()
        const activeMonth = month !== undefined ? month : currentDate.getMonth()
        const activeYear = year !== undefined ? year : currentDate.getFullYear()

        // Generate days for the active month
        const diasDelMes = useMemo(() =>
            generateDiasDelMes(activeYear, activeMonth),
            [activeYear, activeMonth]
        )

        const [cambios, setCambios] = useState<Record<string, Record<string, string>>>({})
        const gridRef = useRef<AgGridReact<TurnoData>>(null)

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
            return [
                {
                    headerName: 'Nombre',
                    field: 'nombre',
                    pinned: 'left',
                    minWidth: 120,
                    maxWidth: 250,
                    flex: 0, // Don't use flex to respect autosize
                    suppressSizeToFit: true, // Exclude from sizeColumnsToFit
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
                    cellStyle: {
                        textAlign: 'center',
                        backgroundColor: d.isFinDeSemana ? '#f5f5f5' : undefined
                    },
                    headerClass: 'ag-custom-header',
                    cellClass: d.isFinDeSemana ? 'fin-de-semana' : '',
                    valueParser: (params: any) =>
                        (params.newValue || '').toUpperCase().slice(0, 2),
                })),
            ]
        }, [diasDelMes])

        // Handle cell value changes
        const handleCellChange = useCallback((e: CellValueChangedEvent<TurnoData>) => {
            if (!e || !e.data) return

            const funcionario = e.data.nombre
            const diaNum = Number(e.colDef?.field)

            if (!diaNum || diaNum < 1 || diaNum > diasDelMes.length) return

            const dia = diasDelMes[diaNum - 1]?.fecha
            if (!dia) return

            // IMPORTANT: Backend currently subtracts 1 day from the date
            // To compensate, we add 1 day here so the correct date is saved
            // TODO: Consider fixing this in the backend instead
            const diaCompensado = new Date(dia)
            diaCompensado.setDate(dia.getDate() + 1)
            const fechaFormateada = diaCompensado.toISOString().split('T')[0]
            const turno = e.value || ''

            // Determine if this is a deletion
            const isDeletion = !turno || turno.trim() === ''

            setCambios(prev => {
                const newCambios = { ...prev }

                // Create a normalized key for the employee
                const clave = funcionario
                    .normalize("NFD")
                    .replace(/[\u0300-\u036f]/g, "")
                    .replace(/\s+/g, '_')
                    .toLowerCase()

                if (!newCambios[clave]) {
                    newCambios[clave] = {}
                }

                if (isDeletion) {
                    // Mark as deletion with special value
                    newCambios[clave][fechaFormateada] = '__DELETE__'
                } else {
                    // Normal update
                    newCambios[clave][fechaFormateada] = turno
                }

                onResumenChange(newCambios)
                return newCambios
            })

            // Log the action
            console.log(`${isDeletion ? 'Eliminando' : 'Actualizando'} turno:`, {
                funcionario,
                dia: diaNum,
                fecha: fechaFormateada,
                turno: isDeletion ? 'VACÍO' : turno
            })

            // Optional: Log shift summary
            if (gridRef.current?.api) {
                const allData: TurnoData[] = []
                gridRef.current.api.forEachNode(node => {
                    if (node.data) allData.push(node.data)
                })
                const resumen = contarTurnos(allData)
                console.log('Resumen de turnos:', resumen)
            }
        }, [onResumenChange, diasDelMes])

        // Handle grid ready event
        const handleGridReady = useCallback((params: GridReadyEvent<TurnoData>) => {
            // Use requestAnimationFrame for better timing
            requestAnimationFrame(() => {
                if (params.api) {
                    params.api.autoSizeColumns(['nombre'])

                    // Give autosize time to calculate
                    requestAnimationFrame(() => {
                        params.api.sizeColumnsToFit()
                    })
                }
            })
        }, [])

        // Handle cell clicks
        const onCellClicked = useCallback((event: CellClickedEvent<TurnoData>) => {
            if (event.colDef?.field === 'nombre') return

            const dia = event.colDef?.field
            const funcionario = event.data?.nombre
            const turno = event.value

            console.log(`Funcionario "${funcionario}" - Día ${dia} - Turno: "${turno || 'vacío'}"`)
        }, [])

        // Resize columns when data changes
        useEffect(() => {
            if (gridRef.current?.api && rowData.length > 0) {
                // Use requestAnimationFrame for smoother updates
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

        // Clear changes when month/year changes
        useEffect(() => {
            setCambios({})
            onResumenChange({})
        }, [activeMonth, activeYear, onResumenChange])

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
                suppressLoadingOverlay={true}
                suppressNoRowsOverlay={true}
                animateRows={false}
                maintainColumnOrder={true}
            />
        )
    }
)

export default AgGridHorizontal
