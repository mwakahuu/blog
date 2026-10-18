ALTER TABLE payments ADD COLUMN dismissed_at INTEGER;
CREATE INDEX payments_pending_browser_session
  ON payments(browser_session_id, status, dismissed_at, created_at);