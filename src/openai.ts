import OpenAI from "openai";

export const initOpenAiClient = ({ apiKey }: { apiKey: string }) => {
  return new OpenAI({
    apiKey,
  });
};

export const createChatCompletionStream = (
  client: OpenAI,
  body: Omit<OpenAI.ChatCompletionCreateParamsStreaming, "stream">,
) => {
  return client.chat.completions.create({
    ...body,
    stream: true,
  });
};

export const createMessage = ({
  content,
  role,
}: {
  content: string;
  role: Exclude<OpenAI.ChatCompletionRole, "tool" | "function">;
}): OpenAI.ChatCompletionMessageParam => {
  return {
    content,
    role,
  };
};
