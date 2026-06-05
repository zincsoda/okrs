CREATE TABLE IF NOT EXISTS change_events (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('period', 'objective', 'key_result')),
  entity_id TEXT NOT NULL,
  period_id TEXT NOT NULL,
  entity_label TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'deleted')),
  field TEXT,
  old_value TEXT,
  new_value TEXT,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  user_display TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_change_events_entity ON change_events(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_change_events_period ON change_events(period_id);
CREATE INDEX IF NOT EXISTS idx_change_events_created_at ON change_events(created_at);
