/**
 * Payment routes - x402 payment infrastructure
 *
 * Universal payment layer for the registry:
 * - Create invoices
 * - Verify payments on-chain
 * - Manage credits/balances
 * - Subscription management
 */

import { Hono } from "hono";
import type { PaymentInvoice, RegistryEnv } from "../types";

export const payments = new Hono<{ Bindings: RegistryEnv }>();

// In-memory stores for PoC
const invoices = new Map<string, PaymentInvoice>();
const balances = new Map<string, { sBTC: number; STX: number; USDh: number }>();
const subscriptions = new Map<string, any>();

// Token contracts
const TOKEN_CONTRACTS = {
  sBTC: "SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token",
  STX: "native",
  USDh: "SP2VCQJGH7PHP2DJK7Z0V48AGBHQAW3R3ZW1QF4N.usdh",
};

// Create payment invoice
payments.post("/create-invoice", async (c) => {
  const body = await c.req.json();
  const { amount, token, recipient, memo, expiresIn } = body;

  if (!amount || !token || !recipient) {
    return c.json({ error: "Required: amount, token, recipient" }, 400);
  }

  const id = generateInvoiceId();
  const expiresAt = new Date(Date.now() + (expiresIn || 300) * 1000).toISOString();

  const invoice: PaymentInvoice = {
    id,
    amount,
    token,
    recipient,
    memo: memo || `invoice:${id}`,
    expiresAt,
    status: "pending",
  };

  invoices.set(id, invoice);

  return c.json({
    invoice: {
      id: invoice.id,
      amount: invoice.amount,
      token: invoice.token,
      recipient: invoice.recipient,
      memo: invoice.memo,
      expiresAt: invoice.expiresAt,
    },
    paymentInstructions: {
      contract: TOKEN_CONTRACTS[token as keyof typeof TOKEN_CONTRACTS],
      function: token === "STX" ? "stx-transfer" : "transfer",
      args: [amount, recipient, invoice.memo],
    },
    qrData: `stacks:${recipient}?amount=${amount}&token=${token}&memo=${invoice.memo}`,
  });
});

// Verify a payment
payments.post("/verify", async (c) => {
  const body = await c.req.json();
  const { txId, invoiceId } = body;

  if (!txId) {
    return c.json({ error: "Transaction ID required" }, 400);
  }

  // Fetch transaction from Stacks API
  try {
    const txResponse = await fetch(`https://api.mainnet.hiro.so/extended/v1/tx/${txId}`);

    if (!txResponse.ok) {
      return c.json({ error: "Transaction not found" }, 404);
    }

    const tx = (await txResponse.json()) as any;

    // Check transaction status
    if (tx.tx_status !== "success") {
      return c.json({
        verified: false,
        status: tx.tx_status,
        error: "Transaction not successful",
      });
    }

    // Extract payment details from transaction
    const paymentDetails = extractPaymentDetails(tx);

    // If invoice ID provided, validate against it
    if (invoiceId) {
      const invoice = invoices.get(invoiceId);
      if (!invoice) {
        return c.json({ error: "Invoice not found" }, 404);
      }

      const isValid =
        paymentDetails.amount >= invoice.amount &&
        paymentDetails.recipient === invoice.recipient &&
        paymentDetails.memo?.includes(invoice.memo);

      if (isValid) {
        invoice.status = "paid";
        invoice.txId = txId;
        invoices.set(invoiceId, invoice);
      }

      return c.json({
        verified: isValid,
        invoice: invoiceId,
        transaction: {
          txId,
          amount: paymentDetails.amount,
          token: paymentDetails.token,
          sender: paymentDetails.sender,
          recipient: paymentDetails.recipient,
          memo: paymentDetails.memo,
          blockHeight: tx.block_height,
          timestamp: tx.burn_block_time_iso,
        },
      });
    }

    // Just verify the transaction exists and succeeded
    return c.json({
      verified: true,
      transaction: {
        txId,
        status: tx.tx_status,
        type: tx.tx_type,
        sender: tx.sender_address,
        blockHeight: tx.block_height,
        timestamp: tx.burn_block_time_iso,
        ...paymentDetails,
      },
    });
  } catch (error: any) {
    return c.json({ error: `Verification failed: ${error.message}` }, 500);
  }
});

// Check credit balance
payments.get("/balance/:address", async (c) => {
  const address = c.req.param("address");

  // Get cached balance or fetch from chain
  let balance = balances.get(address);

  if (!balance) {
    // Fetch real balances from chain
    balance = await fetchOnChainBalances(address);
    balances.set(address, balance);
  }

  return c.json({
    address,
    balances: balance,
    credits: {
      available: balance.sBTC + balance.STX * 0.00001, // Normalize to sBTC equivalent
      locked: 0,
    },
    lastUpdated: new Date().toISOString(),
  });
});

// Deposit credits (records intent, user pays on-chain)
payments.post("/deposit", async (c) => {
  const body = await c.req.json();
  const { address, amount, token } = body;

  if (!address || !amount || !token) {
    return c.json({ error: "Required: address, amount, token" }, 400);
  }

  // Create deposit invoice
  const invoice = {
    id: generateInvoiceId(),
    type: "deposit",
    amount,
    token,
    recipient: "SP2QXPFF4M72QYZWXE7S5321XJDJ2DD32DGEMN5QA", // Registry wallet
    memo: `deposit:${address}`,
    expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
  };

  return c.json({
    depositInstructions: {
      sendTo: invoice.recipient,
      amount: invoice.amount,
      token: invoice.token,
      memo: invoice.memo,
      contract: TOKEN_CONTRACTS[token as keyof typeof TOKEN_CONTRACTS],
    },
    invoiceId: invoice.id,
    expiresAt: invoice.expiresAt,
    note: "After sending, call /payments/verify with txId to credit your account",
  });
});

// Set up subscription
payments.post("/subscribe", async (c) => {
  const body = await c.req.json();
  const { subscriber, endpointId, plan, token } = body;

  if (!subscriber || !endpointId || !plan) {
    return c.json({ error: "Required: subscriber, endpointId, plan" }, 400);
  }

  const plans: Record<string, { calls: number; price: number; period: string }> = {
    basic: { calls: 100, price: 1000, period: "month" },
    pro: { calls: 1000, price: 8000, period: "month" },
    unlimited: { calls: -1, price: 50000, period: "month" },
  };

  const selectedPlan = plans[plan];
  if (!selectedPlan) {
    return c.json({ error: "Invalid plan. Options: basic, pro, unlimited" }, 400);
  }

  const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

  // Check for payment
  const paymentProof = c.req.header("X-Payment-Proof");
  if (!paymentProof) {
    return c.json(
      {
        error: "Payment Required",
        payment: {
          amount: selectedPlan.price,
          token: token || "sBTC",
          recipient: "SP2QXPFF4M72QYZWXE7S5321XJDJ2DD32DGEMN5QA",
          memo: `subscribe:${subscriptionId}`,
        },
        plan: {
          name: plan,
          ...selectedPlan,
        },
      },
      402
    );
  }

  // Create subscription
  const subscription = {
    id: subscriptionId,
    subscriber,
    endpointId,
    plan,
    callsRemaining: selectedPlan.calls,
    callsUsed: 0,
    startsAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
    status: "active",
  };

  subscriptions.set(subscriptionId, subscription);

  return c.json({
    success: true,
    subscription,
  });
});

// Get subscription status
payments.get("/subscription/:id", (c) => {
  const id = c.req.param("id");
  const subscription = subscriptions.get(id);

  if (!subscription) {
    return c.json({ error: "Subscription not found" }, 404);
  }

  return c.json(subscription);
});

// Helper functions

function generateInvoiceId(): string {
  return `inv_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

function extractPaymentDetails(tx: any): {
  amount: number;
  token: string;
  sender: string;
  recipient: string;
  memo?: string;
} {
  // Handle STX transfer
  if (tx.tx_type === "token_transfer") {
    return {
      amount: parseInt(tx.token_transfer.amount),
      token: "STX",
      sender: tx.sender_address,
      recipient: tx.token_transfer.recipient_address,
      memo: tx.token_transfer.memo ? Buffer.from(tx.token_transfer.memo, "hex").toString() : undefined,
    };
  }

  // Handle contract call (SIP-010 transfer)
  if (tx.tx_type === "contract_call") {
    const args = tx.contract_call.function_args || [];
    return {
      amount: parseInt(args[0]?.repr?.replace("u", "") || "0"),
      token: tx.contract_call.contract_id.includes("sbtc") ? "sBTC" : "USDh",
      sender: tx.sender_address,
      recipient: args[2]?.repr?.replace(/'/g, "") || "",
      memo: args[3]?.repr,
    };
  }

  return {
    amount: 0,
    token: "unknown",
    sender: tx.sender_address,
    recipient: "",
  };
}

async function fetchOnChainBalances(
  address: string
): Promise<{ sBTC: number; STX: number; USDh: number }> {
  try {
    // Fetch STX balance
    const stxResponse = await fetch(
      `https://api.mainnet.hiro.so/extended/v1/address/${address}/stx`
    );
    const stxData = (await stxResponse.json()) as any;
    const stxBalance = parseInt(stxData.balance || "0");

    // Fetch FT balances
    const ftResponse = await fetch(
      `https://api.mainnet.hiro.so/extended/v1/address/${address}/balances`
    );
    const ftData = (await ftResponse.json()) as any;

    let sbtcBalance = 0;
    let usdhBalance = 0;

    const fungible = ftData.fungible_tokens || {};
    for (const [key, value] of Object.entries(fungible)) {
      if (key.includes("sbtc")) {
        sbtcBalance = parseInt((value as any).balance || "0");
      }
      if (key.includes("usdh")) {
        usdhBalance = parseInt((value as any).balance || "0");
      }
    }

    return {
      sBTC: sbtcBalance,
      STX: stxBalance,
      USDh: usdhBalance,
    };
  } catch {
    return { sBTC: 0, STX: 0, USDh: 0 };
  }
}
