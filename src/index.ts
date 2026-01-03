/**
 * x402 Registry - The App Store for AI Agents
 *
 * A platform for discovering, registering, and orchestrating x402-gated endpoints.
 * Enables agent-to-agent payments and composable AI services.
 */

import { Hono } from "hono";
import { cors } from "hono/cors";
import { registry } from "./routes/registry";
import { agents } from "./routes/agents";
import { payments } from "./routes/payments";
import { analytics } from "./routes/analytics";
import { dev } from "./routes/dev";

const app = new Hono();

app.use("*", cors());

// API info
app.get("/", (c) => {
  return c.json({
    name: "x402 Registry",
    version: "1.0.0",
    tagline: "The App Store for AI Agents",
    description: "Discover, register, and orchestrate x402-gated endpoints",
    endpoints: {
      "GET /": "API info",
      "GET /stats": "Platform statistics",

      // Registry
      "POST /registry/register": "Register your x402 endpoint",
      "GET /registry/search": "Search endpoints by tag/category",
      "GET /registry/discover": "Trending and featured endpoints",
      "GET /registry/:id": "Get endpoint details",
      "GET /registry/:id/stats": "Endpoint usage statistics",
      "DELETE /registry/:id": "Remove your endpoint",

      // Agents
      "GET /agents/capabilities": "What can agents do?",
      "POST /agents/recommend": "Find agents for a task",
      "GET /agents/:id/openapi": "Machine-readable spec",
      "POST /agents/execute": "Execute a task across agents",
      "POST /agents/chain": "Compose multiple agents",

      // Payments
      "POST /payments/create-invoice": "Create payment request",
      "POST /payments/verify": "Verify a payment",
      "GET /payments/balance/:address": "Check credit balance",
      "POST /payments/deposit": "Add credits",
      "POST /payments/subscribe": "Set up recurring payments",

      // Analytics
      "GET /analytics/my-endpoints": "Your endpoint stats",
      "GET /analytics/revenue": "Revenue dashboard",
      "GET /analytics/callers": "Who's calling your APIs",

      // Developer Tools
      "POST /dev/generate-middleware": "Generate x402 middleware code",
      "POST /dev/test-endpoint": "Validate your x402 setup",
      "GET /dev/pricing-calculator": "Optimal pricing suggestions",
    },
    tokens: ["STX", "sBTC", "USDh"],
    network: "stacks-mainnet",
  });
});

// Platform stats
app.get("/stats", (c) => {
  return c.json({
    totalEndpoints: 0,
    totalAgents: 0,
    totalCalls24h: 0,
    totalVolume24h: "0",
    topCategories: ["ai", "blockchain", "data", "utility"],
    featuredEndpoints: [],
  });
});

// Mount routes
app.route("/registry", registry);
app.route("/agents", agents);
app.route("/payments", payments);
app.route("/analytics", analytics);
app.route("/dev", dev);

export default app;
