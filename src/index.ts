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
import { renderHomePage, renderMyEndpointsPage } from "./frontend";
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

// My Endpoints dashboard
app.get("/my/:address", async (c) => {
  const address = c.req.param("address");

  const results = await c.env.DB.prepare(
    "SELECT * FROM endpoints WHERE owner = ? ORDER BY calls_24h DESC"
  ).bind(address).all();

  const endpointList = (results.results || []).map((row: any) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    url: row.url,
    price: row.price,
    token: row.token,
    tags: JSON.parse(row.tags || "[]"),
    category: row.category,
    verified: Boolean(row.verified),
    calls24h: row.calls_24h || 0,
  }));

  const html = renderMyEndpointsPage({
    endpoints: endpointList,
    address,
    stats: { totalEndpoints: endpointList.length },
  });

  return c.html(html);
});

// x402 discovery - root level discovery for all paid endpoints
app.get("/.well-known/x402", async (c) => {
  return c.json({
    x402Version: 1,
    name: "x402 Registry",
    description: "The App Store for AI Agents - discover, register, and orchestrate x402-gated endpoints",
    network: "stacks",
    accepts: [
      {
        scheme: "exact",
        network: "stacks",
        maxAmountRequired: "1000",
        resource: "/registry/register",
        description: "Register your x402 endpoint in the registry",
        mimeType: "application/json",
        payTo: "SPKH9AWG0ENZ87J1X0PBD4HETP22G8W22AFNVF8K",
        maxTimeoutSeconds: 300,
        asset: "STX",
        outputSchema: {
          input: {
            type: "object",
            properties: {
              url: { type: "string", description: "URL of the x402 endpoint" },
              name: { type: "string", description: "Human-readable name" },
              description: { type: "string", description: "What the endpoint does" },
              owner: { type: "string", description: "Stacks address of owner" },
              price: { type: "number", description: "Price per call in smallest unit" },
              token: { type: "string", enum: ["STX", "sBTC", "USDh"] },
              tags: { type: "array", items: { type: "string" } },
              category: { type: "string" },
            },
            required: ["url", "name", "owner", "price", "token"],
          },
          output: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              endpoint: { type: "object" },
              message: { type: "string" },
            },
          },
        },
      },
      {
        scheme: "exact",
        network: "stacks",
        maxAmountRequired: "variable",
        resource: "/agents/execute",
        description: "Execute a task across multiple AI agents",
        mimeType: "application/json",
        payTo: "SPKH9AWG0ENZ87J1X0PBD4HETP22G8W22AFNVF8K",
        maxTimeoutSeconds: 600,
        asset: "STX",
        outputSchema: {
          input: {
            type: "object",
            properties: {
              task: { type: "string", description: "Task to execute" },
              budget: { type: "number", description: "Maximum budget in smallest unit" },
              token: { type: "string", enum: ["STX", "sBTC", "USDh"] },
              preferredAgents: { type: "array", items: { type: "string" } },
              timeout: { type: "number" },
            },
            required: ["task", "budget", "token"],
          },
          output: {
            type: "object",
            properties: {
              id: { type: "string" },
              status: { type: "string" },
              result: { type: "object" },
              agentsUsed: { type: "array" },
              totalCost: { type: "number" },
            },
          },
        },
      },
      {
        scheme: "exact",
        network: "stacks",
        maxAmountRequired: "variable",
        resource: "/agents/chain",
        description: "Chain multiple agents in sequence",
        mimeType: "application/json",
        payTo: "SPKH9AWG0ENZ87J1X0PBD4HETP22G8W22AFNVF8K",
        maxTimeoutSeconds: 900,
        asset: "STX",
        outputSchema: {
          input: {
            type: "object",
            properties: {
              steps: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    agentId: { type: "string" },
                    action: { type: "string" },
                    inputFrom: { type: "string" },
                  },
                },
              },
              budget: { type: "number" },
              token: { type: "string" },
            },
            required: ["steps"],
          },
          output: {
            type: "object",
            properties: {
              id: { type: "string" },
              status: { type: "string" },
              chain: { type: "array" },
              results: { type: "array" },
              totalCost: { type: "number" },
            },
          },
        },
      },
      {
        scheme: "exact",
        network: "stacks",
        maxAmountRequired: "50000",
        resource: "/payments/subscribe",
        description: "Subscribe to an endpoint for discounted bulk access",
        mimeType: "application/json",
        payTo: "SPKH9AWG0ENZ87J1X0PBD4HETP22G8W22AFNVF8K",
        maxTimeoutSeconds: 300,
        asset: "STX",
        outputSchema: {
          input: {
            type: "object",
            properties: {
              subscriber: { type: "string", description: "Stacks address" },
              endpointId: { type: "string" },
              plan: { type: "string", enum: ["basic", "pro", "unlimited"] },
              token: { type: "string" },
            },
            required: ["subscriber", "endpointId", "plan"],
          },
          output: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              subscription: { type: "object" },
            },
          },
        },
      },
    ],
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
