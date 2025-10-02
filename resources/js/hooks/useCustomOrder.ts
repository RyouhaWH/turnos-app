import { useState, useEffect, useCallback } from 'react';

interface UseCustomOrderOptions {
    storageKey: string;
    defaultOrder?: string[];
}

export const useCustomOrder = ({ storageKey, defaultOrder = [] }: UseCustomOrderOptions) => {
    const [customOrder, setCustomOrder] = useState<string[]>(defaultOrder);

    // Cargar orden desde localStorage al montar
    useEffect(() => {
        try {
            const savedOrder = localStorage.getItem(storageKey);
            if (savedOrder) {
                const parsedOrder = JSON.parse(savedOrder);
                if (Array.isArray(parsedOrder)) {
                    setCustomOrder(parsedOrder);
                }
            }
        } catch (error) {
            console.warn('Error al cargar orden personalizado desde localStorage:', error);
        }
    }, [storageKey]);

    // Guardar orden en localStorage cuando cambie
    const updateCustomOrder = useCallback((newOrder: string[]) => {
        setCustomOrder(newOrder);
        try {
            localStorage.setItem(storageKey, JSON.stringify(newOrder));
        } catch (error) {
            console.warn('Error al guardar orden personalizado en localStorage:', error);
        }
    }, [storageKey]);

    // Limpiar orden personalizado
    const clearCustomOrder = useCallback(() => {
        setCustomOrder([]);
        try {
            localStorage.removeItem(storageKey);
        } catch (error) {
            console.warn('Error al limpiar orden personalizado de localStorage:', error);
        }
    }, [storageKey]);

    return {
        customOrder,
        updateCustomOrder,
        clearCustomOrder,
    };
};
