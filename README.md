# Blog website

This project stores its content in a local SQLite database on the server. It does not require Supabase or another hosted database.

## Run locally

```sh
npm ci
```

Create `.env` with your own `ADMIN_EMAIL` and private, long `ADMIN_PASSWORD` before exposing the site. These exact values are the credentials to enter at **Admin Panel**; the application has no default admin account. Then run:

```sh
npm run dev
```

Open <http://localhost:3000>. The first start creates the SQLite database at `DB_PATH` (by default `./data/blog.sqlite`). Starter video and gallery records are added once when the database is first initialized.

## Production VPS Deployment (Docker)

Vercel is not supported by the current deployment architecture. This project needs the Express server in `server.ts` and a persistent SQLite database; a default Vite deployment on Vercel only builds the frontend and does not provide those API routes or durable database storage. Video files are hosted separately on BunnyCDN, but their records and stream URLs are loaded through the app API. Use the Docker deployment below, or migrate the backend and database to services supported by Vercel.

## Premium video payments

In **Admin Panel → Videos**, mark each new or edited video as Free or Premium. Videos are free by default. A visitor selecting a premium video sees the 3,000 TZS mobile-money prompt; a verified payment grants access to every premium video for five hours from provider confirmation. Enter a local Tanzanian mobile number beginning with `06` or `07`. No viewer account or password is created.

The server creates a pending FastLipa collection, then verifies completion through FastLipa's authenticated transaction-status endpoint. It also accepts FastLipa webhooks only when the raw-body HMAC signature is valid. Completion, entitlement extension, and payment updates are idempotent and transactional. The browser receives an HttpOnly opaque cookie; only its SHA-256 hash is stored. The additive migration in `migrations/001_premium_access.sql` runs automatically at server startup and does not alter existing content tables. Back up `data/blog.sqlite` before deploying.

Add these server-only values to `.env` (never use a `VITE_` prefix):

```dotenv
FASTLIPA_API_TOKEN=
FASTLIPA_WEBHOOK_SECRET=
PUBLIC_APP_URL=https://utamu.chombezo.online
BUNNY_CDN_TOKEN_KEY=
PREMIUM_MEDIA_PROTECTION_CONFIRMED=true
```

Generate a webhook signing secret with FastLipa's authenticated `POST /v1/webhook_secret/generate` endpoint and store the returned value in `FASTLIPA_WEBHOOK_SECRET`. After deploying the Express backend at the new domain, set the FastLipa Developer webhook URL to `https://utamu.chombezo.online/api/payments/webhook`; the app also sends that URL on payment creation. **The current Vercel deployment does not serve the Express webhook route and returns 404, so the new URL will work only after the backend is deployed and reachable.** The app verifies the webhook signature and independently checks transaction status, amount, reference, and provider transaction ID before granting access. FastLipa's documented status response does not include a currency field; this implementation uses the account's TZS collection amount.

The admin may configure an HTTPS stream URL from any host. HLS child playlists, keys, and segments are proxied only when they remain on that stream's original HTTPS host and path; cross-host HLS references are rejected. `BUNNY_CDN_TOKEN_KEY` is optional and is used to sign upstream URLs only for Bunny `*.b-cdn.net` sources. Other providers must either offer protected/signed origin URLs configured by the admin or otherwise keep their origin URLs private. A same-origin proxy does not make a publicly accessible provider URL private. Set `PREMIUM_MEDIA_PROTECTION_CONFIRMED=true` only after verifying unauthorized direct access is denied by the media provider. Do not reuse the Bunny key as a FastLipa secret.

Existing seeded videos remain free until changed in Admin Panel. Free video sources continue to load directly; premium source URLs are excluded from public metadata and the frontend bundle. The FastLipa mock exists only in the automated test harness and is never imported by the application server. Tests are in `tests/premiumAccess.test.ts` and `tests/premiumIntegration.test.ts`; run `npm test` and `npm run lint`. No live FastLipa charge is made by the tests. Configure and verify credentials and webhook delivery with the FastLipa account before production sales.

This deployment runs the app and Caddy in Docker Compose. Caddy obtains and renews HTTPS certificates. The app is only reachable through Caddy, and the SQLite file lives in the VPS project directory at `./data/blog.sqlite`.

### 1. Point a domain at the VPS

Create a DNS `A` record for your domain pointing to the VPS IPv4 address. Add an `AAAA` record only if IPv6 is configured and reachable on the VPS. Allow inbound SSH, TCP ports `80` and `443`, and UDP port `443` in the VPS firewall and provider firewall.

### 2. Install Docker on Ubuntu

```sh
sudo apt update
sudo apt install -y docker.io docker-compose-v2 git
sudo systemctl enable --now docker
```

Use `sudo docker compose` below unless your VPS user is configured for Docker access.

### 3. Copy the project to the VPS

Clone your repository (replace the placeholder with its Git URL):

```sh
sudo mkdir -p /opt/blog
sudo chown "$USER":"$USER" /opt/blog
git clone YOUR_GIT_REPOSITORY_URL /opt/blog
cd /opt/blog
```

For later deployments, run `git pull` from this directory before rebuilding.

If you already have articles or admin-published content in a local `data/blog.sqlite`, it is not included in Git. Before the first VPS start, make a consistent SQLite backup from the machine that owns that database and copy it to the server. Do not copy a live database together with its `-wal` or `-shm` files.

```sh
node --input-type=module -e "import Database from 'better-sqlite3'; const db = new Database('data/blog.sqlite', { readonly: true }); await db.backup('/tmp/blog-production.sqlite'); db.close();"
scp /tmp/blog-production.sqlite YOUR_SSH_USER@YOUR_SERVER:/tmp/blog-production.sqlite
```

On the VPS, after creating `/opt/blog/data` and before starting Compose, install the backup as the persistent app database:

```sh
sudo mkdir -p /opt/blog/data
sudo cp /tmp/blog-production.sqlite /opt/blog/data/blog.sqlite
sudo chown 1000:1000 /opt/blog/data/blog.sqlite
```

Skip this transfer for a genuinely new site; startup will create the schema and seed the starter videos, gallery, and products. The built-in article seed list is empty, so publish articles in the admin panel or import the existing database.

### 4. Configure private admin credentials

Generate a password on the VPS and keep it private:

```sh
openssl rand -base64 36
```

Create `.env` in `/opt/blog` with your real domain, admin email, and generated password:

```dotenv
DOMAIN=utamu.chombezo.online
ADMIN_EMAIL=your-real-email@example.com
ADMIN_PASSWORD=paste-a-generated-password-of-at-least-24-characters
APP_URL=https://utamu.chombezo.online
PUBLIC_APP_URL=https://utamu.chombezo.online
FASTLIPA_API_TOKEN=
FASTLIPA_WEBHOOK_SECRET=
BUNNY_CDN_TOKEN_KEY=
PREMIUM_MEDIA_PROTECTION_CONFIRMED=false
DB_PATH=/data/blog.sqlite
HOST=0.0.0.0
PORT=3000
```

Replace the email and password with your own values. `FASTLIPA_API_TOKEN` and `FASTLIPA_WEBHOOK_SECRET` must be set before payments can work. Generate the webhook secret through FastLipa's authenticated API and configure `https://utamu.chombezo.online/api/payments/webhook` in its Developer settings. `BUNNY_CDN_TOKEN_KEY` is only needed when premium sources use Bunny token authentication. Keep `PREMIUM_MEDIA_PROTECTION_CONFIRMED=false` until you have confirmed that unauthorized direct requests to each premium media origin are denied; setting it to `true` is required before the production checkout route will accept charges. Do not commit `.env` or share its contents. Restrict the file:

```sh
chmod 600 .env
```

### 5. Create persistent storage and start the site

The Node container runs as UID `1000`; give it write access to the host data directory, then build and start both containers:

```sh
mkdir -p data
sudo chown -R 1000:1000 data
sudo docker compose up -d --build
sudo docker compose ps
```

SQLite does not need a separately installed database server or a manual database-creation command. On first startup, the app creates `data/blog.sqlite`, creates its tables, and seeds the initial product, video, and gallery records. `docker-compose.yml` mounts host `./data` into the app at `/data`, so the database survives container rebuilds and restarts. Keep this directory on persistent VPS storage.

Caddy will become healthy and request HTTPS after DNS points to the VPS and ports `80` and `443` are reachable. Check startup logs with `sudo docker compose logs -f blog caddy`. Once healthy, confirm `https://utamu.chombezo.online/admin` and `https://utamu.chombezo.online/api/content` respond successfully. The FastLipa webhook should return `401` to a test request without a signature; that confirms the request reaches the Express handler without accepting an unsigned callback.

### 6. Open the admin panel

Visit `https://YOUR_DOMAIN/admin` and sign in with the `ADMIN_EMAIL` and `ADMIN_PASSWORD` from the VPS `.env`. Admin changes are saved in the local SQLite database. Image and video fields store the links you provide; the linked media itself must remain available at those URLs.

### 7. Update and back up

To deploy newer code:

```sh
git pull
sudo docker compose up -d --build
```

Make a consistent SQLite backup while the app is running using SQLite's online backup API:

```sh
backup="blog-$(date -u +%Y%m%dT%H%M%SZ).sqlite"
sudo docker compose exec -T blog node --input-type=module -e "import Database from 'better-sqlite3'; const db = new Database('/data/blog.sqlite'); await db.backup('/data/$backup'); db.close();"
```

The backup appears under `/opt/blog/data`. Copy backups off the VPS as well; a backup on the same disk does not protect against disk loss. Keep `.env`, the database, and media assets/URLs under your normal private backup and recovery procedures.

`ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `DB_PATH` are server-side settings. Never expose them using a `VITE_` prefix or in client-side code. If browser content from the old local-storage version must be migrated, sign in once on the browser that contains it; the existing one-time migration imports posts, videos, and gallery images.
