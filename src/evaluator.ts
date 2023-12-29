import { exit } from "node:process";
import type readline from "node:readline/promises";
import type OpenAI from "openai";
import {
  createChatCompletionStream,
  createMessage,
  initOpenAiClient,
} from "./openai.ts";
import type { Config } from "./config.ts";
import { countTokens } from "./tokenizer.ts";

const stdout = Bun.stdout;

export const HELP = [
  ".help     # Show this help",
  ".clear    # Clear messages stack",
  ".history  # Show messages stack",
  ".config   # Show config",
  ".exit     # Exit",
]
  .map((line) => ` ${line}`)
  .join("\n");

export class Evaluator {
  private rl: readline.Interface;
  private openAIClient: OpenAI;
  private config: Config;
  private messageHistory: Array<OpenAI.ChatCompletionMessageParam> = [];
  private systemMessage: OpenAI.ChatCompletionMessageParam | null;

  private commands: Record<string, () => Promise<void>> = {
    ".help": async () => {
      console.log(HELP);
    },
    ".clear": async () => {
      this.messageHistory = [];
      console.log("History cleared");
    },
    ".history": async () => {
      console.log(JSON.stringify(this.messageHistory, null, 2));
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
    this.systemMessage = params.config.systemContext
      ? createMessage({
          content: params.config.systemContext,
          role: "system",
        })
      : null;
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

  private chatCompletion = async (line: string) => {
    Bun.write(
      stdout,
      `Token count: ${countTokens(this.config.modelOptions.model, line)}\n`,
    );

    const message: OpenAI.ChatCompletionUserMessageParam = {
      content: line,
      role: "user",
    };
    const messages = [
      this.systemMessage,
      ...this.messageHistory,
      message,
    ].filter(Boolean) as Array<OpenAI.ChatCompletionMessageParam>;

    this.messageHistory.push(message);

    const stream = await createChatCompletionStream(this.openAIClient, {
      model: this.config.modelOptions.model,
      temperature: this.config.modelOptions.temperature,
      top_p: this.config.modelOptions.topP,
      messages,
    });

    let isAborted = false;

    this.rl.on("SIGINT", () => {
      // FIXME: 一度途中で止めると、次からのリクエストが connection error になる
      isAborted = true;
    });

    let buf = "";

    for await (const chunk of stream) {
      if (isAborted) {
        break;
      }
      const content = chunk.choices.at(0)?.delta.content;
      if (content) {
        buf += content;
        Bun.write(stdout, content);
      }
    }

    this.messageHistory.push({
      content: buf,
      role: "assistant",
    });

    Bun.write(
      stdout,
      `\nResponse token count: ${countTokens(
        this.config.modelOptions.model,
        buf,
      )}\n`,
    );
  };
}
