import { Agent } from "@mastra/core/agent";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

import {
  transactionSummaryTool,
  topMerchantsTool,
  monthlySpendTool,
} from "../../tools/transaction.tool.js";

import {
  fundReturnTool,
  rankFundsByReturnTool,
} from "../../tools/fund.tool.js";

import { portfolioSummaryTool } from "../../tools/portfolio.tool.js";

const ollama = createOpenAICompatible({
  name: "ollama",
  baseURL: "http://localhost:11434/v1",
  apiKey: "ollama",
});

export const taraAgent = new Agent({
  name: "Tara",

  instructions: `
You are Tara, a finance research assistant.

Rules:
1. Never invent financial numbers.
2. Always use tools before answering finance questions.
3. Every money, return, transaction, merchant, fund, or portfolio figure must come from tool output.
4. If data is unavailable, say so clearly.
5. Be concise and analytical.
6. Round money and percentages to two decimals.
7. Use INR formatting for currency.
8. Refunds are negative transactions and reduce net spend.
9. Do not treat transfers as spending unless explicitly asked.
10. Distinguish fund period return from holding realised return.
`,

  model: ollama("gpt-oss:20b-cloud"),

  tools: {
    transactionSummaryTool,
    topMerchantsTool,
    monthlySpendTool,
    fundReturnTool,
    rankFundsByReturnTool,
    portfolioSummaryTool,
  },
});