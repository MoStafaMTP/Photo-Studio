$ErrorActionPreference = 'Stop'

$projectRoot = [System.IO.Path]::GetFullPath((Split-Path -Parent $MyInvocation.MyCommand.Path)).TrimEnd('\')
$manifestPath = Join-Path $projectRoot 'PHASE_1_MANIFEST.sha256'
$failures = [System.Collections.Generic.List[string]]::new()
$verified = 0

Get-Content -LiteralPath $manifestPath | Where-Object { $_ -and -not $_.StartsWith('#') } | ForEach-Object {
    if ($_ -notmatch '^([0-9a-f]{64}) \*(.+)$') {
        $failures.Add("Invalid manifest line: $_")
        return
    }

    $expectedHash = $Matches[1]
    $relativePath = $Matches[2].Replace('/', '\')
    $filePath = [System.IO.Path]::GetFullPath((Join-Path $projectRoot $relativePath))

    if (-not $filePath.StartsWith($projectRoot + '\', [System.StringComparison]::OrdinalIgnoreCase)) {
        $failures.Add("Unsafe manifest path: $relativePath")
        return
    }
    if (-not (Test-Path -LiteralPath $filePath -PathType Leaf)) {
        $failures.Add("Missing file: $relativePath")
        return
    }

    $actualHash = (Get-FileHash -LiteralPath $filePath -Algorithm SHA256).Hash.ToLowerInvariant()
    if ($actualHash -ne $expectedHash) {
        $failures.Add("Checksum mismatch: $relativePath")
        return
    }
    $verified += 1
}

if ($failures.Count) {
    $failures | ForEach-Object { Write-Error $_ }
    exit 1
}

Write-Host "Phase 1 verification passed: $verified files match the manifest."
