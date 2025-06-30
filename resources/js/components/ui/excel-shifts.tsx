import React, { useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
ModuleRegistry.registerModules([AllCommunityModule]);


type Persona = {
  nombre: string;
  turno: string;
  fecha: string;
};

type Props = {
  datos: Persona[];
};

type RawTurno = {
  nombre: string
  fecha: string
  turno: string
}

type FormatoTabular = {
  id: string
  nombre: string
  [dia: string]: string
}


export default function ShiftsAGGridHorizontal({ shifts }) {

    console.log('📦 Datos recibidos:', shifts);
    // Si no hay datos, prevenimos errores
    if (!Array.isArray(shifts) || shifts.length === 0) {
        return <p>No hay datos disponibles</p>;
    }

    // Columnas generadas dinámicamente según los headers del CSV
    const columnas = useMemo(() => {
        return Object.keys(shifts[0]).map((campo) => ({
        headerName: campo.toUpperCase(),
        field: campo,
        sortable: true,
        filter: true,
        }));
    }, [shifts]);

  return (
    <div className="ag-theme-alpine" style={{ height: 600, width: '100%' }}>
      <AgGridReact
        rowData={shifts}
        columnDefs={columnas}
        pagination={true}
        paginationPageSize={10}
      />
    </div>
  );
}
