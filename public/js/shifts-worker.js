// Web Worker para procesamiento pesado de turnos
// Este worker maneja operaciones costosas fuera del hilo principal

// Función para ordenar datos de turnos
function sortTurnosData(data) {
    return data.sort((a, b) => {
        const nombreA = a.first_name && a.paternal_lastname
            ? `${a.first_name.split(' ')[0]} ${a.paternal_lastname}`.toLowerCase()
            : (a.nombre || '').toLowerCase();
        const nombreB = b.first_name && b.paternal_lastname
            ? `${b.first_name.split(' ')[0]} ${b.paternal_lastname}`.toLowerCase()
            : (b.nombre || '').toLowerCase();

        return nombreA.localeCompare(nombreB, 'es', { sensitivity: 'base' });
    });
}

// Función para filtrar datos
function filterData(data, searchTerm) {
    if (!searchTerm || !searchTerm.trim()) return data;

    const term = searchTerm.toLowerCase();
    return data.filter(item => {
        const nombreCompleto = item.nombre?.toLowerCase() || '';
        if (nombreCompleto.includes(term)) return true;

        if (item.first_name && item.paternal_lastname) {
            const nombreFormateado = `${item.first_name} ${item.paternal_lastname}`.toLowerCase();
            if (nombreFormateado.includes(term)) return true;
        }

        if (item.first_name && item.first_name.toLowerCase().includes(term)) return true;
        if (item.paternal_lastname && item.paternal_lastname.toLowerCase().includes(term)) return true;
        if (item.maternal_lastname && item.maternal_lastname.toLowerCase().includes(term)) return true;

        return false;
    });
}

// Función para contar turnos
function countShifts(data) {
    const conteo = {};

    for (const fila of data) {
        for (const key in fila) {
            if (key === 'nombre' || key === 'id' || key === 'employee_id' || key === 'rut' ||
                key === 'first_name' || key === 'paternal_lastname' || key === 'maternal_lastname') continue;

            const valor = (fila[key] || '').toUpperCase().trim();
            if (!valor) continue;

            conteo[valor] = (conteo[valor] || 0) + 1;
        }
    }

    return conteo;
}

// Función para aplicar cambios pendientes
function applyPendingChanges(turnosArray, listaCambios, originalChangeDate, fechaActual) {
    if (listaCambios.length === 0 || !originalChangeDate) {
        return turnosArray;
    }

    if (originalChangeDate.getMonth() !== fechaActual.getMonth() ||
        originalChangeDate.getFullYear() !== fechaActual.getFullYear()) {
        return turnosArray;
    }

    try {
        const turnosModificados = turnosArray.map(turno => ({ ...turno }));

        listaCambios.forEach(cambio => {
            const empleadoIndex = turnosModificados.findIndex(
                emp => emp.employee_id === cambio.employeeId || emp.id === cambio.employeeId
            );

            if (empleadoIndex !== -1) {
                turnosModificados[empleadoIndex][cambio.day] = cambio.newValue;
            }
        });

        return turnosModificados;
    } catch (error) {
        console.error('Error al aplicar cambios pendientes:', error);
        return turnosArray;
    }
}

// Escuchar mensajes del hilo principal
self.addEventListener('message', function(e) {
    const { type, data, searchTerm, listaCambios, originalChangeDate, fechaActual } = e.data;

    switch (type) {
        case 'sort':
            const sortedData = sortTurnosData(data);
            self.postMessage({ type: 'sorted', result: sortedData });
            break;

        case 'filter':
            const filteredData = filterData(data, searchTerm);
            self.postMessage({ type: 'filtered', result: filteredData });
            break;

        case 'count':
            const countedData = countShifts(data);
            self.postMessage({ type: 'counted', result: countedData });
            break;

        case 'applyChanges':
            const changedData = applyPendingChanges(data, listaCambios, originalChangeDate, fechaActual);
            self.postMessage({ type: 'changesApplied', result: changedData });
            break;

        case 'batch':
            // Procesamiento por lotes para múltiples operaciones
            const results = {};

            if (data.sort) {
                results.sorted = sortTurnosData(data.sort);
            }

            if (data.filter) {
                results.filtered = filterData(data.filter.data, data.filter.searchTerm);
            }

            if (data.count) {
                results.counted = countShifts(data.count);
            }

            if (data.applyChanges) {
                results.changesApplied = applyPendingChanges(
                    data.applyChanges.turnosArray,
                    data.applyChanges.listaCambios,
                    data.applyChanges.originalChangeDate,
                    data.applyChanges.fechaActual
                );
            }

            self.postMessage({ type: 'batchComplete', results });
            break;

        default:
            console.warn('Tipo de mensaje no reconocido:', type);
    }
});

// Manejar errores
self.addEventListener('error', function(e) {
    console.error('Error en Web Worker:', e.error);
    self.postMessage({ type: 'error', error: e.error.message });
});

// Manejar errores no capturados
self.addEventListener('unhandledrejection', function(e) {
    console.error('Promesa rechazada en Web Worker:', e.reason);
    self.postMessage({ type: 'error', error: e.reason });
});
