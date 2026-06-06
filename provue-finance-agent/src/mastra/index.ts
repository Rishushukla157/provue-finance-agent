import { Mastra } from "@mastra/core";

import { taraAgent } from "./agents/tara-agent.js";

export const mastra = new Mastra({
  agents: {
    tara: taraAgent,
  },
});