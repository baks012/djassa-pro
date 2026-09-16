# 🇨🇮 Djassa Pro — Plateforme d'Entraide pour la Jeunesse Ivoirienne

> Conçu et développé par **Bakayoko Sory**

Djassa Pro est une plateforme **mobile-first** permettant aux jeunes travailleurs ivoiriens (plombiers, coiffeurs, électriciens, livreurs, enseignants...) de proposer leurs services et d'être contactés directement via WhatsApp par des clients à Abidjan.

---

## 🚀 Stack Technique

| Composant | Technologie |
|---|---|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS |
| Base de données | SQLite (local) / PostgreSQL Neon (production) |
| ORM | Prisma |
| Auth | JWT (cookies HTTP-only) |
| Validation | Zod |
| Déploiement | Vercel |

---

## ⚡ Démarrage Rapide (en local)

### Prérequis
- Node.js 18+
- npm

### Installation

```bash
# 1. Cloner le dépôt
git clone https://github.com/VOTRE_USERNAME/djassa-pro.git
cd djassa-pro

# 2. Installer les dépendances
npm install

# 3. Configurer les variables d'environnement
cp .env.example .env.local
# ⚠️ Éditez .env.local : la valeur par défaut SQLite fonctionne sans configuration supplémentaire

# 4. Créer la base de données et pousser le schéma
npm run db:push

# 5. Remplir la base avec les données de démo
npm run db:seed

# 6. Lancer le serveur de développement
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000)

---

## 🔑 Identifiants de Connexion (après seed)

| Rôle | Email | Téléphone | Mot de passe |
|---|---|---|---|
| 👑 **Admin** | `bakayoko.sory@djassapro.ci` | `0700000001` | `BakayokoAdmin2026!` |
| 🧑‍💼 **Prestataire (Sory)** | `sory.prestataire@djassapro.ci` | `0707070707` | `SoryPro2026!` |
| 👷 **Prestataires démo** | `jean.kouassi@djassapro.ci` | — | `DjassaPass2026!` |

> 💡 **Astuce** : Tu peux te connecter avec le téléphone (ex: `0700000001`) **ou** l'email.

---

## 🌐 Déploiement sur Vercel + Neon PostgreSQL (Production)

### Étape 1 : Base de données PostgreSQL gratuite (Neon)

1. Aller sur [https://neon.tech](https://neon.tech) → Créer un compte gratuit
2. Créer un nouveau projet → choisir la région **Europe (Frankfurt)** pour la CI
3. Copier les deux URLs de connexion :
   - **Connection string** (pour `DATABASE_URL`)
   - **Direct connection** (pour `DIRECT_URL`)

### Étape 2 : Schéma PostgreSQL

Pour la production, utiliser le schéma PostgreSQL optimisé :

```bash
# Remplacer le schéma SQLite par le schéma PostgreSQL
cp prisma/schema.postgres.prisma prisma/schema.prisma
```

Puis dans `prisma/schema.prisma`, vérifier que le `datasource` contient bien :
```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

### Étape 3 : Pousser sur GitHub

```bash
git init
git add .
git commit -m "feat: initialisation Djassa Pro par Bakayoko Sory"
git branch -M main
git remote add origin https://github.com/VOTRE_USERNAME/djassa-pro.git
git push -u origin main
```

### Étape 4 : Déployer sur Vercel

1. Aller sur [https://vercel.com](https://vercel.com) → **New Project**
2. Importer le dépôt GitHub `djassa-pro`
3. Dans **Environment Variables**, ajouter :

| Variable | Valeur |
|---|---|
| `DATABASE_URL` | `postgresql://USER:PASS@HOST/DB?sslmode=require` |
| `DIRECT_URL` | `postgresql://USER:PASS@HOST/DB?sslmode=require` |
| `JWT_SECRET` | Une clé secrète longue et aléatoire (min 48 chars) |
| `NEXT_PUBLIC_APP_URL` | `https://votre-projet.vercel.app` |

4. Cliquer **Deploy** → Vercel build et déploie automatiquement

### Étape 5 : Initialiser la base de production

Une fois déployé, initialiser les tables et les données :

```bash
# En local, pointer vers la DB de production pour initialiser
DATABASE_URL="postgresql://..." DIRECT_URL="postgresql://..." npm run db:push
DATABASE_URL="postgresql://..." DIRECT_URL="postgresql://..." npm run db:seed
```

---

## 📁 Structure du Projet

```
djassa-pro/
├── prisma/
│   ├── schema.prisma          # Schéma SQLite (local)
│   ├── schema.postgres.prisma # Schéma PostgreSQL (production)
│   └── seed.ts                # Données de démonstration
├── src/
│   ├── app/
│   │   ├── (auth)/            # Pages connexion & inscription
│   │   ├── admin/             # Back-office administrateur
│   │   ├── api/               # Routes API (auth, providers, admin)
│   │   ├── dashboard/         # Espace prestataire
│   │   └── prestataires/      # Annuaire public des prestataires
│   ├── components/
│   │   ├── layout/            # Navbar, Footer, MobileNav
│   │   ├── cards/             # ProviderCard
│   │   └── search/            # SearchBar
│   ├── features/auth/         # Schémas Zod de validation
│   └── lib/                   # Prisma client, auth JWT, utils
├── .env.example               # Template des variables d'environnement
├── vercel.json                # Configuration Vercel
└── next.config.mjs            # Configuration Next.js
```

---

## 🛡️ Sécurité

- ✅ **JWT HTTP-only cookies** : protection contre XSS
- ✅ **Bcrypt** : hashage des mots de passe (salt rounds 10-12)
- ✅ **Zod** : validation stricte des données d'entrée
- ✅ **Middleware** : protection des routes admin et dashboard
- ✅ **Politique KYC** : seul l'admin peut valider les badges prestataires
- ✅ **Variables d'environnement** : aucun secret en clair dans le code

---

## 📞 Contact

Plateforme créée par **Bakayoko Sory** pour l'insertion professionnelle des jeunes ivoiriens.

---

*© 2026 Djassa Pro Côte d'Ivoire. Tous droits réservés.*
