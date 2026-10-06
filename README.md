# Blog website

This project stores its content in a local SQLite database on the server. It does not require Supabase or another hosted database.

## Run locally

```sh
npm ci
cp .env.example .env
```

Edit `.env` and set your own `ADMIN_EMAIL` and private, long `ADMIN_PASSWORD` before exposing the site. These exact values are the credentials to enter at **Admin Panel**; the application has no default admin account. Then run:

```sh
npm run dev
```

Open <http://localhost:3000>. The first start creates the SQLite database at `DB_PATH` (by default `./data/blog.sqlite`). Starter video and gallery records are added once when the database is first initialized.

## Deploy on a VPS

Install Node.js 20 or newer, copy the project to the VPS, and configure `.env` with a unique admin email and strong password. Build and run the site:

```sh
npm ci
npm run build
npm start
```

The server serves the built website and its API on `PORT` (default `3000`). Put a reverse proxy such as Nginx or Caddy in front of it to provide HTTPS. The admin session cookie is marked `Secure` when `NODE_ENV=production`, which is set by `npm start`.

Keep the database on persistent disk, not an ephemeral deployment directory. Set `DB_PATH` if needed, ensure the server process can write to its parent directory, and back up the database regularly. For a consistent file backup, stop the server before copying the SQLite database.

`ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `DB_PATH` are read by the server only; do not rename them with a `VITE_` prefix or put their values in client-side code.

If this browser has content saved by the previous local-storage version, its first successful admin sign-in imports that content into the SQLite database and removes those browser copies after a successful import. The import runs once per database.
