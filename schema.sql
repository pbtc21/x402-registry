-- x402 Registry Schema

CREATE TABLE IF NOT EXISTS endpoints (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  owner TEXT NOT NULL,
  price INTEGER NOT NULL,
  token TEXT NOT NULL CHECK(token IN ('STX', 'sBTC', 'USDh')),
  tags TEXT DEFAULT '[]',
  category TEXT DEFAULT 'utility',
  open_api_spec TEXT,
  verified INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  total_calls INTEGER DEFAULT 0,
  calls_24h INTEGER DEFAULT 0,
  revenue_24h INTEGER DEFAULT 0,
  avg_response_time INTEGER DEFAULT 0,
  uptime REAL DEFAULT 100.0,
  last_checked TEXT
);

CREATE TABLE IF NOT EXISTS agents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  capabilities TEXT DEFAULT '[]',
  endpoints TEXT DEFAULT '[]',
  owner TEXT NOT NULL,
  pricing_model TEXT DEFAULT 'per-call',
  pricing_base INTEGER DEFAULT 0,
  pricing_token TEXT DEFAULT 'STX',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_endpoints_owner ON endpoints(owner);
CREATE INDEX IF NOT EXISTS idx_endpoints_category ON endpoints(category);
CREATE INDEX IF NOT EXISTS idx_endpoints_token ON endpoints(token);
CREATE INDEX IF NOT EXISTS idx_agents_owner ON agents(owner);

-- Seed data
INSERT OR IGNORE INTO endpoints (id, url, name, description, owner, price, token, tags, category, verified, created_at, updated_at, total_calls, calls_24h, revenue_24h, avg_response_time, uptime, last_checked)
VALUES
  ('sbtc-yield-vault', 'https://sbtc-yield-vault.p-d07.workers.dev', 'sBTC Yield Vault', 'Deposit sBTC and earn ~11% APY through leveraged looping strategy on Zest Protocol', 'SP2QXPFF4M72QYZWXE7S5321XJDJ2DD32DGEMN5QA', 1000, 'sBTC', '["defi","yield","vault","sbtc","zest","lending"]', 'finance', 1, '2026-01-03T05:00:00.000Z', '2026-01-03T05:00:00.000Z', 42, 12, 12000, 85, 99.9, datetime('now')),
  ('sbtc-yield-calc', 'https://sbtc-yield-x402.p-d07.workers.dev/calculate-yield', 'sBTC Yield Calculator', 'Calculate potential yields for sBTC deposits. Pay 0.05 STX per calculation.', 'SP1734723Q6206N1BAWQCJ5H9YFQBEPB96DRQB7KC', 50000, 'STX', '["sbtc","yield","calculator","defi"]', 'finance', 1, '2026-01-05T00:00:00.000Z', '2026-01-05T00:00:00.000Z', 0, 0, 0, 0, 100, datetime('now')),
  ('coin-refill', 'https://coin-refill.p-d07.workers.dev/refill', 'Coin Refill', 'Pay STX to refill wallet with any supported token (STX, sBTC, USDC). Dynamic pricing.', 'SP1734723Q6206N1BAWQCJ5H9YFQBEPB96DRQB7KC', 1000000, 'STX', '["refill","tokens","wallet","exchange","swap"]', 'utility', 1, '2026-01-05T00:00:00.000Z', '2026-01-05T00:00:00.000Z', 0, 0, 0, 0, 100, datetime('now'));
