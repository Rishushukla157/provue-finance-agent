import { openai } from "@ai-sdk/openai";

const model = openai("gpt-4o-mini");

console.log("Model initialized:", model);