import { loadConfig } from "./config.ts";
import { Repl } from "./repl.ts";
import { HELP } from "./evaluator.ts";

const main = async () => {
  const config = await loadConfig();
  const repl = new Repl(config);

  console.log(HELP);
  repl.startRepl();
};

main();
