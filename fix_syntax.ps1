$content = Get-Content 'app/Http/Controllers/ShiftsUpdateController.php' -Raw
$content = $content -replace '\$turnosNoNotificables\$turnosNoNotificables', '$turnosNoNotificables'
Set-Content 'app/Http/Controllers/ShiftsUpdateController.php' -Value $content
Write-Host "Sintaxis corregida"

