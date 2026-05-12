param(
  [string]$Token = $env:GITHUB_TOKEN
)

if (-not $Token) {
  Write-Host "Usage: ./scripts/create-release.ps1 -Token YOUR_GITHUB_TOKEN"
  Write-Host "   or: set GITHUB_TOKEN=YOUR_GITHUB_TOKEN && ./scripts/create-release.ps1"
  exit 1
}

$Owner = "Nevino2233"
$Repo = "Ditto_Market"
$BaseDir = Resolve-Path (Join-Path $PSScriptRoot "..")
$PackagesDir = Join-Path $BaseDir "server" "data" "market-packages"

$releases = @(
  @{ Tag = "v0.1.0"; Name = "Ditto Notes v0.1.0"; File = "com.ditto.notes-0.1.0.dit" },
  @{ Tag = "v1.0.0"; Name = "Ditto Calculator v1.0.0 & Midnight Theme v1.0.0"; File1 = "com.ditto.calc-1.0.0.dit"; File2 = "com.ditto.theme.midnight-1.0.0.ditz" }
)

$headers = @{
  "Authorization" = "Bearer $Token"
  "Accept" = "application/vnd.github.v3+json"
  "X-GitHub-Api-Version" = "2022-11-28"
}

foreach ($release in $releases) {
  Write-Host "`nCreating release $($release.Tag)..."
  
  $body = @{
    tag_name = $release.Tag
    target_commitish = "main"
    name = $release.Name
    body = "Release $($release.Tag)"
    draft = $false
    prerelease = $false
  } | ConvertTo-Json

  $resp = Invoke-RestMethod -Uri "https://api.github.com/repos/$Owner/$Repo/releases" -Method Post -Headers $headers -Body $body -ContentType "application/json"
  $uploadUrl = $resp.upload_url -replace '\{.*\}', ''
  Write-Host "  Release created: $($resp.html_url)"
  Write-Host "  Upload URL: $uploadUrl"

  $files = @()
  if ($release.File) { $files += $release.File }
  if ($release.File1) { $files += $release.File1 }
  if ($release.File2) { $files += $release.File2 }

  foreach ($file in $files) {
    $filePath = Join-Path $PackagesDir $file
    if (-not (Test-Path $filePath)) {
      Write-Host "  WARNING: $file not found at $filePath - skipping"
      continue
    }

    Write-Host "  Uploading $file..."
    $uploadHeaders = @{
      "Authorization" = "Bearer $Token"
      "Content-Type" = "application/octet-stream"
    }
    
    $fileBytes = [System.IO.File]::ReadAllBytes($filePath)
    $uploadResp = Invoke-RestMethod -Uri "$uploadUrl?name=$file" -Method Post -Headers $uploadHeaders -Body $fileBytes
    Write-Host "  Uploaded: $($uploadResp.browser_download_url)"
  }
}

Write-Host "`nDone! All releases created and packages uploaded."
