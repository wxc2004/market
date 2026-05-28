# zip-gui-upload-test.ps1 - Package gui-upload-test skill into zip for GUI upload testing
# Usage: powershell -File scripts\zip-gui-upload-test.ps1

$ErrorActionPreference = "Stop"

$ProjectRoot = Split-Path -Parent (Split-Path -Parent $PSCommandPath)
$SkillDir = Join-Path $ProjectRoot "skills\gui-upload-test"
$OutputZip = Join-Path $ProjectRoot "gui-upload-test.zip"

if (-not (Test-Path $SkillDir)) {
    Write-Host "ERROR: Skill directory not found: $SkillDir" -ForegroundColor Red
    exit 1
}

$requiredFiles = @("package.json", "SKILL.md", "metadata.json", "index.js")
$missing = @()
foreach ($file in $requiredFiles) {
    $path = Join-Path $SkillDir $file
    if (-not (Test-Path $path)) {
        $missing += $file
    }
}

if ($missing.Count -gt 0) {
    Write-Host "ERROR: Missing files: $($missing -join ', ')" -ForegroundColor Red
    exit 1
}

if (Test-Path $OutputZip) {
    Remove-Item $OutputZip -Force
}

Compress-Archive -Path "$SkillDir\*" -DestinationPath $OutputZip -CompressionLevel Optimal

Write-Host ""
Write-Host "Done!" -ForegroundColor Green
Write-Host "  Output: $OutputZip" -ForegroundColor Cyan
Write-Host "  Size: $((Get-Item $OutputZip).Length / 1KB -as [int]) KB" -ForegroundColor Cyan
Write-Host ""
Write-Host "To test GUI upload:" -ForegroundColor Yellow
Write-Host "  1. Start GUI: skm gui" -ForegroundColor White
Write-Host "  2. Open http://localhost:18770" -ForegroundColor White
Write-Host "  3. Click 'Upload' tab" -ForegroundColor White
Write-Host "  4. Drag gui-upload-test.zip onto drop zone" -ForegroundColor White
Write-Host "  5. Click 'Upload & Parse'" -ForegroundColor White
Write-Host "  6. Preview info, choose Install / Publish / Both" -ForegroundColor White
