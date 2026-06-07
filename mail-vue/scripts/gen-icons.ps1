# Generate Windows icon.ico from public/image/psg-logo.png
# Run from the mail-vue directory: pwsh scripts/gen-icons.ps1

Add-Type -AssemblyName System.Drawing

$src  = Resolve-Path "public\image\psg-logo.png"
$dest = "$PSScriptRoot\..\build\icon.ico"

$source = [System.Drawing.Image]::FromFile($src.Path)
$sizes  = @(16, 24, 32, 48, 64, 128, 256)
$pngArrays = [System.Collections.Generic.List[byte[]]]::new()

foreach ($sz in $sizes) {
    $bm = New-Object System.Drawing.Bitmap($sz, $sz, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g  = [System.Drawing.Graphics]::FromImage($bm)
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $g.InterpolationMode  = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode      = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.DrawImage($source, 0, 0, $sz, $sz)
    $g.Dispose()
    $ms = New-Object System.IO.MemoryStream
    $bm.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
    $bm.Dispose()
    $pngArrays.Add($ms.ToArray())
    $ms.Dispose()
}
$source.Dispose()

$result = New-Object System.IO.MemoryStream
$bw     = New-Object System.IO.BinaryWriter($result)

# ICONDIR
$bw.Write([uint16]0)
$bw.Write([uint16]1)
$bw.Write([uint16]$sizes.Count)

# ICONDIRENTRY
$offset = [uint32](6 + $sizes.Count * 16)
for ($i = 0; $i -lt $sizes.Count; $i++) {
    $sz   = $sizes[$i]
    $data = $pngArrays[$i]
    $w    = if ($sz -ge 256) { 0 } else { $sz }
    $bw.Write([byte]$w); $bw.Write([byte]$w)
    $bw.Write([byte]0); $bw.Write([byte]0)
    $bw.Write([uint16]1); $bw.Write([uint16]32)
    $bw.Write([uint32]$data.Length)
    $bw.Write([uint32]$offset)
    $offset += $data.Length
}

foreach ($data in $pngArrays) { $bw.Write($data) }
$bw.Flush()

New-Item -ItemType Directory -Force (Split-Path $dest) | Out-Null
[System.IO.File]::WriteAllBytes($dest, $result.ToArray())
$result.Dispose(); $bw.Dispose()

# Also copy as Linux icon
Copy-Item $src.Path "$PSScriptRoot\..\build\icon.png" -Force

Write-Host "Done: icon.ico ($([math]::Round((Get-Item $dest).Length/1024,1)) KB), icon.png"
