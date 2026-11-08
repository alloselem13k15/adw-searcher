# ADW Intelligence

Plateforme OSINT SaaS — monorepo Next.js 14 + Node.js/Express + PostgreSQL + Redis.

## Stack

| Couche | Technologie |
|---|---|
| Frontend | Next.js 14 App Router, TypeScript, Tailwind CSS, Framer Motion |
| Backend | Node.js, Express, TypeScript |
| Base de données | PostgreSQL + Prisma ORM |
| Cache / Sessions | Redis |
| Auth | JWT (mémoire) + Refresh tokens (HttpOnly cookie) + TOTP 2FA |
| Paiements | Stripe (Checkout + Billing Portal + Webhooks) |
| Mots de passe | Argon2id |
| Design | Monochrome strict — noir, blanc, gris uniquement |

## Structure

```
adw/
├── apps/
│   ├── api/          # Express REST API (port 4000)
│   └── web/          # Next.js frontend (port 3000)
├── packages/
│   └── database/     # Prisma schema + seed
├── nginx/            # Configuration nginx
└── docker-compose.yml
```

## Prérequis

- Node.js 20+
- Docker + Docker Compose
- Compte Stripe (pour les paiements)
- Clé API ADW (pour les recherches OSINT)

## Installation

### 1. Cloner et configurer l'environnement

```bash
git clone <repo>
cd adw
cp .env.example .env
```

Remplir `.env` :

```env
# Base de données
DATABASE_URL=postgresql://adw:adw_secret@localhost:5432/adw

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=<générer avec: openssl rand -hex 64>
JWT_REFRESH_SECRET=<générer avec: openssl rand -hex 64>

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_BASIC=price_...
STRIPE_PRICE_PREMIUM=price_...
STRIPE_PRICE_BUSINESS=price_...

# ADW API (serveur uniquement — ne jamais exposer au client)
ADW_API_KEY=<votre clé>
ADW_API_URL=https://api.adw-provider.com

# URLs
WEB_URL=https://adw-intelligence.com
API_URL=https://api.adw-intelligence.com

# Compte owner initial
OWNER_EMAIL=owner@adw-intelligence.com
OWNER_PASSWORD=ChangeMe!1337
OWNER_USERNAME=owner
```

### 2. Démarrer avec Docker Compose

```bash
docker compose up -d
```

Cela démarre : PostgreSQL, Redis, l'API, le frontend et nginx.

### 3. Initialiser la base de données

```bash
# Migrations
docker compose exec api npx prisma migrate deploy

# Seed (crée le compte owner + plans)
docker compose exec api npx ts-node packages/database/prisma/seed.ts
```

### 4. Accéder à la plateforme

- Frontend : http://localhost (port 80 via nginx)
- API : http://localhost/api
- Connexion owner : email + mot de passe définis dans `.env`

> **Important** : Changer le mot de passe owner immédiatement après la première connexion.

## Développement local

```bash
# Installer les dépendances
npm install

# Démarrer PostgreSQL + Redis
docker compose up postgres redis -d

# Générer le client Prisma
cd packages/database && npx prisma generate && cd ../..

# Migrations
cd packages/database && npx prisma migrate dev && cd ../..

# Seed
cd packages/database && npx ts-node prisma/seed.ts && cd ../..

# Démarrer l'API (port 4000)
cd apps/api && npm run dev &

# Démarrer le frontend (port 3000)
cd apps/web && npm run dev
```

## Crédits par type de recherche

| Type | Coût |
|---|---|
| Personne | 5 crédits |
| Email | 3 crédits |
| Téléphone | 4 crédits |
| Nom d'utilisateur | 2 crédits |
| Adresse IP | 2 crédits |
| Domaine | 3 crédits |
| Entreprise | 6 crédits |

## Plans

| Plan | Crédits/mois | Prix |
|---|---|---|
| Gratuit | 100 | 0 € |
| Basic | 2 000 | 19 €/mois |
| Premium | 10 000 | 49 €/mois |
| Business | 100 000 | 149 €/mois |

## Sécurité

- Mots de passe : Argon2id (memoryCost=65536, timeCost=3)
- Access tokens JWT en mémoire (Zustand) — jamais en localStorage
- Refresh tokens HttpOnly Secure SameSite=Strict (7 jours, rotation)
- Rate limiting Redis : global (100/min), auth (10/15min), recherche (20/min)
- En-têtes de sécurité : CSP, HSTS, X-Frame-Options via Helmet
- 2FA TOTP avec codes de secours (otplib)
- RBAC : USER → ADMIN → OWNER (OWNER non assignable via routes admin)

## API externe

L'API OSINT sous-jacente est appelée **uniquement côté serveur**. Elle n'est jamais exposée au client. Elle est identifiée comme "ADW API" dans toute l'interface utilisateur.

### Utilisation via clé API

```bash
curl -X POST https://adw-intelligence.com/api/search/api \
  -H "X-API-Key: adw_votre_cle" \
  -H "Content-Type: application/json" \
  -d '{"type": "EMAIL", "query": "exemple@email.com"}'
```

## Rôles

- **USER** — utilisateur standard, accès dashboard
- **ADMIN** — gestion des utilisateurs, tickets, annonces (panel `/admin`)
- **OWNER** — accès total incluant gestion des admins, maintenance, revenus (panel `/owner`)

## Déploiement production

1. Mettre à jour `nginx/nginx.conf` : décommenter le bloc HTTPS et configurer le certificat SSL
2. Configurer les variables d'environnement de production
3. `docker compose -f docker-compose.yml up -d --build`
4. Configurer le webhook Stripe : `https://adw-intelligence.com/api/billing/webhook`

## License

Propriétaire — ADW Intelligence SAS. Tous droits réservés.
