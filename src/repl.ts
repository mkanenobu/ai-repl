import { exit, stdin, stdout } from "node:process";
import readline from "node:readline/promises";
import type { Config } from "./config.ts";
import { Evaluator } from "./evaluator.ts";

export class Repl {
  private evaluator: Evaluator;
  private prompt = "> ";
  private rl: readline.Interface;

  constructor(config: Config) {
    this.rl = readline.createInterface({
      input: stdin,
      output: stdout,
      prompt: this.prompt,
    });
    this.evaluator = new Evaluator({ rl: this.rl, config });
  }

  public async startRepl() {
    this.rl.prompt();

    this.rl
      .on("line", async (line) => {
        // FIXME: IME の変換確定の Enter で送信される
        await this.evaluator.evaluateLine(line);
        this.rl.prompt();
      })
      .on("close", () => {
        console.log("\nBye!");
        exit(0);
      });
  }
}
