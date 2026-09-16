/**
 * ChatGPT Playground Page
 *
 * Страница-песочница для тестирования GPT моделей.
 * Пример: /chatgpt или /playground
 */

"use client";

import { ChatGPTPlayground } from "./ChatGPTPlayground";

interface ChatGPTPlaygroundPageProps {
  apiUrl: string;
  defaultModel?: string;
}

export function ChatGPTPlaygroundPage({
  apiUrl,
  defaultModel = "gpt-5.4-mini",
}: ChatGPTPlaygroundPageProps) {
  return (
    <div className="h-screen">
      <ChatGPTPlayground apiUrl={apiUrl} defaultModel={defaultModel} />
    </div>
  );
}

export default ChatGPTPlaygroundPage;