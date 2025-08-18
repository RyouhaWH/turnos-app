import { useState, useEffect } from 'react';

interface Employee {
  id: number;
  name: string;
  rol_id: number;
  amzoma?: boolean;
  shift?: string;
  shift_label?: string;
  reason?: string;
}

interface EmployeeStatus {
  trabajando: Employee[];
  descanso: Employee[];
  ausente: Employee[];
  sinTurno: Employee[];
}

interface EmployeeStatusCounts {
  trabajando: { total: number; byRole: Record<number, number> };
  descanso: { total: number; byRole: Record<number, number> };
  ausente: { total: number; byRole: Record<number, number> };
  sinTurno: { total: number; byRole: Record<number, number> };
}

interface EmployeeStatusResponse {
  success: boolean;
  data: {
    status: EmployeeStatus;
    counts: EmployeeStatusCounts;
    totalActivos: number;
    totalEmpleados: number;
    roles: Record<number, string>;
  };
  date: string;
  message?: string;
}

export const useEmployeeStatus = () => {
  const [employeeStatus, setEmployeeStatus] = useState<EmployeeStatus>({
    trabajando: [],
    descanso: [],
    ausente: [],
    sinTurno: []
  });

  const [counts, setCounts] = useState<EmployeeStatusCounts>({
    trabajando: { total: 0, byRole: {} },
    descanso: { total: 0, byRole: {} },
    ausente: { total: 0, byRole: {} },
    sinTurno: { total: 0, byRole: {} }
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalActivos, setTotalActivos] = useState(0);
  const [totalEmpleados, setTotalEmpleados] = useState(0);
  const [roles, setRoles] = useState<Record<number, string>>({});

  const fetchEmployeeStatus = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/dashboard/employee-status');

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data: EmployeeStatusResponse = await response.json();

      if (data.success) {
        console.log('useEmployeeStatus - Datos recibidos:', data.data);
        console.log('useEmployeeStatus - Empleados trabajando:', data.data.status.trabajando);
        setEmployeeStatus(data.data.status);
        setCounts(data.data.counts);
        setTotalActivos(data.data.totalActivos);
        setTotalEmpleados(data.data.totalEmpleados);
        setRoles(data.data.roles);
      } else {
        setError('Error al cargar estado de empleados del servidor');
      }
    } catch (err) {
      console.error('Error fetching employee status:', err);

      if (err instanceof TypeError && err.message.includes('fetch')) {
        setError('Error de conexión con el servidor');
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Error desconocido al cargar estado de empleados');
      }

      // Resetear datos en caso de error
      setEmployeeStatus({
        trabajando: [],
        descanso: [],
        ausente: [],
        sinTurno: []
      });
      setCounts({
        trabajando: { total: 0, byRole: {} },
        descanso: { total: 0, byRole: {} },
        ausente: { total: 0, byRole: {} },
        sinTurno: { total: 0, byRole: {} }
      });
      setTotalActivos(0);
      setTotalEmpleados(0);
      setRoles({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployeeStatus();

    // Actualizar cada 1 hora
    const interval = setInterval(fetchEmployeeStatus, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return {
    employeeStatus,
    counts,
    totalActivos,
    totalEmpleados,
    roles,
    loading,
    error,
    refetch: fetchEmployeeStatus
  };
};
