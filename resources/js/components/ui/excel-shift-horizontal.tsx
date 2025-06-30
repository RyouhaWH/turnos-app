import React, { useMemo, useRef, useEffect } from 'react'
import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
ModuleRegistry.registerModules([AllCommunityModule]);


interface TurnoData {
    id: string
    nombre: string
    [key: string]: string
}

interface Props {
    rowData: any[]
    onResumenChange: (resumen: Record<string, number>) => void
}

const diasDelMes = Array.from({ length: 31 }, (_, i) => {
    const date = new Date(2025, 6, i + 1) // julio = mes 6 (base 0)
    const diaSemana = date.getDay()
    const diasCortos = ['D', 'L', 'M', 'X', 'J', 'V', 'S']
    return {
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

export default function AgGridHorizontal({ rowData, onResumenChange }: Props) {

    const columnDefs = useMemo<ColDef[]>(() => {
        return [
            {
                headerName: 'Nombre',
                field: 'nombre',
                pinned: 'left',
                width: 140,
            },
            ...diasDelMes.map((d) => ({
                headerName: `${d.dia}\n${d.nombre}`,
                field: d.dia,
                editable: true,
                width: 46,
                cellStyle: { textAlign: 'center' },
                headerClass: 'ag-custom-header',
                cellClass: d.isFinDeSemana ? 'fin-de-semana' : '',
                valueParser: (params) =>
                    (params.newValue || '').toUpperCase().slice(0, 1),
            })),
        ]
    }, [])

    const gridRef = useRef<AgGridReact<TurnoData>>(null)

    useEffect(() => {

        if (gridRef.current && gridRef.current.api) {
            handleCellChange()
            gridRef.current.api.sizeColumnsToFit()
        }
    }, [rowData])

    const handleCellChange = () => {
        if (!gridRef.current) return

        const datosActuales = gridRef.current.api.getRenderedNodes().map((node) => node.data)
        const resumenActual = contarTurnos(datosActuales)

        onResumenChange(resumenActual)
    }

    const handleGridReady = (params: any) => {
        const datos: TurnoData[] = [];
        params.api.forEachNode((node: any) => {
            if (node.data) datos.push(node.data);
        });
        onResumenChange(contarTurnos(datos));
    };

    return (

        <AgGridReact
            ref={gridRef}
            rowData={rowData}
            columnDefs={columnDefs}
            defaultColDef={{ resizable: true }}
            onCellValueChanged={handleCellChange}
            onGridReady={handleGridReady}
            rowHeight={28}
        />
    )
}
