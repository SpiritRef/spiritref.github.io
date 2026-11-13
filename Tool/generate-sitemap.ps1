# generate-sitemap.ps1
# Auto-generate sitemap.xml from Data\postFB.json (+ Data\Services.json for Compendium pages)
# Usage:
#   double-click Tool\run-sitemap.bat
#   or: powershell -ExecutionPolicy Bypass -File .\Tool\generate-sitemap.ps1

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$root = Split-Path -Parent $scriptDir

$jsonPath = Join-Path $root "Data\postFB.json"
if (-not (Test-Path $jsonPath)) {
    Write-Error "Cannot find $jsonPath"
    exit 1
}

$data = Get-Content -Raw -Encoding UTF8 $jsonPath | ConvertFrom-Json

function ConvertTo-DateTimeValue($v) {
    if ($v -is [int] -or $v -is [long] -or $v -is [double]) {
        try { return [DateTime]::FromOADate([double]$v) } catch { return $null }
    }
    $s = [string]$v
    if ($s -notmatch '^\d{4}[/-]\d{2}[/-]\d{2}') { return $null }
    try { return [DateTime]::ParseExact($s, "yyyy/MM/dd HH:mm:ss", [System.Globalization.CultureInfo]::InvariantCulture) } catch { }
    try { return [DateTime]::Parse($s) } catch { }
    return $null
}

$base = "https://spiritref.github.io"
$today = (Get-Date).ToString("yyyy-MM-dd")

$entries = @()

# Static public pages
$static = @(
    @{ loc="$base/services/"; lastmod=$today },
    @{ loc="$base/services/compendium/"; lastmod=$today },
    @{ loc="$base/services/notices/"; lastmod=$today },
    @{ loc="$base/services/consult.html"; lastmod=$today },
    @{ loc="$base/ghoststory/"; lastmod=$today },
    @{ loc="$base/"; lastmod=$today }
)
foreach ($s in $static) { $entries += $s }

# Article pages (compute combined ID from postFB.json)
foreach ($post in $data) {
    $props = @($post.PSObject.Properties)
    # PostID 明確從屬性讀取，不靠屬性順序（inputData 建立的文章屬性順序是 發佈日期 在前）
    $postId = $null
    if ($post.PSObject.Properties.Name -contains 'PostID') {
        $postId = [string]$post.PostID
    } else {
        # 相容舊資料：找名為 PostID 的屬性
        foreach ($pr in $props) {
            if ($pr.Name -eq 'PostID') { $postId = [string]$pr.Value; break }
        }
    }
    if (-not $postId) { $postId = "0" }
    $raw = $null
    foreach ($pr in $props) {
        if ($pr.Value -is [string] -and $pr.Value -match '^\d{4}[/-]\d{2}[/-]\d{2}') {
            $raw = $pr.Value
            break
        }
        if ($pr.Value -is [int] -or $pr.Value -is [long] -or $pr.Value -is [double]) {
            if ([double]$pr.Value -gt 40000 -and [double]$pr.Value -lt 60000) {
                $raw = $pr.Value
                break
            }
        }
    }
    $ts = "0000"
    $dateObj = if ($raw) { ConvertTo-DateTimeValue $raw } else { $null }
    # 未發佈（未來日期）的文章先不收進 sitemap，避免被 Google 當成軟 404
    if ($dateObj -and $dateObj -gt (Get-Date)) { continue }
    $lastmod = if ($dateObj) { $dateObj.ToString("yyyy-MM-dd") } else { $today }
    if ($dateObj) { $ts = $dateObj.ToString("yyyyMMddHHmmss") }
    $combined = "${postId}_${ts}"
    $url = "$base/ghoststory/article/$combined.html"
    $entry = @{ loc=$url; lastmod=$lastmod }
    $entries += $entry
}

# Compendium individual pages (from Data\Services.json, category contains '彙典')
$svcPath = Join-Path $root "Data\Services.json"
if (Test-Path $svcPath) {
    $svcData = Get-Content -Raw -Encoding UTF8 $svcPath | ConvertFrom-Json
    foreach ($svc in $svcData) {
        $props = @($svc.PSObject.Properties)
        $cat = if ($props.Count -gt 0) { [string]$props[0].Value } else { "" }
        if ($cat.Length -lt 6) { continue }
        # find ID property
        $id = $null
        foreach ($pr in $props) {
            if ($pr.Name -eq 'ID') { $id = [string]$pr.Value }
        }
        $title = if ($props.Count -gt 1) { [string]$props[1].Value } else { "" }
        $compendiumId = if ($id) { $id } else { $title }
        if (-not $compendiumId) { continue }
        $encoded = [System.Uri]::EscapeDataString($compendiumId)
        $url = "$base/services/compendium/$encoded.html"
        # 從 Services.json 的發佈日期取 lastmod（沒有就用今天）
        $dateObj = $null
        foreach ($pr in $props) {
            $d = ConvertTo-DateTimeValue $pr.Value
            if ($d) { $dateObj = $d; break }
        }
        $lastmod = if ($dateObj) { $dateObj.ToString("yyyy-MM-dd") } else { $today }
        $entry = @{ loc=$url; lastmod=$lastmod }
        $entries += $entry
    }
}

# Build XML
$sb = New-Object System.Text.StringBuilder
[void]$sb.AppendLine('<?xml version="1.0" encoding="UTF-8"?>')
[void]$sb.AppendLine('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')
foreach ($e in $entries) {
    [void]$sb.AppendLine('  <url>')
    [void]$sb.AppendLine("    <loc>$($e.loc)</loc>")
    if ($e.lastmod) { [void]$sb.AppendLine("    <lastmod>$($e.lastmod)</lastmod>") }
    [void]$sb.AppendLine('  </url>')
}
[void]$sb.AppendLine('</urlset>')

$outPath = Join-Path $root "sitemap.xml"
$sb.ToString() | Out-File -FilePath $outPath -Encoding utf8

Write-Host "Generated: $outPath"
Write-Host "Total URLs: $($entries.Count)"