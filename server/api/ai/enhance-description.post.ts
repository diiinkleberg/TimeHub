import { z } from "zod";
import OpenAI from "openai";

const EnhanceDescriptionSchema = z.object({
  description: z.string().min(1).max(5000),
});

// Create client once, reused across requests
let aiClient: OpenAI | null = null;

function getAIClient() {
  if (!aiClient) {
    const config = useRuntimeConfig();
    aiClient = new OpenAI({ apiKey: config.openaiApiKey });
  }
  return aiClient;
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { description } = EnhanceDescriptionSchema.parse(body);

  const client = getAIClient();

  try {
    const response = await client.responses.create({
      model: "gpt-5-nano",
      prompt: {
        id: "pmpt_690b34769f9c8196b60b0a2acc07c8d30072d5f13637a440",
        version: "1",
      },
      input: description,
    });

    const enhanced = response.output_text?.trim();
    const usedToken = response.usage?.total_tokens || 0;

    if (!enhanced) {
      throw createError({
        statusCode: 500,
        statusMessage: "Failed to enhance description",
        message: "OpenAI returned an empty response",
      });
    }

    return {
      enhanced,
      original: description,
      usedToken,
    };
  } catch (error: any) {
    console.error("OpenAI API Error:", error);

    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: "AI Enhancement Failed",
      message: error.message || "Failed to enhance description",
    });
  }
});
