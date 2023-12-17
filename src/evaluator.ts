import { exit, stdout } from "node:process";
import type readline from "node:readline/promises";
import type OpenAI from "openai";
import { createChatCompletionStream, initOpenAiClient } from "./ai.ts";
import type { Config } from "./config.ts";
import { countTokens } from "./tokenizer.ts";

export const HELP = ` .help     # Show this help
 .clear    # Clear messages stack
 .history  # Show messages stack
 .config   # Show config
 .exit     # Exit`;

export class Evaluator {
  private rl: readline.Interface;
  private openAIClient: OpenAI;
  private config: Config;
  private history: Array<OpenAI.ChatCompletionMessageParam> = [];

  private commands: Record<string, () => Promise<void>> = {
    ".help": async () => {
      console.log(HELP);
    },
    ".clear": async () => {
      this.history = [];
      console.log("History cleared");
    },
    ".history": async () => {
      console.log(JSON.stringify(this.history, null, 2));
    },
    ".config": async () => {
      console.log(this.config);
    },
    ".exit": async () => {
      console.log("Bye!");
      exit(0);
    },
  };

  constructor(params: { rl: readline.Interface; config: Config }) {
    this.rl = params.rl;
    this.config = params.config;
    this.openAIClient = initOpenAiClient({ apiKey: params.config.apiKey });
  }

  public evaluateLine = async (line: string) => {
    const trimmedLine = line.trim();

    const handled = await this.evaluateCommand(trimmedLine);
    if (handled) {
      return;
    }

    await this.chatCompletion(trimmedLine);
  };

  private evaluateCommand = async (command: string) => {
    const handler: () => Promise<void> | undefined = this.commands[command];

    if (!handler) {
      return false;
    }

    await handler();
    return true;
  };

  private createMessages = (): Array<OpenAI.ChatCompletionMessageParam> => {
    const messages: OpenAI.ChatCompletionMessageParam[] = [];

    const systemContext = this.config.systemContext;
    if (systemContext) {
      messages.push({
        content: systemContext,
        role: "system",
      });
    }

    messages.push(...this.history);

    return messages;
  };

  private chatCompletion = async (line: string) => {
    stdout.write(`Token count: ${countTokens(this.config.model, line)}\n`);

    const messages = this.createMessages();
    const message: OpenAI.ChatCompletionMessageParam = {
      content: line,
      role: "user",
    };

    messages.push(message);
    this.history.push(message);

    const stream = await createChatCompletionStream(this.openAIClient, {
      temperature: this.config.temperature,
      top_p: this.config.top_p,
      model: this.config.model,
      messages,
    });

    const reader = stream.toReadableStream().getReader();
    let buf = "";

    while (true) {
      const r = await reader.read();
      if (r.value) {
        const value: OpenAI.ChatCompletionChunk = JSON.parse(
          new TextDecoder().decode(r.value),
        );
        const content = value.choices.at(0)?.delta.content;
        if (content) {
          buf += content;
          stdout.write(content);
        }
      }

      if (r.done) {
        this.history.push({
          content: buf,
          role: "assistant",
        });
        stdout.write(
          `\nResponse token count: ${countTokens(this.config.model, buf)}\n`,
        );
        break;
      }
    }
  };
}
