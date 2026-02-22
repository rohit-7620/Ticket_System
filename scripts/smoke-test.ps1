# Smoke test for Support Ticket System
# Usage: ./scripts/smoke-test.ps1 [-BaseUrl "http://localhost:8000"]

param(
    [string]$BaseUrl = "http://localhost:8000"
)

$ApiBase = "$BaseUrl/api"
$Passed = 0
$Failed = 0

function Test-Endpoint {
    param([string]$Name, [scriptblock]$Test)
    try {
        & $Test
        Write-Host "  [PASS] $Name" -ForegroundColor Green
        $script:Passed++
    } catch {
        Write-Host "  [FAIL] $Name - $_" -ForegroundColor Red
        $script:Failed++
    }
}

Write-Host "`nSupport Ticket System - Smoke Tests" -ForegroundColor Cyan
Write-Host "Base URL: $ApiBase`n" -ForegroundColor Cyan

# 1. List tickets
Test-Endpoint "GET /api/tickets/ - List tickets" {
    $res = Invoke-RestMethod -Uri "$ApiBase/tickets/" -Method GET
    if ($null -eq $res) { throw "Empty response" }
}

# 2. Create a ticket
Test-Endpoint "POST /api/tickets/ - Create ticket" {
    $body = @{
        title       = "Smoke test ticket"
        description = "This is an automated smoke test ticket"
        category    = "technical"
        priority    = "medium"
    } | ConvertTo-Json
    $script:CreatedTicket = Invoke-RestMethod -Uri "$ApiBase/tickets/" -Method POST `
        -Body $body -ContentType "application/json"
    if (-not $script:CreatedTicket.id) { throw "No id in response" }
    Write-Host "    Created ticket ID: $($script:CreatedTicket.id)" -ForegroundColor Gray
}

# 3. Get ticket by ID
Test-Endpoint "GET /api/tickets/{id}/ - Get ticket by ID" {
    $id = $script:CreatedTicket.id
    $res = Invoke-RestMethod -Uri "$ApiBase/tickets/$id/" -Method GET
    if ($res.id -ne $id) { throw "ID mismatch" }
}

# 4. Patch ticket status
Test-Endpoint "PATCH /api/tickets/{id}/ - Update status" {
    $id = $script:CreatedTicket.id
    $body = @{ status = "in_progress" } | ConvertTo-Json
    $res = Invoke-RestMethod -Uri "$ApiBase/tickets/$id/" -Method PATCH `
        -Body $body -ContentType "application/json"
    if ($res.status -ne "in_progress") { throw "Status not updated" }
}

# 5. Filter by category
Test-Endpoint "GET /api/tickets/?category=technical - Filter by category" {
    $res = Invoke-RestMethod -Uri "$ApiBase/tickets/?category=technical" -Method GET
    if ($null -eq $res) { throw "Empty response" }
}

# 6. Filter by priority
Test-Endpoint "GET /api/tickets/?priority=medium - Filter by priority" {
    $res = Invoke-RestMethod -Uri "$ApiBase/tickets/?priority=medium" -Method GET
    if ($null -eq $res) { throw "Empty response" }
}

# 7. Filter by status
Test-Endpoint "GET /api/tickets/?status=in_progress - Filter by status" {
    $res = Invoke-RestMethod -Uri "$ApiBase/tickets/?status=in_progress" -Method GET
    if ($null -eq $res) { throw "Empty response" }
}

# 8. Search
Test-Endpoint "GET /api/tickets/?search=smoke - Search tickets" {
    $res = Invoke-RestMethod -Uri "$ApiBase/tickets/?search=smoke" -Method GET
    if ($null -eq $res) { throw "Empty response" }
}

# 9. Stats
Test-Endpoint "GET /api/tickets/stats/ - Get statistics" {
    $res = Invoke-RestMethod -Uri "$ApiBase/tickets/stats/" -Method GET
    if ($null -eq $res.total_tickets) { throw "Missing total_tickets" }
    if ($null -eq $res.by_status)     { throw "Missing by_status" }
    if ($null -eq $res.by_category)   { throw "Missing by_category" }
    if ($null -eq $res.by_priority)   { throw "Missing by_priority" }
    Write-Host "    Total tickets: $($res.total_tickets)" -ForegroundColor Gray
}

# 10. Classify
Test-Endpoint "POST /api/tickets/classify/ - Classify ticket" {
    $body = @{
        title       = "I was double charged on my invoice"
        description = "My credit card was charged twice for the same subscription."
    } | ConvertTo-Json
    $res = Invoke-RestMethod -Uri "$ApiBase/tickets/classify/" -Method POST `
        -Body $body -ContentType "application/json"
    if (-not $res.category) { throw "Missing category in response" }
    if (-not $res.priority) { throw "Missing priority in response" }
    Write-Host "    Classified as: category=$($res.category), priority=$($res.priority)" -ForegroundColor Gray
}

Write-Host "`n----------------------------------------" -ForegroundColor Cyan
Write-Host "Results: $Passed passed, $Failed failed" -ForegroundColor $(if ($Failed -eq 0) { "Green" } else { "Yellow" })

if ($Failed -gt 0) { exit 1 } else { exit 0 }
