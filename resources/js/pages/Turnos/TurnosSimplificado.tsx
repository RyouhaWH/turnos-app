import React, { useState, useRef, useMemo, useCallback, memo } from 'react';
import { Head } from '@inertiajs/react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { ColDef, ModuleRegistry, AllCommunityModule } from 'ag-grid-community';

// Registrar los módulos de AG Grid
ModuleRegistry.registerModules([AllCommunityModule]);

interface TurnoData {
  id: number;
  nombre: string;
  rol: string;
  color: string;
  [key: string]: any; // Para los días del mes
}

interface CambioTurno {
  id: string; // ID único del cambio
  empleadoId: number;
  empleadoNombre: string;
  dia: number;
  valorAnterior: string;
  valorNuevo: string;
  fecha: Date;
  tipo: 'modificacion' | 'creacion' | 'eliminacion';
}

interface Props {
  datos: TurnoData[];
  mes: number;
  anio: number;
}

const TurnosSimplificado: React.FC<Props> = memo(({ datos, mes, anio }) => {
  const gridRef = useRef<AgGridReact>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Estado centralizado para gestionar cambios
  const [cambiosPendientes, setCambiosPendientes] = useState<CambioTurno[]>([]);
  const [datosModificados, setDatosModificados] = useState<TurnoData[]>(datos);
  const [mostrarResumenCambios, setMostrarResumenCambios] = useState(false);
  
  // Obtener nombres de los meses
  const nombreMes = useMemo(() => {
    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return meses[mes - 1];
  }, [mes]);
  
  // Función para obtener color de contraste (memoizada)
  const getContrastColor = useCallback((hexColor: string): string => {
    // Si no hay color, usar negro
    if (!hexColor) return '#000000';
    
    // Convertir hex a RGB
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    
    // Calcular luminosidad
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    // Retornar blanco o negro según luminosidad
    return luminance > 0.5 ? '#000000' : '#FFFFFF';
  }, []);
  
  // Mapa de colores memoizado
  const coloresTurnos = useMemo(() => ({
    'M': { bg: { normal: '#ffe0b3', finde: '#ffcc80' }, text: '#e65100' },
    'T': { bg: { normal: '#b3d9ff', finde: '#90caf9' }, text: '#1976d2' },
    'N': { bg: { normal: '#b39ddb', finde: '#9575cd' }, text: '#f3e5f5' },
    'V': { bg: { normal: '#ffd4b3', finde: '#ffb74d' }, text: '#ef6c00' },
    'A': { bg: { normal: '#b3e6ff', finde: '#81d4fa' }, text: '#0277bd' },
    'S': { bg: { normal: '#f2b3d9', finde: '#f48fb1' }, text: '#c2185b' },
    'LM': { bg: { normal: '#ffb3b3', finde: '#ef5350' }, text: '#c62828' },
    '1': { bg: { normal: '#ffe0b3', finde: '#ffcc80' }, text: '#e65100' },
    '2': { bg: { normal: '#b3d9ff', finde: '#90caf9' }, text: '#1976d2' },
    '3': { bg: { normal: '#d9d9d9', finde: '#bcbcbc' }, text: '#424242' },
    'F': { bg: { normal: '#FFFFFF', finde: '#e8e8e8' }, text: '#666666' },
    'L': { bg: { normal: '#FFFFFF', finde: '#e8e8e8' }, text: '#666666' }
  }), []);

  // Función para obtener color según turno (optimizada)
  const getTurnoColor = useCallback((turno: string, esFinde: boolean): { bg: string, text: string } => {
    if (!turno) return { bg: esFinde ? '#f5f5f5' : '#FFFFFF', text: '#000000' };
    
    const colorConfig = coloresTurnos[turno];
    if (!colorConfig) return { bg: '#FFFFFF', text: '#000000' };
    
    return {
      bg: esFinde ? colorConfig.bg.finde : colorConfig.bg.normal,
      text: colorConfig.text
    };
  }, [coloresTurnos]);
  
  // Funciones para gestionar cambios
  const agregarCambio = useCallback((empleadoId: number, empleadoNombre: string, dia: number, valorAnterior: string, valorNuevo: string) => {
    console.log('🔄 agregarCambio llamado:', { empleadoId, empleadoNombre, dia, valorAnterior, valorNuevo });
    
    const cambioId = `${empleadoId}-${dia}-${Date.now()}`;
    const nuevoCambio: CambioTurno = {
      id: cambioId,
      empleadoId,
      empleadoNombre,
      dia,
      valorAnterior,
      valorNuevo,
      fecha: new Date(),
      tipo: valorAnterior ? 'modificacion' : 'creacion'
    };
    
    console.log('📝 Nuevo cambio creado:', nuevoCambio);
    
    setCambiosPendientes(prev => {
      // Remover cambio anterior para el mismo empleado y día si existe
      const sinCambioAnterior = prev.filter(c => !(c.empleadoId === empleadoId && c.dia === dia));
      const nuevoArray = [...sinCambioAnterior, nuevoCambio];
      console.log('📋 Cambios pendientes actualizados:', nuevoArray);
      return nuevoArray;
    });
    
    // Actualizar datos modificados
    setDatosModificados(prev => 
      prev.map(empleado => 
        empleado.id === empleadoId 
          ? { ...empleado, [dia.toString()]: valorNuevo }
          : empleado
      )
    );
  }, []);
  
  const deshacerCambio = useCallback((cambioId: string) => {
    const cambio = cambiosPendientes.find(c => c.id === cambioId);
    if (!cambio) return;
    
    // Remover el cambio de la lista
    setCambiosPendientes(prev => prev.filter(c => c.id !== cambioId));
    
    // Restaurar valor original en datos modificados
    setDatosModificados(prev => 
      prev.map(empleado => 
        empleado.id === cambio.empleadoId 
          ? { ...empleado, [cambio.dia.toString()]: cambio.valorAnterior }
          : empleado
      )
    );
  }, [cambiosPendientes]);
  
  const deshacerTodosLosCambios = useCallback(() => {
    setCambiosPendientes([]);
    setDatosModificados(datos);
  }, [datos]);
  
  const confirmarCambios = useCallback(async () => {
    if (cambiosPendientes.length === 0) return;
    
    try {
      // Aquí iría la lógica para enviar los cambios al backend
      console.log('Enviando cambios al servidor:', cambiosPendientes);
      
      // Por ahora solo limpiamos los cambios pendientes
      setCambiosPendientes([]);
      alert(`Se han confirmado ${cambiosPendientes.length} cambios exitosamente.`);
    } catch (error) {
      console.error('Error al confirmar cambios:', error);
      alert('Error al confirmar los cambios. Inténtalo de nuevo.');
    }
  }, [cambiosPendientes]);
  
  // Estilos memoizados para columnas fijas
  const fixedCellStyles = useMemo(() => ({
    funcionario: { fontWeight: 'bold' },
    getRolStyle: (color: string) => ({
      backgroundColor: color,
      color: getContrastColor(color)
    })
  }), [getContrastColor]);

  // Generar definiciones de columnas
  const columnDefs = useMemo(() => {
    // Columnas fijas
    const cols: ColDef[] = [
      { 
        field: 'nombre', 
        headerName: 'Funcionario',
        pinned: 'left',
        width: 200,
        cellStyle: fixedCellStyles.funcionario,
        suppressSizeToFit: true
      },
      { 
        field: 'rol', 
        headerName: 'Rol',
        width: 150,
        cellStyle: (params) => fixedCellStyles.getRolStyle(params.data.color),
        suppressSizeToFit: true
      }
    ];
    
    // Columnas para cada día del mes
    const diasEnMes = new Date(anio, mes, 0).getDate();
    
    for (let dia = 1; dia <= diasEnMes; dia++) {
      const fecha = new Date(anio, mes - 1, dia);
      const esFinde = fecha.getDay() === 0 || fecha.getDay() === 6;
      
      cols.push({
        field: dia.toString(),
        headerName: dia.toString(),
        width: 45,
        suppressSizeToFit: true,
        headerClass: 'day-header',
        editable: true,
        cellEditor: 'agTextCellEditor',
        cellClass: (params) => {
          // Verificar si hay cambios pendientes para esta celda
          const tieneCambios = cambiosPendientes.some(c => 
            c.empleadoId === params.data.id && c.dia === dia
          );
          
          return tieneCambios ? 'celda-modificada' : 'celda-normal';
        },
        cellStyle: (params) => {
          const turno = params.value;
          const color = getTurnoColor(turno, esFinde);
          
          // Verificar si hay cambios pendientes para esta celda
          const tieneCambios = cambiosPendientes.some(c => 
            c.empleadoId === params.data.id && c.dia === dia
          );
          
          if (tieneCambios) {
            return {}; // Los estilos se manejan por CSS
          }
          
          return { 
            backgroundColor: color.bg,
            color: color.text,
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px'
          };
        },
        onCellValueChanged: (params) => {
          // Obtener el valor anterior de los datos originales (no modificados)
          const valorAnterior = datos.find(d => d.id === params.data.id)?.[dia.toString()] || '';
          const valorNuevo = params.newValue || '';
          
          console.log('Cambio detectado:', {
            empleado: params.data.nombre,
            dia: dia,
            valorAnterior,
            valorNuevo
          });
          
          if (valorAnterior !== valorNuevo) {
            agregarCambio(
              params.data.id,
              params.data.nombre,
              dia,
              valorAnterior,
              valorNuevo
            );
          }
        }
      });
    }
    
    return cols;
  }, [mes, anio, getTurnoColor, fixedCellStyles, cambiosPendientes, datos, agregarCambio]);
  
  // Componente de resumen de cambios
  const ResumenCambios = memo(() => {
    console.log('🎨 ResumenCambios renderizado con cambios:', cambiosPendientes.length, cambiosPendientes);
    
    return (
      <div className={`border rounded-lg p-4 mb-4 ${
        cambiosPendientes.length > 0 
          ? 'bg-yellow-50 border-yellow-200' 
          : 'bg-blue-50 border-blue-200'
      }`}>
        <div className="flex justify-between items-center mb-3">
          <h3 className={`text-lg font-semibold ${
            cambiosPendientes.length > 0 ? 'text-yellow-800' : 'text-blue-800'
          }`}>
            {cambiosPendientes.length > 0 
              ? `Cambios Pendientes (${cambiosPendientes.length})` 
              : 'Sistema de Gestión de Cambios'
            }
          </h3>
          
          {cambiosPendientes.length > 0 ? (
            <div className="space-x-2">
              <button
                onClick={() => setMostrarResumenCambios(!mostrarResumenCambios)}
                className="px-3 py-1 text-sm bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200"
              >
                {mostrarResumenCambios ? 'Ocultar' : 'Ver Detalles'}
              </button>
              <button
                onClick={confirmarCambios}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Confirmar Cambios
              </button>
              <button
                onClick={deshacerTodosLosCambios}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Deshacer Todo
              </button>
            </div>
          ) : (
            <div className="text-sm text-blue-600">
              💡 Haz clic en cualquier celda de día para editarla
            </div>
          )}
        </div>
        
        {cambiosPendientes.length === 0 && (
          <div className="text-sm text-blue-700">
            <p>• Los cambios se registran automáticamente al editar las celdas</p>
            <p>• Las celdas modificadas se resaltan en amarillo</p>
            <p>• Puedes confirmar o deshacer cambios desde aquí</p>
          </div>
        )}
        
        {cambiosPendientes.length > 0 && mostrarResumenCambios && (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {cambiosPendientes.map((cambio) => (
              <div key={cambio.id} className="flex justify-between items-center bg-white p-3 rounded border">
                <div className="flex-1">
                  <span className="font-medium">{cambio.empleadoNombre}</span>
                  <span className="text-gray-600 ml-2">Día {cambio.dia}:</span>
                  <span className="ml-1 text-red-600 line-through">{cambio.valorAnterior || '(vacío)'}</span>
                  <span className="mx-2">→</span>
                  <span className="text-green-600 font-medium">{cambio.valorNuevo || '(vacío)'}</span>
                  <span className="text-xs text-gray-500 ml-2">
                    {cambio.fecha.toLocaleTimeString()}
                  </span>
                </div>
                <button
                  onClick={() => deshacerCambio(cambio.id)}
                  className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                >
                  Deshacer
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }, [cambiosPendientes, mostrarResumenCambios, confirmarCambios, deshacerTodosLosCambios, deshacerCambio]);
  
  return (
    <>
      <Head title={`Turnos ${nombreMes} ${anio}`} />
      
      <style>{`
          .day-header {
            text-align: center !important;
            font-size: 14px !important;
            line-height: 1 !important;
            padding: 0 !important;
            overflow: visible !important;
            white-space: nowrap !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            height: 100% !important;
          }
          .day-header .ag-header-cell-text {
            overflow: visible !important;
            text-overflow: clip !important;
            text-align: center !important;
            width: 100% !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            font-size: 14px !important;
          }
          .day-header .ag-header-cell-label {
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            width: 100% !important;
            height: 100% !important;
          }
          
          .celda-modificada {
            background-color: #fff3cd !important;
            color: #856404 !important;
            border: 2px solid #ffc107 !important;
            font-weight: bold !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            font-size: 12px !important;
          }
          
          .celda-normal {
            font-weight: bold !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            font-size: 12px !important;
          }
        `}</style>
      
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Turnos Operativos - {nombreMes} {anio}</h1>
        
        <ResumenCambios />
        
        <div className="ag-theme-alpine w-full h-[calc(100vh-200px)]">
          <AgGridReact
             ref={gridRef}
             rowData={datosModificados}
             columnDefs={columnDefs}
             defaultColDef={{
               resizable: false,
               sortable: false,
               filter: false,
               suppressMenu: true
             }}
             suppressColumnVirtualisation={false}
             suppressRowVirtualisation={false}
             animateRows={false}
             suppressContextMenu={true}
             suppressDragLeaveHidesColumns={true}
             suppressMovableColumns={true}
             getRowId={(params) => params.data.id.toString()}
             rowBuffer={10}
             debounceVerticalScrollbar={true}
             suppressScrollOnNewData={true}
             theme="legacy"
             loading={isLoading}
             loadingOverlayComponent={() => (
               <div className="flex items-center justify-center h-full">
                 <div className="flex flex-col items-center space-y-2">
                   <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                   <span className="text-sm text-gray-600">Cargando datos...</span>
                 </div>
               </div>
             )}
             onBodyScrollStart={() => setIsLoading(true)}
             onBodyScrollEnd={() => setIsLoading(false)}
           />
        </div>
      </div>
    </>
  );
});

export default TurnosSimplificado;