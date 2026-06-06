import { createTool } from "@mastra/core/tools";
import { z } from "zod";

import {
  getTransactionSummary,
  getTopMerchants,
  getMonthlySpend,
} from "../services/transaction.service.js";

export const transactionSummaryTool = createTool({
  id: "transaction-summary",
  description:
    "Get transaction spending summary by category, merchant, and date range. Use for food spend, rent spend, Swiggy spend, total spend, and refund-adjusted net spend.",
  inputSchema: z.object({
    category: z.string().optional(),
    merchant: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    excludeTransfers: z.boolean().optional(),
  }),
  execute: async (input: any) => {
    const context = input.context ?? input;
    return getTransactionSummary(context);
  },
});

export const topMerchantsTool = createTool({
  id: "top-merchants",
  description:
    "Get top merchants by net spend for a date range. Use for biggest merchants or top 5 merchants.",
  inputSchema: z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    limit: z.number().optional(),
    excludeTransfers: z.boolean().optional(),
  }),
  execute: async (input: any) => {
    const context = input.context ?? input;

    return getTopMerchants(
      {
        startDate: context.startDate,
        endDate: context.endDate,
        excludeTransfers: context.excludeTransfers,
      },
      context.limit ?? 5
    );
  },
});

export const monthlySpendTool = createTool({
  id: "monthly-spend",
  description:
    "Get monthly net spend trend by category, merchant, and date range. Use for month-by-month comparisons.",
  inputSchema: z.object({
    category: z.string().optional(),
    merchant: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    excludeTransfers: z.boolean().optional(),
  }),
  execute: async (input: any) => {
    const context = input.context ?? input;
    return getMonthlySpend(context);
  },
});