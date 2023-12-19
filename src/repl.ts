import { exit, stdin, stdout } from "node:process";
import readline from "node:readline/promises";
import type { Config } from "./config.ts";
import { Evaluator } from "./evaluator.ts";
import { saveHistories } from "./history.ts";

export class Repl {
  private evaluator: Evaluator;
  private prompt = "> ";
  private rl: readline.Interface;
  private config: Config;
  private waitForEvaluate = false;

  constructor(config: Config, histories: string[] = []) {
    this.config = config;
    this.rl = readline.createInterface({
      input: stdin,
      output: stdout,
      prompt: this.prompt,
      historySize: 1000,
      history: histories,
    });
    this.evaluator = new Evaluator({ rl: this.rl, config });
  }

  public async startRepl() {
    this.rl.prompt();

    this.rl
      .on("line", async (line) => {
        this.waitForEvaluate = true;
        await this.evaluator.evaluateLine(line).finally(() => {
          this.waitForEvaluate = false;
        });
        this.rl.prompt();
      })
      .on("history", async (histories) => {
        this.config.historyPath &&
          saveHistories(this.config.historyPath, histories);
      })
      .on("SIGINT", () => {
        // Ctrl-C
        if (this.waitForEvaluate) {
          return;
        }

        stdout.write("^C");
        console.log("\nBye!");
        exit(0);
      })
      .on("close", () => {
        console.log("\nBye!");
        exit(0);
      });
  }
}
