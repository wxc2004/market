; =============================================================================
; SkillMarket - Inno Setup Installer Script
; =============================================================================
; Build: ISCC "scripts\skillmarket.iss"
; Requires: Inno Setup 6+ (https://jrsoftware.org/isinfo.php)
; =============================================================================

#define MyAppName "SkillMarket"
#define MyAppVersion "1.3.37"
#define MyAppPublisher "wanxuchen"
#define MyAppURL "https://github.com/wxc2004/market"
#define MyAppExeName "skillmarket.exe"
#define MyAppAssocName "SkillMarket Skill Package"
#define MyAppAssocExt ".skill"

[Setup]
; Basic metadata
AppId={{B8F4A3D2-1E5C-4A7B-9D6F-8C2E3F1A0B5D}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}

; Installation directory
DefaultDirName={autopf}\{#MyAppName}
DefaultGroupName={#MyAppName}
AllowNoIcons=yes

; Output
OutputDir={#SourcePath}\..\dist
OutputBaseFilename=SkillMarket-Setup-{#MyAppVersion}
SetupIconFile={#SourcePath}\..\dist\skillmarket.exe
UninstallDisplayIcon={app}\{#MyAppExeName}

; Compression
Compression=lzma2/ultra64
SolidCompression=yes
LZMAUseSeparateProcess=yes
DiskSpanning=no

; Admin rights required to write to Program Files & system PATH
PrivilegesRequired=admin
PrivilegesRequiredOverridesAllowed=dialog

; Windows version support
MinVersion=10.0.14393

; Misc
DisableProgramGroupPage=yes
DisableDirPage=auto
DisableWelcomePage=no
DisableFinishedPage=no

; Language
ShowLanguageDialog=no
LanguageDetectionMethod=uilanguage

[Languages]
Name: "en"; MessagesFile: "compiler:Default.isl"
Name: "zh"; MessagesFile: "compiler:Languages\ChineseSimplified.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"
Name: "addtopath"; Description: "Add SkillMarket to system PATH (so &apos;skm&apos; works from any terminal)"; GroupDescription: "PATH configuration:"; Flags: checkedonce

[Files]
Source: "{#SourcePath}\..\dist\{#MyAppExeName}"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{group}\{#MyAppName} GUI"; Filename: "{app}\{#MyAppExeName}"; Parameters: "gui"; WorkingDir: "{app}"; Comment: "Start SkillMarket Web GUI"
Name: "{group}\{#MyAppName} CLI (Terminal)"; Filename: "{app}\{#MyAppExeName}"; Parameters: "--help"; WorkingDir: "{app}"; IconFilename: "{app}\{#MyAppExeName}"; Comment: "Show CLI help"
Name: "{group}\Uninstall {#MyAppName}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\{#MyAppName} GUI"; Filename: "{app}\{#MyAppExeName}"; Parameters: "gui"; WorkingDir: "{app}"; Tasks: desktopicon

[Registry]
; Add to system PATH for current user (safer than HKLM)
; Inno Setup's {olddata} is available for REG_EXPAND_SZ
Root: HKCU; Subkey: "Environment"; ValueType: expandsz; ValueName: "Path"; \
    ValueData: "{olddata};{app}"; Check: NeedsAddPath(ExpandConstant('{app}'))

[Run]
Filename: "{app}\{#MyAppExeName}"; Parameters: "gui"; Description: "Launch SkillMarket GUI"; Flags: postinstall nowait skipifsilent unchecked

[UninstallRun]
; No special cleanup needed

[UninstallDelete]
Type: filesandordirs; Name: "{userappdata}\SkillMarket"

[Code]
{--- Helper: Check if a directory is already in PATH ---}
function NeedsAddPath(Param: string): boolean;
var
  OrigPath: string;
  Dir: string;
  i: integer;
begin
  Dir := Param;
  if Dir[Length(Dir)] = '\' then
    Dir := Copy(Dir, 1, Length(Dir) - 1);
  if not RegQueryStringValue(HKCU, 'Environment', 'Path', OrigPath) then
  begin
    Result := True;
    exit;
  end;
  Result := Pos(';' + UpperCase(Dir) + ';', ';' + UpperCase(OrigPath) + ';') = 0;
end;

{--- Custom welcome message ---}
procedure InitializeWizard;
begin
  WizardForm.WelcomeLabel2.Caption :=
    'SkillMarket v{#MyAppVersion}' + #13#10 +
    'Cross-platform skill manager for AI coding tools' + #13#10 + #13#10 +
    'This will install SkillMarket on your computer.' + #13#10 +
    'You can use "skm" commands from any terminal after installation.';
end;

{--- Notify user about PATH changes on completion ---}
procedure CurStepChanged(CurStep: TSetupStep);
begin
  if CurStep = ssPostInstall then
  begin
    if IsTaskSelected('addtopath') then
    begin
      MsgBox(
        'PATH has been updated.' + #13#10 + #13#10 +
        'You may need to restart your terminal for "skm" to be available.',
        mbInformation, MB_OK);
    end;
  end;
end;
