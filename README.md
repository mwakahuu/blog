# Blog website

This project stores its content in a local SQLite database on the server. It does not require Supabase or another hosted database.

## Deploy with Dockdeploy

Use this path when deploying through Dockdeploy. Select **Git + compose**, not **Git repository**: the Dockerfile-only option in that form does not mount persistent storage, so admin-published content could disappear when its container is replaced. The Compose stack keeps `/data/blog.sqlite` in a named Docker volume. Configure your domain and HTTPS in your hosting platform or reverse proxy; the application does not manage domains or certificates.

In **New deployment**, enter:

| Field | Value |
| --- | --- |
| Name | `chombezo` |
| Server | Your configured VPS |
| Source | **Git + compose** |
| Repository | Your GitHub repository URL |
| Branch or tag | The branch containing this deployment file |
| Compose file | `docker-compose.dockdeploy.yml` |
| Container port, if requested | `3000` |

If the Git + compose screen does not offer a Compose-file path, configure it to use `docker-compose.dockdeploy.yml`.

In the deployment's **Environment variables** field, add one `KEY=value` per line. Use your own email and a generated password of at least 24 characters. Paste the FastLipa API token from your private dashboard; do not paste it into Git or this chat.

```dotenv
ADMIN_EMAIL=you@example.com
ADMIN_PASSWORD=replace-with-a-generated-password-at-least-24-characters
FASTLIPA_API_TOKEN=your-private-fastlipa-api-token
PREMIUM_MEDIA_PROTECTION_CONFIRMED=false
```

Route the deployment's **container port 3000** through your hosting platform or reverse proxy. Configure your domain, DNS, and HTTPS there; no domain value is required by the app. The compose file creates a persistent named volume for SQLite; do not delete that volume when redeploying or removing the application.

Before enabling checkout, ensure every premium media origin denies unauthorized direct access, then change `PREMIUM_MEDIA_PROTECTION_CONFIRMED=false` to `true` in Dockdeploy's environment settings and redeploy. Payment confirmation is polled from FastLipa's authenticated status API; no webhook or webhook secret is needed. A `503` before this flag is enabled is intentional and prevents payment for media that is still publicly accessible.

After deploy, confirm `/admin`, `/api/content`, and `/api/access/status` return `200` through your configured public URL. Sign in at `/admin`, publish one article, video, gallery item, and product, and confirm each appears publicly. Redeploy once and confirm the records remain; this verifies Dockdeploy preserved its volume.

Existing content in the current workspace database is not included in Git. If `data/blog.sqlite` exists and contains articles or products you need to keep, make a consistent backup before deploying:

```sh
node --input-type=module -e "import Database from 'better-sqlite3'; const db = new Database('data/blog.sqlite', { readonly: true }); await db.backup('/tmp/blog-production.sqlite'); db.close();"
scp /tmp/blog-production.sqlite YOUR_SSH_USER@YOUR_SERVER:/tmp/blog-production.sqlite
```

After the Dockdeploy volume has been created, stop the app from the panel, find the volume name with `sudo docker volume ls`, then copy the backup into that named volume (replace `DOCKDEPLOY_BLOG_VOLUME` with its actual name):

```sh
sudo docker run --rm \
	-v DOCKDEPLOY_BLOG_VOLUME:/data \
	-v /tmp/blog-production.sqlite:/backup.sqlite:ro \
	alpine:3.20 sh -c 'cp /backup.sqlite /data/blog.sqlite && chown 1000:1000 /data/blog.sqlite'
```

Start the app again from Dockdeploy. SQLite migrations run on startup. Skip this transfer for a new site; its initial article seed list is empty, so publish articles in the admin panel.

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

This project needs the Express server in `server.ts` and a persistent SQLite database; a static frontend-only deployment does not provide those API routes or durable database storage. Video records and stream URLs are loaded through the app API. Use the Docker deployment below or a hosting platform that supports the Node server and persistent storage.

## Premium video payments

In **Admin Panel → Videos**, mark each new or edited video as Free or Premium. Videos are free by default. A visitor selecting a premium video sees the 3,000 TZS mobile-money prompt; a verified payment grants access to every premium video for five hours from provider confirmation. Enter a local Tanzanian mobile number beginning with `06` or `07`. No viewer account or password is created.

The server creates a pending FastLipa collection, then verifies completion by polling FastLipa's authenticated transaction-status endpoint with the private API token. Status polling validates the provider transaction ID, final status, and amount before granting access. Completion, entitlement extension, and payment updates are idempotent and transactional. The browser receives an HttpOnly opaque cookie; only its SHA-256 hash is stored. Versioned migrations in `migrations/` run automatically and transactionally at server startup; they add premium-payment/session tables and dismissed-payment tracking without altering existing content tables. Back up `data/blog.sqlite` before deploying.

Add these server-only values to `.env` (never use a `VITE_` prefix).

```dotenv
FASTLIPA_API_TOKEN=
PREMIUM_MEDIA_PROTECTION_CONFIRMED=true
```

The viewer flow polls FastLipa's authenticated transaction-status endpoint; the server checks the final status, provider transaction ID, and fixed 3,000 TZS amount against its pending database record before granting access. FastLipa's status response does not include a currency field; the app uses the account's TZS collection amount.

The admin may configure HTTPS video URLs from any host. For each admin video, paste one complete media URL into the empty stream field; replace the whole field rather than appending to an existing URL. Malformed or concatenated URLs are rejected. Public MP4 files play directly without token keys; the media host must return the file as `video/mp4` and support byte-range requests. The current six default videos use the storage URLs in `src/data/videos.ts`; the first two are premium. On startup, a one-time migration replaces existing default video records with these six URLs, keeps the first six existing thumbnails, and removes additional old records. Bunny CDN (`*.b-cdn.net`) playlists and segments are proxied by the app with the site's referrer; Bunny must allow public playback (turn off Bunny token authentication and any incompatible referrer restrictions). Premium playback is served through the app's access-controlled proxy. HLS child playlists, keys, and segments are proxied only when they remain on that stream's original HTTPS host and path; cross-host HLS references are rejected. Set `PREMIUM_MEDIA_PROTECTION_CONFIRMED=true` only after verifying that the media origin itself does not expose premium content publicly.

The six current storage links are publicly accessible. Marking the first two as premium gates them in this app, but does not prevent someone from opening a public storage URL directly. Restrict those two files at the storage host before accepting paid premium access.

Premium source URLs are excluded from public metadata and the frontend bundle. The one-time browser local-storage import does not restore the replaced video catalog. The FastLipa mock exists only in the automated test harness and is never imported by the application server. Tests are in `tests/premiumAccess.test.ts` and `tests/premiumIntegration.test.ts`; run `npm test` and `npm run lint`. No live FastLipa charge is made by the tests. Configure the private API token and protected video origins before production sales.

The app runs on container port `3000` and does not configure domains, DNS, or TLS. With `docker-compose.yml`, port `3015` on the VPS maps to the app's container port `3000`; point a local reverse proxy at `http://127.0.0.1:3015`. Dockdeploy exposes the container port `3000` for its own routing. The SQLite file lives in the VPS project directory at `./data/blog.sqlite`.

### 1. Configure your hosting platform

Configure your domain, DNS, HTTPS certificate, and reverse proxy independently of this application. With the VPS `docker-compose.yml`, forward requests to `127.0.0.1:3015`. The app port is bound to loopback and should not be exposed directly to the internet.

```sh
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status
```

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

Create the private environment file from the template, generate a strong admin password, then edit the file:

```dotenv
cp .env.example .env
openssl rand -base64 36
nano .env
```

Set `ADMIN_EMAIL` to your email and paste the generated password into `ADMIN_PASSWORD`; it must be at least 24 characters. Production intentionally refuses to start with blank or sample admin credentials. Set the private `FASTLIPA_API_TOKEN` from your FastLipa dashboard. The app confirms payments by polling FastLipa's authenticated transaction-status endpoint. Payments remain disabled until the API token and media-protection confirmation are configured.

For premium media, use HTTPS video URLs. Before accepting payments, make sure the media provider itself denies direct unauthorized access; the app proxy cannot make a public origin URL private. Keep `PREMIUM_MEDIA_PROTECTION_CONFIRMED=false` until you have tested the origin access rule, then set it to `true` to enable checkout. Never put secrets in `VITE_` variables, Git, or messages. Restrict the file:

```sh
chmod 600 .env
```

Confirm Compose can read the environment before starting:

```sh
docker compose config --quiet
```

### 5. Create persistent storage and start the site

The Node container runs as UID `1000`; give it write access to the host data directory, then build and start the app:

```sh
mkdir -p data
sudo chown -R 1000:1000 data
sudo docker compose up -d --build
sudo docker compose ps
```

SQLite does not need a separately installed database server or a manual database-creation command. On first startup, the app creates `data/blog.sqlite`, creates its tables, and seeds the initial product, video, and gallery records. `docker-compose.yml` mounts host `./data` into the app at `/data`, so the database survives container rebuilds and restarts. Keep this directory on persistent VPS storage.

Check app startup and health with:

```sh
sudo docker compose ps
sudo docker compose logs --tail=100 blog
curl -I http://localhost:3015/admin
curl -sS -o /dev/null -w 'content API: %{http_code}\n' http://localhost:3015/api/content
```

`/admin`, `/api/content`, and `/api/access/status` should return `200`:

```sh
curl -sS -o /dev/null -w 'access API: %{http_code}\n' http://localhost:3015/api/access/status
```

If `blog` is unhealthy, inspect its logs before exposing the site; production startup intentionally fails if the admin email/password are blank or still sample values.

### 6. Open the admin panel

Visit your configured public URL at `/admin` and sign in with the `ADMIN_EMAIL` and `ADMIN_PASSWORD` from the VPS `.env`. Publish a test article, video, gallery image, and product, then verify each appears on its public page. Admin changes are saved in `/data/blog.sqlite` inside the container and persist at `/opt/blog/data/blog.sqlite` on the VPS. Image and video fields store links; the linked media must remain available at those URLs.

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

`ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `DB_PATH` are server-side settings. Never expose them using a `VITE_` prefix or in client-side code. If browser content from the old local-storage version must be migrated, sign in once on the browser that contains it; the existing one-time migration imports posts and gallery images.
