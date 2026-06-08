<#
.SYNOPSIS
    SkillMarket - Windows Installer / Uninstaller
.DESCRIPTION
    Installs or uninstalls SkillMarket without requiring Inno Setup.
    Works on Windows 10+ with PowerShell 5.1+ (no extra tools needed).

    USAGE:
        # Install
        powershell -ExecutionPolicy Bypass -File scripts\install.ps1

        # Uninstall
        powershell -ExecutionPolicy Bypass -File scripts\install.ps1 -Uninstall

        # Install with desktop shortcut
        powershell -ExecutionPolicy Bypass -File scripts\install.ps1 -DesktopShortcut

.PARAMETER Uninstall
    Remove SkillMarket from the system.
.PARAMETER DesktopShortcut
    Create a desktop shortcut for the GUI.
.PARAMETER Silent
    Run without prompts (for automated builds).
#>

param(
    [switch]$Uninstall,
    [switch]$DesktopShortcut,
    [switch]$Silent
)

$ErrorActionPreference = "Stop"
$AppName = "SkillMarket"
$ExeName = "skillmarket.exe"
$Version = "1.3.37"
$ScriptDir = Split-Path -Parent $PSCommandPath
$ProjectRoot = Resolve-Path (Join-Path $ScriptDir "..")
$SourceExe = Join-Path (Join-Path $ProjectRoot "dist") $ExeName

# Installation paths
$InstallDir = Join-Path $env:LOCALAPPDATA $AppName
$InstalledExe = Join-Path $InstallDir $ExeName
$StartMenuDir = Join-Path ([Environment]::GetFolderPath("StartMenu")) "Programs\$AppName"
$UninstallKey = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\$AppName"

# ============================================================================
# Helper functions
# ============================================================================

function Write-Status {
    param([string]$Message, [string]$Color = "Cyan")
    Write-Host ">> $Message" -ForegroundColor $Color
}

function Write-Success {
    param([string]$Message)
    Write-Host "   ✔ $Message" -ForegroundColor "Green"
}

function Write-Warn {
    param([string]$Message)
    Write-Host "   ⚠ $Message" -ForegroundColor "Yellow"
}

function Write-ErrorMsg {
    param([string]$Message)
    Write-Host "   ✘ $Message" -ForegroundColor "Red"
}

function Test-Admin {
    $id = [System.Security.Principal.WindowsIdentity]::GetCurrent()
    $p = New-Object System.Security.Principal.WindowsPrincipal($id)
    return $p.IsInRole([System.Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Add-UserPath {
    param([string]$PathToAdd)
    $paths = [Environment]::GetEnvironmentVariable("Path", "User") -split ";" | Where-Object { $_ -ne "" }
    if ($paths -notcontains $PathToAdd) {
        $newPath = ($paths + $PathToAdd) -join ";"
        [Environment]::SetEnvironmentVariable("Path", $newPath, "User")
        return $true
    }
    return $false
}

function Remove-UserPath {
    param([string]$PathToRemove)
    $paths = [Environment]::GetEnvironmentVariable("Path", "User") -split ";" | Where-Object { $_ -ne "" -and $_ -ne $PathToRemove }
    $newPath = $paths -join ";"
    [Environment]::SetEnvironmentVariable("Path", $newPath, "User")
}

function Create-Shortcut {
    param(
        [string]$ShortcutPath,
        [string]$TargetPath,
        [string]$Arguments = "",
        [string]$WorkingDir = "",
        [string]$Description = ""
    )
    $shell = New-Object -ComObject WScript.Shell
    $shortcut = $shell.CreateShortcut($ShortcutPath)
    $shortcut.TargetPath = $TargetPath
    if ($Arguments) { $shortcut.Arguments = $Arguments }
    if ($WorkingDir) { $shortcut.WorkingDirectory = $WorkingDir }
    if ($Description) { $shortcut.Description = $Description }
    $shortcut.Save()
}

# ============================================================================
# Uninstall
# ============================================================================

function Uninstall-App {
    Write-Status "Uninstalling $AppName..." "Yellow"

    # Remove from PATH
    if ((Get-ItemProperty -Path "HKCU:\Environment" -Name "Path" -ErrorAction SilentlyContinue) -and
        ([Environment]::GetEnvironmentVariable("Path", "User") -match [regex]::Escape($InstallDir))) {
        Remove-UserPath -PathToRemove $InstallDir
        Write-Success "Removed from PATH"
    }

    # Remove start menu shortcuts
    if (Test-Path $StartMenuDir) {
        Remove-Item -Path $StartMenuDir -Recurse -Force -ErrorAction SilentlyContinue
        Write-Success "Removed Start Menu shortcuts"
    }

    # Remove desktop shortcut
    $desktopShortcut = Join-Path ([Environment]::GetFolderPath("Desktop")) "$AppName GUI.lnk"
    if (Test-Path $desktopShortcut) {
        Remove-Item -Path $desktopShortcut -Force -ErrorAction SilentlyContinue
        Write-Success "Removed Desktop shortcut"
    }

    # Remove uninstall registry key
    if (Test-Path $UninstallKey) {
        Remove-Item -Path $UninstallKey -Recurse -Force -ErrorAction SilentlyContinue
        Write-Success "Removed uninstall registry entry"
    }

    # Remove installation directory
    if (Test-Path $InstallDir) {
        # Give a moment for any processes to release handles
        Start-Sleep -Milliseconds 500
        Remove-Item -Path $InstallDir -Recurse -Force -ErrorAction SilentlyContinue
        if (-not (Test-Path $InstallDir)) {
            Write-Success "Removed installation directory"
        } else {
            Write-Warn "Could not remove $InstallDir (files may be in use). Please restart and try again."
        }
    }

    Write-Status "$AppName has been uninstalled." "Green"
    Write-Host "   You may need to restart your terminal for PATH changes to take effect." -ForegroundColor Gray
}

# ============================================================================
# Install
# ============================================================================

function Install-App {
    Write-Status "Installing $AppName v$Version..." "Cyan"

    # --- Check prerequisites ---
    if (-not (Test-Path $SourceExe)) {
        Write-ErrorMsg "Not found: $SourceExe"
        Write-ErrorMsg "Build the exe first: npm run build && node scripts/build-exe.mjs"
        exit 1
    }

    if (-not $Silent) {
        Write-Host ""
        Write-Host "  $AppName v$Version will be installed to:" -ForegroundColor White
        Write-Host "    $InstallDir" -ForegroundColor Gray
        Write-Host ""
        $confirm = Read-Host "Proceed with installation? [Y/n]"
        if ($confirm -eq "n" -or $confirm -eq "N") {
            Write-Status "Installation cancelled." "Yellow"
            exit 0
        }
    }

    # --- Create installation directory ---
    if (-not (Test-Path $InstallDir)) {
        New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null
    }
    Write-Success "Installation directory ready"

    # --- Copy executable ---
    Copy-Item -Path $SourceExe -Destination $InstalledExe -Force
    $size = (Get-Item $InstalledExe).Length / 1MB
    Write-Success "Copied $ExeName ($([math]::Round($size, 1)) MB)"

    # --- Add to PATH ---
    if (Add-UserPath -PathToAdd $InstallDir) {
        Write-Success "Added to user PATH: $InstallDir"
        Write-Warn "You may need to restart your terminal for 'skm' to be available"
    } else {
        Write-Success "Already in PATH"
    }

    # --- Create Start Menu shortcuts ---
    if (-not (Test-Path $StartMenuDir)) {
        New-Item -ItemType Directory -Path $StartMenuDir -Force | Out-Null
    }

    Create-Shortcut `
        -ShortcutPath (Join-Path $StartMenuDir "$AppName GUI.lnk") `
        -TargetPath $InstalledExe `
        -Arguments "gui" `
        -WorkingDir $InstallDir `
        -Description "Start SkillMarket Web GUI"

    Create-Shortcut `
        -ShortcutPath (Join-Path $StartMenuDir "$AppName CLI Help.lnk") `
        -TargetPath $InstalledExe `
        -Arguments "--help" `
        -WorkingDir $InstallDir `
        -Description "Show SkillMarket CLI help"

    Create-Shortcut `
        -ShortcutPath (Join-Path $StartMenuDir "Uninstall $AppName.lnk") `
        -TargetPath "$PSHOME\powershell.exe" `
        -Arguments "-NoExit -ExecutionPolicy Bypass -Command `"& '$PSCommandPath' -Uninstall`"" `
        -WorkingDir $InstallDir `
        -Description "Uninstall SkillMarket"

    Write-Success "Created Start Menu shortcuts"

    # --- Create Desktop shortcut (optional) ---
    if ($DesktopShortcut) {
        $desktopPath = [Environment]::GetFolderPath("Desktop")
        Create-Shortcut `
            -ShortcutPath (Join-Path $desktopPath "$AppName GUI.lnk") `
            -TargetPath $InstalledExe `
            -Arguments "gui" `
            -WorkingDir $InstallDir `
            -Description "Start SkillMarket Web GUI"
        Write-Success "Created Desktop shortcut"
    }

    # --- Create uninstall registry entry ---
    $uninstallString = "`"$InstalledExe`""
    $regData = @{
        "DisplayName" = "$AppName"
        "DisplayVersion" = "$Version"
        "Publisher" = "wanxuchen"
        "DisplayIcon" = "$InstalledExe"
        "UninstallString" = "$PSHOME\powershell.exe -NoExit -ExecutionPolicy Bypass -File `"$PSCommandPath`" -Uninstall"
        "InstallLocation" = "$InstallDir"
        "InstallDate" = (Get-Date -Format "yyyyMMdd")
        "URLInfoAbout" = "https://github.com/wxc2004/market"
        "NoModify" = 1
        "NoRepair" = 1
        "EstimatedSize" = [math]::Round((Get-Item $InstalledExe).Length / 1KB)
    }

    if (-not (Test-Path $UninstallKey)) {
        New-Item -Path $UninstallKey -Force | Out-Null
    }
    foreach ($key in $regData.Keys) {
        Set-ItemProperty -Path $UninstallKey -Name $key -Value $regData[$key]
    }
    Write-Success "Registered for uninstall (Apps & Features)"

    # --- Done ---
    Write-Status "Installation complete!" "Green"
    Write-Host ""
    Write-Host "  Quick start:" -ForegroundColor White
    Write-Host "    skm ls              List available skills" -ForegroundColor Gray
    Write-Host "    skm gui             Start web GUI" -ForegroundColor Gray
    Write-Host "    skm --help          All commands" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  Start Menu shortcut: $AppName GUI" -ForegroundColor Gray
    if (-not $Silent) {
        Write-Host ""
        $launch = Read-Host "Launch SkillMarket GUI now? [Y/n]"
        if ($launch -ne "n" -and $launch -ne "N") {
            Start-Process -FilePath $InstalledExe -ArgumentList "gui"
        }
    }
}

# ============================================================================
# Main
# ============================================================================

Write-Host ""
Write-Host "  ====================================" -ForegroundColor DarkCyan
Write-Host "   $AppName v$Version - Windows Setup" -ForegroundColor Cyan
Write-Host "  ====================================" -ForegroundColor DarkCyan
Write-Host ""

if ($Uninstall) {
    Uninstall-App
} else {
    Install-App
}
