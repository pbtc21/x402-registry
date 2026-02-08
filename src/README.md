# src/

Core application source code for the x402 Registry.

## Files

### index.ts

Main application entry point. Creates the Hono app, configures CORS, and mounts all route modules.

**Key responsibilities:**
- Initialize Hono app with environment bindings
- Serve homepage (HTML for browsers, JSON for API clients)
- Mount route modules at their respective paths
- Provide platform statistics endpoint

**Routes mounted:**
- `/registry` - Endpoint registration and discovery
- `/agents` - Agent orchestration
- `/payments` - Payment infrastructure
- `/analytics` - Usage tracking
- `/dev` - Developer tools

### types.ts

TypeScript interfaces defining the core data structures:

| Interface | Description |
|-----------|-------------|
| `Endpoint` | Registered x402 endpoint with URL, pricing, stats |
| `EndpointStats` | Usage metrics (calls, revenue, response time, uptime) |
| `Agent` | AI agent with capabilities, endpoints, pricing model |
| `PaymentInvoice` | Invoice for tracking payments |
| `ExecutionRequest` | Request to execute a task across agents |
| `ExecutionResult` | Result of task execution |
| `RegistryEnv` | Cloudflare Worker environment bindings |

### frontend.ts

Server-side HTML rendering for the browser UI.

**Features:**
- Responsive dark theme design
- Endpoint cards with pricing, tags, verification status
- Agent cards with capabilities and pricing
- API reference quick view
- Stats dashboard

**Function:** `renderHomePage(data)` - Generates complete HTML page with endpoints, agents, and stats.

## Architecture

```
Browser Request
       │
       ▼
   index.ts
       │
       ├── Accept: text/html? ──► frontend.ts (render HTML)
       │
       └── Accept: application/json? ──► JSON response
                │
                ▼
        routes/*.ts (API handlers)
                │
                ▼
           D1 Database
```

## Environment Bindings

The `RegistryEnv` interface defines available bindings:

```typescript
interface RegistryEnv {
  DB: D1Database;           // Cloudflare D1 database
  REGISTRY_WALLET: string;  // Platform wallet address
  PLATFORM_FEE_BPS: string; // Fee in basis points
}
```
