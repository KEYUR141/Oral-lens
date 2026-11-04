[CmdletBinding()]
param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$CodexArguments
)

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$environmentFile = Join-Path $projectRoot ".env.meta"
$userProfile = $env:USERPROFILE
if ([string]::IsNullOrWhiteSpace($userProfile)) {
    throw "USERPROFILE is unavailable, so the Codex profile directory cannot be resolved."
}
$profileFile = Join-Path $userProfile ".codex\meta.config.toml"

if (-not (Test-Path -LiteralPath $environmentFile -PathType Leaf)) {
    throw "Missing $environmentFile. Create it with Meta_Muse_API_KEY=<your key>."
}

if (-not (Test-Path -LiteralPath $profileFile -PathType Leaf)) {
    throw "Missing $profileFile. The Meta provider profile must remain in the user Codex directory."
}

$keyLine = Get-Content -LiteralPath $environmentFile |
    Where-Object { $_ -match '^\s*Meta_Muse_API_KEY\s*=' } |
    Select-Object -First 1

if (-not $keyLine) {
    throw "Meta_Muse_API_KEY is missing from $environmentFile."
}

$apiKey = ($keyLine -split '=', 2)[1].Trim().Trim('"').Trim("'")
if ([string]::IsNullOrWhiteSpace($apiKey)) {
    throw "Meta_Muse_API_KEY is empty in $environmentFile."
}

$codexCommand = Get-Command codex -CommandType Application -ErrorAction SilentlyContinue
$codexExecutable = if ($codexCommand) { $codexCommand.Source } else { $null }

if (-not $codexExecutable) {
    $extensionRoots = @(
        (Join-Path $userProfile ".vscode\extensions"),
        (Join-Path $userProfile ".vscode-insiders\extensions")
    )

    $codexExecutable = $extensionRoots |
        Where-Object { Test-Path -LiteralPath $_ -PathType Container } |
        ForEach-Object {
            Get-ChildItem -LiteralPath $_ -Directory -Filter "openai.chatgpt-*" -ErrorAction SilentlyContinue
        } |
        Sort-Object LastWriteTimeUtc -Descending |
        ForEach-Object {
            Join-Path $_.FullName "bin\windows-x86_64\codex.exe"
        } |
        Where-Object { Test-Path -LiteralPath $_ -PathType Leaf } |
        Select-Object -First 1
}

if (-not $codexExecutable) {
    throw "Codex executable was not found on PATH or in the installed VS Code OpenAI extension."
}

$env:Meta_Muse_API_KEY = $apiKey
try {
    & $codexExecutable --profile meta @CodexArguments
    exit $LASTEXITCODE
}
finally {
    Remove-Item Env:Meta_Muse_API_KEY -ErrorAction SilentlyContinue
}
