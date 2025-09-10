    /**
     * Filter changes to exclude unassigned or empty shifts
     */
    private function filterValidChanges(array $cambios): array
    {
        // CORREGIDO: Usar descripciones convertidas en lugar de códigos originales
        $turnosNoNotificables = ['Sin Asignar', 'Sin Turno', 'Desconocido'];

        return array_filter($cambios, function ($cambio) use ($turnosNoNotificables) {
            $turnoAnterior = $cambio['turno_anterior'];
            $turnoNuevo = $cambio['turno_nuevo'];

            // No notificar si ambos turnos son no notificables
            if (in_array($turnoAnterior, $turnosNoNotificables) && in_array($turnoNuevo, $turnosNoNotificables)) {
                return false;
            }

            // No notificar si el turno nuevo es no notificable
            if (in_array($turnoNuevo, $turnosNoNotificables)) {
                return false;
            }

            return true;
        });
    }

