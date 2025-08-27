# Test local SSR setup
# Usage: .\scripts\test-local.ps1

Write-Host "🧪 Testing local SSR setup..." -ForegroundColor Green

# Test 1: Check if we're on the right branch
$currentBranch = git branch --show-current
Write-Host "Current branch: $currentBranch" -ForegroundColor Cyan

# Test 2: Check if SSR dependencies are installed
Write-Host "Checking SSR dependencies..." -ForegroundColor Yellow
if (Test-Path "node_modules/@inertiajs/server") {
    Write-Host "✅ @inertiajs/server installed" -ForegroundColor Green
} else {
    Write-Host "❌ @inertiajs/server not found" -ForegroundColor Red
}

# Test 3: Check if SSR files exist
Write-Host "Checking SSR files..." -ForegroundColor Yellow
$ssrFiles = @(
    "resources/js/ssr.tsx",
    "resources/js/ssr-simple.tsx",
    "bootstrap/ssr/ssr.mjs",
    "bootstrap/ssr/ssr-dev.mjs"
)

foreach ($file in $ssrFiles) {
    if (Test-Path $file) {
        Write-Host "✅ $file exists" -ForegroundColor Green
    } else {
        Write-Host "❌ $file missing" -ForegroundColor Red
    }
}

# Test 4: Check if ports are available
Write-Host "Checking ports..." -ForegroundColor Yellow
$ports = @(8000, 13714, 5173)

foreach ($port in $ports) {
    $connection = Test-NetConnection -ComputerName localhost -Port $port -InformationLevel Quiet -WarningAction SilentlyContinue
    if ($connection.TcpTestSucceeded) {
        Write-Host "⚠️  Port $port is in use" -ForegroundColor Yellow
    } else {
        Write-Host "✅ Port $port is available" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "🚀 Ready to start development servers!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Start Laravel: php artisan serve" -ForegroundColor White
Write-Host "2. Start SSR: npm run ssr:dev" -ForegroundColor White
Write-Host "3. Start Vite: npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "Or use the automated script:" -ForegroundColor Cyan
Write-Host ".\scripts\dev-ssr.ps1" -ForegroundColor White
