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
  rowData: TurnoData[]
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

export default function AgGridHorizontal({ rowData }: Props) {

    console.log(rowData)

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
      width: 60,
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
        gridRef.current.api.sizeColumnsToFit()
    }
    }, [rowData])

    console.table(rowData)

  return (
    <AgGridReact
        ref={gridRef}
        rowData={rowData}
        columnDefs={columnDefs}
        defaultColDef={{ resizable: true }}

    />
  )
}
