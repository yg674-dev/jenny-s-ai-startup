import OpenAI from "openai";

const baseURL =
  process.env.DOUBAO_ENDPOINT ?? "https://ark.cn-beijing.volces.com/api/v3";

if (!process.env.DOUBAO_API_KEY) {
  console.warn(
    "[ai] DOUBAO_API_KEY is not set — AI calls will fail at runtime",
  );
}

export const ark = new OpenAI({
  apiKey: process.env.DOUBAO_API_KEY ?? "missing",
  baseURL,
});

export const MODELS = {
  llm: process.env.DOUBAO_LLM_MODEL ?? "doubao-1-5-pro-32k-250115",
  image: process.env.DOUBAO_IMAGE_MODEL ?? "doubao-seedream-3-0-t2i-250415",
} as const;
