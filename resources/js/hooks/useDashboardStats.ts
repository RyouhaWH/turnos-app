import { useState, useEffect } from 'react';

interface DepartmentStats {
  total: number;
  activos: number;
  trabajandoHoy: number;
}

interface DashboardStats {
  [key: string]: DepartmentStats;
  totals: DepartmentStats;
}

interface DashboardStatsResponse {
  success: boolean;
  data: DashboardStats;
  roles?: Record<number, string>;
  date: string;
  message?: string;
  error_details?: string;
}

export const useDashboardStats = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totals: { total: 0, activos: 0, trabajandoHoy: 0 }
  });
  const [roles, setRoles] = useState<Record<number, string>>({});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/dashboard/stats');

      // Verificar si la respuesta es válida
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data: DashboardStatsResponse = await response.json();

      if (data.success) {
        setStats(data.data);
        if (data.roles) {
          setRoles(data.roles);
        }
        setMessage(data.message || null);

        // Si todos los totales son 0, mostrar mensaje informativo
        if (data.data.totals.total === 0) {
          setMessage('No hay datos cargados aún. Los empleados aparecerán aquí cuando subas los turnos.');
        }
      } else {
        setError('Error al cargar estadísticas del servidor');
      }
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);

      // Manejar diferentes tipos de errores
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setError('Error de conexión con el servidor');
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Error desconocido al cargar estadísticas');
      }

      // Mantener stats en 0 si hay error
      setStats({
        totals: { total: 0, activos: 0, trabajandoHoy: 0 }
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();

    // Actualizar cada 5 minutos
    const interval = setInterval(fetchStats, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return {
    stats,
    roles,
    loading,
    error,
    message,
    refetch: fetchStats
  };
};

// Hook para estadísticas de un rol específico
export const useRoleStats = (roleId: number, date?: string) => {
  const [stats, setStats] = useState<DepartmentStats>({
    total: 0,
    activos: 0,
    trabajandoHoy: 0
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRoleStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const url = date
        ? `/api/dashboard/personal/${roleId}/${date}`
        : `/api/dashboard/stats/role/${roleId}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        if (date) {
          // Si es detalles por fecha, extraer summary
          setStats(data.data.summary || { total: 0, activos: 0, trabajandoHoy: 0 });
        } else {
          // Si es estadísticas simples
          setStats(data.data || { total: 0, activos: 0, trabajandoHoy: 0 });
        }
      } else {
        setError('Error al cargar estadísticas del rol');
        setStats({ total: 0, activos: 0, trabajandoHoy: 0 });
      }
    } catch (err) {
      console.error('Error fetching role stats:', err);
      setError('Error de conexión');
      setStats({ total: 0, activos: 0, trabajandoHoy: 0 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoleStats();
  }, [roleId, date]);

  return {
    stats,
    loading,
    error,
    refetch: fetchRoleStats
  };
};
