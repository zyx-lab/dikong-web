param(
  [Parameter(Mandatory = $true)]
  [string]$AccessToken,

  [Parameter(Mandatory = $true)]
  [string]$TenantCode,

  [Parameter(Mandatory = $true)]
  [int]$RouteId,

  [string]$BaseUrl = "http://8.129.135.140:8010"
)

$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

function Invoke-DebugRequest {
  param(
    [Parameter(Mandatory = $true)]
    [ValidateSet("GET", "POST", "PUT", "DELETE")]
    [string]$Method,

    [Parameter(Mandatory = $true)]
    [string]$Url
  )

  $headers = @{
    "Authorization" = "Bearer $AccessToken"
    "X-TENANT-CODE" = $TenantCode
  }

  Write-Host ""
  Write-Host "=== $Method $Url ===" -ForegroundColor Cyan

  try {
    $response = Invoke-WebRequest -Uri $Url -Method $Method -Headers $headers -ContentType "application/json" -UseBasicParsing
    Write-Host "HTTP Status: $($response.StatusCode)" -ForegroundColor Green
    if ($response.Content) {
      Write-Host $response.Content
    }
  } catch {
    $webResponse = $_.Exception.Response
    if ($null -eq $webResponse) {
      throw
    }

    $statusCode = [int]$webResponse.StatusCode
    $stream = $webResponse.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($stream, [System.Text.Encoding]::UTF8)
    $body = $reader.ReadToEnd()
    $reader.Dispose()
    $stream.Dispose()

    Write-Host "HTTP Status: $statusCode" -ForegroundColor Red
    if ($body) {
      Write-Host $body
    }
  }
}

$normalizedBaseUrl = $BaseUrl.TrimEnd("/")
$routeBaseUrl = "$normalizedBaseUrl/api/v1/routes/$RouteId"

Write-Host "BaseUrl   : $normalizedBaseUrl"
Write-Host "TenantCode: $TenantCode"
Write-Host "RouteId   : $RouteId"

Invoke-DebugRequest -Method GET -Url $routeBaseUrl
Invoke-DebugRequest -Method GET -Url "$routeBaseUrl/xml"
Invoke-DebugRequest -Method POST -Url "$routeBaseUrl/publish"
