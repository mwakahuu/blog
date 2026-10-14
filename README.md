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

### 4. Configure private admin credentials

Generate a password on the VPS and keep it private:

```sh
openssl rand -base64 36
```

Create `.env` in `/opt/blog` with your real domain, admin email, and generated password:

```dotenv
DOMAIN=blog.example.com
ADMIN_EMAIL=you@example.com
ADMIN_PASSWORD=paste-your-generated-password-here
```

Replace the example domain and email. Do not commit `.env` or share its contents. The sample password currently shown in a development `.env` is not secure; replace it before exposing the site publicly. Restrict the file:

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

Caddy will become healthy and request HTTPS after DNS points to the VPS and ports `80` and `443` are reachable. Check startup logs with `sudo docker compose logs -f blog caddy`.

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
