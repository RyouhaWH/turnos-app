# Script para agregar debug logging
$content = Get-Content 'resources/js/pages/shifts/hooks/useOptimizedShiftsManager.ts' -Raw

$debugCode = @"
            // Debug logging para comparar empleados municipales vs AMZOMA
            console.log('🔍 Comparando empleados municipales vs AMZOMA:');

            const empleadosMunicipales = turnosOrdenados.filter(emp => emp.amzoma === false || emp.amzoma === 'false' || emp.amzoma === 0);
            const empleadosAmzoma = turnosOrdenados.filter(emp => emp.amzoma === true || emp.amzoma === 'true' || emp.amzoma === 1);

            console.log('📊 Empleados municipales (amzoma=false):', empleadosMunicipales.length);
            console.log('📊 Empleados AMZOMA (amzoma=true):', empleadosAmzoma.length);

            if (empleadosMunicipales.length > 0) {
                console.log('🏛️ Primer empleado municipal:', {
                    nombre: empleadosMunicipales[0].nombre,
                    id: empleadosMunicipales[0].id,
                    employee_id: empleadosMunicipales[0].employee_id,
                    rut: empleadosMunicipales[0].rut,
                    amzoma: empleadosMunicipales[0].amzoma
                });
            }

            if (empleadosAmzoma.length > 0) {
                console.log('🏢 Primer empleado AMZOMA:', {
                    nombre: empleadosAmzoma[0].nombre,
                    id: empleadosAmzoma[0].id,
                    employee_id: empleadosAmzoma[0].employee_id,
                    rut: empleadosAmzoma[0].rut,
                    amzoma: empleadosAmzoma[0].amzoma
                });
            }
"@

$content = $content -replace 'const turnosOrdenados = turnosArray\.sort\(sortByAmzomaAndName\);', "const turnosOrdenados = turnosArray.sort(sortByAmzomaAndName);`n`n$debugCode"

Set-Content 'resources/js/pages/shifts/hooks/useOptimizedShiftsManager.ts' -Value $content
Write-Host "Debug logging agregado"

