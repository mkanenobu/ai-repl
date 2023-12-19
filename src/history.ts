import path from "node:path";
import fs from "node:fs/promises";

export const getHistoryPath = () => {
  return path.join(
    process.env.HOME ?? "~",
    ".config",
    "ai-repl",
    "ai-repl-history",
  );
};

export const loadHistories = async (historyPath: string): Promise<string[]> => {
  const f = await fs.readFile(historyPath);
  const histories = f.toString("utf8").split("\n");

  return histories;
};

export const saveHistories = async (
  historyPath: string,
  histories: string[],
): Promise<void> => {
  await fs.writeFile(historyPath, histories.join("\n"));
};
