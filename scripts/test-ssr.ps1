# Simple SSR test script
# Usage: .\scripts\test-ssr.ps1

Write-Host "🧪 Testing SSR Setup..." -ForegroundColor Green

# Start Laravel server
Write-Host "Starting Laravel server..." -ForegroundColor Yellow
Start-Process -NoNewWindow -FilePath "php" -ArgumentList "artisan", "serve", "--port=8000"

# Wait a moment
Start-Sleep -Seconds 3

# Start SSR server
Write-Host "Starting SSR server..." -ForegroundColor Yellow
Start-Process -NoNewWindow -FilePath "node" -ArgumentList "bootstrap/ssr/ssr-dev.mjs"

# Wait a moment
Start-Sleep -Seconds 2

Write-Host ""
Write-Host "✅ Servers started!" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Test URLs:" -ForegroundColor Cyan
Write-Host "  Laravel: http://localhost:8000" -ForegroundColor White
Write-Host "  SSR Server: http://localhost:13714" -ForegroundColor White
Write-Host ""
Write-Host "📱 Compare these pages:" -ForegroundColor Cyan
Write-Host "  Original: http://localhost:8000/shifts/create" -ForegroundColor White
Write-Host "  SSR Version: http://localhost:8000/shifts/create-ssr" -ForegroundColor White
Write-Host ""
Write-Host "🔍 To check if SSR is working:" -ForegroundColor Yellow
Write-Host "  1. Open both URLs in different tabs" -ForegroundColor White
Write-Host "  2. Right-click > View Page Source" -ForegroundColor White
Write-Host "  3. SSR version should have HTML content" -ForegroundColor White
Write-Host "  4. Original should have empty <div id='app'>" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to stop servers..." -ForegroundColor Red
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# Stop servers
Write-Host "Stopping servers..." -ForegroundColor Yellow
Get-Process -Name "php", "node" -ErrorAction SilentlyContinue | Stop-Process -Force
