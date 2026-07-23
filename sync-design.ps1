# design/ is a VENDORED COPY of the reference-only Youhue-DESIGN library. Re-run to resync after a design change.
$src='..\Youhue-DESIGN'; $dst='.\design'
Copy-Item "$src\approved" "$dst\approved" -Recurse -Force
Copy-Item "$src\theme" "$dst\theme" -Recurse -Force
Write-Host 'design library re-vendored into Youhue-FE/design/'
