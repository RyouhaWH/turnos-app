import { useState, useEffect } from 'react';

interface OperationalRole {
    id: number;
    nombre: string;
    is_operational: boolean;
    color?: string;
}

export const useOperationalRoles = () => {
    const [operationalRoles, setOperationalRoles] = useState<OperationalRole[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchOperationalRoles = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch('/api/roles');

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            if (data.success) {
                // Filtrar solo roles operativos
                const operational = data.data.filter((role: OperationalRole) => role.is_operational);
                setOperationalRoles(operational);
            } else {
                setError('Error al cargar roles operativos del servidor');
            }
        } catch (err) {
            console.error('Error fetching operational roles:', err);

            if (err instanceof TypeError && err.message.includes('fetch')) {
                setError('Error de conexión con el servidor');
            } else if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('Error desconocido al cargar roles operativos');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOperationalRoles();
    }, []);

    return {
        operationalRoles,
        loading,
        error,
        refetch: fetchOperationalRoles,
    };
};
