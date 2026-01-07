/**
 * Agent routes - AI agent discovery and orchestration
 *
 * This is the killer feature: agents can discover other agents,
 * compose them, and execute complex tasks across multiple services.
 */

import { Hono } from "hono";
import type { Agent, ExecutionRequest, ExecutionResult, RegistryEnv } from "../types";

export const agents = new Hono<{ Bindings: RegistryEnv }>();

// In-memory store for PoC
export const agentRegistry = new Map<string, Agent>();

// Capability index for fast lookup
const capabilityIndex = new Map<string, Set<string>>(); // capability -> agent IDs

// Seed data
agentRegistry.set("sbtc-yield-agent", {
  id: "sbtc-yield-agent",
  name: "sBTC Yield Agent",
  description: "Autonomous DeFi agent for sBTC yield optimization. Deposits to vault, monitors positions, and executes looping strategies on Zest Protocol.",
  capabilities: ["defi", "yield-farming", "lending", "blockchain-query", "data-transform"],
  endpoints: ["https://vault.pbtc21.dev"],
  owner: "SP2QXPFF4M72QYZWXE7S5321XJDJ2DD32DGEMN5QA",
  pricing: { model: "per-call", basePrice: 500, token: "sBTC" },
});
// Index capabilities
["defi", "yield-farming", "lending", "blockchain-query", "data-transform"].forEach(cap => {
  capabilityIndex.set(cap, new Set(["sbtc-yield-agent"]));
});

// What can agents do?
agents.get("/capabilities", (c) => {
  const allCapabilities = Array.from(capabilityIndex.keys()).sort();

  const capabilityDetails = allCapabilities.map((cap) => {
    const agentIds = capabilityIndex.get(cap) || new Set();
    return {
      capability: cap,
      agentCount: agentIds.size,
      description: getCapabilityDescription(cap),
    };
  });

  return c.json({
    totalCapabilities: allCapabilities.length,
    totalAgents: agentRegistry.size,
    capabilities: capabilityDetails,
    categories: [
      { name: "ai", description: "AI/ML services (summarization, generation, analysis)" },
      { name: "blockchain", description: "Blockchain queries and transactions" },
      { name: "data", description: "Data transformation and processing" },
      { name: "web", description: "Web scraping and API calls" },
      { name: "media", description: "Image, audio, video processing" },
      { name: "finance", description: "Pricing, payments, trading" },
    ],
  });
});

// Find agents for a task
agents.post("/recommend", async (c) => {
  const body = await c.req.json();
  const { task, budget, token, capabilities } = body;

  if (!task) {
    return c.json({ error: "Task description required" }, 400);
  }

  // Extract capabilities needed from task description
  const neededCapabilities = capabilities || inferCapabilities(task);

  // Find agents that match
  const matchingAgents: { agent: Agent; score: number; matchedCapabilities: string[] }[] = [];

  agentRegistry.forEach((agent) => {
    const matched = agent.capabilities.filter((cap) => neededCapabilities.includes(cap));
    if (matched.length > 0) {
      matchingAgents.push({
        agent,
        score: matched.length / neededCapabilities.length,
        matchedCapabilities: matched,
      });
    }
  });

  // Sort by score and filter by budget if provided
  matchingAgents.sort((a, b) => b.score - a.score);

  const recommendations = matchingAgents
    .filter((m) => !budget || m.agent.pricing.basePrice <= budget)
    .map((m) => ({
      id: m.agent.id,
      name: m.agent.name,
      description: m.agent.description,
      matchScore: Math.round(m.score * 100),
      matchedCapabilities: m.matchedCapabilities,
      pricing: m.agent.pricing,
    }));

  // Build an execution plan if we have multiple agents
  const executionPlan = buildExecutionPlan(task, recommendations);

  return c.json({
    task,
    inferredCapabilities: neededCapabilities,
    recommendations: recommendations.slice(0, 10),
    executionPlan,
    estimatedCost: executionPlan.totalCost,
  });
});

// Get agent's OpenAPI spec (machine-readable)
agents.get("/:id/openapi", (c) => {
  const id = c.req.param("id");
  const agent = agentRegistry.get(id);

  if (!agent) {
    return c.json({ error: "Agent not found" }, 404);
  }

  // Generate OpenAPI spec for this agent
  const spec = {
    openapi: "3.0.0",
    info: {
      title: agent.name,
      description: agent.description,
      version: "1.0.0",
    },
    servers: [{ url: "https://x402.registry/agents" }],
    paths: {
      [`/${agent.id}/execute`]: {
        post: {
          summary: `Execute ${agent.name}`,
          description: agent.description,
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    task: { type: "string" },
                    params: { type: "object" },
                  },
                },
              },
            },
          },
          responses: {
            "200": { description: "Successful execution" },
            "402": { description: "Payment required" },
          },
        },
      },
    },
    "x-capabilities": agent.capabilities,
    "x-pricing": agent.pricing,
    "x-payment": {
      required: true,
      token: agent.pricing.token,
      amount: agent.pricing.basePrice,
    },
  };

  return c.json(spec);
});

// Execute a task (the killer feature)
agents.post("/execute", async (c) => {
  const body = await c.req.json() as ExecutionRequest;
  const { task, budget, token, preferredAgents, timeout } = body;

  if (!task || !budget || !token) {
    return c.json({ error: "Required: task, budget, token" }, 400);
  }

  // Check payment
  const paymentProof = c.req.header("X-Payment-Proof");
  if (!paymentProof) {
    // Return 402 with payment requirements
    const platformFee = Math.ceil(budget * 0.1); // 10% platform fee
    return c.json(
      {
        error: "Payment Required",
        payment: {
          amount: budget + platformFee,
          token,
          recipient: "SP2QXPFF4M72QYZWXE7S5321XJDJ2DD32DGEMN5QA", // Registry wallet
          memo: `execute:${generateExecutionId()}`,
          breakdown: {
            agentBudget: budget,
            platformFee,
            total: budget + platformFee,
          },
        },
        task,
        estimatedAgents: 3,
      },
      402
    );
  }

  // Simulate execution (in production, this would orchestrate real agents)
  const executionId = generateExecutionId();
  const startTime = Date.now();

  // Find best agents for the task
  const capabilities = inferCapabilities(task);
  const selectedAgents = selectAgentsForTask(capabilities, budget, preferredAgents);

  // Simulate calling each agent
  const agentResults: ExecutionResult["agentsUsed"] = [];
  let remainingBudget = budget;

  for (const agent of selectedAgents) {
    if (remainingBudget < agent.pricing.basePrice) break;

    agentResults.push({
      agentId: agent.id,
      endpoint: agent.endpoints[0] || "internal",
      cost: agent.pricing.basePrice,
      responseTime: Math.random() * 500 + 100,
    });

    remainingBudget -= agent.pricing.basePrice;
  }

  const totalCost = agentResults.reduce((sum, a) => sum + a.cost, 0);
  const platformFee = Math.ceil(totalCost * 0.1);

  const result: ExecutionResult = {
    id: executionId,
    task,
    status: "completed",
    result: {
      summary: `Executed task "${task}" using ${agentResults.length} agents`,
      output: "This is a PoC - real execution would return actual results",
      confidence: 0.85,
    },
    agentsUsed: agentResults,
    totalCost,
    platformFee,
    duration: Date.now() - startTime,
  };

  return c.json(result);
});

// Chain multiple agents
agents.post("/chain", async (c) => {
  const body = await c.req.json();
  const { steps, budget, token } = body;

  if (!steps || !Array.isArray(steps) || steps.length === 0) {
    return c.json({ error: "Steps array required" }, 400);
  }

  // Validate chain
  const chainPlan = steps.map((step: any, index: number) => {
    const agent = agentRegistry.get(step.agentId);
    return {
      step: index + 1,
      agentId: step.agentId,
      agentName: agent?.name || "Unknown",
      action: step.action,
      estimatedCost: agent?.pricing.basePrice || 0,
      inputFrom: step.inputFrom || (index > 0 ? `step${index}` : "user"),
    };
  });

  const totalEstimatedCost = chainPlan.reduce((sum, s) => sum + s.estimatedCost, 0);
  const platformFee = Math.ceil(totalEstimatedCost * 0.1);

  // Check payment
  const paymentProof = c.req.header("X-Payment-Proof");
  if (!paymentProof) {
    return c.json(
      {
        error: "Payment Required",
        payment: {
          amount: totalEstimatedCost + platformFee,
          token: token || "sBTC",
          recipient: "SP2QXPFF4M72QYZWXE7S5321XJDJ2DD32DGEMN5QA",
          memo: `chain:${generateExecutionId()}`,
        },
        chain: chainPlan,
        totalSteps: steps.length,
      },
      402
    );
  }

  // Execute chain (simulated)
  return c.json({
    id: generateExecutionId(),
    status: "completed",
    chain: chainPlan,
    results: chainPlan.map((step) => ({
      step: step.step,
      status: "completed",
      output: `Result from ${step.agentName}`,
    })),
    totalCost: totalEstimatedCost,
    platformFee,
  });
});

// Register an agent
agents.post("/register", async (c) => {
  const body = await c.req.json();
  const { name, description, capabilities, endpoints, owner, pricing } = body;

  if (!name || !capabilities || !owner || !pricing) {
    return c.json({ error: "Required: name, capabilities, owner, pricing" }, 400);
  }

  const id = generateAgentId();
  const agent: Agent = {
    id,
    name,
    description: description || "",
    capabilities,
    endpoints: endpoints || [],
    owner,
    pricing,
  };

  agentRegistry.set(id, agent);

  // Update capability index
  capabilities.forEach((cap: string) => {
    const existing = capabilityIndex.get(cap) || new Set();
    existing.add(id);
    capabilityIndex.set(cap, existing);
  });

  return c.json({
    success: true,
    agent: { id, name, capabilities },
    message: "Agent registered successfully",
  }, 201);
});

// List all agents
agents.get("/", (c) => {
  const allAgents = Array.from(agentRegistry.values()).map((a) => ({
    id: a.id,
    name: a.name,
    description: a.description,
    capabilities: a.capabilities,
    pricing: a.pricing,
  }));

  return c.json({
    total: allAgents.length,
    agents: allAgents,
  });
});

// Helper functions

function inferCapabilities(task: string): string[] {
  const taskLower = task.toLowerCase();
  const capabilities: string[] = [];

  const capabilityKeywords: Record<string, string[]> = {
    summarize: ["summarize", "summary", "tldr", "condense"],
    translate: ["translate", "translation", "language"],
    "image-generate": ["generate image", "create image", "draw", "illustration"],
    "image-analyze": ["analyze image", "describe image", "what's in this"],
    search: ["search", "find", "look up", "google"],
    "web-scrape": ["scrape", "extract from", "crawl"],
    "code-generate": ["write code", "generate code", "create function"],
    "code-analyze": ["analyze code", "review code", "explain code"],
    "blockchain-query": ["blockchain", "transaction", "wallet", "balance"],
    "data-transform": ["transform", "convert", "parse", "format"],
    sentiment: ["sentiment", "feeling", "emotion", "tone"],
    classify: ["classify", "categorize", "label", "tag"],
  };

  for (const [capability, keywords] of Object.entries(capabilityKeywords)) {
    if (keywords.some((kw) => taskLower.includes(kw))) {
      capabilities.push(capability);
    }
  }

  // Default to general if no specific capabilities found
  if (capabilities.length === 0) {
    capabilities.push("general");
  }

  return capabilities;
}

function getCapabilityDescription(cap: string): string {
  const descriptions: Record<string, string> = {
    summarize: "Condense long text into key points",
    translate: "Convert text between languages",
    "image-generate": "Create images from text descriptions",
    "image-analyze": "Describe and analyze image contents",
    search: "Search the web or databases",
    "web-scrape": "Extract data from websites",
    "code-generate": "Write code in various languages",
    "code-analyze": "Review and explain code",
    "blockchain-query": "Query blockchain data",
    "data-transform": "Transform and convert data formats",
    sentiment: "Analyze emotional tone of text",
    classify: "Categorize and label content",
    general: "General-purpose processing",
  };
  return descriptions[cap] || "Specialized capability";
}

function buildExecutionPlan(
  task: string,
  agents: any[]
): { steps: any[]; totalCost: number; estimatedTime: number } {
  if (agents.length === 0) {
    return { steps: [], totalCost: 0, estimatedTime: 0 };
  }

  const steps = agents.slice(0, 5).map((agent, index) => ({
    step: index + 1,
    agentId: agent.id,
    agentName: agent.name,
    action: `Execute: ${agent.matchedCapabilities.join(", ")}`,
    estimatedCost: agent.pricing.basePrice,
    estimatedTime: 500 + index * 200,
  }));

  return {
    steps,
    totalCost: steps.reduce((sum, s) => sum + s.estimatedCost, 0),
    estimatedTime: steps.reduce((sum, s) => sum + s.estimatedTime, 0),
  };
}

function selectAgentsForTask(
  capabilities: string[],
  budget: number,
  preferredAgents?: string[]
): Agent[] {
  const selected: Agent[] = [];
  let remainingBudget = budget;

  // First, try preferred agents
  if (preferredAgents) {
    for (const id of preferredAgents) {
      const agent = agentRegistry.get(id);
      if (agent && agent.pricing.basePrice <= remainingBudget) {
        selected.push(agent);
        remainingBudget -= agent.pricing.basePrice;
      }
    }
  }

  // Then fill with capability-matched agents
  for (const cap of capabilities) {
    const agentIds = capabilityIndex.get(cap);
    if (!agentIds) continue;

    for (const id of agentIds) {
      if (selected.some((a) => a.id === id)) continue;

      const agent = agentRegistry.get(id);
      if (agent && agent.pricing.basePrice <= remainingBudget) {
        selected.push(agent);
        remainingBudget -= agent.pricing.basePrice;
      }
    }
  }

  return selected;
}

function generateExecutionId(): string {
  return `exec_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

function generateAgentId(): string {
  return `agent_${Math.random().toString(36).substring(2, 10)}`;
}
