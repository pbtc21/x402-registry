/**
 * Developer tools routes
 *
 * Make it trivially easy to build x402 endpoints:
 * - Generate middleware code
 * - Test endpoint compliance
 * - Pricing calculator
 */

import { Hono } from "hono";
import type { RegistryEnv } from "../types";

export const dev = new Hono<{ Bindings: RegistryEnv }>();

// Generate x402 middleware
dev.post("/generate-middleware", async (c) => {
  const body = await c.req.json();
  const { language, framework, price, token, walletAddress } = body;

  if (!language || !price || !token || !walletAddress) {
    return c.json({ error: "Required: language, price, token, walletAddress" }, 400);
  }

  const code = generateMiddlewareCode(language, framework, price, token, walletAddress);

  return c.json({
    language,
    framework: framework || "none",
    code,
    usage: getUsageInstructions(language, framework),
  });
});

// Test endpoint compliance
dev.post("/test-endpoint", async (c) => {
  const body = await c.req.json();
  const { url, method = "GET" } = body;

  if (!url) {
    return c.json({ error: "URL required" }, 400);
  }

  const tests: { name: string; passed: boolean; details: string }[] = [];

  try {
    // Test 1: Endpoint reachable
    const start = Date.now();
    const response = await fetch(url, { method });
    const responseTime = Date.now() - start;

    tests.push({
      name: "Endpoint reachable",
      passed: true,
      details: `Response time: ${responseTime}ms`,
    });

    // Test 2: Returns 402
    const returns402 = response.status === 402;
    tests.push({
      name: "Returns 402 Payment Required",
      passed: returns402,
      details: returns402 ? "Correct status code" : `Got ${response.status} instead`,
    });

    // Test 3: Payment details in response
    let paymentDetails: any = null;
    if (returns402) {
      try {
        paymentDetails = await response.json();
      } catch {
        paymentDetails = null;
      }
    }

    const hasPaymentInfo = !!(
      paymentDetails?.maxAmountRequired ||
      paymentDetails?.amount ||
      paymentDetails?.payment?.amount
    );

    tests.push({
      name: "Contains payment information",
      passed: hasPaymentInfo,
      details: hasPaymentInfo
        ? `Amount: ${paymentDetails?.maxAmountRequired || paymentDetails?.amount || paymentDetails?.payment?.amount}`
        : "Missing amount field",
    });

    // Test 4: Has recipient address
    const hasRecipient = !!(
      paymentDetails?.payTo ||
      paymentDetails?.recipient ||
      paymentDetails?.payment?.address
    );

    tests.push({
      name: "Has recipient address",
      passed: hasRecipient,
      details: hasRecipient
        ? `Pay to: ${paymentDetails?.payTo || paymentDetails?.recipient || paymentDetails?.payment?.address}`
        : "Missing recipient field",
    });

    // Test 5: Token type specified
    const hasToken = !!(paymentDetails?.tokenType || paymentDetails?.token || paymentDetails?.payment?.token);

    tests.push({
      name: "Token type specified",
      passed: hasToken,
      details: hasToken
        ? `Token: ${paymentDetails?.tokenType || paymentDetails?.token || paymentDetails?.payment?.token}`
        : "Missing token field (defaults to STX)",
    });

    // Test 6: CORS headers
    const hasCors = !!response.headers.get("Access-Control-Allow-Origin");
    tests.push({
      name: "CORS enabled",
      passed: hasCors,
      details: hasCors ? "CORS headers present" : "Missing CORS headers (may block browser calls)",
    });

    const allPassed = tests.every((t) => t.passed);
    const criticalPassed = tests.slice(0, 4).every((t) => t.passed);

    return c.json({
      url,
      compliant: criticalPassed,
      fullyCompliant: allPassed,
      tests,
      paymentDetails,
      recommendations: generateRecommendations(tests),
    });
  } catch (error: any) {
    tests.push({
      name: "Endpoint reachable",
      passed: false,
      details: `Error: ${error.message}`,
    });

    return c.json({
      url,
      compliant: false,
      tests,
      error: error.message,
    });
  }
});

// Pricing calculator
dev.get("/pricing-calculator", (c) => {
  const category = c.req.query("category") || "utility";
  const complexity = c.req.query("complexity") || "medium";
  const token = c.req.query("token") || "sBTC";

  // Market data (would be fetched from real sources)
  const marketPrices = {
    sBTC: { usd: 100000 },
    STX: { usd: 0.5 },
    USDh: { usd: 1 },
  };

  // Base prices by category (in USD cents)
  const categoryPrices: Record<string, number> = {
    utility: 1, // $0.01
    ai: 10, // $0.10
    blockchain: 5, // $0.05
    data: 3, // $0.03
    media: 15, // $0.15
  };

  // Complexity multipliers
  const complexityMultipliers: Record<string, number> = {
    simple: 0.5,
    medium: 1,
    complex: 2,
    premium: 5,
  };

  const basePrice = categoryPrices[category] || 5;
  const multiplier = complexityMultipliers[complexity] || 1;
  const priceUsdCents = basePrice * multiplier;

  // Convert to token amounts
  const tokenPrice = marketPrices[token as keyof typeof marketPrices] || marketPrices.sBTC;
  const priceInToken = Math.ceil((priceUsdCents / 100) / tokenPrice.usd * 100000000); // in smallest unit

  return c.json({
    recommendation: {
      price: priceInToken,
      token,
      priceUsd: `$${(priceUsdCents / 100).toFixed(4)}`,
    },
    inputs: {
      category,
      complexity,
    },
    marketData: {
      token,
      priceUsd: tokenPrice.usd,
    },
    comparisons: {
      sBTC: Math.ceil((priceUsdCents / 100) / marketPrices.sBTC.usd * 100000000),
      STX: Math.ceil((priceUsdCents / 100) / marketPrices.STX.usd * 1000000),
      USDh: Math.ceil((priceUsdCents / 100) * 1000000),
    },
    tips: [
      "Start lower to attract users, raise prices as demand grows",
      "AI endpoints can command 5-10x premium over utility endpoints",
      "Consider offering volume discounts via subscriptions",
      "Monitor competitor pricing in the registry",
    ],
  });
});

// SDK download links
dev.get("/sdk/:language", (c) => {
  const language = c.req.param("language");

  const sdks: Record<string, any> = {
    typescript: {
      package: "@x402/sdk",
      install: "npm install @x402/sdk",
      repo: "https://github.com/x402-registry/sdk-typescript",
      example: `
import { x402 } from '@x402/sdk';

// Create client
const client = x402.createClient({
  wallet: 'SP...',
  privateKey: process.env.STACKS_PRIVATE_KEY,
});

// Call a paid endpoint
const result = await client.call('https://api.example.com/summarize', {
  body: { text: 'Long article...' },
  maxPayment: 1000, // sats
});
`,
    },
    python: {
      package: "x402-sdk",
      install: "pip install x402-sdk",
      repo: "https://github.com/x402-registry/sdk-python",
      example: `
from x402 import Client

client = Client(
    wallet="SP...",
    private_key=os.environ["STACKS_PRIVATE_KEY"]
)

result = client.call(
    "https://api.example.com/summarize",
    body={"text": "Long article..."},
    max_payment=1000
)
`,
    },
    go: {
      package: "github.com/x402-registry/sdk-go",
      install: "go get github.com/x402-registry/sdk-go",
      repo: "https://github.com/x402-registry/sdk-go",
      example: `
import "github.com/x402-registry/sdk-go"

client := x402.NewClient(x402.Config{
    Wallet:     "SP...",
    PrivateKey: os.Getenv("STACKS_PRIVATE_KEY"),
})

result, err := client.Call("https://api.example.com/summarize", x402.CallOptions{
    Body:       map[string]string{"text": "Long article..."},
    MaxPayment: 1000,
})
`,
    },
  };

  const sdk = sdks[language];
  if (!sdk) {
    return c.json({
      error: "SDK not found",
      available: Object.keys(sdks),
    }, 404);
  }

  return c.json({
    language,
    ...sdk,
  });
});

// Helper functions

function generateMiddlewareCode(
  language: string,
  framework: string | undefined,
  price: number,
  token: string,
  walletAddress: string
): string {
  if (language === "typescript" || language === "javascript") {
    if (framework === "hono") {
      return `
import { MiddlewareHandler } from 'hono';

export const x402Middleware = (): MiddlewareHandler => {
  return async (c, next) => {
    const paymentProof = c.req.header('X-Payment-Proof');

    if (!paymentProof) {
      return c.json({
        error: 'Payment Required',
        payment: {
          amount: ${price},
          token: '${token}',
          address: '${walletAddress}',
          memo: 'api-call',
        },
      }, 402);
    }

    // Verify payment on-chain
    const verified = await verifyPayment(paymentProof, ${price});
    if (!verified) {
      return c.json({ error: 'Invalid payment' }, 402);
    }

    await next();
  };
};

async function verifyPayment(txId: string, expectedAmount: number): Promise<boolean> {
  const response = await fetch(\`https://api.mainnet.hiro.so/extended/v1/tx/\${txId}\`);
  const tx = await response.json();
  return tx.tx_status === 'success';
}
`;
    }

    // Express
    return `
const x402Middleware = (req, res, next) => {
  const paymentProof = req.headers['x-payment-proof'];

  if (!paymentProof) {
    return res.status(402).json({
      error: 'Payment Required',
      payment: {
        amount: ${price},
        token: '${token}',
        address: '${walletAddress}',
        memo: 'api-call',
      },
    });
  }

  // Verify payment (implement verification logic)
  next();
};

module.exports = x402Middleware;
`;
  }

  if (language === "python") {
    return `
from functools import wraps
from flask import request, jsonify

def x402_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        payment_proof = request.headers.get('X-Payment-Proof')

        if not payment_proof:
            return jsonify({
                'error': 'Payment Required',
                'payment': {
                    'amount': ${price},
                    'token': '${token}',
                    'address': '${walletAddress}',
                    'memo': 'api-call',
                }
            }), 402

        # Verify payment on-chain
        if not verify_payment(payment_proof, ${price}):
            return jsonify({'error': 'Invalid payment'}), 402

        return f(*args, **kwargs)
    return decorated
`;
  }

  return `// Middleware for ${language} not yet available`;
}

function getUsageInstructions(language: string, framework: string | undefined): string {
  if (language === "typescript" && framework === "hono") {
    return `
// Apply to specific routes:
app.use('/api/paid/*', x402Middleware());

// Or to entire app:
app.use(x402Middleware());
`;
  }

  if (language === "python") {
    return `
# Apply to specific routes:
@app.route('/api/paid')
@x402_required
def paid_endpoint():
    return {'data': 'premium content'}
`;
  }

  return "See SDK documentation for usage instructions";
}

function generateRecommendations(tests: { name: string; passed: boolean }[]): string[] {
  const recommendations: string[] = [];

  tests.forEach((test) => {
    if (!test.passed) {
      switch (test.name) {
        case "Returns 402 Payment Required":
          recommendations.push("Return HTTP 402 status code for unpaid requests");
          break;
        case "Contains payment information":
          recommendations.push("Include 'amount' or 'maxAmountRequired' in 402 response body");
          break;
        case "Has recipient address":
          recommendations.push("Include 'payTo' or 'recipient' Stacks address in response");
          break;
        case "Token type specified":
          recommendations.push("Specify 'tokenType' (sBTC, STX, or USDh) in response");
          break;
        case "CORS enabled":
          recommendations.push("Add CORS headers to allow browser-based agent calls");
          break;
      }
    }
  });

  if (recommendations.length === 0) {
    recommendations.push("Your endpoint is fully x402 compliant!");
    recommendations.push("Consider registering it at POST /registry/register");
  }

  return recommendations;
}
