# Script para corregir filterValidChanges
$content = Get-Content 'app/Http/Controllers/ShiftsUpdateController.php' -Raw
$content = $content -replace "\$turnosNoNotificables = \['SA', 'X', null, '', ' '\];", "`$turnosNoNotificables = ['Sin Asignar', 'Sin Turno', 'Desconocido'];"
Set-Content 'app/Http/Controllers/ShiftsUpdateController.php' -Value $content
Write-Host "Corrección aplicada exitosamente"
