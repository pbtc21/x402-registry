# x402 Registry

**The App Store for AI Agents**

A Cloudflare Worker platform for discovering, registering, and orchestrating x402-gated endpoints. Enables agent-to-agent payments and composable AI services on the Stacks blockchain.

## What is x402?

x402 is a payment protocol that uses HTTP status code 402 (Payment Required) to enable micropayments for API calls. When an endpoint requires payment, it returns a 402 response with payment details. Clients can then pay via the Stacks blockchain and include proof of payment in subsequent requests.

## Features

- **Endpoint Registry**: Discover and register x402-gated API endpoints
- **Agent Orchestration**: AI agents can discover, compose, and execute tasks across multiple services
- **Payment Infrastructure**: Create invoices, verify on-chain payments, manage subscriptions
- **Analytics Dashboard**: Track usage, revenue, and caller demographics
- **Developer Tools**: Generate middleware, test compliance, get pricing recommendations

## Stack

| Component | Technology |
|-----------|------------|
| Runtime | Cloudflare Workers |
| Framework | Hono |
| Database | Cloudflare D1 |
| Language | TypeScript |
| Package Manager | Bun |
| Blockchain | Stacks (mainnet) |

## Supported Tokens

- **sBTC** - Synthetic Bitcoin on Stacks
- **STX** - Stacks native token
- **USDh** - USD stablecoin

## Quick Start

### Installation

```bash
bun install
```

### Local Development

```bash
bun run wrangler dev
```

### Deploy

```bash
CLOUDFLARE_API_TOKEN="..." CI=true bun run wrangler deploy
```

## API Reference

### Registry Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/registry/register` | Register a new x402 endpoint |
| GET | `/registry/search` | Search endpoints by category, token, or query |
| GET | `/registry/discover` | Discover trending and featured endpoints |
| GET | `/registry/:id` | Get endpoint details |
| GET | `/registry/:id/stats` | Get endpoint statistics |
| PUT | `/registry/:id` | Update endpoint (owner only) |
| DELETE | `/registry/:id` | Delete endpoint (owner only) |

### Agent Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/agents` | List all registered agents |
| POST | `/agents/register` | Register a new AI agent |
| GET | `/agents/capabilities` | List available capabilities |
| POST | `/agents/recommend` | Get agent recommendations for a task |
| GET | `/agents/:id/openapi` | Get agent OpenAPI spec |
| POST | `/agents/execute` | Execute a task across agents |
| POST | `/agents/chain` | Chain multiple agents together |

### Payment Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/payments/create-invoice` | Create a payment invoice |
| POST | `/payments/verify` | Verify a payment on-chain |
| GET | `/payments/balance/:address` | Check wallet balance |
| POST | `/payments/deposit` | Deposit credits |
| POST | `/payments/subscribe` | Set up subscription |
| GET | `/payments/subscription/:id` | Get subscription status |

### Analytics Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/analytics/my-endpoints` | Get stats for owned endpoints |
| GET | `/analytics/revenue` | Revenue dashboard |
| GET | `/analytics/callers` | Caller demographics |

### Developer Tools

| Method | Path | Description |
|--------|------|-------------|
| POST | `/dev/generate-middleware` | Generate x402 middleware code |
| POST | `/dev/test-endpoint` | Test endpoint compliance |
| GET | `/dev/pricing-calculator` | Get pricing recommendations |
| GET | `/dev/sdk/:language` | Get SDK for a language |

## Usage Examples

### Register an Endpoint

```bash
curl -X POST https://x402-registry.example.workers.dev/registry/register \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://my-api.example.com/summarize",
    "name": "Text Summarizer",
    "description": "Summarize long text using AI",
    "owner": "SP...",
    "price": 1000,
    "token": "sBTC",
    "tags": ["ai", "text", "summarization"],
    "category": "ai"
  }'
```

### Search Endpoints

```bash
curl "https://x402-registry.example.workers.dev/registry/search?category=ai&token=sBTC"
```

### Execute a Task

```bash
curl -X POST https://x402-registry.example.workers.dev/agents/execute \
  -H "Content-Type: application/json" \
  -H "X-Payment-Proof: <txid>" \
  -d '{
    "task": "Summarize and translate this article",
    "budget": 5000,
    "token": "sBTC"
  }'
```

## Project Structure

```
x402-registry/
├── src/
│   ├── index.ts         # Main app entry, route mounting
│   ├── types.ts         # TypeScript interfaces
│   ├── frontend.ts      # HTML rendering for browser UI
│   └── routes/
│       ├── registry.ts  # Endpoint registration and discovery
│       ├── agents.ts    # Agent orchestration
│       ├── payments.ts  # Payment infrastructure
│       ├── analytics.ts # Usage tracking
│       └── dev.ts       # Developer tools
├── schema.sql           # D1 database schema
├── wrangler.toml        # Cloudflare configuration
└── package.json
```

## Database Schema

The registry uses Cloudflare D1 with two main tables:

- **endpoints**: Registered x402 endpoints with pricing, stats, and metadata
- **agents**: AI agents with capabilities, pricing models, and endpoint references

See `schema.sql` for full schema definition.

## Configuration

Environment variables in `wrangler.toml`:

| Variable | Description |
|----------|-------------|
| `REGISTRY_WALLET` | Stacks address for receiving platform fees |
| `PLATFORM_FEE_BPS` | Platform fee in basis points (1000 = 10%) |

## License

MIT
