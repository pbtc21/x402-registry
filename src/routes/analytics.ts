/**
 * Analytics routes - Usage and revenue tracking
 *
 * Provides developers with insights into their endpoints:
 * - Call volumes and trends
 * - Revenue tracking
 * - Caller demographics
 */

import { Hono } from "hono";
import type { RegistryEnv } from "../types";

export const analytics = new Hono<{ Bindings: RegistryEnv }>();

// In-memory analytics store for PoC
const analyticsData = new Map<
  string,
  {
    calls: { timestamp: number; caller: string; responseTime: number; paid: number }[];
    revenue: { timestamp: number; amount: number; token: string; txId: string }[];
  }
>();

// Get stats for all your endpoints
analytics.get("/my-endpoints", (c) => {
  const owner = c.req.header("X-Owner-Address");

  if (!owner) {
    return c.json({ error: "X-Owner-Address header required" }, 401);
  }

  // Aggregate stats for all endpoints owned by this address
  const endpoints: any[] = [];

  analyticsData.forEach((data, endpointId) => {
    const last24h = Date.now() - 24 * 3600 * 1000;
    const calls24h = data.calls.filter((c) => c.timestamp > last24h);
    const revenue24h = data.revenue
      .filter((r) => r.timestamp > last24h)
      .reduce((sum, r) => sum + r.amount, 0);

    endpoints.push({
      endpointId,
      totalCalls: data.calls.length,
      calls24h: calls24h.length,
      totalRevenue: data.revenue.reduce((sum, r) => sum + r.amount, 0),
      revenue24h,
      avgResponseTime:
        data.calls.length > 0
          ? data.calls.reduce((sum, c) => sum + c.responseTime, 0) / data.calls.length
          : 0,
    });
  });

  return c.json({
    owner,
    endpoints,
    summary: {
      totalEndpoints: endpoints.length,
      totalCalls: endpoints.reduce((sum, e) => sum + e.totalCalls, 0),
      totalRevenue: endpoints.reduce((sum, e) => sum + e.totalRevenue, 0),
      calls24h: endpoints.reduce((sum, e) => sum + e.calls24h, 0),
      revenue24h: endpoints.reduce((sum, e) => sum + e.revenue24h, 0),
    },
  });
});

// Revenue dashboard
analytics.get("/revenue", (c) => {
  const owner = c.req.header("X-Owner-Address");
  const period = c.req.query("period") || "7d";

  if (!owner) {
    return c.json({ error: "X-Owner-Address header required" }, 401);
  }

  const periodMs = parsePeriod(period);
  const cutoff = Date.now() - periodMs;

  // Aggregate revenue data
  const revenueByDay = new Map<string, { sBTC: number; STX: number; USDh: number }>();
  const revenueByEndpoint = new Map<string, number>();

  analyticsData.forEach((data, endpointId) => {
    data.revenue
      .filter((r) => r.timestamp > cutoff)
      .forEach((r) => {
        // By day
        const day = new Date(r.timestamp).toISOString().split("T")[0];
        const dayData = revenueByDay.get(day) || { sBTC: 0, STX: 0, USDh: 0 };
        dayData[r.token as keyof typeof dayData] += r.amount;
        revenueByDay.set(day, dayData);

        // By endpoint
        revenueByEndpoint.set(endpointId, (revenueByEndpoint.get(endpointId) || 0) + r.amount);
      });
  });

  // Sort by day
  const dailyRevenue = Array.from(revenueByDay.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, amounts]) => ({ date, ...amounts }));

  // Top endpoints by revenue
  const topEndpoints = Array.from(revenueByEndpoint.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([endpointId, revenue]) => ({ endpointId, revenue }));

  return c.json({
    period,
    dailyRevenue,
    topEndpoints,
    totals: {
      sBTC: dailyRevenue.reduce((sum, d) => sum + d.sBTC, 0),
      STX: dailyRevenue.reduce((sum, d) => sum + d.STX, 0),
      USDh: dailyRevenue.reduce((sum, d) => sum + d.USDh, 0),
    },
  });
});

// Who's calling your APIs
analytics.get("/callers", (c) => {
  const owner = c.req.header("X-Owner-Address");
  const endpointId = c.req.query("endpoint");

  if (!owner) {
    return c.json({ error: "X-Owner-Address header required" }, 401);
  }

  const callerStats = new Map<
    string,
    { calls: number; totalPaid: number; avgResponseTime: number; lastSeen: number }
  >();

  const filterEndpoints = endpointId ? [endpointId] : Array.from(analyticsData.keys());

  filterEndpoints.forEach((epId) => {
    const data = analyticsData.get(epId);
    if (!data) return;

    data.calls.forEach((call) => {
      const existing = callerStats.get(call.caller) || {
        calls: 0,
        totalPaid: 0,
        avgResponseTime: 0,
        lastSeen: 0,
      };
      existing.calls++;
      existing.totalPaid += call.paid;
      existing.avgResponseTime =
        (existing.avgResponseTime * (existing.calls - 1) + call.responseTime) / existing.calls;
      existing.lastSeen = Math.max(existing.lastSeen, call.timestamp);
      callerStats.set(call.caller, existing);
    });
  });

  // Sort by calls
  const topCallers = Array.from(callerStats.entries())
    .sort(([, a], [, b]) => b.calls - a.calls)
    .slice(0, 50)
    .map(([address, stats]) => ({
      address,
      ...stats,
      lastSeen: new Date(stats.lastSeen).toISOString(),
    }));

  return c.json({
    endpoint: endpointId || "all",
    uniqueCallers: callerStats.size,
    topCallers,
  });
});

// Record a call (internal use)
analytics.post("/record-call", async (c) => {
  const body = await c.req.json();
  const { endpointId, caller, responseTime, paid } = body;

  if (!endpointId || !caller) {
    return c.json({ error: "Required: endpointId, caller" }, 400);
  }

  const data = analyticsData.get(endpointId) || { calls: [], revenue: [] };
  data.calls.push({
    timestamp: Date.now(),
    caller,
    responseTime: responseTime || 0,
    paid: paid || 0,
  });

  if (paid > 0) {
    data.revenue.push({
      timestamp: Date.now(),
      amount: paid,
      token: "sBTC",
      txId: "",
    });
  }

  analyticsData.set(endpointId, data);

  return c.json({ success: true });
});

// Helper functions

function parsePeriod(period: string): number {
  const match = period.match(/^(\d+)([hdwm])$/);
  if (!match) return 7 * 24 * 3600 * 1000; // default 7 days

  const value = parseInt(match[1]);
  const unit = match[2];

  switch (unit) {
    case "h":
      return value * 3600 * 1000;
    case "d":
      return value * 24 * 3600 * 1000;
    case "w":
      return value * 7 * 24 * 3600 * 1000;
    case "m":
      return value * 30 * 24 * 3600 * 1000;
    default:
      return 7 * 24 * 3600 * 1000;
  }
}
