/**
 * Registry routes - Register and discover x402 endpoints
 */

import { Hono } from "hono";
import type { Endpoint, RegistryEnv } from "../types";

export const registry = new Hono<{ Bindings: RegistryEnv }>();

// In-memory store for PoC (replace with D1 in production)
const endpoints = new Map<string, Endpoint>();

// Register a new endpoint
registry.post("/register", async (c) => {
  const body = await c.req.json();

  const { url, name, description, owner, price, token, tags, category, openApiSpec } = body;

  // Validate required fields
  if (!url || !name || !owner || price === undefined || !token) {
    return c.json({ error: "Missing required fields: url, name, owner, price, token" }, 400);
  }

  // Verify the endpoint is x402 compliant (best effort - CF worker-to-worker can be flaky)
  const verification = await verifyX402Endpoint(url);
  // Allow registration even if verification fails - mark as unverified
  const isVerified = verification.valid;

  const id = generateId();
  const endpoint: Endpoint = {
    id,
    url,
    name,
    description: description || "",
    owner,
    price,
    token,
    tags: tags || [],
    category: category || "utility",
    openApiSpec,
    verified: isVerified,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    stats: {
      totalCalls: 0,
      calls24h: 0,
      revenue24h: 0,
      avgResponseTime: verification.responseTime || 0,
      uptime: 100,
      lastChecked: new Date().toISOString(),
    },
  };

  endpoints.set(id, endpoint);

  return c.json({
    success: true,
    endpoint: {
      id: endpoint.id,
      url: endpoint.url,
      name: endpoint.name,
      verified: endpoint.verified,
      registryUrl: `https://x402.registry/endpoint/${id}`,
    },
    message: "Endpoint registered successfully! It will appear in search results.",
  }, 201);
});

// Search endpoints
registry.get("/search", (c) => {
  const tag = c.req.query("tag");
  const category = c.req.query("category");
  const token = c.req.query("token");
  const q = c.req.query("q");
  const limit = parseInt(c.req.query("limit") || "20");
  const offset = parseInt(c.req.query("offset") || "0");

  let results = Array.from(endpoints.values());

  // Filter by tag
  if (tag) {
    results = results.filter((e) => e.tags.includes(tag));
  }

  // Filter by category
  if (category) {
    results = results.filter((e) => e.category === category);
  }

  // Filter by token
  if (token) {
    results = results.filter((e) => e.token === token);
  }

  // Search query
  if (q) {
    const query = q.toLowerCase();
    results = results.filter(
      (e) =>
        e.name.toLowerCase().includes(query) ||
        e.description.toLowerCase().includes(query) ||
        e.tags.some((t) => t.toLowerCase().includes(query))
    );
  }

  // Sort by popularity (calls24h)
  results.sort((a, b) => b.stats.calls24h - a.stats.calls24h);

  // Paginate
  const total = results.length;
  results = results.slice(offset, offset + limit);

  return c.json({
    results: results.map(summarizeEndpoint),
    total,
    limit,
    offset,
    hasMore: offset + limit < total,
  });
});

// Discover trending/featured endpoints
registry.get("/discover", (c) => {
  const allEndpoints = Array.from(endpoints.values());

  // Trending: most calls in 24h
  const trending = [...allEndpoints]
    .sort((a, b) => b.stats.calls24h - a.stats.calls24h)
    .slice(0, 10);

  // New: recently added
  const newest = [...allEndpoints]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10);

  // By category
  const categories = new Map<string, Endpoint[]>();
  allEndpoints.forEach((e) => {
    const cat = categories.get(e.category) || [];
    cat.push(e);
    categories.set(e.category, cat);
  });

  const byCategory: Record<string, any[]> = {};
  categories.forEach((eps, cat) => {
    byCategory[cat] = eps.slice(0, 5).map(summarizeEndpoint);
  });

  return c.json({
    trending: trending.map(summarizeEndpoint),
    new: newest.map(summarizeEndpoint),
    byCategory,
    totalEndpoints: allEndpoints.length,
    categories: Array.from(categories.keys()),
  });
});

// Get endpoint details
registry.get("/:id", (c) => {
  const id = c.req.param("id");
  const endpoint = endpoints.get(id);

  if (!endpoint) {
    return c.json({ error: "Endpoint not found" }, 404);
  }

  return c.json(endpoint);
});

// Get endpoint stats
registry.get("/:id/stats", (c) => {
  const id = c.req.param("id");
  const endpoint = endpoints.get(id);

  if (!endpoint) {
    return c.json({ error: "Endpoint not found" }, 404);
  }

  return c.json({
    endpointId: id,
    name: endpoint.name,
    stats: endpoint.stats,
    pricing: {
      price: endpoint.price,
      token: endpoint.token,
    },
  });
});

// Delete endpoint (owner only)
registry.delete("/:id", async (c) => {
  const id = c.req.param("id");
  const owner = c.req.header("X-Owner-Address");

  const endpoint = endpoints.get(id);

  if (!endpoint) {
    return c.json({ error: "Endpoint not found" }, 404);
  }

  if (endpoint.owner !== owner) {
    return c.json({ error: "Not authorized" }, 403);
  }

  endpoints.delete(id);

  return c.json({ success: true, message: "Endpoint removed" });
});

// Update endpoint
registry.put("/:id", async (c) => {
  const id = c.req.param("id");
  const owner = c.req.header("X-Owner-Address");
  const updates = await c.req.json();

  const endpoint = endpoints.get(id);

  if (!endpoint) {
    return c.json({ error: "Endpoint not found" }, 404);
  }

  if (endpoint.owner !== owner) {
    return c.json({ error: "Not authorized" }, 403);
  }

  // Only allow updating certain fields
  const allowedUpdates = ["name", "description", "price", "tags", "category", "openApiSpec"];
  for (const key of allowedUpdates) {
    if (updates[key] !== undefined) {
      (endpoint as any)[key] = updates[key];
    }
  }
  endpoint.updatedAt = new Date().toISOString();

  endpoints.set(id, endpoint);

  return c.json({ success: true, endpoint: summarizeEndpoint(endpoint) });
});

// Helper functions

async function verifyX402Endpoint(url: string): Promise<{ valid: boolean; error?: string; responseTime?: number }> {
  try {
    const start = Date.now();
    const response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
    });
    const responseTime = Date.now() - start;

    // Should return 402 Payment Required
    if (response.status === 402) {
      const body = await response.json().catch(() => ({}));

      // Check for required x402 fields
      if (body.maxAmountRequired || body.amount || body.payTo || body.payment) {
        return { valid: true, responseTime };
      }

      return {
        valid: false,
        error: "402 response missing payment requirements (maxAmountRequired, payTo)",
        responseTime,
      };
    }

    // Some endpoints might be GET with query params that make it paid
    // Accept 200 if they claim to be x402
    if (response.status === 200) {
      return {
        valid: true,
        responseTime,
      };
    }

    return {
      valid: false,
      error: `Expected 402 status, got ${response.status}`,
      responseTime,
    };
  } catch (error: any) {
    return {
      valid: false,
      error: `Failed to reach endpoint: ${error.message}`,
    };
  }
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

function summarizeEndpoint(e: Endpoint) {
  return {
    id: e.id,
    url: e.url,
    name: e.name,
    description: e.description,
    price: e.price,
    token: e.token,
    tags: e.tags,
    category: e.category,
    verified: e.verified,
    calls24h: e.stats.calls24h,
    uptime: e.stats.uptime,
  };
}
