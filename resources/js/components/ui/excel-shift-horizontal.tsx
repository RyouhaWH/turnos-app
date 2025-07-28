import React, { useMemo, useRef, useEffect, useCallback, useState } from 'react'
import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
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

const contarTurnos = (datos: string[]): Record<string, number> => {

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

    const [cambios, setCambios] = useState<Record<string, Record<string, Date>>>({});

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
                    (params.newValue || '').toUpperCase().slice(0, 2),
            })),
        ]
    }, [])

    const gridRef = useRef<AgGridReact<TurnoData>>(null)

    const handleCellChange = useCallback((e: CellValueChangedEvent) => {

        if (!e || !gridRef.current) return;

        if (!gridRef.current) return

        const datosActuales = gridRef.current.api.getRenderedNodes().map((node) => node.data)
        const resumenActual = contarTurnos(datosActuales)

        const funcionario = e.data.nombre;
        const dia = diasDelMes[(e.colDef.field)].fecha
        const diaAnterior = new Date(dia);
        diaAnterior.setDate(dia.getDate() - 1);

        // Formato YYYY-MM-DD
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


        // console.log(`Has cambiado el turno del "${fechaFormateada}" del funcionario: "${funcionario}" para el turno: "${turno}"`)

    }, [onResumenChange])



    const handleGridReady = (params: unknown) => {
        const datos: TurnoData[] = [];
        params.api.forEachNode((node: unknown) => {
            if (node.data) datos.push(node.data);
        });
        // onResumenChange(contarTurnos(datos));
    };

    useEffect(() => {

        if (gridRef.current && gridRef.current.api) {
            handleCellChange()
            gridRef.current.api.sizeColumnsToFit()
        }

    }, [rowData, handleCellChange])

    const onCellClicked = (event) => {

        // Evitamos que se dispare al hacer clic en la columna "Nombre"
        if (event.colDef.field === 'nombre') return;

        const dia = event.colDef.field; // día del mes, por ejemplo "01"
        const funcionario = event.data.nombre;
        const turno = event.value;                   // Turno en esa celda

        console.log(`El funcionario "${funcionario}" el día "${dia}" tiene el turno "${turno}"`);
    };

    return (

        <AgGridReact
            ref={gridRef}
            rowData={rowData}
            columnDefs={columnDefs}
            defaultColDef={{ resizable: true }}
            onCellClicked={onCellClicked}
            onCellValueChanged={handleCellChange}
            onGridReady={handleGridReady}
            rowHeight={28}
        />
    )
}
