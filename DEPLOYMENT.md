# QuickPrint EC2 Deployment Guide

## Docker Compose Files Overview

| File | Purpose | When to Use |
|------|---------|-------------|
| `docker-compose.dev.yml` | Local development | Running DBs locally while coding |
| `docker-compose.ec2.yml` | EC2 without domain | Direct IP access (http://IP:port) |
| `docker-compose.yml` | Production with domain | With SSL & domain (https://quickprint.com) |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        EC2 Instance                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────────────┐   │
│  │  Frontend   │   │   Backend   │   │    Async-Worker     │   │
│  │  (React)    │   │  (Fastify)  │   │   (Job Processor)   │   │
│  │   :80       │   │   :3000     │   │                     │   │
│  └──────┬──────┘   └──────┬──────┘   └──────────┬──────────┘   │
│         │                 │                      │              │
│         └────────────────┬┴──────────────────────┘              │
│                          │                                      │
│  ┌───────────────────────┴─────────────────────────────────┐   │
│  │                    Docker Network                        │   │
│  └───────────────────────┬─────────────────────────────────┘   │
│                          │                                      │
│  ┌──────────┐   ┌────────┴───┐   ┌─────────────┐               │
│  │ Postgres │   │   Redis    │   │  RabbitMQ   │               │
│  │   :5432  │   │   :6379    │   │    :5672    │               │
│  └──────────┘   └────────────┘   └─────────────┘               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## docker-compose.ec2.yml (No Domain)

**Use this when:** You only have an IP address, no domain.

### Services

| Service | Image/Build | Ports Exposed | Purpose |
|---------|-------------|---------------|---------|
| **frontend** | Build from `./frontend/Dockerfile` | `80:80` | Serves React app via Nginx |
| **backend** | Build from `./backend/Dockerfile` | `3000:3000` | REST API + WebSocket |
| **async-worker** | Build from `./async-worker/Dockerfile` | None | Processes background jobs |
| **postgres** | `postgres:16-alpine` | None (internal) | Database |
| **redis** | `redis:7-alpine` | None (internal) | Cache & sessions |
| **rabbitmq** | `rabbitmq:3.12-management-alpine` | `15672:15672` | Message queue |

### Deployment Steps

```bash
# 1. SSH into EC2
ssh -i key.pem ubuntu@YOUR_IP

# 2. Install Docker
sudo apt update && sudo apt install -y docker.io docker-compose

# 3. Clone repo
git clone https://github.com/SA-Ash/quickprint.git
cd quickprint

# 4. Create .env with your secrets
nano .env

# 5. Build & start all containers
sudo docker-compose -f docker-compose.ec2.yml up -d --build

# 6. Run database migrations
sudo docker-compose -f docker-compose.ec2.yml exec backend npx prisma migrate deploy

# 7. Check status
sudo docker-compose -f docker-compose.ec2.yml ps
```

### Access URLs
- Frontend: `http://YOUR_IP`
- Backend API: `http://YOUR_IP:3000`
- RabbitMQ Dashboard: `http://YOUR_IP:15672`

---

## docker-compose.yml (With Domain + SSL)

**Use this when:** You have a domain pointing to your EC2.

### Additional Components

| Service | Purpose |
|---------|---------|
| **Traefik** | Reverse proxy, auto SSL certificates |
| **MinIO** | S3-compatible file storage (optional) |

### How Traefik Works

```
Internet Request
       │
       ▼
┌──────────────┐
│   Traefik    │  ← Handles SSL, routes by domain
│   :80/:443   │
└──────┬───────┘
       │
       ├── quickprint.com      → Frontend container
       ├── api.quickprint.com  → Backend container
       └── rabbitmq.quickprint.com → RabbitMQ UI
```

### Pre-requisites

1. Domain (e.g., `quickprint.com`)
2. DNS A records pointing to EC2 IP:
   - `quickprint.com` → EC2 IP
   - `api.quickprint.com` → EC2 IP
   - `www.quickprint.com` → EC2 IP

### Deployment Steps

```bash
# 1. Update docker-compose.yml with your domain
# Replace all instances of "quickprint.com" with your domain

# 2. Create traefik.yml config (if not exists)
# This configures Let's Encrypt for SSL

# 3. Deploy
sudo docker-compose up -d --build

# 4. Traefik will automatically:
#    - Get SSL certificates from Let's Encrypt
#    - Route traffic to correct containers
#    - Handle HTTPS redirect
```

### Access URLs (with domain)
- Frontend: `https://quickprint.com`
- Backend API: `https://api.quickprint.com`
- RabbitMQ: `https://rabbitmq.quickprint.com`

---

## Build Process (What Happens During `docker-compose up --build`)

### Backend Build (`backend/Dockerfile`)

```
Stage 1: deps
├── Install Node.js Alpine image
├── Install build tools (python, gcc)
├── Copy package.json
├── Run npm ci (install dependencies)
└── Generate Prisma client

Stage 2: builder
├── Copy source code
├── Compile TypeScript → JavaScript
└── Output to /app/dist

Stage 3: runner (Final)
├── Copy compiled code
├── Copy node_modules
├── Create non-root user
└── CMD: node dist/index.js
```

### Frontend Build (`frontend/Dockerfile`)

```
Stage 1: deps
├── Install Node.js
├── Copy package.json
└── Run npm ci

Stage 2: builder
├── Copy source code
├── Inject environment variables (VITE_*)
├── Run npm run build
└── Output static files to /app/dist

Stage 3: runner (Nginx)
├── Copy built files to /usr/share/nginx/html
├── Copy nginx.conf
└── Serve static files on port 80
```

---

## Container Communication

All containers are on the same Docker network (`quickprint`):

| From | To | Connection String |
|------|-----|-------------------|
| backend | postgres | `postgres:5432` |
| backend | redis | `redis:6379` |
| backend | rabbitmq | `rabbitmq:5672` |
| async-worker | postgres | `postgres:5432` |
| async-worker | rabbitmq | `rabbitmq:5672` |
| frontend | backend | Via browser (external) |

---

## Common Commands

```bash
# View all containers
sudo docker-compose -f docker-compose.ec2.yml ps

# View logs
sudo docker-compose -f docker-compose.ec2.yml logs -f

# View specific service logs
sudo docker-compose -f docker-compose.ec2.yml logs -f backend

# Restart a service
sudo docker-compose -f docker-compose.ec2.yml restart backend

# Stop everything
sudo docker-compose -f docker-compose.ec2.yml down

# Stop and remove volumes (DELETES DATA)
sudo docker-compose -f docker-compose.ec2.yml down -v

# Rebuild single service
sudo docker-compose -f docker-compose.ec2.yml up -d --build backend

# Shell into container
sudo docker-compose -f docker-compose.ec2.yml exec backend sh

# Run Prisma commands
sudo docker-compose -f docker-compose.ec2.yml exec backend npx prisma migrate deploy
sudo docker-compose -f docker-compose.ec2.yml exec backend npx prisma studio
```

---

## Environment Variables Flow

```
.env (root)
    │
    ├── POSTGRES_USER, POSTGRES_PASSWORD
    │   └── Used by: postgres, backend, async-worker
    │
    ├── JWT_SECRET
    │   └── Used by: backend
    │
    ├── TWILIO_*, SENDGRID_*
    │   └── Used by: backend, async-worker
    │
    └── AWS_*, S3_BUCKET
        └── Used by: backend
```

The root `.env` file is read by docker-compose and injected into containers via `environment:` blocks.

---

## Switching from EC2 to Domain

When you get a domain:

1. **Update DNS** - Point domain to EC2 IP
2. **Update frontend build arg** in docker-compose.yml:
   ```yaml
   args:
     - VITE_API_BASE_URL=https://api.yourdomain.com
   ```
3. **Switch compose file**:
   ```bash
   sudo docker-compose down
   sudo docker-compose up -d --build
   ```
4. **Traefik handles SSL automatically**
