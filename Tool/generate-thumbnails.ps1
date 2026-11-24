# 批次生成 ghoststory/pic 的縮圖 (160x160 Center-Crop, Quality 82)
Add-Type -AssemblyName System.Drawing

$srcDir = Join-Path $PSScriptRoot "..\ghoststory\pic"
$destDir = Join-Path $srcDir "thumb"

if (-not (Test-Path $destDir)) {
    New-Item -ItemType Directory -Path $destDir | Out-Null
}

$files = Get-ChildItem -Path $srcDir -File | Where-Object { $_.Extension -match '^\.(jpg|jpeg|png)$' }
$targetSize = 160

$jpegCodec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq "image/jpeg" }
$encoderParams = New-Object System.Drawing.Imaging.EncoderParameters 1
$encoderParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter ([System.Drawing.Imaging.Encoder]::Quality, [long]82)

$count = 0
foreach ($file in $files) {
    $destFile = Join-Path $destDir $file.Name
    
    # 若已存在且比來源新則跳過
    if ((Test-Path $destFile) -and ((Get-Item $destFile).LastWriteTime -ge $file.LastWriteTime)) {
        continue
    }

    try {
        $bytes = [System.IO.File]::ReadAllBytes($file.FullName)
        $ms = New-Object System.IO.MemoryStream(,$bytes)
        $bmp = [System.Drawing.Bitmap]::FromStream($ms)

        $srcW = $bmp.Width
        $srcH = $bmp.Height

        if ($srcW -gt $srcH) {
            $cropW = $srcH
            $cropH = $srcH
            $cropX = [int](($srcW - $srcH) / 2)
            $cropY = 0
        } else {
            $cropW = $srcW
            $cropH = $srcW
            $cropX = 0
            $cropY = [int](($srcH - $srcW) / 2)
        }

        $thumb = New-Object System.Drawing.Bitmap $targetSize, $targetSize
        $graphics = [System.Drawing.Graphics]::FromImage($thumb)
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

        $srcRect = New-Object System.Drawing.Rectangle $cropX, $cropY, $cropW, $cropH
        $destRect = New-Object System.Drawing.Rectangle 0, 0, $targetSize, $targetSize

        $graphics.DrawImage($bmp, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
        $graphics.Dispose()

        if ($file.Extension -eq '.png') {
            $thumb.Save($destFile, [System.Drawing.Imaging.ImageFormat]::Png)
        } else {
            $thumb.Save($destFile, $jpegCodec, $encoderParams)
        }

        $thumb.Dispose()
        $bmp.Dispose()
        $ms.Dispose()
        $count++
    } catch {
        Write-Warning "處理失敗 $($file.Name): $_"
    }
}

Write-Output "生成完成！共處理 $count 張縮圖。"
