<#
.SYNOPSIS
  Extracts every real table from an STCC After-Hours Telehealth Triage Guidelines
  Access database (.mdb) into one canonical JSON file, keyed by the *actual* vendor
  column names (verified against a real sample .mdb via ODBC, not approximated from
  PDF bulletins).

.DESCRIPTION
  Uses the "Microsoft Access Driver (*.mdb, *.accdb)" ODBC driver, which ships with
  Windows/Office and is already installed on this machine - no extra install required.
  Run this once per STCC delivery (they ship an updated .mdb annually, per their FAQ)
  to produce a stable JSON snapshot that src/data/stccLicensedContent can map from,
  instead of hand re-approximating the schema from PDF bulletins each time.

.PARAMETER MdbPath
  Path to the .mdb file to extract.

.PARAMETER OutputPath
  Path to write the canonical JSON output.

.EXAMPLE
  pwsh scripts/extractStccMdb.ps1 "C:\Users\...\Algorithms_adult_AH_SAMPLE_database.mdb" "docs/protocol-review/data/stcc-sample-extract.json"
#>
param(
  [Parameter(Mandatory = $true)]
  [string]$MdbPath,

  [Parameter(Mandatory = $true)]
  [string]$OutputPath
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $MdbPath)) {
  throw "MDB file not found: $MdbPath"
}

# One entry per real table, in extraction order. Table names match the vendor's own
# 14 documented content tables plus the System/Type lookups; Access's internal
# "Switchboard Items" UI table is intentionally excluded.
$tables = @(
  @{ Name = "Algorithm"; Key = "algorithms" },
  @{ Name = "Question"; Key = "questions" },
  @{ Name = "QuestionAdvice"; Key = "questionAdvice" },
  @{ Name = "Advice"; Key = "advice" },
  @{ Name = "Disposition"; Key = "dispositions" },
  @{ Name = "AcuityRating"; Key = "acuityRatings" },
  @{ Name = "Reference"; Key = "references" },
  @{ Name = "AlgorithmReference"; Key = "algorithmReferences" },
  @{ Name = "SearchWord"; Key = "searchWords" },
  @{ Name = "AlgorithmSearchWords"; Key = "algorithmSearchWords" },
  @{ Name = "Supplemental"; Key = "supplementals" },
  @{ Name = "AlgorithmSupplemental"; Key = "algorithmSupplementals" },
  @{ Name = "System"; Key = "systems" },
  @{ Name = "Type"; Key = "types" }
)

# Binary/image columns (e.g. AcuityRating_Bullet) are never read by the app -
# skip them so the JSON stays plain-text and portable.
function Get-RowsExcludingBinary($conn, $tableName) {
  $cmd = $conn.CreateCommand()
  $cmd.CommandText = "SELECT * FROM [$tableName]"
  $reader = $cmd.ExecuteReader()

  $columnNames = @()
  $binaryColumnIndexes = @{}
  for ($i = 0; $i -lt $reader.FieldCount; $i++) {
    $columnNames += $reader.GetName($i)
    if ($reader.GetFieldType($i) -eq [System.Byte[]]) {
      $binaryColumnIndexes[$i] = $true
    }
  }

  $rows = @()
  while ($reader.Read()) {
    $row = [ordered]@{}
    for ($i = 0; $i -lt $columnNames.Count; $i++) {
      if ($binaryColumnIndexes.ContainsKey($i)) {
        continue
      }
      $value = $reader.GetValue($i)
      if ($value -is [System.DBNull]) {
        $row[$columnNames[$i]] = $null
      } elseif ($value -is [System.DateTime]) {
        $row[$columnNames[$i]] = $value.ToString("o")
      } else {
        $row[$columnNames[$i]] = $value
      }
    }
    $rows += [PSCustomObject]$row
  }
  $reader.Close()
  return $rows
}

$connStr = "Driver={Microsoft Access Driver (*.mdb, *.accdb)};Dbq=$MdbPath;"
$conn = New-Object System.Data.Odbc.OdbcConnection($connStr)
$conn.Open()

$result = [ordered]@{
  _source     = $MdbPath
  _extractedAtIso = (Get-Date).ToString("o")
}

foreach ($table in $tables) {
  Write-Host "Extracting $($table.Name)..."
  $rows = Get-RowsExcludingBinary -conn $conn -tableName $table.Name
  $result[$table.Key] = $rows
  Write-Host "  -> $($rows.Count) rows"
}

$conn.Close()

$outDir = Split-Path -Parent $OutputPath
if ($outDir -and -not (Test-Path $outDir)) {
  New-Item -ItemType Directory -Force -Path $outDir | Out-Null
}

# Out-File -Encoding utf8 adds a BOM that Node's JSON.parse does not strip -
# write via .NET directly with a BOM-less UTF8 encoding instead.
$json = $result | ConvertTo-Json -Depth 10
[System.IO.File]::WriteAllText($OutputPath, $json, (New-Object System.Text.UTF8Encoding($false)))
Write-Host "Wrote $OutputPath"
