$ErrorActionPreference = 'Stop'

$base = "http://localhost:8000/api"

Write-Host "1) Classify description"
$classifyBody = @{ description = "I cannot log in after changing my phone number and need account help." } | ConvertTo-Json
$classify = Invoke-RestMethod -Method Post -Uri "$base/tickets/classify/" -ContentType "application/json" -Body $classifyBody
$classify | ConvertTo-Json -Depth 5 | Write-Host

Write-Host "2) Create ticket"
$createBody = @{
  title = "Login issue"
  description = "I cannot log in after changing my phone number and need account help."
  category = $classify.suggested_category
  priority = $classify.suggested_priority
} | ConvertTo-Json
$created = Invoke-RestMethod -Method Post -Uri "$base/tickets/" -ContentType "application/json" -Body $createBody
$ticketId = $created.id
$created | ConvertTo-Json -Depth 5 | Write-Host

Write-Host "3) List tickets with combined filters + search"
$list = Invoke-RestMethod -Method Get -Uri "$base/tickets/?category=$($created.category)&priority=$($created.priority)&status=open&search=log"
$list | ConvertTo-Json -Depth 5 | Write-Host

Write-Host "4) Patch status"
$patchBody = @{ status = "in_progress" } | ConvertTo-Json
$patched = Invoke-RestMethod -Method Patch -Uri "$base/tickets/$ticketId/" -ContentType "application/json" -Body $patchBody
$patched | ConvertTo-Json -Depth 5 | Write-Host

Write-Host "5) Get stats"
$stats = Invoke-RestMethod -Method Get -Uri "$base/tickets/stats/"
$stats | ConvertTo-Json -Depth 10 | Write-Host

Write-Host "Smoke test completed successfully."
