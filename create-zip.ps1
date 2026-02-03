# Script para criar ZIP da pasta vercelnew
$zipFile = "vercelnew-deploy.zip"

# Remove ZIP anterior se existir
if (Test-Path $zipFile) {
    Remove-Item $zipFile -Force
}

# Criar ZIP com todos os arquivos da pasta vercelnew
Compress-Archive -Path "vercelnew\*" -DestinationPath $zipFile -Force

Write-Host ""
Write-Host "ZIP criado: $zipFile" -ForegroundColor Green
Write-Host ""
Write-Host "Agora faca upload deste ZIP no GitHub ou extraia e faca upload dos arquivos!" -ForegroundColor Cyan
