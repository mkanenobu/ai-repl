import { encoding_for_model as encodingForModel } from "tiktoken";

export const countTokens = (model: string, text: string) => {
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  const tokens = encodingForModel(model as any).encode(text);
  return tokens.length;
};
