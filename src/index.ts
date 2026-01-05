/**
 * x402 Registry - The App Store for AI Agents
 *
 * A platform for discovering, registering, and orchestrating x402-gated endpoints.
 * Enables agent-to-agent payments and composable AI services.
 */

import { Hono } from "hono";
import { cors } from "hono/cors";
import { registry } from "./routes/registry";
import { agents, agentRegistry } from "./routes/agents";
import { payments } from "./routes/payments";
import { analytics } from "./routes/analytics";
import { dev } from "./routes/dev";
import { renderHomePage } from "./frontend";
import type { RegistryEnv } from "./types";

const app = new Hono<{ Bindings: RegistryEnv }>();

app.use("*", cors());

// Homepage - serve HTML for browsers, JSON for API clients
app.get("/", async (c) => {
  const accept = c.req.header("Accept") || "";
  const isBrowser = accept.includes("text/html");

  if (isBrowser) {
    const results = await c.env.DB.prepare("SELECT * FROM endpoints ORDER BY calls_24h DESC").all();
    const endpointList = (results.results || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      price: row.price,
      token: row.token,
      tags: JSON.parse(row.tags || "[]"),
      category: row.category,
      verified: Boolean(row.verified),
      calls24h: row.calls_24h || 0,
    }));

    const agentList = Array.from(agentRegistry.values()).map(a => ({
      id: a.id,
      name: a.name,
      description: a.description,
      capabilities: a.capabilities,
      pricing: a.pricing,
    }));

    const html = renderHomePage({
      endpoints: endpointList,
      agents: agentList,
      stats: { totalEndpoints: endpointList.length, totalAgents: agentList.length },
    });

    return c.html(html);
  }

  return c.json({
    name: "x402 Registry",
    version: "1.0.0",
    tagline: "The App Store for AI Agents",
    description: "Discover, register, and orchestrate x402-gated endpoints",
    endpoints: {
      "GET /": "API info (HTML for browsers)",
      "GET /stats": "Platform statistics",
      "POST /registry/register": "Register your x402 endpoint",
      "GET /registry/search": "Search endpoints by tag/category",
      "GET /registry/discover": "Trending and featured endpoints",
      "GET /agents": "List all agents",
      "POST /agents/register": "Register an agent",
      "POST /agents/execute": "Execute a task across agents",
      "POST /payments/verify": "Verify a payment",
      "GET /dev/pricing-calculator": "Optimal pricing suggestions",
    },
    tokens: ["STX", "sBTC", "USDh"],
    network: "stacks-mainnet",
  });
});

// Platform stats
app.get("/stats", async (c) => {
  const countResult = await c.env.DB.prepare("SELECT COUNT(*) as total FROM endpoints").first<{ total: number }>();
  const callsResult = await c.env.DB.prepare("SELECT SUM(calls_24h) as calls FROM endpoints").first<{ calls: number }>();
  const categories = await c.env.DB.prepare("SELECT DISTINCT category FROM endpoints").all();

  return c.json({
    totalEndpoints: countResult?.total || 0,
    totalAgents: agentRegistry.size,
    totalCalls24h: callsResult?.calls || 0,
    totalVolume24h: "0",
    topCategories: (categories.results || []).map((c: any) => c.category),
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
