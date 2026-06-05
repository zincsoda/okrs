CREATE TABLE IF NOT EXISTS planning_periods (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Draft', 'Active', 'Closed'))
);

CREATE TABLE IF NOT EXISTS objectives (
  id TEXT PRIMARY KEY,
  period_id TEXT NOT NULL REFERENCES planning_periods(id) ON DELETE CASCADE,
  objective_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  owner TEXT NOT NULL,
  weight REAL NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Draft', 'Active', 'Completed'))
);

CREATE TABLE IF NOT EXISTS key_results (
  id TEXT PRIMARY KEY,
  objective_id TEXT NOT NULL REFERENCES objectives(id) ON DELETE CASCADE,
  key_result_id TEXT NOT NULL,
  title TEXT NOT NULL,
  owner TEXT NOT NULL,
  baseline REAL NOT NULL,
  target REAL NOT NULL,
  current REAL NOT NULL,
  weight REAL NOT NULL,
  confidence TEXT NOT NULL CHECK (confidence IN ('High', 'Medium', 'Low')),
  notes TEXT
);

CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_objectives_period_id ON objectives(period_id);
CREATE INDEX IF NOT EXISTS idx_key_results_objective_id ON key_results(objective_id);
