/**
 * Core types for x402 Registry
 */

export interface Endpoint {
  id: string;
  url: string;
  name: string;
  description: string;
  owner: string; // Stacks address
  price: number; // in smallest unit (sats for sBTC)
  token: "STX" | "sBTC" | "USDh";
  tags: string[];
  category: string;
  openApiSpec?: string; // URL to OpenAPI spec
  verified: boolean;
  createdAt: string;
  updatedAt: string;
  stats: EndpointStats;
}

export interface EndpointStats {
  totalCalls: number;
  calls24h: number;
  revenue24h: number;
  avgResponseTime: number;
  uptime: number; // percentage
  lastChecked: string;
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  endpoints: string[]; // endpoint IDs this agent uses
  owner: string;
  pricing: {
    model: "per-call" | "per-token" | "flat";
    basePrice: number;
    token: "STX" | "sBTC" | "USDh";
  };
}

export interface PaymentInvoice {
  id: string;
  amount: number;
  token: "STX" | "sBTC" | "USDh";
  recipient: string;
  memo: string;
  expiresAt: string;
  status: "pending" | "paid" | "expired";
  txId?: string;
}

export interface ExecutionRequest {
  task: string;
  budget: number;
  token: "STX" | "sBTC" | "USDh";
  preferredAgents?: string[];
  timeout?: number;
}

export interface ExecutionResult {
  id: string;
  task: string;
  status: "completed" | "failed" | "partial";
  result: any;
  agentsUsed: {
    agentId: string;
    endpoint: string;
    cost: number;
    responseTime: number;
  }[];
  totalCost: number;
  platformFee: number;
  duration: number;
}

export interface RegistryEnv {
  DB: D1Database;
  REGISTRY_WALLET: string;
  PLATFORM_FEE_BPS: string; // basis points (1000 = 10%)
}
