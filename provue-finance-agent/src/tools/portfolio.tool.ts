import { createTool } from "@mastra/core/tools";
import { z } from "zod";

import { getPortfolioSummary } from "../services/portfolio.service.js";

export const portfolioSummaryTool = createTool({
  id: "portfolio-summary",
  description:
    "Get user's current portfolio value, purchase value, profit, return percent, and realised return for each holding.",
  inputSchema: z.object({}),
  execute: async () => {
    return getPortfolioSummary();
  },
});