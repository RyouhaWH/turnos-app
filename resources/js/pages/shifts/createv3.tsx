import { MonthYearPicker } from '@/components/month-year-picker';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MobileHeaderMenu } from '@/components/ui/mobile-header-menu';
import { Calendar as UiCalendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { MobileShiftFilterModal } from '@/components/ui/mobile-shift-filter-modal';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { WhatsAppNotificationsConfig } from '@/components/ui/whatsapp-notifications-config';
import { useIsMobile } from '@/hooks/use-mobile';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    Calendar,
    CheckCircle2,
    Eye,
    EyeOff,
    FileSpreadsheet,
    Filter,
    History,
    Loader2,
    Maximize2,
    Minimize2,
    MessageSquare,
    Phone,
    Save,
    Undo2,
    Users,
    X,
} from 'lucide-react';
import React, { Suspense, useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { useOptimizedShiftsManager, type TurnoData } from './hooks/useOptimizedShiftsManager';

// Lazy loading de componentes pesados
const OptimizedExcelGrid = React.lazy(() => import('@/components/ui/optimized-excel-grid'));
const ListaCambios = React.lazy(() => import('./shift-change-list'));
const EmployeeManagementCardV3 = React.lazy(() =>
    import('./components/EmployeeManagementCardV3').then((module) => ({ default: module.default })),
);
const ShiftHistoryFeed = React.lazy(() => import('@/components/ui/shift-history-feed'));

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Selección de facción',
        href: '/turnos',
    },
    {
        title: 'Gestión de turnos',
        href: '#',
    },
];

// Componente de loading optimizado
const OptimizedLoadingGrid = () => (
    <div className="flex h-full min-h-[500px] items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700">
        <div className="flex flex-col items-center space-y-6">
            <div className="relative">
                <div className="h-16 w-16 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600 dark:border-slate-600 dark:border-t-blue-400"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <FileSpreadsheet className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
            </div>
            <div className="text-center">
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Cargando turnos optimizados...</h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Preparando la experiencia mejorada</p>
            </div>
            <div className="flex space-x-2">
                <div className="h-3 w-3 animate-bounce rounded-full bg-blue-600 [animation-delay:-0.3s]"></div>
                <div className="h-3 w-3 animate-bounce rounded-full bg-blue-600 [animation-delay:-0.15s]"></div>
                <div className="h-3 w-3 animate-bounce rounded-full bg-blue-600"></div>
            </div>
        </div>
    </div>
);

// Componente principal optimizado
interface ShiftType {
    code: string;
    name: string;
    color: string;
    isGroup?: boolean;
    codes?: string[];
}

interface OptimizedShiftsManagerProps {
    turnos?: any[];
    employee_rol_id?: number;
}

export default function OptimizedShiftsManager({ turnos = [], employee_rol_id = 1 }: OptimizedShiftsManagerProps) {
    const isMobile = useIsMobile();
    const { props: pageProps } = usePage<{ auth: { user: any } }>();
    const user = pageProps.auth?.user;

    // Verificar si el usuario tiene permisos de administrador
    const hasAdminPermissions = user?.roles?.some((role: any) => role.name === 'Administrador') || false;

    const [showSummary, setShowSummary] = useState(false);
    const [showEmployeePanel, setShowEmployeePanel] = useState(false);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [showMobileHistoryModal, setShowMobileHistoryModal] = useState(false);
    const [showWhatsAppConfig, setShowWhatsAppConfig] = useState(false);
    const [showTotals, setShowTotals] = useState(false);
    const [selectedTotalsShiftTypes, setSelectedTotalsShiftTypes] = useState<Set<string>>(new Set());
    const [showTotalsSelector, setShowTotalsSelector] = useState(false);

    // Estados para popups móviles
    const [showMobileSummaryModal, setShowMobileSummaryModal] = useState(false);
    const [showMobileEmployeeModal, setShowMobileEmployeeModal] = useState(false);
    const [showMobileDatePickerModal, setShowMobileDatePickerModal] = useState(false);
    const [showMobileWhatsAppModal, setShowMobileWhatsAppModal] = useState(false);
    const [showMobileFilterModal, setShowMobileFilterModal] = useState(false);

    // Estado para rango de días visible (solo UI, datos siguen siendo mensuales)
    const [rangeStart, setRangeStart] = useState<Date | null>(null);
    const [rangeEnd, setRangeEnd] = useState<Date | null>(null);

    // Estados para filtro de turnos
    const [showShiftFilter, setShowShiftFilter] = useState(false);
    const [visibleShiftTypes, setVisibleShiftTypes] = useState<Set<string>>(new Set());

    // Estado para maximizar el grid
    const [isGridMaximized, setIsGridMaximized] = useState(false);

    // Estado para destinatarios de WhatsApp seleccionados
    const [selectedWhatsAppRecipients, setSelectedWhatsAppRecipients] = useState<string[]>(() => {
        // Cargar destinatarios guardados desde localStorage o usar todos por defecto
        try {
            const saved = localStorage.getItem('whatsapp-recipients');
            if (saved) {
                const parsed = JSON.parse(saved);
                return parsed.length > 0
                    ? parsed
                    : [
                          'julio-sarmiento',
                          'marianela-huequelef',
                          'priscila-escobar',
                          'javier-alvarado',
                          'eduardo-esparza',
                          'dayana-chavez',
                          'central',
                          'manuel-verdugo',
                          'paola-carrasco',
                          'cesar-soto',
                          'cristian-montecinos',
                          'informaciones-amzoma',
                          'jorge-waltemath',
                      ];
            }
            // Si no hay nada guardado, seleccionar todos por defecto
            return [
                'julio-sarmiento',
                'marianela-huequelef',
                'priscila-escobar',
                'javier-alvarado',
                'eduardo-esparza',
                'dayana-chavez',
                'central',
                'manuel-verdugo',
                'paola-carrasco',
                'cesar-soto',
                'cristian-montecinos',
                'informaciones-amzoma',
                'jorge-waltemath',
            ];
        } catch (error) {
            console.error('Error al cargar destinatarios WhatsApp:', error);
            // En caso de error, seleccionar todos por defecto
            return [
                'julio-sarmiento',
                'marianela-huequelef',
                'priscila-escobar',
                'javier-alvarado',
                'eduardo-esparza',
                'dayana-chavez',
                'central',
                'manuel-verdugo',
                'paola-carrasco',
                'cesar-soto',
                'cristian-montecinos',
                'informaciones-amzoma',
                'jorge-waltemath',
            ];
        }
    });

    // Estado para modo testing de WhatsApp
    const [whatsappTestingMode, setWhatsappTestingMode] = useState<boolean>(() => {
        try {
            const saved = localStorage.getItem('whatsapp-testing-mode');
            return saved ? JSON.parse(saved) : false;
        } catch (error) {
            console.error('Error al cargar modo testing WhatsApp:', error);
            return false;
        }
    });

    // Estados para el modal de confirmación de cambio de fecha (ya no se usan)
    // const [showDateChangeConfirmModal, setShowDateChangeConfirmModal] = useState(false);
    // const [pendingDateChange, setPendingDateChange] = useState<Date | null>(null);
    // const [isDiscardingChanges, setIsDiscardingChanges] = useState(false);

    // Funciones para manejar paneles mutuamente excluyentes (desktop) y popups (móvil)
    const handleToggleSummary = useCallback(() => {
        if (isMobile) {
            // En móvil, abrir popup modal
            setShowMobileSummaryModal(true);
        } else {
            // En desktop, comportamiento normal de panel lateral
            if (showSummary) {
                setShowSummary(false);
            } else {
                setShowSummary(true);
                setShowEmployeePanel(false);
            }
        }
    }, [isMobile, showSummary]);

    const handleToggleTotals = useCallback(() => {
        setShowTotals(prev => !prev);
    }, []);

    const handleToggleTotalsShiftType = useCallback((shiftType: string) => {
        setSelectedTotalsShiftTypes(prev => {
            const newSet = new Set(prev);
            if (newSet.has(shiftType)) {
                newSet.delete(shiftType);
            } else {
                newSet.add(shiftType);
            }
            return newSet;
        });
    }, []);

    // Handler definido más abajo, tras declarar filteredRowData
    const handleSelectAllTotalsShiftTypesRef = useRef<(() => void) | null>(null);
    const handleSelectAllTotalsShiftTypes = useCallback(() => {
        handleSelectAllTotalsShiftTypesRef.current && handleSelectAllTotalsShiftTypesRef.current();
    }, []);

    const handleClearAllTotalsShiftTypes = useCallback(() => {
        setSelectedTotalsShiftTypes(new Set());
    }, []);

    // Cerrar selector de totales cuando se hace click fuera
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Element;
            if (!target.closest('.totals-selector-container')) {
                setShowTotalsSelector(false);
            }
        };

        if (showTotalsSelector) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [showTotalsSelector]);

    const handleToggleEmployeePanel = useCallback(() => {
        if (isMobile) {
            // En móvil, abrir popup modal
            setShowMobileEmployeeModal(true);
        } else {
            // En desktop, comportamiento normal de panel lateral
            if (showEmployeePanel) {
                setShowEmployeePanel(false);
            } else {
                setShowEmployeePanel(true);
                setShowSummary(false);
            }
        }
    }, [isMobile, showEmployeePanel]);

    // Función para manejar el selector de fecha en móvil y en desktop cuando está maximizado
    const handleToggleDatePicker = useCallback(() => {
        if (isMobile || isGridMaximized) {
            setShowMobileDatePickerModal(true);
        }
    }, [isMobile, isGridMaximized]);

    // Función para manejar el historial en móvil
    const handleToggleHistory = useCallback(() => {
        if (isMobile) {
            setShowMobileHistoryModal(true);
        }
    }, [isMobile]);

    // Función para manejar la configuración de WhatsApp
    const handleToggleWhatsAppConfig = useCallback(() => {
        if (isMobile) {
            setShowMobileWhatsAppModal(true);
        } else {
            setShowWhatsAppConfig(true);
        }
    }, [isMobile]);

    // Función para manejar el filtro móvil
    const handleToggleFilter = useCallback(() => {
        if (isMobile) {
            setShowMobileFilterModal(true);
        } else {
            setShowShiftFilter(!showShiftFilter);
        }
    }, [isMobile, showShiftFilter]);

    // Función para guardar la configuración de WhatsApp
    const handleSaveWhatsAppConfig = useCallback((recipients: string[], testingMode: boolean) => {
        setSelectedWhatsAppRecipients(recipients);
        setWhatsappTestingMode(testingMode);
        // Guardar la configuración en localStorage
        localStorage.setItem('whatsapp-recipients', JSON.stringify(recipients));
        localStorage.setItem('whatsapp-testing-mode', JSON.stringify(testingMode));
    }, []);



    // Funciones para el filtro de turnos
    const handleToggleShiftFilter = useCallback(() => {
        setShowShiftFilter(!showShiftFilter);
    }, [showShiftFilter]);

    // Función para alternar el estado de maximizado del grid
    const handleToggleGridMaximize = useCallback(() => {
        setIsGridMaximized(prev => !prev);
    }, []);

    // Manejar tecla ESC para cerrar modal de pantalla completa (se declara después de obtener recalculateGridLayout)

    // Función para abrir el popup de confirmación
    const handleOpenConfirmDialog = useCallback(() => {
        setShowConfirmDialog(true);
    }, []);

    const {
        // Estados principales
        rowData,
        filteredRowData,
        resumen,
        selectedDate,
        currentMonthTitle,
        loading,
        originalChangeDate,
        isSaving,
        showPendingChanges,
        searchTerm,
        selectedEmployees,
        availableEmployees,
        listaCambios,
        hasEditPermissions,
        processing,
        errors,
        isProcessingChanges,

        // Estados de historial
        canUndo,
        canRedo,
        changeCount,

        // Funciones principales
        setSelectedDate,
        setSearchTerm,
        cargarTurnosPorMes,
        registerChange,
        handleActualizarCambios,
        recalculateGridLayout,
        cargarTurnosPorRango,

        // Funciones de historial
        undoChange,
        undoSpecificChange,
        undoSpecificChangesWithCallback,
        redoChange,
        clearAllChanges,

        // Funciones de empleados
        getEmployeeId,
        addEmployeeToGrid,
        removeEmployeeFromGrid,

        // Funciones de utilidad
        getTotalEmployees,
        filterData,
        handleResumenUpdate,
        setGridApi,
        // Estados y funciones adicionales para filtro de empleados
        filteredAvailableEmployees,
        addAllEmployees,
        clearAllEmployees,
        closeEmployeeSelector,
    } = useOptimizedShiftsManager(employee_rol_id);
    // Manejar tecla ESC y recalcular layout al entrar/salir fullscreen
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && isGridMaximized) {
                setIsGridMaximized(false);
            }
        };

        if (isGridMaximized) {
            document.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden';
            try { (recalculateGridLayout as any)?.(); } catch {}
            const id = window.setTimeout(() => { try { (recalculateGridLayout as any)?.(); } catch {} }, 120);
            return () => {
                document.removeEventListener('keydown', handleKeyDown);
                document.body.style.overflow = 'unset';
                window.clearTimeout(id);
            };
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'unset';
        };
    }, [isGridMaximized, recalculateGridLayout]);

    // ========== FILTRO HARDCODEADO - EDITA AQUÍ LOS TIPOS DE TURNOS ==========
    // Para agregar o quitar tipos de turnos del filtro, modifica este array:
    const availableShiftTypes = useMemo<ShiftType[]>(
        () => [
            { code: 'TURNO_1_GROUP', name: '1er turno / Mañana', color: '#ffcc80', isGroup: true, codes: ['1', 'M'] },
            { code: 'TURNO_2_GROUP', name: '2do turno / Tarde', color: '#90caf9', isGroup: true, codes: ['2', 'T'] },
            { code: 'TURNO_3_GROUP', name: '3er turno / Noche', color: '#9575cd', isGroup: true, codes: ['3', 'N'] },

            // Agrega más tipos aquí si necesitas:
            { code: 'V', name: 'Vacaciones', color: '#ff8a65' },
            { code: 'A', name: 'Administrativo', color: '#4db6ac' },
            { code: 'S', name: 'Sindical', color: '#ba68c8' },
            { code: 'F', name: 'Franco', color: 'transparent' },
            { code: 'L', name: 'Libre', color: 'transparent' },
            { code: 'SA', name: 'Sin Asignar', color: '#bdbdbd' },
            { code: 'LM', name: 'Licencia Médica', color: '#e57373' },
            { code: 'P', name: 'Permiso / Cumpleaño', color: '#ff8a65' },


            // Turnos Extras (agrupados)
            { code: 'EXTRAS_GROUP', name: 'Turnos Extras', color: '#f06292', isGroup: true, codes: ['E', 'ME', 'TE', 'NE', '1E', '2E', '3E'] },
            // { code: 'LC', name: 'Licencia', color: '#aed581' },
        ],
        [],
    );
    // ========================================================================

    // Códigos de turno presentes actualmente en la grilla (para totales)
    const presentShiftCodes = useMemo<Set<string>>(() => {
        const codes = new Set<string>();
        const data: any[] = (filteredRowData as any[]) || [];
        if (!data || data.length === 0) return codes;

        // Determinar claves de días visibles: rango multi-mes usa fechas ISO; mensual usa 1..31 existentes
        const sameMonth = !!(rangeStart && rangeEnd) &&
            rangeStart!.getMonth() === rangeEnd!.getMonth() && rangeStart!.getFullYear() === rangeEnd!.getFullYear();

        let dayKeys: string[] = [];
        if (rangeStart && rangeEnd && !sameMonth) {
            // Generar claves por fecha completa entre inicio y fin (incluyendo el día final)
            const cur = new Date(rangeStart);
            const end = new Date(rangeEnd);
            // Asegurar que endDate incluya todo el día final
            end.setHours(23, 59, 59, 999);
            while (cur <= end) {
                dayKeys.push(cur.toISOString().split('T')[0]);
                cur.setDate(cur.getDate() + 1);
            }
        } else {
            // Tomar claves numéricas presentes en el sample
            const sample: any = data.find((r: any) => !r?.isSeparator) || (data[0] as any);
            dayKeys = Object.keys(sample || {}).filter((k) => {
                const n = parseInt(k, 10);
                return !isNaN(n) && n >= 1 && n <= 31;
            });
            // Si hay rango dentro del mismo mes, limitar a ese subrango (incluyendo el día final)
            if (rangeStart && rangeEnd && sameMonth) {
                const from = rangeStart.getDate();
                const to = rangeEnd.getDate();
                dayKeys = dayKeys.filter((k) => {
                    const n = parseInt(k, 10);
                    return n >= from && n <= to;
                });
            }
        }

        data.forEach((row: any) => {
            if (row?.isSeparator) return;
            dayKeys.forEach((k) => {
                const v = String(row[k] ?? '').toUpperCase().trim();
                if (v) codes.add(v);
            });
        });

        return codes;
    }, [filteredRowData, rangeStart, rangeEnd]);

    // Completar handler ahora que filteredRowData existe
    useEffect(() => {
        handleSelectAllTotalsShiftTypesRef.current = () => {
            setSelectedTotalsShiftTypes(new Set(Array.from(presentShiftCodes)));
        };
    }, [presentShiftCodes]);

    // Opciones del selector de totales, derivadas de lo que realmente existe en la grilla
    const totalsSelectableShiftCodes = useMemo(() => {
        const codes = Array.from(presentShiftCodes).sort();
        return codes.map((code) => ({ code, label: code }));
    }, [presentShiftCodes]);

    const handleToggleShiftType = useCallback(
        (shiftType: string) => {
            setVisibleShiftTypes((prev) => {
                const newSet = new Set(prev);
                const shiftConfig = availableShiftTypes.find((shift) => shift.code === shiftType);

                if (shiftConfig?.isGroup && shiftConfig.codes) {
                    // Manejar grupo de turnos
                    const allGroupVisible = shiftConfig.codes.every((code) => newSet.has(code));
                    if (allGroupVisible) {
                        // Si todos están visibles, ocultar todos
                        shiftConfig.codes.forEach((code) => newSet.delete(code));
                    } else {
                        // Si no todos están visibles, mostrar todos
                        shiftConfig.codes.forEach((code) => newSet.add(code));
                    }
                } else {
                    // Manejar turno individual
                    if (newSet.has(shiftType)) {
                        newSet.delete(shiftType);
                    } else {
                        newSet.add(shiftType);
                    }
                }
                return newSet;
            });
        },
        [availableShiftTypes],
    );

    // Función para obtener todos los códigos incluyendo los de grupos
    const getAllShiftCodes = useCallback(() => {
        const allCodes: string[] = [];
        availableShiftTypes.forEach((shift) => {
            if (shift.isGroup && shift.codes) {
                allCodes.push(...shift.codes);
            } else {
                allCodes.push(shift.code);
            }
        });
        return allCodes;
    }, [availableShiftTypes]);

    const clearAllFilters = useCallback(() => {
        setVisibleShiftTypes(new Set(getAllShiftCodes()));
    }, [getAllShiftCodes]);

    const deselectAllFilters = useCallback(() => {
        setVisibleShiftTypes(new Set());
    }, []);

    // Inicializar todos los tipos como visibles al cargar
    useEffect(() => {
        const allCodes = getAllShiftCodes();
        if (allCodes.length > 0) {
            setVisibleShiftTypes(new Set(allCodes));
        }
    }, [getAllShiftCodes]);

    // Inicialización adicional por si acaso
    useEffect(() => {
        if (visibleShiftTypes.size === 0 && availableShiftTypes.length > 0) {
            const allCodes = getAllShiftCodes();
            setVisibleShiftTypes(new Set(allCodes));
        }
    }, [availableShiftTypes, visibleShiftTypes.size, getAllShiftCodes]);

    // Función para manejar solicitud de cambio de fecha (ya no se usa)
    const handleDateChangeRequest = useCallback((newDate: Date) => {
        // Esta función ya no se usa porque ahora se previene el cambio directamente
    }, []);

    // Funciones para confirmación de cambio de fecha (ya no se usan)
    /*
    const handleConfirmDateChangeWithSave = useCallback(async () => {
        // Ya no se usa
    }, []);

    const handleConfirmDateChangeWithDiscard = useCallback(() => {
        // Ya no se usa
    }, []);

    const handleCancelDateChange = useCallback(() => {
        // Ya no se usa
    }, []);
    */

    // Función para confirmar y aplicar cambios
    const handleConfirmChanges = useCallback(async () => {
        setShowConfirmDialog(false);
        // Usar una cadena vacía como comentario por defecto y pasar los destinatarios de WhatsApp
        await handleActualizarCambios('');
    }, [handleActualizarCambios, selectedWhatsAppRecipients]);

    // Función para obtener el nombre completo del turno
    const getTurnoLabel = useCallback((turno: string) => {
        if (!turno || turno === '' || turno === ' ') return 'Sin Turno';

        const labels: Record<string, string> = {
            // Turnos básicos
            'M': 'Mañana',
            'T': 'Tarde',
            'N': 'Noche',
            'F': 'Franco',
            'L': 'Libre',

            // Turnos numéricos
            '1': '1er Turno',
            '2': '2do Turno',
            '3': '3er Turno',

            // Turnos extra
            'ME': 'Mañana Extra',
            'TE': 'Tarde Extra',
            'NE': 'Noche Extra',
            '1E': '1er Turno Extra',
            '2E': '2do Turno Extra',
            '3E': '3er Turno Extra',

            // Días especiales
            'A': 'Administrativo',
            'V': 'Vacaciones',
            'P': 'Permiso / Cumpleaño',
            'S': 'Suspensión',
            'SA': 'Sin Asignar',
            'X': 'Sin Asignar',
        };

        return labels[turno] || turno;
    }, []);

    // Función para formatear los cambios para mostrar en el popup
    const formatChangesForDisplay = useCallback(() => {
        const changesList: Array<{
            empleado: string;
            fecha: string;
            turno: string;
            day: number;
        }> = [];

        // Usar listaCambios que tiene la información de oldValue y newValue
        listaCambios.forEach((change) => {
            const dayNumber = parseInt(change.day);
            const date = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), dayNumber);

            const oldTurnoLabel = getTurnoLabel(change.oldValue);
            const newTurnoLabel = getTurnoLabel(change.newValue);

            // Crear descripción del cambio
            let turnoDescription = '';
            if (change.oldValue && change.newValue) {
                turnoDescription = `Turno: ${oldTurnoLabel} → ${newTurnoLabel}`;
            } else if (change.newValue) {
                turnoDescription = `Turno: Asignar ${newTurnoLabel}`;
            } else {
                turnoDescription = `Turno: Eliminar ${oldTurnoLabel}`;
            }

            changesList.push({
                empleado: change.employeeName,
                fecha: date.toLocaleDateString('es-CL', {
                    day: 'numeric',
                    month: 'short',
                }),
                turno: turnoDescription,
                day: dayNumber,
            });
        });

        return changesList.sort((a, b) => a.day - b.day);
    }, [listaCambios, selectedDate, getTurnoLabel]);

    // Función para generar la lista de destinatarios de WhatsApp
    const formatWhatsAppRecipients = useCallback(() => {
        const recipientsList: Array<{
            id: string;
            name: string;
            phone: string;
            role?: string;
        }> = [];

        // Lista de destinatarios basada en los números del ShiftsUpdateController
        const availableRecipients = [
            { id: 'funcionarios-afectados', name: 'Funcionarios Afectados', phone: 'Automático', role: 'Especial' },
            { id: 'julio-sarmiento', name: 'Julio Sarmiento', phone: 'Se obtiene de BD', role: 'Supervisor' },
            { id: 'marianela-huequelef', name: 'Marianela Huequelef', phone: 'Se obtiene de BD', role: 'Supervisor' },
            { id: 'priscila-escobar', name: 'Priscila Escobar', phone: 'Se obtiene de BD', role: 'Supervisor' },
            { id: 'javier-alvarado', name: 'Javier Alvarado', phone: 'Se obtiene de BD', role: 'Supervisor' },
            { id: 'eduardo-esparza', name: 'Eduardo Esparza', phone: 'Se obtiene de BD', role: 'Supervisor' },
            { id: 'dayana-chavez', name: 'Dayana Chavez', phone: '981841759', role: 'Supervisor' },
            { id: 'central', name: 'Central', phone: '964949887', role: 'Central' },
            { id: 'manuel-verdugo', name: 'Manuel Verdugo', phone: 'Se obtiene de BD', role: 'Supervisor' },
            { id: 'paola-carrasco', name: 'Paola Carrasco', phone: 'Se obtiene de BD', role: 'Supervisor' },
            { id: 'cesar-soto', name: 'Cesar Soto', phone: 'Se obtiene de BD', role: 'Supervisor' },
            { id: 'cristian-montecinos', name: 'Cristian Montecinos', phone: '975952121', role: 'Supervisor' },
            { id: 'informaciones-amzoma', name: 'Informaciones Amzoma', phone: '985639782', role: 'Central' },
            { id: 'jorge-waltemath', name: 'Jorge Waltemath', phone: 'Se obtiene de BD', role: 'Supervisor' },
        ];

        // Filtrar solo los destinatarios seleccionados
        selectedWhatsAppRecipients.forEach(recipientId => {
            const recipient = availableRecipients.find(r => r.id === recipientId);
            if (recipient) {
                recipientsList.push(recipient);
            }
        });

        return recipientsList;
    }, [selectedWhatsAppRecipients]);

    // Memoizar el manejador de cambios de celda
    const handleCellValueChanged = useCallback(
        (change: any) => {
            registerChange(change.employeeName, change.employeeRut, change.day, change.oldValue, change.newValue);
        },
        [registerChange],
    );

    // Memoizar props del grid
    const gridProps = useMemo(
        () => ({
            rowData: filteredRowData,
            onCellValueChanged: handleCellValueChanged,
            onGridReady: setGridApi, // ¡Crucial para el sistema de undo!
            editable: hasEditPermissions && !isProcessingChanges,
            month: selectedDate.getMonth(),
            year: selectedDate.getFullYear(),
            pendingChanges: listaCambios,
            showPendingChanges,
            isProcessingChanges,
            hiddenShiftTypes: new Set(getAllShiftCodes().filter((code) => !visibleShiftTypes.has(code))),
            className: 'transition-all duration-300 ease-in-out',
            showTotals,
            selectedTotalsShiftTypes,
            visibleDayRange: rangeStart && rangeEnd
                ? { from: rangeStart.getDate(), to: rangeEnd.getDate() }
                : null,
            // Si rangos cruzan meses, construir columnas de fecha completa con subheader por mes
            dateColumns: (() => {
                if (!rangeStart || !rangeEnd) return null;
                const sameMonth = rangeStart.getMonth() === rangeEnd.getMonth() && rangeStart.getFullYear() === rangeEnd.getFullYear();
                if (sameMonth) return null;
                const cols: { key: string; date: Date }[] = [];
                const cur = new Date(rangeStart);
                const end = new Date(rangeEnd);
                // Asegurar que endDate incluya todo el día final
                end.setHours(23, 59, 59, 999);
                while (cur <= end) {
                    const key = cur.toISOString().split('T')[0];
                    cols.push({ key, date: new Date(cur) });
                    cur.setDate(cur.getDate() + 1);
                }
                return cols;
            })(),
        }),
        [
            filteredRowData,
            handleCellValueChanged,
            setGridApi,
            hasEditPermissions,
            isProcessingChanges,
            selectedDate,
            listaCambios,
            showPendingChanges,
            visibleShiftTypes,
            availableShiftTypes,
            showTotals,
            selectedTotalsShiftTypes,
            rangeStart,
            rangeEnd,
        ],
    );

    // Cargar por rango si cruza meses, si no, filtrar columnas del mismo mes
    const handleApplyRange = useCallback(async () => {
        if (!rangeStart || !rangeEnd) return;

        const sameMonth = rangeStart.getMonth() === rangeEnd.getMonth() && rangeStart.getFullYear() === rangeEnd.getFullYear();
        if (sameMonth) {
            // Solo ajustar visibilidad de columnas (ya se hace vía visibleDayRange)
            return;
        }

        // Cruza meses: llamar API de rango (placeholder mensual era para esto)
        try {
            toast.info('Cargando turnos por rango (cruza meses)...');
            await cargarTurnosPorRango(rangeStart, rangeEnd);
        } catch (_) {
            // notificar ya gestionado en hook
        }
    }, [rangeStart, rangeEnd, cargarTurnosPorRango]);

    // Memoizar props del resumen
    const summaryProps = useMemo(
        () => ({
            cambios: resumen,
            onActualizar: handleActualizarCambios,
            isProcesing: isSaving,
            isCollapsed: false,
            selectedDate: originalChangeDate || selectedDate,
            disabled: !hasEditPermissions,
            onUndoLastChange: undoChange,
            onUndoSpecificChange: undoSpecificChange,
            onClearAllChanges: undefined, // No más función de limpiar todo
            changeHistory: listaCambios,
        }),
        [
            resumen,
            handleActualizarCambios,
            isSaving,
            originalChangeDate,
            selectedDate,
            hasEditPermissions,
            undoChange,
            undoSpecificChange,
            listaCambios,
        ],
    );

    return (
        <>
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Turnos Optimizados" />

                <div className="overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
                <div className={`overflow-hidden ${isMobile ? 'p-2' : isGridMaximized ? 'p-2' : 'p-6'}`}>
                    {/* Header compacto de página */}
                    <div className={isMobile ? 'mb-0' : isGridMaximized ? 'mb-2' : 'mb-4'}>
                        <div className={`md:mb-2 flex flex-col ${isMobile ? 'gap-1' : 'gap-2'} lg:flex-row lg:items-center lg:justify-between`}>
                            <div className="flex w-full items-baseline justify-between">
                                <div className="ml-4 flex items-center gap-3">
                                    <div className="rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 p-2 shadow-md">
                                        <FileSpreadsheet className="h-8 md:h-12 w-8 md:w-12 text-white" />
                                    </div>
                                    <div>
                                        <h1
                                            className={`${isMobile ? 'text-lg' : 'text-xl'} flex items-center gap-2 font-bold text-slate-900 dark:text-white`}
                                        >
                                            {isMobile ? 'Turnos' : `Grid de Turnos - ${currentMonthTitle}`}
                                            {employee_rol_id === 1 && (
                                                <Badge className="bg-blue-100 text-xs text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                                                    Patrullaje
                                                </Badge>
                                            )}
                                        </h1>
                                        <div className={`flex items-center gap-3 ${isMobile ? 'mt-0.5 justify-center' : 'mt-0.5'}`}>
                                            {/* Selector de fecha solo en desktop */}
                                            {!isMobile && (
                                                <MonthYearPicker
                                                    onChange={setSelectedDate}
                                                    onLoadData={cargarTurnosPorMes}
                                                    loading={loading}
                                                    currentMonthTitle={currentMonthTitle}
                                                    selectedDate={selectedDate}
                                                    onMonthChangeRequest={handleDateChangeRequest}
                                                    hasPendingChanges={changeCount > 0}
                                                />
                                            )}
                                            {/* Botón de rango por días con 2 calendarios (inicio y término) */}
                                            {!isMobile && !loading && (
                                                <div className="flex items-center gap-2">
                                                    <Popover>
                                                        <PopoverTrigger asChild>
                                                            <Button variant="outline" size="sm">
                                                                {rangeStart && rangeEnd
                                                                    ? `${rangeStart.getDate()} ${rangeStart.toLocaleDateString('es-CL', { month: 'short' })} - ${rangeEnd.getDate()} ${rangeEnd.toLocaleDateString('es-CL', { month: 'short' })}`
                                                                    : 'Rango de días'}
                                                            </Button>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-auto p-3" align="start">
                                                            <div className="flex gap-4">
                                                                <div>
                                                                    <div className="text-xs mb-1 text-slate-600 dark:text-slate-300">Inicio</div>
                                                                    <UiCalendar
                                                                        mode="single"
                                                                        selected={rangeStart as any}
                                                                        defaultMonth={(rangeStart as any) || selectedDate}
                                                                        captionLayout="dropdown"
                                                                        onSelect={(d: any) => {
                                                                            if (!d) return;
                                                                            setRangeStart(d);
                                                                            if (rangeEnd && d > rangeEnd) {
                                                                                setRangeEnd(d);
                                                                            }
                                                                        }}
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <div className="text-xs mb-1 text-slate-600 dark:text-slate-300">Término</div>
                                                                    <UiCalendar
                                                                        mode="single"
                                                                        selected={rangeEnd as any}
                                                                        defaultMonth={(rangeEnd as any) || (rangeStart as any) || selectedDate}
                                                                        captionLayout="dropdown"
                                                                        onSelect={(d: any) => {
                                                                            if (!d) return;
                                                                            setRangeEnd(d);
                                                                            if (rangeStart && d < rangeStart) {
                                                                                setRangeStart(d);
                                                                            }
                                                                        }}
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div className="mt-2 flex justify-end gap-2">
                                                                {(rangeStart || rangeEnd) && (
                                                                    <Button variant="ghost" size="sm" onClick={() => { setRangeStart(null); setRangeEnd(null); }}>Limpiar</Button>
                                                                )}
                                                                <Button variant="default" size="sm" disabled={!rangeStart || !rangeEnd} onClick={handleApplyRange}>Aplicar</Button>
                                                            </div>
                                                        </PopoverContent>
                                                    </Popover>
                                                </div>
                                            )}
                                            {isMobile && (
                                                <button
                                                onClick={handleToggleDatePicker}
                                                className="flex cursor-pointer items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 transition-all hover:border-slate-300 hover:bg-slate-100 hover:text-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                                            >
                                                <Calendar className="h-3 w-3" />
                                                {currentMonthTitle}
                                            </button>
                                            )}

                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {!hasEditPermissions && (
                                        <Badge variant="outline" className="border-yellow-300 bg-yellow-50 text-xs text-yellow-700">
                                            Solo lectura
                                        </Badge>
                                    )}

                                    {/* Controles de edición movidos aquí */}
                                    {hasEditPermissions && (
                                        <>
                                            {/* Botones móviles en el header */}
                                            {isMobile && (
                                                <>
                                                    {/* Botón de deshacer en móvil */}
                                                    {changeCount > 0 && canUndo && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={undoChange}
                                                            disabled={!canUndo || isProcessingChanges}
                                                            className="flex h-8 w-8 items-center justify-center p-0"
                                                            title="Deshacer último cambio"
                                                        >
                                                            <Undo2 className="h-4 w-4" />
                                                        </Button>
                                                    )}

                                                    {/* Botón de guardar cambios en móvil */}
                                                    {changeCount > 0 && (
                                                        <Button
                                                            variant="default"
                                                            size="sm"
                                                            onClick={handleOpenConfirmDialog}
                                                            disabled={isProcessingChanges || isSaving}
                                                            className="flex h-8 w-8 items-center justify-center bg-green-600 p-0 text-white hover:bg-green-700"
                                                            title="Aplicar cambios"
                                                        >
                                                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                                        </Button>
                                                    )}

                                                    {/* Botón de menú en móvil */}
                                                    <MobileHeaderMenu
                                                        onShowSummary={() => setShowMobileSummaryModal(true)}
                                                        onShowEmployees={() => setShowMobileEmployeeModal(true)}
                                                        onShowDatePicker={handleToggleDatePicker}
                                                        onShowHistory={handleToggleHistory}
                                                        onShowWhatsApp={handleToggleWhatsAppConfig}
                                                        onShowFilter={handleToggleFilter}
                                                        changeCount={changeCount}
                                                        employeeCount={filteredRowData.length}
                                                        availableCount={filteredAvailableEmployees.length}
                                                        currentMonthTitle={currentMonthTitle}
                                                        hasAdminPermissions={hasAdminPermissions}
                                                    />
                                                </>
                                            )}

                                            {/* Botón de deshacer solo en desktop */}
                                            {!isMobile && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={undoChange}
                                                    disabled={!canUndo || isProcessingChanges}
                                                    className="flex items-center gap-2"
                                                >
                                                    <Undo2 className="h-4 w-4" />
                                                    Deshacer último
                                                </Button>
                                            )}

                                            {/* Botón de maximizar/minimizar grid */}
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={handleToggleGridMaximize}
                                                className="flex items-center gap-2"
                                                title={isGridMaximized ? 'Minimizar grid' : 'Maximizar grid'}
                                            >
                                                {isGridMaximized ? (
                                                    <Minimize2 className="h-4 w-4" />
                                                ) : (
                                                    <Maximize2 className="h-4 w-4" />
                                                )}
                                                {!isMobile && (isGridMaximized ? 'Minimizar' : 'Maximizar')}
                                            </Button>

                                            {/* Botón de empleados solo en desktop */}
                                            {!isMobile && !isGridMaximized && (
                                                <Button
                                                    variant={showEmployeePanel ? 'ghost' : 'outline'}
                                                    size="sm"
                                                    onClick={handleToggleEmployeePanel}
                                                    className={`flex items-center gap-2 transition-all duration-300 ${
                                                        showEmployeePanel
                                                            ? 'hover:bg-slate-100 dark:hover:bg-green-800'
                                                            : 'border-green-200 bg-green-50 text-green-700 hover:border-green-300 hover:bg-green-100 dark:border-green-800 dark:bg-green-800 dark:text-green-100 dark:hover:border-green-700 dark:hover:bg-green-700 dark:hover:text-green-100'
                                                    }`}
                                                    title={showEmployeePanel ? 'Ocultar gestión de empleados' : 'Mostrar gestión de empleados'}
                                                >
                                                    <Users className="h-4 w-4" />
                                                    {showEmployeePanel ? 'Ocultar empleados' : 'Gestionar empleados'}
                                                </Button>
                                            )}

                                            {/* Botón para toggle del resumen solo en desktop */}
                                            {!isMobile && !isGridMaximized && changeCount > 0 && (
                                                <Button
                                                    variant={showSummary ? 'ghost' : 'outline'}
                                                    size="sm"
                                                    onClick={handleToggleSummary}
                                                    className={`flex items-center gap-2 transition-all duration-300 ${
                                                        showSummary
                                                            ? 'hover:bg-slate-100 dark:hover:bg-blue-800'
                                                            : 'border-blue-200 bg-blue-50 font-medium text-blue-700 hover:border-blue-300 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-800 dark:text-blue-100 dark:hover:border-blue-700 dark:hover:bg-blue-700 dark:hover:text-blue-100'
                                                    }`}
                                                    title={showSummary ? 'Ocultar resumen' : 'Mostrar resumen de cambios'}
                                                >
                                                    {showSummary ? (
                                                        <>
                                                            <EyeOff className="h-4 w-4" />
                                                            Ocultar resumen
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Eye className="h-4 w-4" />
                                                            <span className="font-medium">Ver resumen ({changeCount})</span>
                                                        </>
                                                    )}
                                                </Button>
                                            )}

                                            {/* Botón de configuración WhatsApp solo para administradores */}
                                            {!isMobile && !isGridMaximized && hasAdminPermissions && (
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={handleToggleWhatsAppConfig}
                                                        className="flex items-center gap-2 border-green-200 bg-green-50 text-green-700 hover:border-green-300 hover:bg-green-100 dark:border-green-800 dark:bg-green-800 dark:text-green-100 dark:hover:border-green-700 dark:hover:bg-green-700 dark:hover:text-green-100"
                                                        title="Configurar notificaciones WhatsApp"
                                                    >
                                                        <MessageSquare className="h-4 w-4" />
                                                        WhatsApp
                                                    </Button>

                                                    {/* Checkbox de Modo Testing */}
                                                    <div className="flex items-center space-x-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-all duration-300 dark:border-slate-700 dark:hover:border-slate-600 dark:bg-slate-800 dark:hover:text-slate-100 border border-slate-200 py-2 px-3">
                                                        <Checkbox
                                                            id="whatsapp-testing-mode-desktop"
                                                            checked={whatsappTestingMode}
                                                            onCheckedChange={(checked) => {
                                                                setWhatsappTestingMode(checked as boolean);
                                                                localStorage.setItem('whatsapp-testing-mode', JSON.stringify(checked));
                                                            }}
                                                            className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded data-[state=checked]:bg-yellow-600 data-[state=checked]:border-yellow-600 dark:border-gray-700 dark:data-[state=checked]:bg-yellow-600 dark:data-[state=checked]:border-yellow-600"
                                                        />
                                                        <label
                                                            htmlFor="whatsapp-testing-mode-desktop"
                                                            className="text-xs font-medium text-yellow-700 cursor-pointer dark:text-yellow-100"
                                                            title="Enviar todos los mensajes de WhatsApp a mi número de prueba (951004035)"
                                                        >
                                                            🧪 Testing
                                                        </label>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Botón para mostrar/ocultar totales */}
                                            {!isMobile && !isGridMaximized && (
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        variant={showTotals ? 'ghost' : 'outline'}
                                                        size="sm"
                                                        onClick={handleToggleTotals}
                                                        className={`flex items-center gap-2 transition-all duration-300 ${
                                                            showTotals
                                                                ? 'hover:bg-slate-100 dark:hover:bg-purple-800'
                                                                : 'border-purple-200 bg-purple-50 text-purple-700 hover:border-purple-300 hover:bg-purple-100 dark:border-purple-800 dark:bg-purple-800 dark:text-purple-100 dark:hover:border-purple-700 dark:hover:bg-purple-700 dark:hover:text-purple-100'
                                                        }`}
                                                        title={showTotals ? 'Ocultar totales' : 'Mostrar totales por tipo de turno'}
                                                    >
                                                        {showTotals ? (
                                                            <>
                                                                <EyeOff className="h-4 w-4" />
                                                                Ocultar totales
                                                            </>
                                                        ) : (
                                                            <>
                                                                <FileSpreadsheet className="h-4 w-4" />
                                                                Mostrar totales
                                                            </>
                                                        )}
                                                    </Button>

                                                    {/* Selector de tipos de turnos para totales */}
                                                    {showTotals && (
                                                        <div className="relative totals-selector-container">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => setShowTotalsSelector(!showTotalsSelector)}
                                                                className="flex items-center gap-2 border-purple-200 bg-purple-50 text-purple-700 hover:border-purple-300 hover:bg-purple-100 dark:border-purple-800 dark:bg-purple-800 dark:text-purple-100 dark:hover:border-purple-700 dark:hover:bg-purple-700"
                                                                title="Seleccionar tipos de turnos para totales"
                                                            >
                                                                <Filter className="h-4 w-4" />
                                                                Filtrar ({selectedTotalsShiftTypes.size})
                                                            </Button>

                                                            {/* Dropdown del selector */}
                                                            {showTotalsSelector && (
                                                                <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-lg border border-slate-200 bg-white p-4 shadow-lg dark:border-slate-700 dark:bg-slate-800">
                                                                    <div className="mb-3 flex items-center justify-between">
                                                                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                                                                            Tipos de turnos para totales
                                                                        </h3>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            onClick={() => setShowTotalsSelector(false)}
                                                                            className="h-6 w-6 p-0"
                                                                        >
                                                                            <X className="h-4 w-4" />
                                                                        </Button>
                                                                    </div>

                                                                    <div className="mb-3 flex gap-2">
                                                                        <Button
                                                                            variant="outline"
                                                                            size="sm"
                                                                            onClick={handleSelectAllTotalsShiftTypes}
                                                                            className="text-xs"
                                                                        >
                                                                            Seleccionar todos
                                                                        </Button>
                                                                        <Button
                                                                            variant="outline"
                                                                            size="sm"
                                                                            onClick={handleClearAllTotalsShiftTypes}
                                                                            className="text-xs"
                                                                        >
                                                                            Limpiar
                                                                        </Button>
                                                                    </div>

                                                                    <div className="max-h-60 space-y-2 overflow-y-auto">
                                                                        {totalsSelectableShiftCodes.map((item) => (
                                                                            <div key={item.code} className="flex items-center space-x-2">
                                                                                <Checkbox
                                                                                    id={`totals-${item.code}`}
                                                                                    checked={selectedTotalsShiftTypes.has(item.code)}
                                                                                    onCheckedChange={() => handleToggleTotalsShiftType(item.code)}
                                                                                    className="h-4 w-4"
                                                                                />
                                                                                <label
                                                                                    htmlFor={`totals-${item.code}`}
                                                                                    className="flex-1 cursor-pointer text-sm text-slate-700 dark:text-slate-300"
                                                                                >
                                                                                    {item.code} - {item.label}
                                                                                </label>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Botón de filtro de turnos */}
                                            {!isMobile && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={handleToggleShiftFilter}
                                                    className={`flex items-center gap-2 transition-all duration-300 ${
                                                        showShiftFilter
                                                            ? 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-800 dark:text-blue-100 dark:hover:border-blue-700 dark:hover:bg-blue-700 dark:hover:text-blue-100'
                                                            : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                                                    }`}
                                                    title="Filtrar tipos de turnos"
                                                >
                                                    <Filter className="h-4 w-4" />
                                                    Filtrar Turnos
                                                    {visibleShiftTypes.size < availableShiftTypes.length && (
                                                        <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-blue-500 px-1.5 py-0.5 text-xs text-white">
                                                            {availableShiftTypes.length - visibleShiftTypes.size}
                                                        </span>
                                                    )}
                                                </Button>
                                            )}

                                            {/* Botón para aplicar cambios solo en desktop */}
                                            {!isMobile && changeCount > 0 && (
                                                <Button
                                                    variant="default"
                                                    size="sm"
                                                    onClick={handleOpenConfirmDialog}
                                                    disabled={isProcessingChanges || isSaving}
                                                    className="flex items-center gap-2 bg-green-600 text-white hover:bg-green-700 dark:bg-green-800 dark:text-green-100 dark:hover:bg-green-700"
                                                >
                                                    {isSaving ? (
                                                        <>
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                            Aplicando...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Save className="h-4 w-4" />
                                                            Aplicar cambios
                                                        </>
                                                    )}
                                                </Button>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Contenido principal */}
                        <div className={`flex overflow-hidden ${isMobile ? 'h-[calc(100vh-120px)] flex-col' : isGridMaximized ? 'h-[calc(100vh-140px)]' : 'h-[calc(100vh-180px)] gap-6'}`}>
                            {/* Grid principal */}
                            <div className="min-w-0 flex-1">
                                {isMobile ? (
                                    // Vista móvil: Sin Card, ocupa todo el ancho con padding para FAB
                                    <div className="mt-4 h-full min-h-[calc(100vh-200px)] w-full pb-12">
                                        {loading ? (
                                            <OptimizedLoadingGrid />
                                        ) : (
                                            <Suspense fallback={<OptimizedLoadingGrid />}>
                                                <div className="ag-theme-alpine h-full w-full">
                                                    <OptimizedExcelGrid {...(gridProps as any)} />
                                                </div>
                                            </Suspense>
                                        )}
                                    </div>
                                ) : (
                                    // Vista desktop: Con Card y estilos
                                    <Card className="h-full border-slate-200/50 shadow-xl backdrop-blur-sm dark:bg-slate-900/90">
                                        <CardContent className="flex h-full flex-col p-0">
                                            <div className="flex-1 overflow-hidden">
                                                {loading ? (
                                                    <OptimizedLoadingGrid />
                                                ) : (
                                                    <Suspense fallback={<OptimizedLoadingGrid />}>
                                                        <div className="ag-theme-alpine h-full">
                                                            <OptimizedExcelGrid {...(gridProps as any)} />
                                                        </div>
                                                    </Suspense>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>

                            {/* Panel lateral - Resumen de cambios */}
                            {!isMobile && !isGridMaximized && hasEditPermissions && changeCount > 0 && showSummary && (
                                <div className="h-full w-96 flex-shrink-0">
                                    <Suspense
                                        fallback={
                                            <div className="flex h-full items-center justify-center">
                                                <Loader2 className="h-6 w-6 animate-spin" />
                                            </div>
                                        }
                                    >
                                        <ListaCambios {...summaryProps} />
                                    </Suspense>
                                </div>
                            )}

                            {/* Panel de gestión de empleados - Solo desktop */}
                            {!isMobile && !isGridMaximized && hasEditPermissions && showEmployeePanel && (
                                <div className="h-full w-96 flex-shrink-0">
                                    <Suspense
                                        fallback={
                                            <div className="flex h-full items-center justify-center">
                                                <Loader2 className="h-6 w-6 animate-spin" />
                                            </div>
                                        }
                                    >
                                        <EmployeeManagementCardV3
                                            searchTerm={searchTerm}
                                            setSearchTerm={setSearchTerm}
                                            rowData={filteredRowData}
                                            availableEmployees={filteredAvailableEmployees}
                                            getEmployeeId={getEmployeeId}
                                            addEmployeeToGrid={addEmployeeToGrid}
                                            removeEmployeeFromGrid={removeEmployeeFromGrid}
                                            addAllEmployees={addAllEmployees}
                                            clearAllEmployees={clearAllEmployees}
                                            isMobile={false}
                                        />
                                    </Suspense>
                                </div>
                            )}

                            {/* Panel de filtro de turnos - Solo desktop */}
                            {!isMobile && showShiftFilter && (
                                <div className="h-full w-80 flex-shrink-0">
                                    <Card className="h-full border-slate-200/50 shadow-xl backdrop-blur-sm dark:bg-slate-900/90">
                                        <CardHeader className="pb-3">
                                            <div className="flex items-center justify-between">
                                                <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                                                    <Filter className="h-5 w-5" />
                                                    Filtrar Turnos
                                                </CardTitle>
                                                <Button variant="ghost" size="sm" onClick={handleToggleShiftFilter} className="h-8 w-8 p-0">
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                                Desmarca los tipos de turnos que deseas ocultar
                                            </p>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            {/* Botones para manejar filtros */}
                                            <div className="flex flex-wrap gap-2">
                                                {visibleShiftTypes.size < availableShiftTypes.length && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={clearAllFilters}
                                                        className="max-w-[120px] min-w-0 flex-1 px-1"
                                                    >
                                                        Seleccionar todos
                                                    </Button>
                                                )}
                                                {visibleShiftTypes.size > 0 && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={deselectAllFilters}
                                                        className="dark:bg-red-800 dark:text-red-100 dark:hover:bg-red-700 dark:hover:text-red-100 dark:border-red-700 dark:hover:border-red-700"
                                                    >
                                                        Deseleccionar todos
                                                    </Button>
                                                )}
                                            </div>

                                            {/* Lista de tipos de turnos */}
                                            <ScrollArea className="h-[calc(100vh-400px)]">
                                                <div className="space-y-3">
                                                    {availableShiftTypes.map((shiftType) => (
                                                        <div
                                                            key={shiftType.code}
                                                            className="flex items-center space-x-3 rounded-lg p-2 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
                                                        >
                                                            <Checkbox
                                                                id={`shift-${shiftType.code}`}
                                                                checked={
                                                                    shiftType.isGroup && shiftType.codes
                                                                        ? shiftType.codes.every((code) => visibleShiftTypes.has(code))
                                                                        : visibleShiftTypes.has(shiftType.code)
                                                                }
                                                                onCheckedChange={() => handleToggleShiftType(shiftType.code)}
                                                            />
                                                            <div className="flex flex-1 items-center gap-2">
                                                                <div
                                                                    className="h-4 w-4 rounded border border-slate-300 dark:border-slate-600"
                                                                    style={{
                                                                        backgroundColor:
                                                                            shiftType.color === 'transparent' ? '#f1f5f9' : shiftType.color,
                                                                        border: shiftType.color === 'transparent' ? '1px dashed #94a3b8' : undefined,
                                                                    }}
                                                                />
                                                                <label
                                                                    htmlFor={`shift-${shiftType.code}`}
                                                                    className="flex-1 cursor-pointer text-sm font-medium"
                                                                >
                                                                    {shiftType.name}
                                                                </label>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </ScrollArea>
                                        </CardContent>
                                    </Card>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Modal móvil - Resumen de cambios */}
                    <Dialog open={showMobileSummaryModal} onOpenChange={setShowMobileSummaryModal}>
                        <DialogContent className="mx-auto h-full max-h-[90vh] w-full max-w-[95vw] p-2">
                            <DialogHeader className="border-b bg-white px-4 py-3 dark:bg-slate-900">
                                <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
                                    <Eye className="h-5 w-5" />
                                    Resumen de Cambios
                                </DialogTitle>
                                <DialogDescription className="text-sm text-slate-600 dark:text-slate-400">
                                    {changeCount} cambio{changeCount !== 1 ? 's' : ''} pendiente{changeCount !== 1 ? 's' : ''} por aplicar
                                </DialogDescription>
                            </DialogHeader>
                            <div className="flex-1 overflow-y-auto bg-slate-50 px-4 py-3 dark:bg-slate-800">
                                <Suspense
                                    fallback={
                                        <div className="flex items-center justify-center p-8">
                                            <Loader2 className="h-6 w-6 animate-spin" />
                                        </div>
                                    }
                                >
                                    <ListaCambios {...summaryProps} />
                                </Suspense>
                            </div>
                        </DialogContent>
                    </Dialog>

                    {/* Modal móvil - Gestión de empleados */}
                    <Dialog open={showMobileEmployeeModal} onOpenChange={setShowMobileEmployeeModal}>
                        <DialogContent className="mx-auto flex h-[80vh] max-h-[80vh] w-full max-w-[95vw] flex-col p-2">
                            <DialogHeader className="flex-shrink-0 border-b bg-white px-4 py-3 dark:bg-slate-900">
                                <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
                                    <Users className="h-5 w-5" />
                                    Gestión de Funcionarios
                                </DialogTitle>
                                <DialogDescription className="text-sm text-slate-600 dark:text-slate-400">
                                    {filteredRowData.length} empleados en grid • {filteredAvailableEmployees.length} disponibles
                                </DialogDescription>
                            </DialogHeader>
                            <div className="flex-1 overflow-hidden bg-slate-50 px-4 py-3 dark:bg-slate-800">
                                <Suspense
                                    fallback={
                                        <div className="flex h-full items-center justify-center">
                                            <Loader2 className="h-6 w-6 animate-spin" />
                                        </div>
                                    }
                                >
                                    <EmployeeManagementCardV3
                                        searchTerm={searchTerm}
                                        setSearchTerm={setSearchTerm}
                                        rowData={filteredRowData}
                                        availableEmployees={filteredAvailableEmployees}
                                        getEmployeeId={getEmployeeId}
                                        addEmployeeToGrid={addEmployeeToGrid}
                                        removeEmployeeFromGrid={removeEmployeeFromGrid}
                                        addAllEmployees={addAllEmployees}
                                        clearAllEmployees={clearAllEmployees}
                                        isMobile={true}
                                    />
                                </Suspense>
                            </div>
                        </DialogContent>
                    </Dialog>

                    {/* Modal móvil - Selector de fecha */}
                    <Dialog open={showMobileDatePickerModal} onOpenChange={setShowMobileDatePickerModal}>
                        <DialogContent className="mx-auto flex h-[80vh] max-h-[80vh] w-full max-w-[95vw] flex-col p-2 z-[10000]">
                            <DialogHeader className="flex-shrink-0 border-b bg-white px-4 py-3 dark:bg-slate-900">
                                <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
                                    <Calendar className="h-5 w-5" />
                                    Seleccionar Fecha
                                </DialogTitle>
                                <DialogDescription className="text-sm text-slate-600 dark:text-slate-400">
                                    Cambiar el mes y año para visualizar turnos
                                </DialogDescription>
                            </DialogHeader>
                            <div className="flex-1 overflow-y-auto bg-slate-50 px-4 py-6 dark:bg-slate-800">
                                <div className="flex h-full flex-col items-center justify-center">
                                    <div className="w-full max-w-sm">
                                        <MonthYearPicker
                                            onChange={setSelectedDate}
                                            onLoadData={cargarTurnosPorMes}
                                            loading={loading}
                                            currentMonthTitle={currentMonthTitle}
                                            selectedDate={selectedDate}
                                            onMonthChangeRequest={handleDateChangeRequest}
                                            hasPendingChanges={changeCount > 0}
                                        />
                                    </div>

                                    {/* Advertencia de cambios pendientes */}
                                    {changeCount > 0 && (
                                        <div className="mt-4 w-full max-w-sm">
                                            <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-900/20">
                                                <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
                                                <div className="flex-1">
                                                    <h4 className="text-sm font-medium text-amber-800 dark:text-amber-200">Cambios Pendientes</h4>
                                                    <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                                                        Tienes {changeCount} cambio{changeCount !== 1 ? 's' : ''} sin guardar en el mes actual. Te
                                                        recomendamos guardar o deshacer los cambios antes de cambiar de mes.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    <div className="mt-6 text-center">
                                        <p className="text-sm text-slate-600 dark:text-slate-400">
                                            Actualmente visualizando: <span className="font-medium">{currentMonthTitle}</span>
                                        </p>
                                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">{getTotalEmployees()} empleados en el grid</p>
                                    </div>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>

                    {/* Modal móvil - Historial de cambios */}
                    <Dialog open={showMobileHistoryModal} onOpenChange={setShowMobileHistoryModal}>
                        <DialogContent className="mx-auto h-full max-h-[90vh] w-full max-w-[95vw] p-2">
                            <DialogHeader className="flex-shrink-0 border-b bg-white px-4 py-3 dark:bg-slate-900">
                                <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
                                    <History className="h-5 w-5" />
                                    Historial de Cambios
                                </DialogTitle>
                                <DialogDescription className="text-sm text-slate-600 dark:text-slate-400">
                                    Historial de cambios de turnos guardados en la base de datos
                                </DialogDescription>
                            </DialogHeader>
                            <div className="flex-1 overflow-hidden">
                                <Suspense
                                    fallback={
                                        <div className="flex h-full items-center justify-center">
                                            <Loader2 className="h-6 w-6 animate-spin" />
                                        </div>
                                    }
                                >
                                    <ShiftHistoryFeed employee_rol_id={employee_rol_id} />
                                </Suspense>
                            </div>
                        </DialogContent>
                    </Dialog>

                    {/* Dialog de confirmación para aplicar cambios */}
                    <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                        <DialogContent className="mx-auto max-h-[90vh] w-full max-w-[95vw] lg:max-w-[1200px] p-2 sm:p-3 lg:p-6">
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                                    Confirmar aplicación de cambios
                                </DialogTitle>
                                <DialogDescription>
                                    Estás a punto de aplicar {changeCount} cambio{changeCount !== 1 ? 's' : ''} en los turnos. Esta acción no se puede
                                    deshacer.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="py-4">
                                <h4 className="mb-3 text-sm font-medium">Resumen de cambios:</h4>
                                <div className="max-h-32 sm:max-h-40 md:max-h-48 overflow-y-auto rounded-md border p-3">
                                        {formatChangesForDisplay().map((change, index) => (
                                            <div key={index} className="my-2 flex md:flex-row flex-col items-center justify-between rounded-md bg-slate-50 p-2">
                                                <div>
                                                    <span className="font-medium text-slate-900">{change.empleado}</span>
                                                    <span className="ml-2 text-slate-500">• {change.fecha}</span>
                                                </div>
                                                <Badge
                                                    variant="outline"
                                                    className={
                                                        change.turno === 'Eliminar'
                                                            ? 'border-red-300 text-red-700'
                                                            : 'border-green-300 text-green-700'
                                                    }
                                                >
                                                    {change.turno}
                                                </Badge>
                                            </div>
                                        ))}
                                </div>
                            </div>

                            {/* Sección de destinatarios de WhatsApp */}
                            {(selectedWhatsAppRecipients.length > 0 || whatsappTestingMode) && (
                                <div className="py-4">
                                    <h4 className="mb-3 flex items-center gap-2 text-sm font-medium">
                                        <MessageSquare className="h-4 w-4 text-green-600" />
                                        Destinatarios de WhatsApp:
                                        {whatsappTestingMode && (
                                            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                                                🧪 Modo Testing
                                            </Badge>
                                        )}
                                    </h4>
                                    <div className="rounded-md border bg-green-50 p-2 sm:p-3">
                                        <div className="max-h-20 sm:max-h-24 md:max-h-32 lg:max-h-40 overflow-y-auto">
                                            <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1.5 sm:gap-2 pr-2">
                                                {formatWhatsAppRecipients().map((recipient, index) => (
                                                    <div key={index} className="flex items-center rounded-md bg-green-100 p-1.5 sm:p-2">
                                                        <div className="flex items-center gap-2">
                                                            <Phone className="h-3 w-3 text-green-600" />
                                                            <span className="font-medium text-slate-900">{recipient.name}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        {whatsappTestingMode && (
                                            <div className="mt-2 rounded-md bg-yellow-100 p-2">
                                                <p className="text-xs text-yellow-800">
                                                    🧪 <strong>Modo Testing:</strong> Todos los mensajes se enviarán a tu número de prueba (951004035)
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <DialogFooter className="pb-2">
                                <Button variant="outline" onClick={() => setShowConfirmDialog(false)} disabled={isSaving}>
                                    Cancelar
                                </Button>
                                <Button onClick={handleConfirmChanges} disabled={isSaving} className="bg-green-600 hover:bg-green-700">
                                    {isSaving ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Aplicando...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 className="mr-2 h-4 w-4" />
                                            Confirmar y aplicar
                                        </>
                                    )}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* Modal de configuración de WhatsApp - Desktop */}
                    {!isMobile && hasAdminPermissions && (
                        <Dialog open={showWhatsAppConfig} onOpenChange={setShowWhatsAppConfig}>
                            <DialogContent className="mx-auto max-h-[90vh] w-full max-w-4xl">
                                <WhatsAppNotificationsConfig
                                    isOpen={showWhatsAppConfig}
                                    onClose={() => setShowWhatsAppConfig(false)}
                                    onSave={handleSaveWhatsAppConfig}
                                    selectedRecipients={selectedWhatsAppRecipients}
                                    initialTestingMode={whatsappTestingMode}
                                    isMobile={false}
                                />
                            </DialogContent>
                        </Dialog>
                    )}

                    {/* Modal de configuración de WhatsApp - Mobile */}
                    {isMobile && hasAdminPermissions && (
                        <WhatsAppNotificationsConfig
                            isOpen={showMobileWhatsAppModal}
                            onClose={() => setShowMobileWhatsAppModal(false)}
                            onSave={handleSaveWhatsAppConfig}
                            selectedRecipients={selectedWhatsAppRecipients}
                            initialTestingMode={whatsappTestingMode}
                            isMobile={true}
                        />
                    )}

                    {/* Modal de filtro de turnos - Mobile */}
                    {isMobile && (
                        <MobileShiftFilterModal
                            isOpen={showMobileFilterModal}
                            onClose={() => setShowMobileFilterModal(false)}
                            shiftTypes={availableShiftTypes}
                            selectedShiftTypes={Array.from(visibleShiftTypes)}
                            onShiftTypeToggle={handleToggleShiftType}
                            onSelectAll={clearAllFilters}
                            onDeselectAll={deselectAllFilters}
                        />
                    )}

                    {/* Toast optimizado */}
                    <Toaster
                        richColors
                        position="bottom-right"
                        toastOptions={{
                            style: {
                                background: 'rgba(255, 255, 255, 0.95)',
                                backdropFilter: 'blur(10px)',
                                border: '1px solid rgba(226, 232, 240, 0.5)',
                            },
                        }}
                    />
                </div>
            </div>
        </AppLayout>

        {/* Modal de pantalla completa para grid maximizado - Solo desktop */}
        {!isMobile && isGridMaximized && (
            <div
                className="fixed inset-0 z-[9999] bg-white dark:bg-slate-900"
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    width: '100vw',
                    height: '100vh',
                    margin: 0,
                    padding: 0,
                    transform: 'none',
                    zIndex: 9999
                }}
                onClick={(e) => {
                    // Solo cerrar si se hace clic en el fondo, no en el contenido
                    if (e.target === e.currentTarget) {
                        setIsGridMaximized(false);
                    }
                }}
            >
                <div className="flex h-full flex-col">
                    {/* Header minimalista para pantalla completa */}
                    <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-800">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 p-2 shadow-md">
                                <FileSpreadsheet className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-slate-900 dark:text-white">
                                    Grid de Turnos - {currentMonthTitle}
                                </h1>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {!hasEditPermissions && (
                                <Badge variant="outline" className="border-yellow-300 bg-yellow-50 text-xs text-yellow-700">
                                    Solo lectura
                                </Badge>
                            )}

                            {hasEditPermissions && (
                                <>
                                    {/* Botón de deshacer */}
                                    {changeCount > 0 && canUndo && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={undoChange}
                                            disabled={!canUndo || isProcessingChanges}
                                            className="flex items-center gap-2"
                                        >
                                            <Undo2 className="h-4 w-4" />
                                            Deshacer último
                                        </Button>
                                    )}

                                    {/* Botón móvil del selector de fecha */}
                                    {isMobile && (
                                        <button
                                            onClick={handleToggleDatePicker}
                                            className="flex cursor-pointer items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 transition-all hover:border-slate-300 hover:bg-slate-100 hover:text-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                                        >
                                            <Calendar className="h-3 w-3" />
                                            {currentMonthTitle}
                                        </button>
                                    )}

                                    {/* Botón de empleados */}
                                    <Button
                                        variant={showEmployeePanel ? 'ghost' : 'outline'}
                                        size="sm"
                                        onClick={handleToggleEmployeePanel}
                                        className={`flex items-center gap-2 transition-all duration-300 ${
                                            showEmployeePanel
                                                ? 'hover:bg-slate-100 dark:hover:bg-green-800'
                                                : 'border-green-200 bg-green-50 text-green-700 hover:border-green-300 hover:bg-green-100 dark:border-green-800 dark:bg-green-800 dark:text-green-100 dark:hover:border-green-700 dark:hover:bg-green-700'
                                        }`}
                                        title={showEmployeePanel ? 'Ocultar gestión de empleados' : 'Mostrar gestión de empleados'}
                                    >
                                        <Users className="h-4 w-4" />
                                        {showEmployeePanel ? 'Ocultar empleados' : 'Gestionar empleados'}
                                    </Button>

                                    {/* Botón de resumen */}
                                    {changeCount > 0 && (
                                        <Button
                                            variant={showSummary ? 'ghost' : 'outline'}
                                            size="sm"
                                            onClick={handleToggleSummary}
                                            className={`flex items-center gap-2 transition-all duration-300 ${
                                                showSummary
                                                    ? 'hover:bg-slate-100 dark:hover:bg-blue-800'
                                                    : 'border-blue-200 bg-blue-50 font-medium text-blue-700 hover:border-blue-300 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-800 dark:text-blue-100 dark:hover:border-blue-700 dark:hover:bg-blue-700 dark:hover:text-blue-100'
                                            }`}
                                            title={showSummary ? 'Ocultar resumen de cambios' : 'Mostrar resumen de cambios'}
                                        >
                                            <Eye className="h-4 w-4" />
                                            {showSummary ? 'Ocultar resumen' : 'Ver resumen'}
                                        </Button>
                                    )}

                                    {/* Botón de filtro de turnos */}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleToggleShiftFilter}
                                        className={`flex items-center gap-2 transition-all duration-300 ${
                                            showShiftFilter
                                                ? 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-800 dark:text-blue-100 dark:hover:border-blue-700 dark:hover:bg-blue-700 dark:hover:text-blue-100'
                                                : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                                        }`}
                                        title={showShiftFilter ? 'Ocultar filtro de turnos' : 'Mostrar filtro de turnos'}
                                    >
                                        <Filter className="h-4 w-4" />
                                        {showShiftFilter ? 'Ocultar filtro' : 'Filtrar turnos'}
                                    </Button>

                                    {/* Botón para mostrar/ocultar totales */}
                                    <Button
                                        variant={showTotals ? 'ghost' : 'outline'}
                                        size="sm"
                                        onClick={handleToggleTotals}
                                        className={`flex items-center gap-2 transition-all duration-300 ${
                                            showTotals
                                                ? 'hover:bg-slate-100 dark:hover:bg-purple-800'
                                                : 'border-purple-200 bg-purple-50 text-purple-700 hover:border-purple-300 hover:bg-purple-100 dark:border-purple-800 dark:bg-purple-800 dark:text-purple-100 dark:hover:border-purple-700 dark:hover:bg-purple-700 dark:hover:text-purple-100'
                                        }`}
                                        title={showTotals ? 'Ocultar totales' : 'Mostrar totales'}
                                    >
                                        <Eye className="h-4 w-4" />
                                        {showTotals ? 'Ocultar totales' : 'Ver totales'}
                                    </Button>

                                    {/* Botón de configuración WhatsApp solo para administradores */}
                                    {hasAdminPermissions && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleToggleWhatsAppConfig}
                                            className="flex items-center gap-2 border-green-200 bg-green-50 text-green-700 hover:border-green-300 hover:bg-green-100 dark:border-green-800 dark:bg-green-800 dark:text-green-100 dark:hover:border-green-700 dark:hover:bg-green-700 dark:hover:text-green-100"
                                            title="Configurar notificaciones WhatsApp"
                                        >
                                            <MessageSquare className="h-4 w-4" />
                                            WhatsApp
                                        </Button>
                                    )}

                                    {/* Botón de guardar */}
                                    {changeCount > 0 && (
                                        <Button
                                            onClick={handleOpenConfirmDialog}
                                            disabled={isProcessingChanges || isSaving}
                                            className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                                        >
                                            <Save className="h-4 w-4" />
                                            {isSaving ? 'Guardando...' : `Guardar ${changeCount} cambio${changeCount !== 1 ? 's' : ''}`}
                                        </Button>
                                    )}
                                </>
                            )}

                            {/* Botón de minimizar */}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleToggleGridMaximize}
                                className="flex items-center gap-2"
                                title="Minimizar grid"
                            >
                                <Minimize2 className="h-4 w-4" />
                                Minimizar
                            </Button>
                            {/* Botón selector de fecha (desktop en vista maximizada) */}
                            {!isMobile && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleToggleDatePicker}
                                    className="flex items-center gap-2"
                                    title="Seleccionar mes/año"
                                >
                                    <Calendar className="h-4 w-4" />
                                    {currentMonthTitle}
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Contenido principal con paneles laterales */}
                    <div className="flex flex-1 overflow-hidden">
                        {/* Grid principal */}
                        <div className="min-w-0 flex-1">
                            {loading ? (
                                <div className="flex h-full items-center justify-center">
                                    <div className="flex flex-col items-center space-y-4">
                                        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
                                        <p className="text-slate-600 dark:text-slate-400">Cargando turnos...</p>
                                    </div>
                                </div>
                            ) : (
                                <Suspense fallback={
                                    <div className="flex h-full items-center justify-center">
                                        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
                                    </div>
                                }>
                                    <div className="ag-theme-alpine h-full w-full">
                                        <OptimizedExcelGrid {...(gridProps as any)} />
                                    </div>
                                </Suspense>
                            )}
                        </div>

                        {/* Panel lateral - Resumen de cambios */}
                        {hasEditPermissions && changeCount > 0 && showSummary && (
                            <div className="h-full w-96 flex-shrink-0 border-l border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
                                <Suspense
                                    fallback={
                                        <div className="flex h-full items-center justify-center">
                                            <div className="h-6 w-6 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
                                        </div>
                                    }
                                >
                                    <ListaCambios {...summaryProps} />
                                </Suspense>
                            </div>
                        )}

                        {/* Panel de gestión de empleados */}
                        {hasEditPermissions && showEmployeePanel && (
                            <div className="h-full w-96 flex-shrink-0 border-l border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
                                <Suspense
                                    fallback={
                                        <div className="flex h-full items-center justify-center">
                                            <div className="h-6 w-6 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
                                        </div>
                                    }
                                >
                                        <EmployeeManagementCardV3
                                            searchTerm={searchTerm}
                                            setSearchTerm={setSearchTerm}
                                            rowData={filteredRowData}
                                            availableEmployees={filteredAvailableEmployees}
                                            getEmployeeId={getEmployeeId}
                                            addEmployeeToGrid={addEmployeeToGrid}
                                            removeEmployeeFromGrid={removeEmployeeFromGrid}
                                            addAllEmployees={addAllEmployees}
                                            clearAllEmployees={clearAllEmployees}
                                            isMobile={false}
                                        />
                                </Suspense>
                            </div>
                        )}

                        {/* Panel de filtro de turnos */}
                        {showShiftFilter && (
                            <div className="h-full w-80 flex-shrink-0 border-l border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
                                <div className="h-full p-4">
                                    <div className="mb-4 flex items-center justify-between">
                                        <h3 className="flex items-center gap-2 text-lg font-semibold">
                                            <Filter className="h-5 w-5" />
                                            Filtrar Turnos
                                        </h3>
                                        <Button variant="ghost" size="sm" onClick={handleToggleShiftFilter} className="h-8 w-8 p-0">
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
                                        Desmarca los tipos de turnos que deseas ocultar
                                    </p>

                                    {/* Botones para manejar filtros */}
                                    <div className="mb-4 flex flex-wrap gap-2">
                                        {visibleShiftTypes.size < availableShiftTypes.length && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={clearAllFilters}
                                                className="text-xs"
                                            >
                                                Mostrar todos
                                            </Button>
                                        )}
                                        {visibleShiftTypes.size > 0 && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={deselectAllFilters}
                                                className="text-xs"
                                            >
                                                Ocultar todos
                                            </Button>
                                        )}
                                    </div>

                                    {/* Lista de tipos de turnos */}
                                    <ScrollArea className="h-[calc(100%-120px)]">
                                        <div className="space-y-2">
                                            {availableShiftTypes.map((shiftType) => (
                                                <div key={shiftType.code} className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id={`shift-${shiftType.code}`}
                                                        checked={
                                                            shiftType.isGroup && shiftType.codes
                                                                ? shiftType.codes.every((code) => visibleShiftTypes.has(code))
                                                                : visibleShiftTypes.has(shiftType.code)
                                                        }
                                                        onCheckedChange={() => handleToggleShiftType(shiftType.code)}
                                                    />
                                                    <div className="flex items-center gap-2">
                                                        <div
                                                            className="h-4 w-4 rounded border"
                                                            style={{
                                                                backgroundColor:
                                                                    shiftType.color === 'transparent' ? '#f1f5f9' : shiftType.color,
                                                                border: shiftType.color === 'transparent' ? '1px dashed #94a3b8' : undefined,
                                                            }}
                                                        />
                                                        <label
                                                            htmlFor={`shift-${shiftType.code}`}
                                                            className="flex-1 cursor-pointer text-sm font-medium"
                                                        >
                                                            {shiftType.name}
                                                        </label>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </ScrollArea>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}
        </>
    );
}
