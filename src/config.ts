import path from "node:path";
import {
  type Output,
  maxValue,
  minValue,
  number,
  object,
  optional,
  parse,
  string,
} from "valibot";
import fs from "node:fs/promises";

const configSchema = object({
  apiKey: string(),
  systemContext: optional(string()),
  model: optional(string(), "gpt-4-1106-preview"),
  temperature: optional(number([minValue(0.0), maxValue(2.0)]), 0.7),
  top_p: optional(number([minValue(0.0), maxValue(1.0)]), 1.0),
  historyPath: optional(string()),
});

export type Config = Output<typeof configSchema>;

const parseConfig = (config: unknown): Config => {
  return parse(configSchema, config);
};

export const loadConfig = async () => {
  const confFilePath = path.join(
    process.env.HOME ?? "~",
    ".config",
    "ai-repl",
    "config.json",
  );

  const f = await fs.readFile(confFilePath);
  const jsonObj = JSON.parse(await f.toString("utf8"));
  const parsed = parseConfig(jsonObj);

  return parsed;
};
