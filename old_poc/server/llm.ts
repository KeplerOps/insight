import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { config } from "./config";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024
// the newest Anthropic model is "claude-3-5-sonnet-20241022"

export type Provider = "openai" | "anthropic";
type Role = "user" | "assistant" | "system";

interface Message {
  role: Role;
  content: string;
}

export class LLMService {
  private openai: OpenAI | null = null;
  private anthropic: Anthropic | null = null;

  constructor() {
    if (config.api.openai) {
      this.setOpenAIKey(config.api.openai);
    }
    if (config.api.anthropic) {
      this.setAnthropicKey(config.api.anthropic);
    }
  }

  setOpenAIKey(key: string) {
    this.openai = new OpenAI({ apiKey: key });
  }

  setAnthropicKey(key: string) {
    this.anthropic = new Anthropic({ apiKey: key });
  }

  async generateResponse(
    provider: Provider,
    model: string,
    messages: Message[],
    skipLLM = false,
    tool?: any
  ) {
    if (skipLLM) {
      return messages[messages.length - 1].content;
    }
    try {
      if (provider === "openai" && this.openai) {
        const response = await this.openai.chat.completions.create({
          model,
          messages: messages as OpenAI.Chat.ChatCompletionMessageParam[],
        });
        return response.choices[0].message.content || "";
      } else if (provider === "anthropic" && this.anthropic) {
        // Extract system message if present
        const systemMessage = messages.find(msg => msg.role === "system");
        const nonSystemMessages = messages.filter(msg => msg.role !== "system");

        const response = await this.anthropic.messages.create({
          model,
          system: systemMessage?.content,
          messages: nonSystemMessages.map(msg => ({
            role: msg.role,
            content: msg.content,
          })) as Anthropic.MessageParam[],
          max_tokens: 1024,
          ...(tool && { tools: [tool] })
        });
        const content = response.content[0];
        if (!content) {
          throw new Error("Empty response from Anthropic API");
        }
        if (content.type === 'tool_use') {
          return JSON.stringify(content.input);
        }
        if ('text' in content) {
          return content.text;
        }
        return "";
      }
      throw new Error(`No API key set for ${provider}`);
    } catch (error: any) {
      console.error("LLM Error details:", {
        error,
        message: error.message,
        response: error.response?.body,
        status: error.status,
        type: error.type
      });
      throw new Error(`LLM Error: ${error.message}`);
    }
  }

  getAvailableModels(provider: Provider) {
    if (provider === "openai") {
      return ["gpt-4o", "gpt-3.5-turbo"];
    } else {
      return ["claude-3-5-sonnet-20241022", "claude-2.1"];
    }
  }
}

export const llmService = new LLMService();
