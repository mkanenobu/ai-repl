import { loadConfig } from "./config.ts";
import { Repl } from "./repl.ts";
import { HELP } from "./evaluator.ts";
import { getHistoryPath, loadHistories } from "./history.ts";

const main = async () => {
  const config = await loadConfig();
  if (!config.historyPath) {
    config.historyPath = await getHistoryPath();
  }

  const histories = await loadHistories(config.historyPath).catch((error) => {
    return [];
  });

  const repl = new Repl(config, histories);

  console.log(HELP);
  repl.startRepl();
};

main();
