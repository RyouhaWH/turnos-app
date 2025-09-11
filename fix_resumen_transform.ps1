# Script para mejorar la transformación del resumen
$content = Get-Content 'resources/js/pages/shifts/hooks/useOptimizedShiftsManager.ts' -Raw

$improvedCode = @"
            // Buscar el empleado en rowData para obtener su ID numérico real
            const employeeInGrid = rowData.find(emp =>
                emp.nombre === employeeKey ||
                String(emp.employee_id) === employeeKey ||
                String(emp.id) === employeeKey ||
                emp.rut === employeeKey  // Agregar búsqueda por RUT
            );

            const realEmployeeId = String(employeeInGrid?.employee_id || employeeInGrid?.id || employeeKey);

            console.log('🔄 Transformando resumen:', {
                employeeKey,
                realEmployeeId,
                employeeInGrid: employeeInGrid ? {
                    id: employeeInGrid.id,
                    employee_id: employeeInGrid.employee_id,
                    nombre: employeeInGrid.nombre,
                    rut: employeeInGrid.rut,
                    amzoma: employeeInGrid.amzoma
                } : null,
                found: !!employeeInGrid
            });
"@

$content = $content -replace '// Buscar el empleado en rowData para obtener su ID numérico real[\s\S]*?const realEmployeeId = String\(employeeInGrid\?\.[^;]+\);', $improvedCode

Set-Content 'resources/js/pages/shifts/hooks/useOptimizedShiftsManager.ts' -Value $content
Write-Host "Transformación del resumen mejorada"


