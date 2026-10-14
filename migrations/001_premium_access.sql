CREATE TABLE payments (
  id TEXT PRIMARY KEY,
  reference TEXT NOT NULL UNIQUE,
  provider TEXT NOT NULL,
  provider_transaction_id TEXT UNIQUE,
  amount_tzs INTEGER NOT NULL CHECK (amount_tzs > 0),
  currency TEXT NOT NULL CHECK (currency = 'TZS'),
  product_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'cancelled', 'refunded')),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  confirmed_at INTEGER
);

CREATE TABLE entitlements (
  id TEXT PRIMARY KEY,
  payment_id TEXT NOT NULL UNIQUE REFERENCES payments(id),
  status TEXT NOT NULL CHECK (status IN ('active', 'expired', 'revoked')),
  starts_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  CHECK (expires_at > starts_at)
);

CREATE INDEX entitlements_status_expiry ON entitlements(status, expires_at);

CREATE TABLE premium_sessions (
  id TEXT PRIMARY KEY,
  token_hash TEXT NOT NULL UNIQUE,
  entitlement_id TEXT REFERENCES entitlements(id),
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  revoked_at INTEGER
);

CREATE INDEX premium_sessions_expiry ON premium_sessions(expires_at);

ALTER TABLE payments ADD COLUMN browser_session_id TEXT REFERENCES premium_sessions(id);
ALTER TABLE payments ADD COLUMN entitlement_id TEXT REFERENCES entitlements(id);
CREATE INDEX payments_browser_session ON payments(browser_session_id, created_at);
