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
import { useCustomOrder } from '@/hooks/useCustomOrder';
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
    const [showMobileWhatsAppModal, setShowMobileWhatsAppModal] = useState(false);
    const [showMobileFilterModal, setShowMobileFilterModal] = useState(false);
    const [showMobileDateModal, setShowMobileDateModal] = useState(false);

    // Estados para popups individuales de fecha
    const [showStartDatePopup, setShowStartDatePopup] = useState(false);
    const [showEndDatePopup, setShowEndDatePopup] = useState(false);

    // Estado para rango de días visible (solo UI, datos siguen siendo mensuales)
    // Establecer rango por defecto para el mes actual
    const getDefaultRange = () => {
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        return { firstDay, lastDay };
    };

    const defaultRange = getDefaultRange();
    const [rangeStart, setRangeStart] = useState<Date | null>(defaultRange.firstDay);
    const [rangeEnd, setRangeEnd] = useState<Date | null>(defaultRange.lastDay);

    // Estados temporales para la selección de rango (no afectan la tabla hasta aplicar)
    const [tempRangeStart, setTempRangeStart] = useState<Date | null>(rangeStart);
    const [tempRangeEnd, setTempRangeEnd] = useState<Date | null>(rangeEnd);

    // Sincronizar estados temporales con estados reales cuando cambien
    useEffect(() => {
        setTempRangeStart(rangeStart);
        setTempRangeEnd(rangeEnd);
    }, [rangeStart, rangeEnd]);


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
        // En mobile, usar un modal con day pickers individuales
        if (isMobile) {
            setShowMobileDateModal(true);
        }
    }, [isMobile]);

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

    // Hook para manejar el orden personalizado de empleados
    const { customOrder, updateCustomOrder } = useCustomOrder({
        storageKey: `custom-order-${selectedDate.getFullYear()}-${selectedDate.getMonth()}`,
    });

    // Función para abrir el popup de confirmación
    const handleOpenConfirmDialog = useCallback(() => {
        setShowConfirmDialog(true);
    }, []);

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
            try { (recalculateGridLayout as any)?.(); } catch { }
            const id = window.setTimeout(() => { try { (recalculateGridLayout as any)?.(); } catch { } }, 120);
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

    //! ========== FILTRO HARDCODEADO - EDITA AQUÍ LOS TIPOS DE TURNOS ==========
    //! Para agregar o quitar tipos de turnos del filtro, modifica este array:
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
            {
                code: 'EXTRAS_GROUP',
                name: 'Turnos Extras',
                color: '#f06292',
                isGroup: true,
                codes: ['E', 'ME', 'TE', 'NE', '1E', '2E', '3E']
            },
            // { code: 'LC', name: 'Licencia', color: '#aed581' },
        ],
        [],
    );
    // ========================================================================

    // Códigos de turno presentes actualmente en la grilla (para totales)
    // Incluye cambios pendientes para reflejar turnos agregados dinámicamente
    const presentShiftCodes = useMemo<Set<string>>(() => {
        const codes = new Set<string>();
        const data: any[] = (filteredRowData as any[]) || [];

        // Debug temporal
        console.log('🔍 presentShiftCodes calculation:', {
            filteredRowDataLength: data.length,
            listaCambiosLength: listaCambios?.length || 0,
            listaCambios: listaCambios,
            rangeStart,
            rangeEnd
        });

        if (!data || data.length === 0) return codes;

        // Determinar claves de días visibles: cuando hay rango seleccionado SIEMPRE usar fechas ISO
        // y además soportar lectura por día numérico para compatibilidad con datos existentes.
        const sameMonth = !!(rangeStart && rangeEnd) &&
            rangeStart!.getMonth() === rangeEnd!.getMonth() && rangeStart!.getFullYear() === rangeEnd!.getFullYear();

        let dayKeys: string[] = [];
        if (rangeStart && rangeEnd) {
            // Generar claves por fecha completa entre inicio y fin (incluyendo el día final)
            const cur = new Date(rangeStart);
            const end = new Date(rangeEnd);
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

            // Si no hay claves de días en los datos pero hay cambios pendientes,
            // extraer las claves de días de los cambios pendientes
            if (dayKeys.length === 0 && listaCambios && listaCambios.length > 0) {
                const dayKeysFromChanges = new Set<string>();
                listaCambios.forEach(change => {
                    if (change.day) {
                        // Si es una fecha completa (YYYY-MM-DD), extraer solo el día
                        if (change.day.includes('-') && change.day.match(/^\d{4}-\d{2}-\d{2}$/)) {
                            const day = parseInt(change.day.split('-')[2], 10);
                            if (day >= 1 && day <= 31) {
                                dayKeysFromChanges.add(change.day); // Mantener la fecha completa
                            }
                        } else {
                            // Si es un número de día (1-31)
                            const dayNum = parseInt(change.day, 10);
                            if (!isNaN(dayNum) && dayNum >= 1 && dayNum <= 31) {
                                dayKeysFromChanges.add(change.day);
                            }
                        }
                    }
                });
                dayKeys = Array.from(dayKeysFromChanges);
            }

            // Si hay rango dentro del mismo mes y estamos usando claves numéricas, limitar a subrango
            if (!rangeStart || !rangeEnd) {
                // no-op
            }
        }

        // Crear una copia de los datos con cambios pendientes aplicados
        let dataWithChanges = [...data];
        if (listaCambios && listaCambios.length > 0) {
            dataWithChanges = data.map(row => {
                const changesForRow = listaCambios.filter(change =>
                    change.employeeId === row.employee_id || change.employeeId === row.id
                );

                if (changesForRow.length === 0) return row;

                const updatedRow = { ...row } as any;
                changesForRow.forEach(change => {
                    if (!change) return;
                    const value = change.newValue;
                    // Si existe fullDate (YYYY-MM-DD) y la usamos como clave en dayKeys, setearla
                    if (change.fullDate) {
                        updatedRow[change.fullDate] = value;
                    }
                    // Además, setear por día numérico para compatibilidad con vistas 1..31
                    if (change.day) {
                        updatedRow[change.day] = value;
                    }
                });
                return updatedRow;
            });
        }

        // Extraer códigos de turnos de los datos (incluyendo cambios pendientes)
        dataWithChanges.forEach((row: any) => {
            if (row?.isSeparator) return;
            dayKeys.forEach((k) => {
                // Primero intentar por clave exacta (ISO YYYY-MM-DD)
                let v = String(row[k] ?? '').toUpperCase().trim();
                // Compatibilidad: si no hay valor y k es ISO, intentar por día numérico (1..31)
                if (!v && k.includes('-') && k.match(/^\d{4}-\d{2}-\d{2}$/)) {
                    const dayNum = parseInt(k.split('-')[2], 10);
                    if (!isNaN(dayNum)) {
                        v = String(row[String(dayNum)] ?? '').toUpperCase().trim();
                    }
                }
                if (v) codes.add(v);
            });
        });

        // Si no hay datos pero sí hay cambios pendientes, extraer códigos directamente de los cambios
        if (codes.size === 0 && listaCambios && listaCambios.length > 0 && dayKeys.length > 0) {
            listaCambios.forEach(change => {
                if (change.day && change.newValue) {
                    // Verificar si este cambio corresponde a un día que estamos considerando
                    const dayMatches = dayKeys.some(dayKey => {
                        if (dayKey.includes('-') && dayKey.match(/^\d{4}-\d{2}-\d{2}$/)) {
                            // Es una fecha completa, comparar directamente
                            return dayKey === change.day;
                        } else {
                            // Es un número de día, extraer el día de la fecha del cambio
                            if (change.day.includes('-') && change.day.match(/^\d{4}-\d{2}-\d{2}$/)) {
                                const changeDay = change.day.split('-')[2];
                                return changeDay === dayKey;
                            }
                            return change.day === dayKey;
                        }
                    });

                    if (dayMatches) {
                        const v = String(change.newValue).toUpperCase().trim();
                        if (v) codes.add(v);
                    }
                }
            });
        }

        // Debug temporal
        console.log('🔍 presentShiftCodes result:', {
            codes: Array.from(codes),
            dataWithChangesLength: dataWithChanges.length,
            dayKeys: dayKeys
        });

        return codes;
    }, [filteredRowData, rangeStart, rangeEnd, listaCambios]);

    // Completar handler ahora que filteredRowData existe
    useEffect(() => {
        handleSelectAllTotalsShiftTypesRef.current = () => {
            setSelectedTotalsShiftTypes(new Set(Array.from(presentShiftCodes)));
        };
    }, [presentShiftCodes]);

    // Actualizar automáticamente selectedTotalsShiftTypes cuando aparecen nuevos turnos
    // Esto soluciona el bug donde el filtro no se actualiza cuando se agregan turnos a una planilla vacía
    useEffect(() => {
        console.log('🔄 useEffect presentShiftCodes triggered:', {
            presentShiftCodes: Array.from(presentShiftCodes),
            presentShiftCodesSize: presentShiftCodes.size
        });

        if (presentShiftCodes.size > 0) {
            setSelectedTotalsShiftTypes(prev => {
                const newSet = new Set(prev);

                console.log('🔄 Updating selectedTotalsShiftTypes:', {
                    prev: Array.from(prev),
                    presentShiftCodes: Array.from(presentShiftCodes)
                });

                // Agregar nuevos turnos que no estaban seleccionados
                presentShiftCodes.forEach(code => {
                    if (!newSet.has(code)) {
                        newSet.add(code);
                    }
                });

                console.log('🔄 New selectedTotalsShiftTypes:', Array.from(newSet));

                // Opcional: remover turnos que ya no existen (comentado para mantener selección manual)
                // Array.from(newSet).forEach(code => {
                //     if (!presentShiftCodes.has(code)) {
                //         newSet.delete(code);
                //     }
                // });

                return newSet;
            });
        }
    }, [presentShiftCodes]);

    // Función para obtener el nombre completo de un código de turno
    const getShiftNameByCode = useCallback((code: string): string => {
        // Buscar en los tipos disponibles
        for (const shiftType of availableShiftTypes) {
            if (shiftType.code === code) {
                return shiftType.name;
            }
            // Si es un grupo, buscar en los códigos del grupo
            if (shiftType.isGroup && shiftType.codes?.includes(code)) {
                return shiftType.name;
            }
        }
        // Si no se encuentra, devolver el código original
        return code;
    }, [availableShiftTypes]);

    // Opciones del selector de totales, derivadas de lo que realmente existe en la grilla
    const totalsSelectableShiftCodes = useMemo(() => {
        const codes = Array.from(presentShiftCodes).sort();
        return codes.map((code) => ({
            code,
            label: getShiftNameByCode(code)
        }));
    }, [presentShiftCodes, getShiftNameByCode]);

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


    // Función para manejar solicitud de cambio de fecha (ya no se usa)
    const handleDateChangeRequest = useCallback((newDate: Date) => {
        // Esta función ya no se usa porque ahora se previene el cambio directamente
    }, []);

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
            // Extraer el número de día correctamente
            let dayNumber: number;
            if (change.day.includes('-') && change.day.match(/^\d{4}-\d{2}-\d{2}$/)) {
                // Es una fecha completa (YYYY-MM-DD), extraer el día
                const dateObj = new Date(change.day + 'T00:00:00');
                dayNumber = dateObj.getDate();
            } else {
                // Es solo el número del día
                dayNumber = parseInt(change.day);
                if (isNaN(dayNumber) || dayNumber < 1 || dayNumber > 31) {
                    dayNumber = 1;
                }
            }

            // Determinar la fecha correcta: usar fullDate si está disponible,
            // sino verificar si change.day es una fecha completa, sino usar month/year, sino fallback
            let date: Date;
            if (change.fullDate) {
                // Es un cambio multi-mes, usar la fecha completa
                date = new Date(change.fullDate + 'T00:00:00');
            } else if (change.day.includes('-') && change.day.match(/^\d{4}-\d{2}-\d{2}$/)) {
                // change.day es una fecha completa (YYYY-MM-DD), usarla directamente
                date = new Date(change.day + 'T00:00:00');
            } else if (change.month !== undefined && change.year !== undefined) {
                // Usar month y year específicos
                date = new Date(change.year, change.month, dayNumber);
            } else if (rangeStart && rangeEnd) {
                // Si el rango cruza meses, no podemos inferir correctamente el mes
                // sin más información. Usar el mes de inicio como fallback.
                const rangeYear = rangeStart.getFullYear();
                const rangeMonth = rangeStart.getMonth();
                date = new Date(rangeYear, rangeMonth, dayNumber);
            } else {
                // Fallback final al selectedDate
                date = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), dayNumber);
            }

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

            const fechaFormateada = date.toLocaleDateString('es-CL', {
                day: 'numeric',
                month: 'short',
                year: 'numeric', // Agregar año para cambios multi-mes
            });

            changesList.push({
                empleado: change.employeeName,
                fecha: fechaFormateada,
                turno: turnoDescription,
                day: dayNumber,
            });
        });

        return changesList.sort((a, b) => a.day - b.day);
    }, [listaCambios, selectedDate, rangeStart, rangeEnd, getTurnoLabel]);

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
            { id: 'julio-sarmiento', name: 'Julio Sarmiento', phone: 'Se obtiene de BD', role: 'Supervisor' },
            { id: 'priscila-escobar', name: 'Priscila Escobar', phone: 'Se obtiene de BD', role: 'Supervisor' },
            { id: 'central', name: 'Central', phone: '964949887', role: 'Central' },
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
            // Para columnas multi-mes, usar fullDate si está disponible, sino usar day
            const dayKey = change.fullDate || change.day;
            registerChange(change.employeeName, change.employeeRut, dayKey, change.oldValue, change.newValue);
        },
        [registerChange],
    );


    // Memoizar props del grid
    const gridProps = useMemo(
        () => ({
            rowData: filteredRowData,
            onCellValueChanged: handleCellValueChanged,
            onGridReady: setGridApi, // ¡Crucial para el sistema de undo!
            onCustomOrderChanged: updateCustomOrder, // Callback para guardar orden personalizado
            customOrder, // Orden personalizado actual
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
                // Siempre usar columnas de fecha completa cuando hay un rango seleccionado
                // Esto asegura que los cambios tengan información completa de fecha
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
            updateCustomOrder,
            customOrder,
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
        if (!tempRangeStart || !tempRangeEnd) return;

        // Aplicar los estados temporales a los estados reales
        setRangeStart(tempRangeStart);
        setRangeEnd(tempRangeEnd);

        // Actualizar selectedDate al primer día del rango para que el modal muestre fechas correctas
        setSelectedDate(new Date(tempRangeStart));

        // Siempre cargar por rango específico, no por mes completo
        try {
            const sameMonth = tempRangeStart.getMonth() === tempRangeEnd.getMonth() && tempRangeStart.getFullYear() === tempRangeEnd.getFullYear();
            if (sameMonth) {
                toast.info('Cargando turnos por rango del mismo mes...');
            } else {
                toast.info('Cargando turnos por rango (cruza meses)...');
            }
            await cargarTurnosPorRango(tempRangeStart, tempRangeEnd);
        } catch (_) {
            // notificar ya gestionado en hook
        }
    }, [tempRangeStart, tempRangeEnd, cargarTurnosPorRango, cargarTurnosPorMes, setSelectedDate]);

    // Flag para evitar carga múltiple
    const [initialLoadDone, setInitialLoadDone] = useState(false);

    // Cargar automáticamente los datos del rango por defecto al inicializar
    useEffect(() => {
        if (rangeStart && rangeEnd && !loading && !initialLoadDone) {
            setInitialLoadDone(true);
            handleApplyRange();
        }
    }, [rangeStart, rangeEnd, loading, initialLoadDone, handleApplyRange]); // Ejecutar cuando cambien los rangos o la función

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
                    <div className={`overflow-hidden ${isMobile ? 'px-2 pt-2' : isGridMaximized ? 'p-2' : 'px-6 pt-4'}`}>
                        {/* Header compacto de página */}
                        <div className={isMobile ? 'mb-0' : isGridMaximized ? 'mb-2' : 'mb-4'}>
                            <div className={`md:mb-2 flex flex-col ${isMobile ? 'gap-1' : 'gap-2'} lg:flex-row lg:items-center lg:justify-between`}>
                                <div className="flex w-full items-end justify-between ">
                                    <div className=" flex items-center gap-3">
                                        <div className="rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 p-2 shadow-md">
                                            <FileSpreadsheet className="h-8 md:h-12 w-8 md:w-12 text-white" />
                                        </div>
                                        <div className=''>
                                            <h1
                                                className={`${isMobile ? 'text-lg' : 'text-xl'} flex items-center gap-2 font-bold text-slate-900 dark:text-white`}
                                            >
                                                {isMobile
                                                    ? 'Turnos'
                                                    : (() => {
                                                        if (rangeStart && rangeEnd) {
                                                            const sameMonth = rangeStart.getMonth() === rangeEnd.getMonth() && rangeStart.getFullYear() === rangeEnd.getFullYear();
                                                            const sameYear = rangeStart.getFullYear() === rangeEnd.getFullYear();
                                                            const fromDay = rangeStart.getDate();
                                                            const toDay = rangeEnd.getDate();
                                                            const fromMonth = rangeStart.toLocaleDateString('es-CL', { month: 'short' });
                                                            const toMonth = rangeEnd.toLocaleDateString('es-CL', { month: 'short' });
                                                            const fromYear = rangeStart.getFullYear();
                                                            const toYear = rangeEnd.getFullYear();
                                                            if (sameMonth) {
                                                                return `Grid de Turnos - Rango: ${fromDay}–${toDay} ${toMonth} ${toYear}`;
                                                            }
                                                            if (sameYear) {
                                                                return `Grid de Turnos - Rango: ${fromDay} ${fromMonth} – ${toDay} ${toMonth} ${toYear}`;
                                                            }
                                                            return `Grid de Turnos - Rango: ${fromDay} ${fromMonth} ${fromYear} – ${toDay} ${toMonth} ${toYear}`;
                                                        }
                                                        return `Grid de Turnos - ${currentMonthTitle}`;
                                                    })()}
                                                {employee_rol_id === 1 && (
                                                    <Badge className="bg-blue-100 text-xs text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                                                        Patrullaje
                                                    </Badge>
                                                )}
                                            </h1>
                                            <div className={`flex items-start gap-3 ${isMobile ? 'mt-0.5 justify-center' : 'mt-0.5'}`}>
                                                {/* Selector de fecha solo en desktop - COMENTADO: usando solo rango de fechas */}
                                                {!isMobile && false && (
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
                                                                {tempRangeStart && tempRangeEnd
                                                                    ? `${tempRangeStart.getDate()} ${tempRangeStart.toLocaleDateString('es-CL', { month: 'short' })} - ${tempRangeEnd.getDate()} ${tempRangeEnd.toLocaleDateString('es-CL', { month: 'short' })}`
                                                                    : 'Rango de días'}
                                                                </Button>
                                                            </PopoverTrigger>
                                                            <PopoverContent className="w-auto p-3" align="start">
                                                                <div className="flex gap-4">
                                                                    <div>
                                                                        <div className="text-xs mb-1 text-slate-600 dark:text-slate-300">Inicio</div>
                                                                        <UiCalendar
                                                                            mode="single"
                                                        selected={tempRangeStart as any}
                                                        defaultMonth={(tempRangeStart as any) || selectedDate}
                                                        captionLayout="dropdown"
                                                        fromYear={2020}
                                                        toYear={2030}
                                                        onSelect={(d: any) => {
                                                            if (!d) return;
                                                            setTempRangeStart(d);
                                                            if (tempRangeEnd && d > tempRangeEnd) {
                                                                setTempRangeEnd(d);
                                                            }
                                                        }}
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <div className="text-xs mb-1 text-slate-600 dark:text-slate-300">Término</div>
                                                                        <UiCalendar
                                                                            mode="single"
                                                        selected={tempRangeEnd as any}
                                                        defaultMonth={(tempRangeEnd as any) || (tempRangeStart as any) || selectedDate}
                                                        captionLayout="dropdown"
                                                        fromYear={2020}
                                                        toYear={2030}
                                                        onSelect={(d: any) => {
                                                            if (!d) return;
                                                            setTempRangeEnd(d);
                                                            if (tempRangeStart && d < tempRangeStart) {
                                                                setTempRangeStart(d);
                                                            }
                                                        }}
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <div className="mt-2 flex justify-end gap-2">
                                                                {(tempRangeStart || tempRangeEnd) && (
                                                                    <Button variant="ghost" size="sm" onClick={() => { setTempRangeStart(null); setTempRangeEnd(null); }}>Limpiar</Button>
                                                                )}
                                                                <Button variant="default" size="sm" disabled={!tempRangeStart || !tempRangeEnd} onClick={handleApplyRange}>Aplicar</Button>
                                                                </div>
                                                            </PopoverContent>
                                                        </Popover>
                                                    </div>
                                                )}
                                                {isMobile && (
                                                    <button
                                                        onClick={handleToggleDatePicker}
                                                        className="flex cursor-pointer items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-2 py-1.5 text-sm font-medium text-blue-700 transition-all hover:border-blue-300 hover:bg-blue-100 dark:border-blue-600 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:border-blue-500 dark:hover:bg-blue-900/50"
                                                    >
                                                        <Calendar className="h-4 w-4" />
                                                        {currentMonthTitle}
                                                    </button>
                                                )}

                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-end gap-2">
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
                                                {!isMobile && changeCount > 0 && canUndo && (
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


                                                {/* Botón de empleados solo en desktop */}
                                                {!isMobile && !isGridMaximized && (
                                                    <Button
                                                        variant={showEmployeePanel ? 'ghost' : 'outline'}
                                                        size="sm"
                                                        onClick={handleToggleEmployeePanel}
                                                        className={`flex items-center gap-2 transition-all duration-300 ${showEmployeePanel
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
                                                        className={`flex items-center gap-2 transition-all duration-300 ${showSummary
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
                                                    <div className="flex items-end gap-2">
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
                                                        <div className="flex items-center space-x-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-all duration-300 dark:border-slate-700 dark:hover:border-slate-600 dark:bg-slate-800 dark:hover:text-slate-100 border border-slate-200 px-3 h-8">
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
                                                {!isMobile && (
                                                    <div className="flex items-end gap-2">
                                                        <Button
                                                            variant={showTotals ? 'ghost' : 'outline'}
                                                            size="sm"
                                                            onClick={handleToggleTotals}
                                                            className={`flex items-center gap-2 transition-all duration-300 ${showTotals
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
                                                        className={`flex items-center gap-2 transition-all duration-300 ${showShiftFilter
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
                            <div className={`flex overflow-hidden ${isMobile ? 'h-[calc(100vh-140px)] flex-col' : isGridMaximized ? 'h-[calc(100vh-140px)]' : 'h-[calc(100vh-180px)] gap-6'}`}>
                                {/* Grid principal */}
                                <div className="min-w-0 flex-1 relative">
                                    {/* Botón de maximizar como overlay - Solo en desktop */}
                                    {!isMobile && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleToggleGridMaximize}
                                            className="absolute top-2 right-2 z-10 flex items-center gap-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-lg border-2 border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 backdrop-blur-sm"
                                            title={isGridMaximized ? 'Minimizar grid' : 'Maximizar grid'}
                                        >
                                            {isGridMaximized ? (
                                                <Minimize2 className="h-4 w-4" />
                                            ) : (
                                                <Maximize2 className="h-4 w-4" />
                                            )}
                                            {isGridMaximized ? 'Minimizar' : 'Maximizar'}
                                        </Button>
                                    )}
                                    {isMobile ? (
                                        // Vista móvil: Sin Card, ocupa todo el ancho con padding para FAB
                                        <div className="mt-4 h-full w-full pb-8">
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
                                        <Card className="h-full  shadow-xl pb-0">                                        <CardContent className="flex h-full flex-col p-0">
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
                            <DialogContent className="mx-auto flex h-[90vh] max-h-[90vh] w-full max-w-[95vw] flex-col p-0 overflow-hidden">
                                <DialogHeader className="flex-shrink-0 border-b border-slate-100 bg-slate-50 px-6 py-4 dark:border-slate-700 dark:bg-slate-800">
                                    <DialogTitle className="flex items-center gap-3 text-lg font-semibold text-slate-700 dark:text-slate-200">
                                        <div className="rounded-lg bg-blue-50 p-2 dark:bg-blue-900/20">
                                            <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        Gestión de Funcionarios
                                    </DialogTitle>
                                    <DialogDescription className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                                        <div className="flex items-center gap-4">
                                            <span className="flex items-center gap-2">
                                                <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                                                {filteredRowData.length} en grid
                                            </span>
                                            <span className="flex items-center gap-2">
                                                <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                                                {filteredAvailableEmployees.length} disponibles
                                            </span>
                                        </div>
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="flex-1 overflow-y-auto bg-white dark:bg-slate-900">
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
                        <Dialog open={showMobileDateModal} onOpenChange={setShowMobileDateModal}>
                            <DialogContent className="mx-auto max-w-[95vw] w-full p-0 z-[10000]">
                                <DialogHeader className="px-4 py-3 border-b">
                                    <DialogTitle className="flex items-center gap-2 text-base font-semibold">
                                        <Calendar className="h-4 w-4" />
                                        Rango de Fechas
                                    </DialogTitle>
                                </DialogHeader>
                                <div className="px-4 py-4 bg-white dark:bg-slate-800">
                                    <div className="space-y-4">
                                        {/* Botón para Fecha de Inicio */}
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                                Fecha de Inicio
                                            </label>
                                            <Button
                                                variant="outline"
                                                className="w-full justify-start text-left h-12"
                                                onClick={() => setShowStartDatePopup(true)}
                                            >
                                                <Calendar className="h-4 w-4 mr-2" />
                                                {tempRangeStart ? tempRangeStart.toLocaleDateString('es-CL') : 'Seleccionar fecha de inicio'}
                                            </Button>
                                        </div>

                                        {/* Botón para Fecha de Término */}
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                                Fecha de Término
                                            </label>
                                            <Button
                                                variant="outline"
                                                className="w-full justify-start text-left h-12"
                                                onClick={() => setShowEndDatePopup(true)}
                                            >
                                                <Calendar className="h-4 w-4 mr-2" />
                                                {tempRangeEnd ? tempRangeEnd.toLocaleDateString('es-CL') : 'Seleccionar fecha de término'}
                                            </Button>
                                        </div>

                                        {/* Resumen de fechas seleccionadas */}
                                        {(tempRangeStart || tempRangeEnd) && (
                                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                                                <div className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                                                    Rango seleccionado:
                                                </div>
                                                <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                                                    {tempRangeStart && (
                                                        <div>• Inicio: {tempRangeStart.toLocaleDateString('es-CL')}</div>
                                                    )}
                                                    {tempRangeEnd && (
                                                        <div>• Término: {tempRangeEnd.toLocaleDateString('es-CL')}</div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Botones de acción */}
                                        <div className="flex gap-2 pt-2">
                                            {(tempRangeStart || tempRangeEnd) && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="flex-1"
                                                    onClick={() => {
                                                        setTempRangeStart(null);
                                                        setTempRangeEnd(null);
                                                    }}
                                                >
                                                    Limpiar
                                                </Button>
                                            )}
                                            <Button
                                                variant="default"
                                                size="sm"
                                                className="flex-1"
                                                disabled={!tempRangeStart || !tempRangeEnd}
                                                onClick={() => {
                                                    handleApplyRange();
                                                    setShowMobileDateModal(false);
                                                }}
                                            >
                                                Aplicar Rango
                                            </Button>
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
                                        {(() => {
                                            if (rangeStart && rangeEnd) {
                                                const sameMonth = rangeStart.getMonth() === rangeEnd.getMonth() && rangeStart.getFullYear() === rangeEnd.getFullYear();
                                                const sameYear = rangeStart.getFullYear() === rangeEnd.getFullYear();
                                                const fromDay = rangeStart.getDate();
                                                const toDay = rangeEnd.getDate();
                                                const fromMonth = rangeStart.toLocaleDateString('es-CL', { month: 'short' });
                                                const toMonth = rangeEnd.toLocaleDateString('es-CL', { month: 'short' });
                                                const fromYear = rangeStart.getFullYear();
                                                const toYear = rangeEnd.getFullYear();
                                                if (sameMonth) {
                                                    return `Grid de Turnos - Rango: ${fromDay}–${toDay} ${toMonth} ${toYear}`;
                                                }
                                                if (sameYear) {
                                                    return `Grid de Turnos - Rango: ${fromDay} ${fromMonth} – ${toDay} ${toMonth} ${toYear}`;
                                                }
                                                return `Grid de Turnos - Rango: ${fromDay} ${fromMonth} ${fromYear} – ${toDay} ${toMonth} ${toYear}`;
                                            }
                                            return `Grid de Turnos - ${currentMonthTitle}`;
                                        })()}
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
                                                className="flex cursor-pointer items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-2 py-1.5 text-sm font-medium text-blue-700 transition-all hover:border-blue-300 hover:bg-blue-100 dark:border-blue-600 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:border-blue-500 dark:hover:bg-blue-900/50"
                                            >
                                                <Calendar className="h-4 w-4" />
                                                {currentMonthTitle}
                                            </button>
                                        )}

                                        {/* Botón de empleados */}
                                        <Button
                                            variant={showEmployeePanel ? 'ghost' : 'outline'}
                                            size="sm"
                                            onClick={handleToggleEmployeePanel}
                                            className={`flex items-center gap-2 transition-all duration-300 ${showEmployeePanel
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
                                                className={`flex items-center gap-2 transition-all duration-300 ${showSummary
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
                                            className={`flex items-center gap-2 transition-all duration-300 ${showShiftFilter
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
                                            className={`flex items-center gap-2 transition-all duration-300 ${showTotals
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


                                {/* Selector de rango de fechas (desktop en vista maximizada) */}
                                {!isMobile && !loading && (
                                    <div className="flex items-center gap-2">
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant="outline" size="sm">
                                                                {tempRangeStart && tempRangeEnd
                                                                    ? `${tempRangeStart.getDate()} ${tempRangeStart.toLocaleDateString('es-CL', { month: 'short' })} - ${tempRangeEnd.getDate()} ${tempRangeEnd.toLocaleDateString('es-CL', { month: 'short' })}`
                                                                    : 'Rango de días'}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-3 z-[10050]" align="start">
                                                <div className="flex gap-4">
                                                    <div>
                                                        <div className="text-xs mb-1 text-slate-600 dark:text-slate-300">Inicio</div>
                                                        <UiCalendar
                                                            mode="single"
                                                        selected={tempRangeStart as any}
                                                        defaultMonth={(tempRangeStart as any) || selectedDate}
                                                        captionLayout="dropdown"
                                                        onSelect={(d: any) => {
                                                            if (!d) return;
                                                            setTempRangeStart(d);
                                                            if (tempRangeEnd && d > tempRangeEnd) {
                                                                setTempRangeEnd(d);
                                                            }
                                                        }}
                                                        />
                                                    </div>
                                                    <div>
                                                        <div className="text-xs mb-1 text-slate-600 dark:text-slate-300">Término</div>
                                                        <UiCalendar
                                                            mode="single"
                                                        selected={tempRangeEnd as any}
                                                        defaultMonth={(tempRangeEnd as any) || (tempRangeStart as any) || selectedDate}
                                                        captionLayout="dropdown"
                                                        onSelect={(d: any) => {
                                                            if (!d) return;
                                                            setTempRangeEnd(d);
                                                            if (tempRangeStart && d < tempRangeStart) {
                                                                setTempRangeStart(d);
                                                            }
                                                        }}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="mt-2 flex justify-end gap-2">
                                                                {(tempRangeStart || tempRangeEnd) && (
                                                                    <Button variant="ghost" size="sm" onClick={() => { setTempRangeStart(null); setTempRangeEnd(null); }}>Limpiar</Button>
                                                                )}
                                                                <Button variant="default" size="sm" disabled={!tempRangeStart || !tempRangeEnd} onClick={handleApplyRange}>Aplicar</Button>
                                                </div>
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                )}
                                {/* Botón de minimizar */}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleToggleGridMaximize}
                                    className="flex items-center gap-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-lg border-2 border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 backdrop-blur-sm"
                                    title="Minimizar grid"
                                >
                                    <Minimize2 className="h-4 w-4" />
                                    Minimizar
                                </Button>
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

            {/* Calendario centrado para Fecha de Inicio */}
            <Dialog open={showStartDatePopup} onOpenChange={setShowStartDatePopup}>
                <DialogContent className="max-w-sm mx-auto z-[10001]">
                    <DialogHeader>
                        <DialogTitle className="text-center">Seleccionar Fecha de Inicio</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <UiCalendar
                            mode="single"
                            selected={tempRangeStart as any}
                            defaultMonth={tempRangeStart as any || selectedDate}
                            captionLayout="dropdown"
                            fromYear={2020}
                            toYear={2030}
                            onSelect={(d) => {
                                setTempRangeStart(d || null);
                                setShowStartDatePopup(false);
                            }}
                            className="w-full"
                        />
                    </div>
                </DialogContent>
            </Dialog>

            {/* Calendario centrado para Fecha de Término */}
            <Dialog open={showEndDatePopup} onOpenChange={setShowEndDatePopup}>
                <DialogContent className="max-w-sm mx-auto z-[10001]">
                    <DialogHeader>
                        <DialogTitle className="text-center">Seleccionar Fecha de Término</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <UiCalendar
                            mode="single"
                            selected={tempRangeEnd as any}
                            defaultMonth={tempRangeEnd as any || tempRangeStart as any || selectedDate}
                            captionLayout="dropdown"
                            fromYear={2020}
                            toYear={2030}
                            onSelect={(d) => {
                                setTempRangeEnd(d || null);
                                setShowEndDatePopup(false);
                            }}
                            className="w-full"
                        />
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
