Add-Type -AssemblyName System.IO.Compression.FileSystem
$path = "C:\Users\thibault.darexy\Downloads\dynamic-reinscription-pdf-1774278292290.docx"
$zip = [System.IO.Compression.ZipFile]::OpenRead($path)
$entry = $zip.GetEntry('word/document.xml')
$stream = $entry.Open()
$reader = New-Object System.IO.StreamReader($stream)
$content = $reader.ReadToEnd()
$reader.Close()
$zip.Dispose()
$text = $content -replace '<[^>]+>', ' '
Write-Output $text
