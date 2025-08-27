# Development script for SSR testing (Windows PowerShell)
# Usage: .\scripts\dev-ssr.ps1

Write-Host "🚀 Starting local SSR development..." -ForegroundColor Green

# Check if we're on the right branch
$currentBranch = git branch --show-current
if ($currentBranch -ne "feature/ssr-hybrid-optimization") {
    Write-Host "[WARNING] You're not on the SSR branch. Current branch: $currentBranch" -ForegroundColor Yellow
    $continue = Read-Host "Continue anyway? (y/N)"
    if ($continue -ne "y" -and $continue -ne "Y") {
        exit 1
    }
}

Write-Host "[INFO] Installing dependencies..." -ForegroundColor Green
npm install

Write-Host "[INFO] Building SSR..." -ForegroundColor Green
npm run build:ssr

Write-Host "[INFO] Starting Laravel development server..." -ForegroundColor Green
Start-Process -NoNewWindow -FilePath "php" -ArgumentList "artisan", "serve", "--host=0.0.0.0", "--port=8000"

Write-Host "[INFO] Starting SSR server..." -ForegroundColor Green
Start-Process -NoNewWindow -FilePath "node" -ArgumentList "bootstrap/ssr/ssr.mjs"

Write-Host "[INFO] Starting Vite development server..." -ForegroundColor Green
Start-Process -NoNewWindow -FilePath "npm" -ArgumentList "run", "dev"

Write-Host "[INFO] Development servers started!" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 URLs:" -ForegroundColor Cyan
Write-Host "  Laravel: http://localhost:8000" -ForegroundColor White
Write-Host "  SSR Server: http://localhost:13714" -ForegroundColor White
Write-Host "  Vite Dev: http://localhost:5173" -ForegroundColor White
Write-Host ""
Write-Host "📱 Test URLs:" -ForegroundColor Cyan
Write-Host "  Original: http://localhost:8000/shifts/create" -ForegroundColor White
Write-Host "  SSR Version: http://localhost:8000/shifts/create-ssr" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to stop all servers..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

Write-Host "[INFO] Shutting down servers..." -ForegroundColor Green
Get-Process -Name "php", "node" -ErrorAction SilentlyContinue | Stop-Process -Force
