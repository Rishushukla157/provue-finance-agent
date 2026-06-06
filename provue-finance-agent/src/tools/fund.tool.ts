import { createTool } from "@mastra/core/tools";
import { z } from "zod";

import {
  getFundReturn,
  rankFundsByReturn,
} from "../services/fund.service.js";

export const fundReturnTool = createTool({
  id: "fund-return",
  description:
    "Compute one mutual fund's NAV period return between two dates. Use for fund-only performance questions.",
  inputSchema: z.object({
    fundNameOrId: z.string(),
    startDate: z.string(),
    endDate: z.string(),
  }),
  execute: async (input: any) => {
    const context = input.context ?? input;

    return getFundReturn(
      context.fundNameOrId,
      context.startDate,
      context.endDate
    );
  },
});

export const rankFundsByReturnTool = createTool({
  id: "rank-funds-by-return",
  description:
    "Rank all funds by NAV period return between two dates and show best/worst spread.",
  inputSchema: z.object({
    startDate: z.string(),
    endDate: z.string(),
  }),
  execute: async (input: any) => {
    const context = input.context ?? input;

    return rankFundsByReturn(
      context.startDate,
      context.endDate
    );
  },
});