import "dotenv/config";
import express from "express";

import { taraAgent } from "./mastra/agents/tara-agent.js";

import {
  getTransactionSummary,
  getTopMerchants,
  getMonthlySpend,
} from "./services/transaction.service.js";

import { rankFundsByReturn } from "./services/fund.service.js";
import { getPortfolioSummary } from "./services/portfolio.service.js";

const app = express();

console.log("TARA SERVER LOADED");

app.use(express.json());

app.get("/health", (_, res) => {
  res.json({
    status: "ok",
    service: "provue-finance-agent",
  });
});

function extractAnswer(result: any): string {
  if (typeof result === "string") return result;

  if (typeof result?.text === "string" && result.text.trim()) {
    return result.text;
  }

  if (typeof result?.content === "string" && result.content.trim()) {
    return result.content;
  }

  return "";
}

async function fallbackAnswer(questionRaw: string): Promise<string> {
  const question = questionRaw.toLowerCase();

  if (question.includes("portfolio") || question.includes("worth")) {
    const summary: any = await getPortfolioSummary();

    return `Your portfolio is worth ₹${summary.totals.currentValue}. You invested ₹${summary.totals.purchaseValue}, so your profit is ₹${summary.totals.profit}, with a total return of ${summary.totals.returnPercent}%.`;
  }

  if (
    question.includes("fund") &&
    (question.includes("best") ||
      question.includes("performed") ||
      question.includes("performing") ||
      question.includes("return") ||
      question.includes("rank"))
  ) {
    const dateMatches = questionRaw.match(/\d{4}-\d{2}-\d{2}/g);

    const startDate = dateMatches?.[0] ?? "2024-01-01";
    const endDate = dateMatches?.[1] ?? "2025-01-01";

    const funds: any[] = await rankFundsByReturn(startDate, endDate);

    if (!funds.length) {
      return `No fund performance data is available between ${startDate} and ${endDate}.`;
    }

    return `Best fund was ${funds[0].fundName} with ${funds[0].returnPercent.toFixed(
      2
    )}% return between ${startDate} and ${endDate}.`;
  }

  if (question.includes("swiggy")) {
    const data: any = await getTransactionSummary({
      merchant: "Swiggy",
      startDate: "2024-01-01",
      endDate: "2025-03-31",
    });

    return `Your Swiggy net spend was ₹${data.netSpend} across ${data.transactionCount} transactions.`;
  }

  if (question.includes("top") && question.includes("merchant")) {
    const data: any[] = await getTopMerchants(
      {
        startDate: "2024-01-01",
        endDate: "2025-03-31",
        excludeTransfers: true,
      },
      5
    );

    return `Your top merchants are: ${data
      .map((m) => `${m.merchant}: ₹${m.netSpend}`)
      .join(", ")}.`;
  }

  if (question.includes("monthly") && question.includes("food")) {
    const data: any[] = await getMonthlySpend({
      category: "food",
      startDate: "2024-01-01",
      endDate: "2025-03-31",
      excludeTransfers: true,
    });

    return `Monthly food spend: ${data
      .map((m) => `${m.month}: ₹${m.netSpend}`)
      .join(", ")}.`;
  }

  return "I could not confidently answer this question from the available tools and data.";
}

app.post("/ask", async (req, res) => {
  try {
    const question = String(req.body?.question || "");

    if (!question.trim()) {
      return res.status(400).json({
        answer: "Please provide a question.",
      });
    }

    console.log({
      timestamp: new Date().toISOString(),
      question,
    });

    let answer = "";

    try {
      const result: any = await taraAgent.generate(question);
      answer = extractAnswer(result);
    } catch (agentError: any) {
      console.error({
        timestamp: new Date().toISOString(),
        agentError: agentError.message,
      });
    }

    if (!answer.trim()) {
      answer = await fallbackAnswer(question);
    }

    console.log({
      timestamp: new Date().toISOString(),
      answer,
    });

    return res.json({
      answer,
    });
  } catch (error: any) {
    console.error({
      timestamp: new Date().toISOString(),
      error: error.message,
    });

    return res.status(500).json({
      answer: "Something went wrong while processing the question.",
      error: error.message,
    });
  }
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});