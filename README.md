# 🇨🇮 Djassa Pro — Plateforme d'Entraide pour la Jeunesse Ivoirienne

> Conçu et développé par **Bakayoko Sory**

**Djassa Pro** est une plateforme web moderne et mobile-first permettant aux jeunes travailleurs et artisans ivoiriens (plombiers, coiffeurs, électriciens, livreurs, réparateurs...) de valoriser leurs compétences et d'être contactés directement via WhatsApp par des clients à Abidjan et partout en Côte d'Ivoire.

---

## 🌟 Points Forts & Fonctionnalités

- ⚡ **Expérience Mobile-First Ultra-Rapide** : Optimisée pour les réseaux mobiles (3G/4G) avec chargement en moins de 1 seconde (< 107 ko First Load JS).
- 📱 **Mise en Relation Directe WhatsApp** : Connexion immédiate en un clic avec message pré-rempli, sans intermédiaire ni commission.
- 🛡️ **Vérification d'Identité & Badges Sécurisés** : Système KYC avec contrôle des pièces d'identité et traçabilité des validations dans un journal d'audit.
- 🔍 **Recherche Locale par Commune & Quartier** : Filtres par commune d'Abidjan (Cocody, Yopougon, Koumassi, Marcory, etc.) et métiers.
- 👑 **Back-Office d'Administration** : Tableau de bord pour la modération, la vérification des pièces d'identité et le suivi des prestataires.

---

## 🚀 Stack Technique

| Composant | Technologie |
|---|---|
| **Framework** | Next.js 14 (App Router) |
| **Styling** | Tailwind CSS (Design System moderne) |
| **Base de données** | PostgreSQL Cloud Serverless (Neon Tech) / SQLite (développement) |
| **ORM** | Prisma Client & Schema Engine |
| **Authentification** | Sessions sécurisées JWT via cookies `HttpOnly` & `SameSite` |
| **Sécurité** | Hachage bcrypt (10-12 rounds) & validation stricte Zod |
| **Hébergement** | Vercel |

---

## ⚡ Démarrage Rapide (Développement Local)

### 1. Prérequis
- Node.js 18+
- npm

### 2. Installation
```bash
# Cloner le dépôt
git clone https://github.com/baks012/djassa-pro.git
cd djassa-pro

# Installer les dépendances
npm install

# Configurer l'environnement local
cp .env.example .env.local

# Générer le client de base de données
npx prisma generate

# Lancer le serveur de développement
npm run dev
```

Accédez ensuite à l'application sur : **`http://localhost:3000`**

---

## 🌐 Déploiement en Production (Vercel)

1. Connectez le dépôt GitHub **`baks012/djassa-pro`** sur [Vercel](https://vercel.com).
2. Renseignez les variables d'environnement dans les paramètres Vercel :
   - `DATABASE_URL` (votre URL PostgreSQL)
   - `JWT_SECRET` (clé secrète sécurisée)
   - `NEXT_PUBLIC_APP_URL` (URL du site)
3. Vercel compile et déploie automatiquement l'application.

---

## 🛡️ Architecture & Cybersécurité

- **Zero Trust** : Aucun badge de vérification ne peut être attribué sans validation explicite de l'administrateur.
- **Protection XSS & CSRF** : Tokens de session stockés exclusivement dans des cookies `HttpOnly` inaccessibles en JavaScript côté client.
- **Normalisation des Données** : Validation Zod stricte sur les numéros de téléphone ivoiriens à 10 chiffres débutant par `01`, `05` ou `07`.
- **Journal d'Audit** : Traçabilité complète de toutes les actions d'administration (`AdminAuditLog`).

---

## 👨‍💻 Auteur & Vision

Projet initié, conçu et développé par **Bakayoko Sory**, ingénieur et développeur passionné par la valorisation du travail des jeunes et l'innovation numérique en Côte d'Ivoire.

*© 2026 Djassa Pro Côte d'Ivoire. Tous droits réservés.*
