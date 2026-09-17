# 🇨🇮 Djassa Pro — Plateforme d'Entraide & Pros Locaux en Côte d'Ivoire

> Conçu et développé par **Bakayoko Sory**

**Djassa Pro** est une plateforme web moderne et mobile-first permettant aux jeunes travailleurs et artisans ivoiriens (plombiers, coiffeurs, électriciens, livreurs, réparateurs...) de valoriser leurs compétences et d'être contactés directement via WhatsApp par des clients à Abidjan et partout en Côte d'Ivoire.

---

## 🌟 Points Forts & Fonctionnalités

- ⚡ **Expérience Mobile-First Ultra-Rapide** : Optimisée pour les réseaux mobiles (3G/4G) avec chargement en moins de 1 seconde (< 105 ko First Load JS).
- 📱 **Mise en Relation Directe WhatsApp** : Connexion immédiate en un clic avec message pré-rempli, sans intermédiaire ni commission.
- 🛡️ **Vérification d'Identité & Badges Sécurisés** : Système KYC avec contrôle des pièces d'identité et traçabilité des validations dans un journal d'audit.
- ⭐ **Avis & Notations Clients** : Système interactif d'évaluation (1 à 5 étoiles) avec recalcul dynamique des moyennes.
- 🔍 **Recherche Locale par Commune & Quartier** : Filtres par commune d'Abidjan (Cocody, Yopougon, Koumassi, Marcory, etc.) et métiers.
- 👑 **Back-Office d'Administration** : Tableau de bord pour la modération, la vérification des pièces d'identité et le suivi des prestataires.

---

## 🚀 Stack Technique

| Composant | Technologie |
|---|---|
| **Framework** | Next.js 14 (App Router) |
| **Styling** | Tailwind CSS |
| **Base de données** | PostgreSQL (Vercel Postgres / Neon) |
| **ORM** | Prisma Client & Schema Engine |
| **Authentification** | Sessions sécurisées Edge-compatible (`jose`) via cookies `HttpOnly` |
| **Sécurité** | Hachage bcrypt (10-12 rounds) & validation stricte Zod |
| **Hébergement** | Vercel |

---

## ⚡ Démarrage Rapide

### 1. Installation
```bash
# Installer les dépendances
npm install

# Configurer l'environnement local
cp .env.example .env.local

# Générer le client Prisma
npx prisma generate

# Lancer le serveur de développement
npm run dev
```

Accédez ensuite à l'application sur : **`http://localhost:3000`**

---

## 🌐 Déploiement en Production sur Vercel

1. Importez le dépôt sur [Vercel](https://vercel.com).
2. Créez une base de données **Vercel Postgres** (ou connectez Neon) depuis l'onglet Storage.
3. Vercel injecte automatiquement les variables `DATABASE_URL` et `DIRECT_URL`.
4. Ajoutez la variable `JWT_SECRET` dans **Settings → Environment Variables**.
5. Déployez ! Prisma exécutera automatiquement `prisma generate` lors du build.

---

## 👨‍💻 Auteur & Vision

Projet initié, conçu et développé par **Bakayoko Sory**, ingénieur et développeur passionné par la valorisation du travail des jeunes et l'innovation numérique en Côte d'Ivoire.

*© 2026 Djassa Pro Côte d'Ivoire. Tous droits réservés.*
