/**
 * x402 Registry - The App Store for AI Agents
 *
 * A platform for discovering, registering, and orchestrating x402-gated endpoints.
 * Enables agent-to-agent payments and composable AI services.
 */

import { Hono } from "hono";
import { cors } from "hono/cors";
import { registry, endpoints } from "./routes/registry";
import { agents, agentRegistry } from "./routes/agents";
import { payments } from "./routes/payments";
import { analytics } from "./routes/analytics";
import { dev } from "./routes/dev";
import { renderHomePage } from "./frontend";

const app = new Hono();

app.use("*", cors());

// Homepage - serve HTML for browsers, JSON for API clients
app.get("/", (c) => {
  const accept = c.req.header("Accept") || "";
  const isBrowser = accept.includes("text/html");

  if (isBrowser) {
    const endpointList = Array.from(endpoints.values()).map(e => ({
      id: e.id,
      name: e.name,
      description: e.description,
      price: e.price,
      token: e.token,
      tags: e.tags,
      category: e.category,
      verified: e.verified,
      calls24h: e.stats.calls24h,
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
