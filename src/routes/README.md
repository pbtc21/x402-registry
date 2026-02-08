# src/routes/

API route modules for the x402 Registry. Each file exports a Hono router that gets mounted in `index.ts`.

## Files

### registry.ts

**Purpose:** Endpoint registration and discovery

Handles the core registry functionality - registering, searching, and managing x402-gated endpoints.

**Endpoints:**

| Method | Path | Description |
|--------|------|-------------|
| POST | `/register` | Register a new endpoint |
| GET | `/search` | Search with filters (category, token, query) |
| GET | `/discover` | Trending, newest, and categorized endpoints |
| GET | `/:id` | Get single endpoint details |
| GET | `/:id/stats` | Get endpoint statistics |
| PUT | `/:id` | Update endpoint (requires `X-Owner-Address`) |
| DELETE | `/:id` | Delete endpoint (requires `X-Owner-Address`) |

**Key functions:**
- `verifyX402Endpoint()` - Tests if URL returns proper 402 response
- `rowToEndpoint()` - Converts D1 row to Endpoint object
- `generateId()` - Creates random endpoint IDs

---

### agents.ts

**Purpose:** AI agent orchestration and discovery

The "killer feature" - enables agents to discover other agents, compose them, and execute complex tasks.

**Endpoints:**

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List all registered agents |
| POST | `/register` | Register a new agent |
| GET | `/capabilities` | List all available capabilities |
| POST | `/recommend` | Get agent recommendations for a task |
| GET | `/:id/openapi` | Machine-readable OpenAPI spec for agent |
| POST | `/execute` | Execute task across agents (402 paywall) |
| POST | `/chain` | Chain multiple agents together (402 paywall) |

**Key features:**
- Capability-based indexing for fast lookup
- Task decomposition and agent matching
- Execution plan generation with cost estimates
- Agent chaining with step-by-step orchestration

**Data structures:**
- `agentRegistry` - In-memory Map of registered agents
- `capabilityIndex` - Capability to agent ID mapping

---

### payments.ts

**Purpose:** x402 payment infrastructure

Universal payment layer for creating invoices, verifying on-chain payments, and managing subscriptions.

**Endpoints:**

| Method | Path | Description |
|--------|------|-------------|
| POST | `/create-invoice` | Create payment invoice with QR data |
| POST | `/verify` | Verify transaction on Stacks mainnet |
| GET | `/balance/:address` | Get wallet balances (STX, sBTC, USDh) |
| POST | `/deposit` | Deposit credits to registry account |
| POST | `/subscribe` | Set up subscription plan |
| GET | `/subscription/:id` | Get subscription status |

**Token contracts:**
```typescript
{
  sBTC: "SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token",
  STX: "native",
  USDh: "SP2VCQJGH7PHP2DJK7Z0V48AGBHQAW3R3ZW1QF4N.usdh"
}
```

**Key functions:**
- `extractPaymentDetails()` - Parse STX transfers and SIP-010 calls
- `fetchOnChainBalances()` - Query Hiro API for wallet balances

**Subscription plans:**
| Plan | Calls | Price | Period |
|------|-------|-------|--------|
| basic | 100 | 1000 | month |
| pro | 1000 | 8000 | month |
| unlimited | unlimited | 50000 | month |

---

### analytics.ts

**Purpose:** Usage and revenue tracking

Provides developers with insights into their endpoints' performance.

**Endpoints:**

| Method | Path | Description |
|--------|------|-------------|
| GET | `/my-endpoints` | Aggregate stats for owned endpoints |
| GET | `/revenue` | Revenue dashboard with daily breakdown |
| GET | `/callers` | Top callers by address |
| POST | `/record-call` | Internal: record an API call |

**Query parameters:**
- `period` - Time period for revenue (e.g., `7d`, `30d`, `1m`)
- `endpoint` - Filter callers by endpoint ID

**Authentication:** Requires `X-Owner-Address` header.

---

### dev.ts

**Purpose:** Developer tools and onboarding

Makes it easy to build x402-compliant endpoints.

**Endpoints:**

| Method | Path | Description |
|--------|------|-------------|
| POST | `/generate-middleware` | Generate x402 middleware code |
| POST | `/test-endpoint` | Test URL for x402 compliance |
| GET | `/pricing-calculator` | Get pricing recommendations |
| GET | `/sdk/:language` | Get SDK info and examples |

**Middleware generation:**

Supports:
- TypeScript + Hono
- JavaScript + Express
- Python + Flask

**Compliance tests:**
1. Endpoint reachable
2. Returns 402 status
3. Contains payment amount
4. Has recipient address
5. Token type specified
6. CORS enabled

**Pricing calculator inputs:**
- `category` - utility, ai, blockchain, data, media
- `complexity` - simple, medium, complex, premium
- `token` - sBTC, STX, USDh

## Common Patterns

### 402 Response Format

```typescript
{
  error: "Payment Required",
  payment: {
    amount: number,
    token: "STX" | "sBTC" | "USDh",
    recipient: string,  // Stacks address
    memo: string
  }
}
```

### Owner Authentication

Routes requiring ownership use `X-Owner-Address` header:

```typescript
const owner = c.req.header("X-Owner-Address");
if (row.owner !== owner) {
  return c.json({ error: "Not authorized" }, 403);
}
```

### Payment Verification

Routes requiring payment check `X-Payment-Proof` header:

```typescript
const paymentProof = c.req.header("X-Payment-Proof");
if (!paymentProof) {
  return c.json({ /* 402 response */ }, 402);
}
```
