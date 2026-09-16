param(
    [Parameter(Mandatory=$false)]
    [string]$NeonUrl
)

$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   🚀 DÉPLOIEMENT DE LA BASE DE DONNÉES DJASSA PRO SUR NEON" -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""

if (-not $NeonUrl) {
    $NeonUrl = Read-Host "👉 Colle ici ton URL de connexion Neon (ex: postgresql://...)"
}

$NeonUrl = $NeonUrl.Trim()

if (-not $NeonUrl -or -not ($NeonUrl.StartsWith("postgresql://") -or $NeonUrl.StartsWith("postgres://"))) {
    Write-Host "❌ Erreur : L'URL fournie n'est pas une URL PostgreSQL valide." -ForegroundColor Red
    Write-Host "Format attendu : postgresql://username:password@ep-xxxx.neon.tech/neondb?sslmode=require" -ForegroundColor Gray
    exit 1
}

Write-Host "`n1️⃣ Configuration du schéma Prisma pour PostgreSQL..." -ForegroundColor Cyan
$schemaPath = Join-Path $PSScriptRoot "prisma\schema.prisma"
$schemaContent = Get-Content $schemaPath -Raw
$schemaContent = $schemaContent -replace 'provider\s*=\s*"sqlite"', 'provider = "postgresql"'
Set-Content -Path $schemaPath -Value $schemaContent -Encoding UTF8
Write-Host "   ✅ datasource db mis à jour : provider = 'postgresql'" -ForegroundColor Green

Write-Host "`n2️⃣ Configuration des variables d'environnement..." -ForegroundColor Cyan
$envPath = Join-Path $PSScriptRoot ".env.local"
$envContent = Get-Content $envPath -Raw
if ($envContent -match 'DATABASE_URL=.*') {
    $envContent = $envContent -replace 'DATABASE_URL=.*', "DATABASE_URL=`"$NeonUrl`""
} else {
    $envContent += "`nDATABASE_URL=`"$NeonUrl`""
}
Set-Content -Path $envPath -Value $envContent -Encoding UTF8
$env:DATABASE_URL = $NeonUrl
Write-Host "   ✅ DATABASE_URL configurée avec succès." -ForegroundColor Green

Write-Host "`n3️⃣ Génération du client Prisma..." -ForegroundColor Cyan
npx prisma generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erreur lors de la génération du client Prisma." -ForegroundColor Red
    exit $LASTEXITCODE
}

Write-Host "`n4️⃣ Déploiement des tables sur Neon (prisma db push)..." -ForegroundColor Cyan
npx prisma db push --accept-data-loss
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erreur lors de la création des tables sur Neon." -ForegroundColor Red
    exit $LASTEXITCODE
}
Write-Host "   ✅ Tables créées avec succès sur Neon !" -ForegroundColor Green

Write-Host "`n5️⃣ Insertion des données initiales (Seed : Bakayoko Sory, prestataires, services, avis)..." -ForegroundColor Cyan
npx tsx prisma/seed.ts
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erreur lors de l'insertion des données (seed)." -ForegroundColor Red
    exit $LASTEXITCODE
}
Write-Host "   ✅ Données insérées avec succès sur Neon !" -ForegroundColor Green

Write-Host "`n6️⃣ Mise à jour du fichier ZIP pour Vercel/GitHub..." -ForegroundColor Cyan
$zipPath = "C:\Users\soryb\.gemini\antigravity-ide\scratch\djassa-pro-deploy.zip"
if (Test-Path $zipPath) {
    Remove-Item $zipPath -Force
}
Compress-Archive -Path @(
  ".\.env.example",
  ".\.gitignore",
  ".\vercel.json",
  ".\README.md",
  ".\package.json",
  ".\package-lock.json",
  ".\tsconfig.json",
  ".\next.config.mjs",
  ".\postcss.config.mjs",
  ".\tailwind.config.ts",
  ".\prisma",
  ".\src",
  ".\supabase",
  ".\docker-compose.yml",
  ".\deploy-neon.ps1"
) -DestinationPath $zipPath -Force

Write-Host "   ✅ Nouveau ZIP propre créé : $zipPath" -ForegroundColor Green

Write-Host "`n==========================================================" -ForegroundColor Green
Write-Host "   🎉 FÉLICITATIONS ! TA BASE NEON EST 100% OPÉRATIONNELLE !" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "Comptes configurés sur Neon :" -ForegroundColor White
Write-Host "👑 Admin        : bakayoko.sory@djassapro.ci / BakayokoAdmin2026!" -ForegroundColor Yellow
Write-Host "💼 Prestataire  : sory.prestataire@djassapro.ci / SoryPro2026!" -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Green
