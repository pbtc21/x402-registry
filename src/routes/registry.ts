/**
 * Registry routes - Register and discover x402 endpoints
 * Now with D1 persistence!
 */

import { Hono } from "hono";
import type { Endpoint, RegistryEnv } from "../types";

export const registry = new Hono<{ Bindings: RegistryEnv }>();

// Helper to convert DB row to Endpoint object
function rowToEndpoint(row: any): Endpoint {
  return {
    id: row.id,
    url: row.url,
    name: row.name,
    description: row.description || "",
    owner: row.owner,
    price: row.price,
    token: row.token,
    tags: JSON.parse(row.tags || "[]"),
    category: row.category || "utility",
    openApiSpec: row.open_api_spec,
    verified: Boolean(row.verified),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    stats: {
      totalCalls: row.total_calls || 0,
      calls24h: row.calls_24h || 0,
      revenue24h: row.revenue_24h || 0,
      avgResponseTime: row.avg_response_time || 0,
      uptime: row.uptime || 100,
      lastChecked: row.last_checked || new Date().toISOString(),
    },
  };
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

// Register a new endpoint
registry.post("/register", async (c) => {
  const body = await c.req.json();
  const { url, name, description, owner, price, token, tags, category, openApiSpec } = body;

  if (!url || !name || !owner || price === undefined || !token) {
    return c.json({ error: "Missing required fields: url, name, owner, price, token" }, 400);
  }

  const verification = await verifyX402Endpoint(url);
  const isVerified = verification.valid;
  const id = generateId();
  const now = new Date().toISOString();

  await c.env.DB.prepare(`
    INSERT INTO endpoints (id, url, name, description, owner, price, token, tags, category, open_api_spec, verified, created_at, updated_at, avg_response_time, uptime, last_checked)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id, url, name, description || "", owner, price, token,
    JSON.stringify(tags || []), category || "utility", openApiSpec || null,
    isVerified ? 1 : 0, now, now, verification.responseTime || 0, 100, now
  ).run();

  return c.json({
    success: true,
    endpoint: { id, url, name, verified: isVerified, registryUrl: `https://x402-registry.p-d07.workers.dev/registry/${id}` },
    message: "Endpoint registered successfully! It will appear in search results.",
  }, 201);
});

// Search endpoints
registry.get("/search", async (c) => {
  const category = c.req.query("category");
  const token = c.req.query("token");
  const q = c.req.query("q");
  const limit = parseInt(c.req.query("limit") || "20");
  const offset = parseInt(c.req.query("offset") || "0");

  let sql = "SELECT * FROM endpoints WHERE 1=1";
  const params: any[] = [];

  if (category) {
    sql += " AND category = ?";
    params.push(category);
  }
  if (token) {
    sql += " AND token = ?";
    params.push(token);
  }
  if (q) {
    sql += " AND (name LIKE ? OR description LIKE ?)";
    params.push(`%${q}%`, `%${q}%`);
  }

  sql += " ORDER BY calls_24h DESC LIMIT ? OFFSET ?";
  params.push(limit, offset);

  const results = await c.env.DB.prepare(sql).bind(...params).all();
  const countResult = await c.env.DB.prepare("SELECT COUNT(*) as total FROM endpoints").first<{ total: number }>();

  return c.json({
    results: (results.results || []).map((row: any) => summarizeEndpoint(rowToEndpoint(row))),
    total: countResult?.total || 0,
    limit,
    offset,
    hasMore: offset + limit < (countResult?.total || 0),
  });
});

// Discover trending/featured endpoints
registry.get("/discover", async (c) => {
  const trending = await c.env.DB.prepare("SELECT * FROM endpoints ORDER BY calls_24h DESC LIMIT 10").all();
  const newest = await c.env.DB.prepare("SELECT * FROM endpoints ORDER BY created_at DESC LIMIT 10").all();
  const categories = await c.env.DB.prepare("SELECT DISTINCT category FROM endpoints").all();

  const byCategory: Record<string, any[]> = {};
  for (const cat of (categories.results || [])) {
    const catEndpoints = await c.env.DB.prepare("SELECT * FROM endpoints WHERE category = ? LIMIT 5").bind((cat as any).category).all();
    byCategory[(cat as any).category] = (catEndpoints.results || []).map((row: any) => summarizeEndpoint(rowToEndpoint(row)));
  }

  const allEndpoints = (trending.results || []).map((row: any) => rowToEndpoint(row));

  return c.json({
    trending: allEndpoints.map(summarizeEndpoint),
    new: (newest.results || []).map((row: any) => summarizeEndpoint(rowToEndpoint(row))),
    byCategory,
    totalEndpoints: allEndpoints.length,
    categories: (categories.results || []).map((c: any) => c.category),
  });
});

// Get endpoint details
registry.get("/:id", async (c) => {
  const id = c.req.param("id");
  const row = await c.env.DB.prepare("SELECT * FROM endpoints WHERE id = ?").bind(id).first();

  if (!row) {
    return c.json({ error: "Endpoint not found" }, 404);
  }

  return c.json(rowToEndpoint(row));
});

// Get endpoint stats
registry.get("/:id/stats", async (c) => {
  const id = c.req.param("id");
  const row = await c.env.DB.prepare("SELECT * FROM endpoints WHERE id = ?").bind(id).first();

  if (!row) {
    return c.json({ error: "Endpoint not found" }, 404);
  }

  const endpoint = rowToEndpoint(row);
  return c.json({
    endpointId: id,
    name: endpoint.name,
    stats: endpoint.stats,
    pricing: { price: endpoint.price, token: endpoint.token },
  });
});

// Delete endpoint (owner only)
registry.delete("/:id", async (c) => {
  const id = c.req.param("id");
  const owner = c.req.header("X-Owner-Address");

  const row = await c.env.DB.prepare("SELECT * FROM endpoints WHERE id = ?").bind(id).first();
  if (!row) return c.json({ error: "Endpoint not found" }, 404);
  if ((row as any).owner !== owner) return c.json({ error: "Not authorized" }, 403);

  await c.env.DB.prepare("DELETE FROM endpoints WHERE id = ?").bind(id).run();
  return c.json({ success: true, message: "Endpoint removed" });
});

// Update endpoint
registry.put("/:id", async (c) => {
  const id = c.req.param("id");
  const owner = c.req.header("X-Owner-Address");
  const updates = await c.req.json();

  const row = await c.env.DB.prepare("SELECT * FROM endpoints WHERE id = ?").bind(id).first();
  if (!row) return c.json({ error: "Endpoint not found" }, 404);
  if ((row as any).owner !== owner) return c.json({ error: "Not authorized" }, 403);

  const allowedUpdates = ["name", "description", "price", "tags", "category"];
  const setClauses: string[] = ["updated_at = ?"];
  const params: any[] = [new Date().toISOString()];

  for (const key of allowedUpdates) {
    if (updates[key] !== undefined) {
      const dbKey = key === "openApiSpec" ? "open_api_spec" : key;
      setClauses.push(`${dbKey} = ?`);
      params.push(key === "tags" ? JSON.stringify(updates[key]) : updates[key]);
    }
  }

  params.push(id);
  await c.env.DB.prepare(`UPDATE endpoints SET ${setClauses.join(", ")} WHERE id = ?`).bind(...params).run();

  const updated = await c.env.DB.prepare("SELECT * FROM endpoints WHERE id = ?").bind(id).first();
  return c.json({ success: true, endpoint: summarizeEndpoint(rowToEndpoint(updated)) });
});

// Helper functions
async function verifyX402Endpoint(url: string): Promise<{ valid: boolean; error?: string; responseTime?: number }> {
  try {
    const start = Date.now();
    const response = await fetch(url, { method: "GET", headers: { Accept: "application/json" } });
    const responseTime = Date.now() - start;

    if (response.status === 402) {
      const body = await response.json().catch(() => ({}));
      if (body.maxAmountRequired || body.amount || body.payTo || body.payment) {
        return { valid: true, responseTime };
      }
      return { valid: false, error: "402 response missing payment requirements", responseTime };
    }

    if (response.status === 200) return { valid: true, responseTime };
    return { valid: false, error: `Expected 402 status, got ${response.status}`, responseTime };
  } catch (error: any) {
    return { valid: false, error: `Failed to reach endpoint: ${error.message}` };
  }
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

// Export for backward compatibility with index.ts
export const endpoints = new Map<string, Endpoint>();
